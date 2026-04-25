'use client';

import { useState, useTransition } from 'react';
import { draftRelease, type PressRelease } from '@/actions/release';
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

type FilingMini = {
  accession: string;
  form: string;
  filingDate: string;
  description: string;
  url: string;
};

export function ReleaseWorkbench({
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

  function copyAll() {
    if (!release) return;
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
          <SectionHeader title="Generated release" actionLabel="Copy all" onAction={copyAll} />
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
