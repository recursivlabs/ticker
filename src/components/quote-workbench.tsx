'use client';

import { useState, useTransition } from 'react';
import { generateQuotes, type GeneratedQuote } from '@/actions/quote';
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
  const [selected, setSelected] = useState<Set<string>>(() => new Set(filings.slice(0, 3).map((f) => f.accessionNumber)));
  const [results, setResults] = useState<GeneratedQuote[] | null>(null);
  const [sources, setSources] = useState<{ label: string; url: string }[]>([]);
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
      setSources(res.sourcesUsed.map((s) => ({ label: s.label, url: s.url })));
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
      {/* Left: prior quotes selector */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
            Prior filings ({filings.length})
          </div>
          <span className="text-[10px] text-[var(--muted)]">
            {selected.size} selected
          </span>
        </div>
        <p className="px-4 pb-2 text-xs text-[var(--muted)]">
          Select 2-5 filings to match tonality from.
        </p>
        <div className="divide-y divide-[var(--border)] max-h-[520px] overflow-y-auto">
          {filings.map((f) => {
            const isSelected = selected.has(f.accessionNumber);
            return (
              <button
                key={f.accessionNumber}
                onClick={() => toggle(f.accessionNumber)}
                className={cn(
                  'w-full text-left px-4 py-3 transition-colors',
                  isSelected ? 'bg-accent-subtle' : 'hover:bg-[var(--card-elevated)]'
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center',
                      isSelected
                        ? 'border-accent bg-accent text-[var(--bg)]'
                        : 'border-[var(--border)]'
                    )}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{f.description}</div>
                    <div className="text-[11px] text-[var(--muted)] mono">
                      {f.form} · {f.filingDate}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle: inputs */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-2">
            Topic
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What is this quote about?&#10;&#10;e.g. 'We are launching a new digital retail platform that will serve online buyers directly...'"
            className="w-full h-40 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-accent/60 transition-colors resize-none"
          />
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-2">
            Tonality
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {TONALITIES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTonality(t.key)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs transition-colors text-left',
                  tonality === t.key
                    ? 'border-accent bg-accent-subtle text-accent'
                    : 'border-[var(--border)] hover:border-accent/40'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={pending || !topic.trim() || selected.size === 0}
          className="w-full rounded-md bg-accent text-[var(--bg)] font-medium py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors"
        >
          {pending ? 'Generating...' : 'Generate 5 drafts'}
        </button>

        {error && (
          <div className="rounded-md border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="text-[10px] text-[var(--muted)] mono">
          Powered by Recursiv · sources cited on every draft
        </div>
      </div>

      {/* Right: results */}
      <div className="space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
          Drafts {results ? `(${results.length})` : ''}
        </div>

        {!results && !pending && (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-6 text-center text-sm text-[var(--muted)]">
            Your drafts will appear here. Each will be styled like a press release quote and cited to source filings.
          </div>
        )}

        {pending && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-accent pulse-dot" />
            Reading source filings and drafting in {ceoName}&rsquo;s voice...
          </div>
        )}

        {results &&
          results.map((q, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] mono text-[var(--muted)]">Draft {i + 1}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(q.quote)}
                  className="text-[11px] text-[var(--muted)] hover:text-accent"
                >
                  Copy
                </button>
              </div>
              <blockquote className="text-sm leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <div className="mt-1.5 text-xs text-[var(--muted)] italic">
                {ceoName}
              </div>
              {q.citation.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">
                    Tonality sourced from
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.citation.map((c, ci) => (
                      <a
                        key={ci}
                        href={c.url}
                        target="_blank"
                        rel="noopener"
                        className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] mono hover:border-accent/40 hover:text-accent transition-colors"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

        {results && sources.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/50 p-3 text-xs text-[var(--muted)]">
            <div className="font-mono mb-1">Full source set used</div>
            <div className="flex flex-wrap gap-1">
              {sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener" className="hover:text-accent">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
