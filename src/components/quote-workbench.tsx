'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  generateQuotes,
  type GeneratedQuote,
  type QuoteContentType,
} from '@/actions/quote';
import { LastMileDelivery } from '@/components/last-mile';
import {
  AgentCard,
  ErrorBox,
  Field,
  FilingChecklist,
  LoadingBox,
  PoweredBy,
  PrimaryButton,
  SectionHeader,
  SourcePicker,
} from '@/components/agent-ui';
import { cn } from '@/lib/utils';

type FilingMini = {
  accessionNumber: string;
  form: string;
  filingDate: string;
  description: string;
  url: string;
};

type ExecMini = {
  id: string;
  name: string;
  title: string;
  role: string;
  speaksPublicly: boolean;
};

// Bryan's exact tonality vocabulary from his brain dump.
const TONALITIES = [
  { key: 'confident', label: 'Confident' },
  { key: 'cautious', label: 'Cautious' },
  { key: 'optimistic', label: 'Optimistic' },
  { key: 'hedged-confidence', label: 'Hedged confidence' },
];

// Bryan's three content types from his brain dump.
const CONTENT_TYPES: { key: QuoteContentType; label: string; hint: string }[] = [
  { key: 'quote', label: 'CEO/exec quote', hint: '1-3 sentences for a press release' },
  { key: 'release', label: 'Full press release', hint: 'Headline + body + quote + boilerplate' },
  { key: 'commentary', label: 'Other exec commentary', hint: 'Prepared remarks for a call' },
];

