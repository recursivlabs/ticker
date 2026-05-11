'use client';

import { useState, useTransition } from 'react';
import {
  analyzeReleaseTemplate,
  draftFromTemplate,
  draftRelease,
  type PressRelease,
  type ReleaseTemplate,
} from '@/actions/release';
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
  accession: string;
  form: string;
  filingDate: string;
  description: string;
  url: string;
};

type Mode = 'linear' | 'reverse';

export function ReleaseWorkbench({
  symbol,
  filings,
}: {
  symbol: string;
  filings: FilingMini[];
}) {
  const [mode, setMode] = useState<Mode>('linear');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-2">
        <div className="grid grid-cols-2 gap-1">
          <ModeButton
            active={mode === 'linear'}
            onClick={() => setMode('linear')}
            title="Linear"
            body="Start from a topic, the agent drafts in your voice"
          />
          <ModeButton
            active={mode === 'reverse'}
            onClick={() => setMode('reverse')}
            title="Reverse-engineer"
            body="Paste a prior release, the agent extracts the template and asks fill-in questions"
          />
        </div>
      </div>

      {mode === 'linear' ? (
        <LinearMode symbol={symbol} filings={filings} />
      ) : (
        <ReverseMode symbol={symbol} />
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-xl px-4 py-3 text-left transition-colors',
        active
          ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
          : 'text-[var(--fg-soft)] hover:bg-[var(--border-soft)]'
      )}
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="text-[11px] text-[var(--muted)] mt-0.5">{body}</div>
    </button>
  );
}

// ============================================================================
// Linear mode (existing flow)
// ============================================================================

