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
  const [currentAccession, setCurrentAccession] = useState(
    annualReports[0]?.accession ?? ''
  );
  const [priorAccession, setPriorAccession] = useState(
    annualReports[1]?.accession ?? ''
  );
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
      const res = await diffRiskFactors({
        symbol,
        currentAccession,
        priorAccession,
      });
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

  const sameSelected = Boolean(
    currentAccession && priorAccession && currentAccession === priorAccession
  );

  return (
    <div className="space-y-4">
      <div className="sticky top-20 z-10 rounded-lg border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-sm p-4 space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
          Pick two 10-Ks to compare
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
          <FilingPicker
            label="Current 10-K"
            value={currentAccession}
            onChange={setCurrentAccession}
            options={annualReports}
          />
          <FilingPicker
            label="Prior 10-K"
            value={priorAccession}
            onChange={setPriorAccession}
            options={annualReports}
          />
          <button
            onClick={submit}
            disabled={pending || !currentAccession || !priorAccession || sameSelected}
            className="rounded-md bg-accent text-[var(--bg)] font-medium px-4 py-2 text-sm disabled:opacity-40 hover:bg-accent-hover transition-colors h-[38px]"
          >
            {pending ? 'Analyzing' : 'Analyze'}
          </button>
        </div>
        {sameSelected && (
          <div className="text-[11px] text-amber-700">
            Pick two different 10-Ks.
          </div>
        )}
        {annualReports.length < 2 && (
          <div className="text-[11px] text-[var(--muted)]">
            Need at least two 10-Ks for {symbol}. EDGAR has {annualReports.length}.
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
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
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-1">
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
                      <div className="rounded border border-[var(--accent-ink)]/30 bg-[var(--accent-soft)] p-3">
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

function FilingPicker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: AnnualMini[];
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm mono"
      >
        {options.map((o) => (
          <option key={o.accession} value={o.accession}>
            10-K · {humanDate(o.filingDate)}
          </option>
        ))}
        {options.length === 0 && <option value="">none available</option>}
      </select>
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
        ? 'text-rose-600'
        : tone === 'reword'
          ? 'text-amber-600'
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
