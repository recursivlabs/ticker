'use client';

import { useState, useTransition } from 'react';
import { summarizeFiling, type FilingSummary } from '@/actions/summarize';
import { cn } from '@/lib/utils';

type FilingMini = {
  accession: string;
  form: string;
  filingDate: string;
  filingDateDisplay: string;
  description: string;
  url: string;
};

export function FilingSummarizer({
  symbol,
  preselectedAccession,
  filings,
}: {
  symbol: string;
  preselectedAccession?: string;
  filings: FilingMini[];
}) {
  const [accession, setAccession] = useState(
    preselectedAccession ?? filings[0]?.accession ?? ''
  );
  const [summary, setSummary] = useState<FilingSummary | null>(null);
  const [source, setSource] = useState<{ form: string; filingDate: string; url: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setSummary(null);
    startTransition(async () => {
      const res = await summarizeFiling({ symbol, accession });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSummary(res.summary);
      setSource(res.source);
    });
  }

  const selected = filings.find((f) => f.accession === accession);

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] self-start lg:sticky lg:top-20">
        <div className="p-3 border-b border-[var(--border)] space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] px-1">
            Pick a filing, then summarize
          </div>
          <button
            onClick={submit}
            disabled={pending || !accession}
            className="w-full rounded-md bg-accent text-[var(--bg)] font-medium py-2 text-sm disabled:opacity-40 hover:bg-accent-hover transition-colors"
          >
            {pending ? 'Summarizing...' : 'Summarize selected filing'}
          </button>
          <div className="text-[10px] text-[var(--muted)] mono text-center">
            Powered by Recursiv
          </div>
        </div>
        <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto">
          {filings.map((f) => {
            const isSelected = accession === f.accession;
            return (
              <button
                key={f.accession}
                onClick={() => setAccession(f.accession)}
                className={cn(
                  'w-full text-left px-4 py-3 transition-colors',
                  isSelected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--border-soft)]'
                )}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-0.5 text-[10px] mono font-semibold rounded px-1.5 py-0.5 shrink-0',
                      f.form === '10-K'
                        ? 'bg-[var(--accent-soft)] text-accent'
                        : f.form === '10-Q'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-[var(--border-soft)] text-[var(--muted)]'
                    )}
                  >
                    {f.form}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{f.description}</div>
                    <div className="text-[11px] text-[var(--muted)] mono">{f.filingDateDisplay}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {!summary && !pending && !error && (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-6 text-center text-sm text-[var(--muted)]">
            {selected ? (
              <>Pick a filing and hit Summarize. Result will show headline, material events, numbers, forward-looking statements, and risk changes.</>
            ) : (
              <>No filings available.</>
            )}
          </div>
        )}

        {pending && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-accent pulse-dot" />
            Reading filing and building briefing...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        {summary && source && (
          <>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1">
                  Headline
                </div>
                <h2 className="text-lg font-semibold leading-snug">{summary.headline}</h2>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1">
                  TL;DR
                </div>
                <p className="text-sm leading-relaxed">{summary.tldr}</p>
              </div>
            </div>

            <Section title="Material events" items={summary.materialEvents} />
            <Section title="Numbers" items={summary.numbers} mono />
            <Section title="Forward-looking" items={summary.forwardLooking} />
            <Section title="Risk changes" items={summary.riskChanges} />
            <Section title="Next steps for your IR team" items={summary.nextSteps} accent />

            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/50 p-3 text-xs text-[var(--muted)]">
              <span className="mono">Source:</span>{' '}
              <a href={source.url} target="_blank" rel="noopener" className="hover:text-accent">
                {source.form} · {source.filingDate}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  mono,
  accent,
}: {
  title: string;
  items: string[];
  mono?: boolean;
  accent?: boolean;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-2">
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className={cn(
              'flex gap-2 text-sm leading-relaxed',
              mono && 'mono tabular',
              accent && 'text-[var(--fg)]'
            )}
          >
            <span className={cn('shrink-0', accent ? 'text-accent' : 'text-[var(--muted)]')}>·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
