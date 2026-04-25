'use client';

import { useState, useTransition } from 'react';
import { prepareQa, type QaQuestion } from '@/actions/qa';
import { cn } from '@/lib/utils';

type SourceMini = {
  accession: string;
  form: string;
  filingDate: string;
  description: string;
  url: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Financial: 'bg-blue-100 text-blue-700',
  Strategic: 'bg-purple-100 text-purple-700',
  Competitive: 'bg-rose-100 text-rose-700',
  Operational: 'bg-sky-100 text-sky-700',
  'Forward-Looking': 'bg-amber-100 text-amber-700',
  Macro: 'bg-slate-100 text-slate-700',
  'Capital Allocation': 'bg-emerald-100 text-emerald-700',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  soft: 'text-emerald-700',
  medium: 'text-amber-700',
  hard: 'text-rose-600',
};

export function QaWorkbench({ symbol, sources }: { symbol: string; sources: SourceMini[] }) {
  const [currentContext, setCurrentContext] = useState('');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(sources.slice(0, 3).map((s) => s.accession))
  );
  const [questions, setQuestions] = useState<QaQuestion[]>([]);
  const [rehearse, setRehearse] = useState<string[]>([]);
  const [citations, setCitations] = useState<{ label: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

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
    setQuestions([]);
    startTransition(async () => {
      const res = await prepareQa({
        symbol,
        currentContext,
        selectedAccessions: Array.from(selected),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setQuestions(res.questions);
      setRehearse(res.topThreeToRehearse);
      setCitations(res.citations);
    });
  }

  const visibleQuestions = filterCategory
    ? questions.filter((q) => q.category === filterCategory)
    : questions;

  const categories = Array.from(new Set(questions.map((q) => q.category)));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.6fr] lg:items-start">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm lg:sticky lg:top-6">
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
            Source filings
          </div>
          <span className="text-[10px] text-[var(--muted)]">{selected.size} selected</span>
        </div>
        <p className="px-4 pb-2 text-xs text-[var(--muted)]">
          Pick filings that set up the current quarter or that analysts have been reacting to.
        </p>
        <div className="divide-y divide-[var(--border)] max-h-[460px] overflow-y-auto">
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
            Current quarter context
          </div>
          <textarea
            value={currentContext}
            onChange={(e) => setCurrentContext(e.target.value)}
            placeholder="What's new this quarter? Results, strategy updates, changes from guidance, big numbers, new product or market context. The agent uses this to predict what analysts will ask about."
            className="w-full h-56 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-none"
          />
        </div>

        <button
          onClick={submit}
          disabled={pending || !currentContext.trim() || selected.size === 0}
          className="w-full rounded-lg bg-accent text-white font-medium py-2.5 text-sm disabled:opacity-40 hover:bg-accent-hover transition-colors"
        >
          {pending ? 'Preparing' : 'Generate brief'}
        </button>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
            {error}
          </div>
        )}

        <div className="text-[10px] text-[var(--muted)] mono">
          Powered by Recursiv · 10-15 questions, ranked by risk
        </div>
      </div>

      <div className="space-y-4">
        {questions.length === 0 && !pending && !error && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-8 text-center text-sm text-[var(--muted)]">
            Your question brief will appear here. Each question includes category, difficulty, why
            it&rsquo;s likely this quarter, and a suggested answer framework.
          </div>
        )}

        {pending && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-6 text-sm text-[var(--muted)] flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-accent pulse-dot" />
            Analyzing prior call patterns and generating likely questions...
          </div>
        )}

        {rehearse.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-700 mb-2">
              Top 3 to rehearse
            </div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-[var(--fg)]">
              {rehearse.map((q, i) => (
                <li key={i} className="leading-relaxed">
                  {q}
                </li>
              ))}
            </ol>
          </div>
        )}

        {questions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterCategory(null)}
              className={cn(
                'text-[11px] rounded-full px-2.5 py-1 border transition-colors',
                filterCategory === null
                  ? 'border-[var(--accent-ink)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                  : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]'
              )}
            >
              All · {questions.length}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={cn(
                  'text-[11px] rounded-full px-2.5 py-1 border transition-colors',
                  filterCategory === c
                    ? 'border-[var(--accent-ink)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                    : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {visibleQuestions.map((q, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-base leading-snug font-medium text-[var(--fg)]">{q.question}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">— {q.askedBy}</div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={cn(
                    'text-[10px] rounded-full px-2 py-0.5 font-medium',
                    CATEGORY_COLORS[q.category] ?? 'bg-[var(--border-soft)] text-[var(--muted)]'
                  )}
                >
                  {q.category}
                </span>
                <span
                  className={cn(
                    'text-[10px] mono uppercase tracking-wider',
                    DIFFICULTY_COLORS[q.difficulty] ?? 'text-[var(--muted)]'
                  )}
                >
                  {q.difficulty}
                </span>
              </div>
            </div>

            {q.whyNow && (
              <div className="text-xs text-[var(--muted)] italic">
                <span className="font-mono uppercase tracking-wider">Why now</span> · {q.whyNow}
              </div>
            )}

            <div className="rounded-lg border border-[var(--border)] bg-[var(--border-soft)]/40 p-3 space-y-2 text-xs">
              <div>
                <div className="font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-1">
                  Suggested answer framework
                </div>
                <p className="text-[var(--fg-soft)] leading-relaxed">
                  {q.suggestedAnswer.framework}
                </p>
              </div>

              {q.suggestedAnswer.numbersToHave.length > 0 && (
                <div>
                  <div className="font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-1">
                    Numbers to have ready
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {q.suggestedAnswer.numbersToHave.map((n, j) => (
                      <span
                        key={j}
                        className="rounded bg-white border border-[var(--border)] px-1.5 py-0.5 mono tabular"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {q.suggestedAnswer.pivotPoints.length > 0 && (
                <div>
                  <div className="font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-1">
                    Pivot if needed
                  </div>
                  <ul className="space-y-0.5 text-[var(--fg-soft)]">
                    {q.suggestedAnswer.pivotPoints.map((p, j) => (
                      <li key={j}>· {p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {q.suggestedAnswer.landminesToAvoid.length > 0 && (
                <div>
                  <div className="font-mono uppercase tracking-wider text-rose-600 mb-1">
                    Landmines to avoid
                  </div>
                  <ul className="space-y-0.5 text-rose-700">
                    {q.suggestedAnswer.landminesToAvoid.map((l, j) => (
                      <li key={j}>· {l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {questions.length > 0 && citations.length > 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 p-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-1.5">
              Based on
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
      </div>
    </div>
  );
}
