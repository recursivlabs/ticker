'use client';

import { useState, useTransition } from 'react';
import {
  draftScript,
  extractScriptMetrics,
  reuseScript,
  type EarningsScript,
  type ScriptMetric,
} from '@/actions/script';
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

type Mode = 'scratch' | 'reuse';

export function ScriptWorkbench({
  symbol,
  sources,
}: {
  symbol: string;
  sources: SourceMini[];
}) {
  const [mode, setMode] = useState<Mode>('reuse');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-2">
        <div className="grid grid-cols-2 gap-1">
          <ModeButton
            active={mode === 'reuse'}
            onClick={() => setMode('reuse')}
            title="Reuse + delta"
            body="Load prior script, agent updates only what changed"
          />
          <ModeButton
            active={mode === 'scratch'}
            onClick={() => setMode('scratch')}
            title="From scratch"
            body="Start with quarter highlights, agent drafts the whole thing"
          />
        </div>
      </div>

      {mode === 'reuse' ? (
        <ReuseMode symbol={symbol} />
      ) : (
        <ScratchMode symbol={symbol} sources={sources} />
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
// Reuse + delta mode (Bryan's preferred path)
// ============================================================================

function ReuseMode({ symbol }: { symbol: string }) {
  const [priorScript, setPriorScript] = useState('');
  const [quarter, setQuarter] = useState('');
  const [metrics, setMetrics] = useState<ScriptMetric[]>([]);
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [qualitativeNotes, setQualitativeNotes] = useState('');
  const [script, setScript] = useState<EarningsScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extracting, startExtract] = useTransition();
  const [drafting, startDraft] = useTransition();

  function extract() {
    setError(null);
    setMetrics([]);
    setNewValues({});
    setScript(null);
    startExtract(async () => {
      const res = await extractScriptMetrics(symbol, priorScript);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMetrics(res.metrics);
    });
  }

  function draft() {
    setError(null);
    setScript(null);
    startDraft(async () => {
      const res = await reuseScript({
        symbol,
        priorScriptText: priorScript,
        quarter,
        newValues,
        qualitativeNotes,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setScript(res.script);
    });
  }

  return (
    <div className="space-y-6">
      <AgentCard>
        <Field label="Quarter we're drafting">
          <input
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            placeholder="e.g. Q1 2026"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 h-10 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all"
          />
        </Field>

        <Field
          label="Paste prior quarter's script"
          hint={`${priorScript.length.toLocaleString()} chars`}
        >
          <textarea
            value={priorScript}
            onChange={(e) => setPriorScript(e.target.value)}
            placeholder="Paste the prior quarter's full earnings call script (or last year's same quarter). The agent will identify every metric and ask for new values."
            className="w-full h-48 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-y"
          />
        </Field>

        <PrimaryButton onClick={extract} disabled={extracting || priorScript.trim().length < 500}>
          {extracting ? 'Reading prior script' : 'Identify metrics in prior script'}
        </PrimaryButton>

        <PoweredBy text="Earnings Script Drafter agent · reuse + delta mode" />
      </AgentCard>

      {error && <ErrorBox error={error} />}
      {extracting && (
        <LoadingBox label="Reading the prior script and cataloguing every metric that may need updating" />
      )}

      {metrics.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
              {metrics.length} metrics found
            </div>
            <div className="mt-0.5 text-sm text-[var(--muted)]">
              Fill in the new value for anything that changed this quarter. Leave blank to keep the
              prior value.
            </div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {metrics.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_auto_180px] gap-3 px-5 py-3 items-center"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--fg)] truncate">{m.context}</div>
                  <div className="text-xs text-[var(--muted)] truncate">{m.description}</div>
                </div>
                <div className="text-xs mono tabular text-[var(--muted)] whitespace-nowrap">
                  {m.priorValue} →
                </div>
                <input
                  value={newValues[m.id] ?? ''}
                  onChange={(e) =>
                    setNewValues((prev) => ({ ...prev, [m.id]: e.target.value }))
                  }
                  placeholder="new value"
                  className="rounded-md border border-[var(--border)] bg-[var(--bg-raised)] px-2 h-8 text-sm mono tabular outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all"
                />
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] p-5 space-y-4">
            <Field label="Qualitative changes this quarter (optional)">
              <textarea
                value={qualitativeNotes}
                onChange={(e) => setQualitativeNotes(e.target.value)}
                placeholder="e.g. We're calling out a tariff headwind in the macro section, and adding new commentary on captive finance delinquencies."
                className="w-full h-24 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-none"
              />
            </Field>
            <PrimaryButton onClick={draft} disabled={drafting || !quarter.trim()}>
              {drafting ? 'Drafting' : 'Draft new script'}
            </PrimaryButton>
          </div>
        </div>
      )}

      {drafting && (
        <LoadingBox label="Substituting new values into the prior script and preserving its structure" />
      )}

      {script && (
        <>
          <SectionHeader title={`Updated ${quarter || 'earnings'} script`} />
          <ScriptArticle script={script} />
          <div className="rounded-lg border border-[var(--accent-ink)]/30 bg-[var(--accent-soft)]/50 p-3 text-xs text-[var(--accent-ink)]">
            Reused your prior script. Same structure and voice. New values substituted in.
          </div>
          <LastMileDelivery onCopy={() => copyScript(script)} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// From-scratch mode (existing flow)
// ============================================================================

function ScratchMode({
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
    });
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

        <PoweredBy text="Earnings Script Drafter agent · from scratch" />
      </AgentCard>

      {error && <ErrorBox error={error} />}
      {pending && (
        <LoadingBox label="Reading prior transcripts and drafting prepared remarks from scratch" />
      )}

      {script && (
        <>
          <SectionHeader title="Earnings call script" />
          <ScriptArticle script={script} />
          <LastMileDelivery onCopy={() => copyScript(script)} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// Shared rendering
// ============================================================================

function ScriptArticle({ script }: { script: EarningsScript }) {
  return (
    <>
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
    </>
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

function copyScript(script: EarningsScript) {
  const ceo = script.prepared_remarks.ceo
    .map((s) => `[${s.section}]\n${s.content}`)
    .join('\n\n');
  const cfo = script.prepared_remarks.cfo
    .map((s) => `[${s.section}]\n${s.content}`)
    .join('\n\n');
  const notes = script.speakerNotes.map((n) => `· ${n}`).join('\n');
  navigator.clipboard.writeText(
    `CEO Prepared Remarks\n\n${ceo}\n\nCFO Prepared Remarks\n\n${cfo}\n\nSpeaker notes\n\n${notes}`
  );
}
