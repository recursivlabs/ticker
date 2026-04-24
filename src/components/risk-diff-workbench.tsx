'use client';

import { useState, useTransition } from 'react';
import { diffRiskFactors, type RiskDiff } from '@/actions/risk-diff';
import { humanDate } from '@/lib/dates';

type AnnualMini = {
  accession: string;
  filingDate: string;
  url: string;
};

export function RiskDiffWorkbench({
  symbol,
  annualReports,
}: {
  symbol: string;
  annualReports: AnnualMini[];
}) {
  const [diff, setDiff] = useState<RiskDiff | null>(null);
  const [sources, setSources] = useState<{
    current: { filingDate: string; url: string };
    prior: { filingDate: string; url: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setDiff(null);
    startTransition(async () => {
      const res = await diffRiskFactors({ symbol });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDiff(res.diff);
      setSources({
        current: { filingDate: res.sources.current.filingDate, url: res.sources.current.url },
        prior: { filingDate: res.sources.prior.filingDate, url: res.sources.prior.url },
      });
    });
  }

  const currentAR = annualReports[0];
  const priorAR = annualReports[1];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1">
            Comparing
          </div>
          {currentAR && priorAR ? (
            <div className="flex items-center gap-3 mono tabular">
              <a href={currentAR.url} target="_blank" rel="noopener" className="hover:text-accent">
                10-K · {humanDate(currentAR.filingDate)}
              </a>
              <span className="text-[var(--muted)]">vs</span>
              <a href={priorAR.url} target="_blank" rel="noopener" className="hover:text-accent">
                10-K · {humanDate(priorAR.filingDate)}
              </a>
            </div>
          ) : (
            <span className="text-[var(--muted)]">
              Need at least two 10-Ks on EDGAR for this company.
            </span>
          )}
        </div>
        <button
          onClick={submit}
          disabled={pending || !currentAR || !priorAR}
          className="rounded-md bg-accent text-[var(--bg)] font-medium px-4 py-2 text-sm disabled:opacity-40 hover:bg-accent-hover transition-colors"
        >
          {pending ? 'Analyzing...' : 'Analyze the diff'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {pending && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] flex items-center gap-3">
          <span className="inline-block h-2 w-2 rounded-full bg-accent pulse-dot" />
          Extracting Risk Factors sections and analyzing year-over-year changes...
        </div>
      )}

      {diff && sources && (
        <>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-2">
              Summary
            </div>
            <p className="text-base leading-relaxed">{diff.summary}</p>

            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-4 gap-4 text-center">
              <Stat label="Added" count={diff.added.length} tone="add" />
              <Stat label="Removed" count={diff.removed.length} tone="remove" />
              <Stat label="Reworded" count={diff.reworded.length} tone="reword" />
              <Stat label="Unchanged" count={diff.unchanged} tone="muted" />
            </div>
          </div>

          {diff.materialityRead && (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 mb-1">
                Materiality read
              </div>
              <p className="text-sm text-[var(--fg)] leading-relaxed">{diff.materialityRead}</p>
            </div>
          )}

          {diff.added.length > 0 && (
            <DiffSection title="Added" tone="add" items={diff.added} />
          )}
          {diff.removed.length > 0 && (
            <DiffSection title="Removed" tone="remove" items={diff.removed} />
          )}

          {diff.reworded.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Substantively reworded ({diff.reworded.length})
                </div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {diff.reworded.map((r, i) => (
                  <div key={i} className="p-4 space-y-2">
                    <div className="font-medium text-sm">{r.risk}</div>
                    <div className="grid md:grid-cols-2 gap-3 text-xs">
                      <div className="rounded border border-[var(--border)] bg-[var(--bg)] p-3">
                        <div className="mono uppercase tracking-wider text-[var(--muted)] mb-1">
                          Prior
                        </div>
                        <div className="italic text-[var(--muted)]">{r.prior}</div>
                      </div>
                      <div className="rounded border border-accent/30 bg-accent-subtle p-3">
                        <div className="mono uppercase tracking-wider text-accent mb-1">
                          Current
                        </div>
                        <div>{r.current}</div>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--muted)] italic">
                      Why it matters: {r.substantiveChange}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/50 p-3 text-xs text-[var(--muted)]">
            Sources:{' '}
            <a href={sources.current.url} target="_blank" rel="noopener" className="hover:text-accent mono">
              10-K · {humanDate(sources.current.filingDate)}
            </a>{' '}
            and{' '}
            <a href={sources.prior.url} target="_blank" rel="noopener" className="hover:text-accent mono">
              10-K · {humanDate(sources.prior.filingDate)}
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'add' | 'remove' | 'reword' | 'muted';
}) {
  const color =
    tone === 'add'
      ? 'text-accent'
      : tone === 'remove'
        ? 'text-rose-400'
        : tone === 'reword'
          ? 'text-amber-400'
          : 'text-[var(--muted)]';
  return (
    <div>
      <div className={'text-2xl font-semibold mono tabular ' + color}>{count}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

function DiffSection({
  title,
  tone,
  items,
}: {
  title: string;
  tone: 'add' | 'remove';
  items: { risk: string; significance: string }[];
}) {
  const dot = tone === 'add' ? 'bg-accent' : 'bg-rose-400';
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <span className={'inline-block h-2 w-2 rounded-full ' + dot} />
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
          {title} ({items.length})
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {items.map((it, i) => (
          <div key={i} className="p-4 space-y-1">
            <div className="font-medium text-sm">{it.risk}</div>
            <div className="text-xs text-[var(--muted)] italic">{it.significance}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