function LinearMode({
  symbol,
  filings,
}: {
  symbol: string;
  filings: FilingMini[];
}) {
  const [topic, setTopic] = useState('');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(filings.slice(0, 3).map((f) => f.accession))
  );
  const [showSources, setShowSources] = useState(false);
  const [release, setRelease] = useState<PressRelease | null>(null);
  const [citations, setCitations] = useState<{ label: string; url: string }[]>([]);
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
    setRelease(null);
    startTransition(async () => {
      const res = await draftRelease({
        symbol,
        topic,
        selectedAccessionNumbers: Array.from(selected),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRelease(res.release);
      setCitations(res.citations);
    });
  }

  return (
    <div className="space-y-6">
      <AgentCard>
        <Field label="What's the release about?">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Announcing a new digital retail platform launching May 15th that lets customers purchase vehicles entirely online with home delivery..."
            className="w-full h-32 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-none"
          />
        </Field>

        <SourcePicker
          label={`Voice sourced from ${selected.size} of ${filings.length} prior releases`}
          open={showSources}
          onToggle={() => setShowSources(!showSources)}
        >
          <FilingChecklist filings={filings} selected={selected} onToggle={toggle} />
        </SourcePicker>

        <PrimaryButton onClick={submit} disabled={pending || !topic.trim() || selected.size === 0}>
          {pending ? 'Drafting' : 'Draft release'}
        </PrimaryButton>

        <PoweredBy text="Press Release Drafter agent · voice matched to prior filings" />
      </AgentCard>

      {error && <ErrorBox error={error} />}
      {pending && <LoadingBox label="Press Release Drafter is reading your prior releases and drafting" />}

      {release && (
        <>
          <SectionHeader title="Generated release" />
          <ReleaseArticle release={release} />
          {citations.length > 0 && <CitationChips citations={citations} />}
          <LastMileDelivery onCopy={() => copyRelease(release)} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// Reverse mode (new)
// ============================================================================

function ReverseMode({ symbol }: { symbol: string }) {
  const [priorText, setPriorText] = useState('');
  const [template, setTemplate] = useState<ReleaseTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [release, setRelease] = useState<PressRelease | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const [drafting, startDraft] = useTransition();

  function analyze() {
    setError(null);
    setTemplate(null);
    setAnswers({});
    setRelease(null);
    startAnalyze(async () => {
      const res = await analyzeReleaseTemplate(symbol, priorText);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTemplate(res.template);
    });
  }

  function draft() {
    if (!template) return;
    setError(null);
    setRelease(null);
    startDraft(async () => {
      const res = await draftFromTemplate({
        symbol,
        template,
        answers,
        priorReleaseText: priorText,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRelease(res.release);
    });
  }

  return (
    <div className="space-y-6">
      <AgentCard>
        <Field
          label="Paste a prior similar press release"
          hint={`${priorText.length.toLocaleString()} chars`}
        >
          <textarea
            value={priorText}
            onChange={(e) => setPriorText(e.target.value)}
            placeholder={
              "Paste the full text of a prior release that's the same kind of announcement (M&A, results, guidance, etc.) as the one you're about to write. The agent recognizes the shape and asks targeted questions for the new variables."
            }
            className="w-full h-44 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-y"
          />
        </Field>

        <PrimaryButton onClick={analyze} disabled={analyzing || priorText.trim().length < 200}>
          {analyzing ? 'Reading template' : 'Analyze template'}
        </PrimaryButton>

        <PoweredBy text="Press Release Drafter agent · reverse-engineering mode" />
      </AgentCard>

      {error && <ErrorBox error={error} />}
      {analyzing && (
        <LoadingBox label="Reading your prior release and identifying the announcement shape" />
      )}

      {template && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5 space-y-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
              Recognized template
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] px-3 py-1 text-xs font-medium">
                {template.announcementType}
              </span>
            </div>
            <div className="mt-3 text-sm text-[var(--fg-soft)] leading-relaxed">
              <span className="font-medium text-[var(--fg)]">Headline pattern:</span>{' '}
              {template.headlinePattern}
            </div>
            <div className="mt-1.5 text-sm text-[var(--fg-soft)] leading-relaxed">
              <span className="font-medium text-[var(--fg)]">Structure:</span>{' '}
              {template.structureNotes}
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-3">
              Fill these in for the new release
            </div>
            <div className="space-y-3">
              {template.slots.map((s) => (
                <div key={s.id}>
                  <label className="block text-sm font-medium text-[var(--fg)]">
                    {s.question}
                  </label>
                  {s.hint && (
                    <div className="text-[11px] text-[var(--muted)] italic mb-1.5">
                      Hint: {s.hint}
                    </div>
                  )}
                  {s.type === 'longtext' ? (
                    <textarea
                      value={answers[s.id] ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      className="w-full h-20 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-none"
                    />
                  ) : (
                    <input
                      type={s.type === 'date' ? 'date' : s.type === 'number' ? 'text' : 'text'}
                      value={answers[s.id] ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 h-10 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <PrimaryButton onClick={draft} disabled={drafting}>
            {drafting ? 'Drafting' : 'Draft new release'}
          </PrimaryButton>
        </div>
      )}

      {drafting && <LoadingBox label="Drafting the new release in the same shape as your template" />}

      {release && (
        <>
          <SectionHeader title="Generated release" />
          <ReleaseArticle release={release} />
          <div className="rounded-lg border border-[var(--accent-ink)]/30 bg-[var(--accent-soft)]/50 p-3 text-xs text-[var(--accent-ink)]">
            Drafted in the same shape as the prior release you pasted, with your new variables
            substituted in.
          </div>
          <LastMileDelivery onCopy={() => copyRelease(release)} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// Shared rendering
// ============================================================================

function ReleaseArticle({ release }: { release: PressRelease }) {
  return (
    <article
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-6 text-sm leading-relaxed space-y-4"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      <div className="mono text-xs text-[var(--muted)] uppercase tracking-wide">
        {release.dateline}
      </div>
      <h2 className="text-2xl font-semibold leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
        {release.headline}
      </h2>
      {release.subheadline && (
        <div className="text-base italic text-[var(--muted)]">{release.subheadline}</div>
      )}
      {release.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <blockquote className="border-l-2 border-[var(--accent-ink)]/40 pl-4 italic text-[var(--muted)]">
        &ldquo;{release.quote.text}&rdquo; {release.quote.attributedTo}
      </blockquote>
      {release.boilerplate && (
        <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
          <div
            className="font-mono uppercase tracking-wider mb-1 not-italic"
            style={{ fontFamily: 'ui-monospace, monospace' }}
          >
            About
          </div>
          {release.boilerplate}
        </div>
      )}
      {release.forwardLookingStatement && (
        <div className="text-[11px] text-[var(--muted)] italic">
          {release.forwardLookingStatement}
        </div>
      )}
    </article>
  );
}

function CitationChips({ citations }: { citations: { label: string; url: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {citations.map((c, i) => (
        <a
          key={i}
          href={c.url}
          target="_blank"
          rel="noopener"
          className="text-[10px] mono rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[var(--muted)] hover:border-accent/40 hover:text-[var(--accent-ink)]"
        >
          {c.label}
        </a>
      ))}
    </div>
  );
}

function copyRelease(release: PressRelease) {
  const body = release.body.join('\n\n');
  const quote = `"${release.quote.text}" ${release.quote.attributedTo}`;
  const full = [
    release.dateline,
    release.headline,
    release.subheadline,
    body,
    quote,
    release.boilerplate,
    release.forwardLookingStatement,
  ]
    .filter(Boolean)
    .join('\n\n');
  navigator.clipboard.writeText(full);
}
