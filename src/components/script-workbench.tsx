'use client';

import { useState, useTransition } from 'react';
import { draftScript, type EarningsScript } from '@/actions/script';
import { cn } from '@/lib/utils';

type SourceMini = {
  accession: string;
  form: string;
  filingDate: string;
  description: string;
  url: string;
};

export function ScriptWorkbench({
  symbol,
  sources,
}: {
  symbol: string;
  sources: SourceMini[];
}) {
  const [quarter, setQuarter] = useState('');
  const [highlights, setHighlights] = useState('');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(sources.slice(0, 3).map((s) => s.accession))
  );
  const [script, setScript] = useState<EarningsScript | null>(null);
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
    setScript(null);
    startTransition(async () => {
      const res = await draftScript({
        symbol,
        quarter,
        highlights,
        selectedTranscriptAccessions: Array.from(selected),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setScript(res.script);
      setCitations(res.citations);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr] lg:items-start">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm lg:sticky lg:top-6">
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
            Prior transcripts / releases
          </div>
          <span className="text-[10px] text-[var(--muted)]">{selected.size} selected</span>
        </div>
        <p className="px-4 pb-2 text-xs text-[var(--muted)]">
          Select 2-5 prior 8-Ks or 10-Qs to match voice and pacing from.
        </p>
        <div className="divide-y divide-[var(--border)] max-h-[480px] overflow-y-auto">
          {sources.map((f) => {
            const isSelected = selected.has(f.accession);
            return (
              <button
                key={f.accession}
                onClick={() => toggle(f.accession)}
                className={cn(
                  'w-full text-left px-4 py-3 transition-colors',
                  isSelected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--border-soft)]'
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center',
                      isSelected
                        ? 'border-accent bg-accent text-white'
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

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-4 space-y-4 lg:sticky lg:top-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-1.5">
            Quarter
          </div>
          <input
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            placeholder="e.g. Q1 2026"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all"
          />
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-1.5">
            Current quarter highlights
          </div>
          <textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder="Paste your results highlights, key slide bullets, and talking points. Don't worry about voice, the agent will handle that."
            className="w-full h-44 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-none"
          />
        </div>

        <button
          onClick={submit}
          disabled={pending || !quarter.trim() || !highlights.trim() || selected.size === 0}
          className="w-full rounded-lg bg-accent text-white font-medium py-2.5 text-sm disabled:opacity-40 hover:bg-accent-hover transition-colors"
        >
          {pending ? 'Drafting script...' : 'Draft script'}
        </button>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
            {error}
          </div>
        )}

        <div className="text-[10px] text-[var(--muted)] mono">
          Powered by Recursiv · voice matched to prior calls
        </div>
      </div>

      <div className="space-y-4">
        {!script && !pending && !error && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-8 text-center text-sm text-[var(--muted)]">
            Your script will appear here, with CEO and CFO prepared remarks plus speaker notes.
          </div>
        )}

        {pending && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-6 text-sm text-[var(--muted)] flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-accent pulse-dot" />
            Reading prior transcripts and drafting prepared remarks...
          </div>
        )}

        {script && (
          <>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-3">
                Estimated timing
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="mono tabular text-2xl font-semibold text-[var(--accent-ink)]">
                    {script.timing.ceoEstimatedMinutes}
                  </div>
                  <div className="text-xs text-[var(--muted)]">min CEO</div>
                </div>
                <div>
                  <div className="mono tabular text-2xl font-semibold text-[var(--accent-ink)]">
                    {script.timing.cfoEstimatedMinutes}
                  </div>
                  <div className="text-xs text-[var(--muted)]">min CFO</div>
                </div>
              </div>
            </div>

            <ScriptSection title="CEO prepared remarks" sections={script.prepared_remarks.ceo} />
            <ScriptSection title="CFO prepared remarks" sections={script.prepared_remarks.cfo} />

            {script.speakerNotes && script.speakerNotes.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-2">
                  Speaker notes
                </div>
                <ul className="space-y-1.5 text-sm">
                  {script.speakerNotes.map((n, i) => (
                    <li key={i} className="flex gap-2 text-[var(--fg-soft)]">
                      <span className="text-[var(--muted-soft)] shrink-0">·</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {citations.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-1.5">
                  Voice sourced from
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noopener"
                      className="rounded-md border border-[var(--border)] bg-white px-2 py-0.5 text-[11px] mono hover:border-accent/40 hover:text-[var(--accent-ink)] transition-colors"
                    >
                      {c.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ScriptSection({
  title,
  sections,
}: {
  title: string;
  sections: { section: string; content: string }[];
}) {
  if (!sections || sections.length === 0) return null;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--border-soft)]/60">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
          {title}
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {sections.map((s, i) => (
          <div key={i} className="p-5 space-y-2">
            <div className="text-xs font-medium text-[var(--accent-ink)]">{s.section}</div>
            <p className="text-sm leading-relaxed text-[var(--fg-soft)] whitespace-pre-wrap">
              {s.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
