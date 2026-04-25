'use client';

import { useState, useTransition } from 'react';
import { draftScript, type EarningsScript } from '@/actions/script';
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
  const [showSources, setShowSources] = useState(false);
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

  function copyAll() {
    if (!script) return;
    const ceo = script.prepared_remarks.ceo
      .map((s) => `[${s.section}]\n${s.content}`)
      .join('\n\n');
    const cfo = script.prepared_remarks.cfo
      .map((s) => `[${s.section}]\n${s.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(`CEO Prepared Remarks\n\n${ceo}\n\nCFO Prepared Remarks\n\n${cfo}`);
  }

  return (
    <div className="space-y-6">
      <AgentCard>
        <Field label="Quarter">
          <input
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            placeholder="e.g. Q1 2026"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 h-11 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all"
          />
        </Field>

        <Field label="Current quarter highlights" hint="Paste your slide bullets or talking points">
          <textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder="Don't worry about voice. The agent will match your CEO and CFO from prior calls."
            className="w-full h-32 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-none"
          />
        </Field>

        <SourcePicker
          label={`Voice sourced from ${selected.size} of ${sources.length} prior transcripts`}
          open={showSources}
          onToggle={() => setShowSources(!showSources)}
        >
          <FilingChecklist filings={sources} selected={selected} onToggle={toggle} />
        </SourcePicker>

        <PrimaryButton
          onClick={submit}
          disabled={pending || !quarter.trim() || !highlights.trim() || selected.size === 0}
        >
          {pending ? 'Drafting' : 'Draft script'}
        </PrimaryButton>

        <PoweredBy text="Earnings Script Drafter agent · CEO + CFO prepared remarks" />
      </AgentCard>

      {error && <ErrorBox error={error} />}
      {pending && <LoadingBox label="Earnings Script Drafter is reading prior calls and writing prepared remarks" />}

      {script && (
        <>
          <SectionHeader title="Earnings call script" actionLabel="Copy all" onAction={copyAll} />

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-2">
              Estimated timing
            </div>
            <div className="flex gap-8">
              <Timing minutes={script.timing.ceoEstimatedMinutes} label="CEO" />
              <Timing minutes={script.timing.cfoEstimatedMinutes} label="CFO" />
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

function Timing({ minutes, label }: { minutes: number; label: string }) {
  return (
    <div>
      <div className="mono tabular text-2xl font-semibold text-[var(--accent-ink)]">{minutes}</div>
      <div className="text-xs text-[var(--muted)]">min {label}</div>
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
