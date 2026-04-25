'use client';

import { useState, useTransition } from 'react';
import { prepareQa, type QaQuestion } from '@/actions/qa';
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
  const [showSources, setShowSources] = useState(false);
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

  function copyAll() {
    if (questions.length === 0) return;
    const text = questions
      .map(
        (q, i) =>
          `${i + 1}. ${q.question}\n   Suggested: ${q.suggestedAnswer.framework}\n   Numbers: ${q.suggestedAnswer.numbersToHave.join(', ')}\n   Pivot: ${q.suggestedAnswer.pivotPoints.join(' / ')}\n   Avoid: ${q.suggestedAnswer.landminesToAvoid.join('; ')}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
  }

  const visibleQuestions = filterCategory
    ? questions.filter((q) => q.category === filterCategory)
    : questions;

  const categories = Array.from(new Set(questions.map((q) => q.category)));

  return (
    <div className="space-y-6">
      <AgentCard>
        <Field label="Current quarter context" hint="Results, strategy, what's new">
          <textarea
            value={currentContext}
            onChange={(e) => setCurrentContext(e.target.value)}
            placeholder="Paste recent disclosures, results, strategy updates, big numbers, new products. The agent uses this to predict what analysts will ask."
            className="w-full h-36 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-none"
          />
        </Field>

        <SourcePicker
          label={`Patterns sourced from ${selected.size} of ${sources.length} prior filings`}
          open={showSources}
          onToggle={() => setShowSources(!showSources)}
        >
          <FilingChecklist filings={sources} selected={selected} onToggle={toggle} />
        </SourcePicker>

        <PrimaryButton onClick={submit} disabled={pending || !currentContext.trim() || selected.size === 0}>
          {pending ? 'Preparing' : 'Generate brief'}
        </PrimaryButton>

        <PoweredBy text="Q&A Preparer agent · 10-15 questions ranked by risk" />
      </AgentCard>

      {error && <ErrorBox error={error} />}
      {pending && <LoadingBox label="Q&A Preparer is studying analyst patterns and predicting questions" />}

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
        <>
          <SectionHeader title={`${questions.length} likely questions`} actionLabel="Copy all" onAction={copyAll} />

          <div className="flex flex-wrap items-center gap-2">
            <FilterPill label={`All · ${questions.length}`} active={filterCategory === null} onClick={() => setFilterCategory(null)} />
            {categories.map((c) => (
              <FilterPill
                key={c}
                label={c}
                active={filterCategory === c}
                onClick={() => setFilterCategory(c)}
              />
            ))}
          </div>

          {visibleQuestions.map((q, i) => (
            <QuestionCard key={i} q={q} />
          ))}

          {citations.length > 0 && (
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
          )}

          <LastMileDelivery onCopy={copyAll} />
        </>
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-[11px] rounded-full px-2.5 py-1 border transition-colors',
        active
          ? 'border-[var(--accent-ink)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
          : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]'
      )}
    >
      {label}
    </button>
  );
}

function QuestionCard({ q }: { q: QaQuestion }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-base leading-snug font-medium text-[var(--fg)]">{q.question}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">{q.askedBy}</div>
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
            Suggested answer
          </div>
          <p className="text-[var(--fg-soft)] leading-relaxed">{q.suggestedAnswer.framework}</p>
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
  );
}