export function QuoteWorkbench({
  symbol,
  companyName,
  executives,
  preselectedExecId,
  filings,
}: {
  symbol: string;
  companyName: string;
  executives: ExecMini[];
  preselectedExecId?: string;
  filings: FilingMini[];
}) {
  // Pick the initial exec: preselected from query param, else CEO, else first public speaker.
  const initialExec = useMemo(() => {
    if (preselectedExecId) {
      const found = executives.find((e) => e.id === preselectedExecId);
      if (found) return found;
    }
    return (
      executives.find((e) => e.role === 'ceo') ??
      executives.find((e) => e.speaksPublicly) ??
      executives[0] ??
      null
    );
  }, [executives, preselectedExecId]);

  const [execId, setExecId] = useState<string | null>(initialExec?.id ?? null);
  const [contentType, setContentType] = useState<QuoteContentType>('quote');
  const [topic, setTopic] = useState('');
  const [tonality, setTonality] = useState('confident');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(filings.slice(0, 3).map((f) => f.accessionNumber))
  );
  const [showSources, setShowSources] = useState(false);
  const [results, setResults] = useState<GeneratedQuote[] | null>(null);
  const [execUsed, setExecUsed] = useState<{ name: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentExec = executives.find((e) => e.id === execId) ?? initialExec;

  function toggle(acc: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(acc)) next.delete(acc);
      else next.add(acc);
      return next;
    });
  }

  function submit() {
    setError(null);
    setResults(null);
    startTransition(async () => {
      const res = await generateQuotes({
        symbol,
        topic,
        tonality: TONALITIES.find((t) => t.key === tonality)?.label ?? tonality,
        selectedAccessionNumbers: Array.from(selected),
        execId: execId ?? undefined,
        contentType,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(res.quotes);
      setExecUsed(res.execUsed ? { name: res.execUsed.name, title: res.execUsed.title } : null);
    });
  }

  function copyAll() {
    if (!results) return;
    navigator.clipboard.writeText(results.map((r, i) => `${i + 1}. "${r.quote}"`).join('\n\n'));
  }

  return (
    <div className="space-y-6">
      <AgentCard>
        {executives.length > 0 && (
          <Field
            label="Speaker"
            hint={currentExec ? `Drafts in ${currentExec.name}'s voice` : undefined}
          >
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {executives.map((e) => {
                const active = e.id === execId;
                return (
                  <button
                    key={e.id}
                    onClick={() => setExecId(e.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                      active
                        ? 'border-[var(--accent-ink)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border)] bg-[var(--bg-raised)] hover:border-[var(--muted-soft)]'
                    )}
                  >
                    <div
                      className={cn(
                        'h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold',
                        active
                          ? 'bg-[var(--accent-ink)] text-white'
                          : e.role === 'ceo'
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                            : 'bg-[var(--border-soft)] text-[var(--muted)]'
                      )}
                    >
                      {e.name
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={cn(
                          'text-sm font-medium truncate',
                          active ? 'text-[var(--accent-ink)]' : 'text-[var(--fg)]'
                        )}
                      >
                        {e.name}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] truncate">{e.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <Field label="Content type">
          <div className="grid gap-1.5 sm:grid-cols-3">
            {CONTENT_TYPES.map((c) => {
              const active = c.key === contentType;
              return (
                <button
                  key={c.key}
                  onClick={() => setContentType(c.key)}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-left transition-colors',
                    active
                      ? 'border-[var(--accent-ink)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] bg-[var(--bg-raised)] hover:border-[var(--muted-soft)]'
                  )}
                >
                  <div
                    className={cn(
                      'text-sm font-medium',
                      active ? 'text-[var(--accent-ink)]' : 'text-[var(--fg)]'
                    )}
                  >
                    {c.label}
                  </div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">{c.hint}</div>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="What's the announcement about?">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              contentType === 'release'
                ? 'e.g. AutoNation acquiring dealerships in South Florida, Chicago, Southern California — $200M annualized revenue, immediately accretive.'
                : "e.g. We're launching a new digital retail platform that will serve online buyers directly..."
            }
            className="w-full h-28 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-none"
          />
        </Field>

        <Field label="Tonality">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {TONALITIES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTonality(t.key)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs transition-colors text-left',
                  tonality === t.key
                    ? 'border-[var(--accent-ink)] bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium'
                    : 'border-[var(--border)] text-[var(--fg-soft)] hover:border-[var(--muted-soft)]'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <SourcePicker
          label={`Optional: ${selected.size} additional filings as backup voice context`}
          open={showSources}
          onToggle={() => setShowSources(!showSources)}
        >
          <FilingChecklist filings={filings.map((f) => ({ ...f }))} selected={selected} onToggle={toggle} />
        </SourcePicker>

        <PrimaryButton onClick={submit} disabled={pending || !topic.trim()}>
          {pending ? 'Generating' : 'Generate drafts'}
        </PrimaryButton>

        <PoweredBy
          text={
            currentExec
              ? `Quote Drafter agent · ${currentExec.name}'s voice corpus`
              : `Quote Drafter agent · ${companyName} corpus`
          }
        />
      </AgentCard>

      {error && <ErrorBox error={error} />}
      {pending && (
        <LoadingBox
          label={
            currentExec
              ? `Quote Drafter is reading ${currentExec.name}'s prior statements and matching voice`
              : 'Quote Drafter is reading prior filings and matching voice'
          }
        />
      )}

      {results && (
        <>
          <SectionHeader
            title={
              execUsed
                ? `Drafts (${results.length}) · ${execUsed.name}`
                : `Drafts (${results.length})`
            }
            actionLabel="Copy all"
            onAction={copyAll}
          />
          <div className="space-y-3">
            {results.map((q, i) => (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] mono uppercase tracking-wider text-[var(--muted-soft)]">
                    Draft {i + 1}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(q.quote)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--accent-ink)]"
                  >
                    Copy
                  </button>
                </div>
                <blockquote
                  className="text-base leading-relaxed text-[var(--fg)]"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  &ldquo;{q.quote}&rdquo;
                </blockquote>
                {execUsed && (
                  <div className="mt-2 text-xs italic text-[var(--muted)]">
                    {execUsed.name}, {execUsed.title}
                  </div>
                )}
                {q.citation.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap gap-1.5">
                    {q.citation.map((c, ci) => (
                      <a
                        key={ci}
                        href={c.url}
                        target="_blank"
                        rel="noopener"
                        className="text-[10px] mono rounded-md border border-[var(--border)] bg-[var(--bg-raised)] px-2 py-0.5 text-[var(--muted)] hover:border-accent/40 hover:text-[var(--accent-ink)]"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <LastMileDelivery onCopy={copyAll} />
        </>
      )}
    </div>
  );
}
