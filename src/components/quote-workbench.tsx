'use client';

import { useState, useTransition } from 'react';
import { generateQuotes, type GeneratedQuote } from '@/actions/quote';
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

const TONALITIES = [
  { key: 'cautiously-optimistic', label: 'Cautiously optimistic' },
  { key: 'confident', label: 'Confident' },
  { key: 'measured', label: 'Measured' },
  { key: 'assertive', label: 'Assertive' },
  { key: 'diplomatic', label: 'Diplomatic' },
  { key: 'forward-looking', label: 'Forward-looking' },
];

export function QuoteWorkbench({
  symbol,
  ceoName,
  filings,
}: {
  symbol: string;
  ceoName: string;
  filings: FilingMini[];
}) {
  const [topic, setTopic] = useState('');
  const [tonality, setTonality] = useState('cautiously-optimistic');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(filings.slice(0, 3).map((f) => f.accessionNumber))
  );
  const [showSources, setShowSources] = useState(false);
  const [results, setResults] = useState<GeneratedQuote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(res.quotes);
    });
  }

  function copyAll() {
    if (!results) return;
    navigator.clipboard.writeText(results.map((r, i) => `${i + 1}. "${r.quote}"`).join('\n\n'));
  }

  return (
    <div className="space-y-6">
      <AgentCard>
        <Field label="What's the quote about?">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. We're launching a new digital retail platform that will serve online buyers directly..."
            className="w-full h-28 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-none"
          />
        </Field>

        <Field label="Tonality">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
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
          label={`Voice sourced from ${selected.size} of ${filings.length} prior filings`}
          open={showSources}
          onToggle={() => setShowSources(!showSources)}
        >
          <FilingChecklist filings={filings.map((f) => ({ ...f }))} selected={selected} onToggle={toggle} />
        </SourcePicker>

        <PrimaryButton
          onClick={submit}
          disabled={pending || !topic.trim() || selected.size === 0}
        >
          {pending ? 'Generating' : 'Generate drafts'}
        </PrimaryButton>

        <PoweredBy text={`Quote Drafter agent · drafts in ${ceoName}'s voice`} />
      </AgentCard>

      {error && <ErrorBox error={error} />}
      {pending && <LoadingBox label={`Quote Drafter is reading filings and matching ${ceoName}'s voice`} />}

      {results && (
        <>
          <SectionHeader title={`Drafts (${results.length})`} actionLabel="Copy all" onAction={copyAll} />
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
                <blockquote className="text-base leading-relaxed text-[var(--fg)]" style={{ fontFamily: 'Georgia, serif' }}>
                  &ldquo;{q.quote}&rdquo;
                </blockquote>
                <div className="mt-2 text-xs italic text-[var(--muted)]">{ceoName}</div>
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
