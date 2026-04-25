'use client';

import { useState, useTransition } from 'react';
import { summarizeFiling, type FilingSummary } from '@/actions/summarize';
import { LastMileDelivery } from '@/components/last-mile';
import {
  AgentCard,
  ErrorBox,
  Field,
  LoadingBox,
  PoweredBy,
  PrimaryButton,
} from '@/components/agent-ui';
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

  function copyAll() {
    if (!summary) return;
    const text = [
      summary.headline,
      '',
      summary.tldr,
      '',
      'Material events:',
      ...summary.materialEvents.map((m) => `· ${m}`),
      '',
      'Numbers:',
      ...summary.numbers.map((m) => `· ${m}`),
      '',
      'Forward-looking:',
      ...summary.forwardLooking.map((m) => `· ${m}`),
    ].join('\n');
    navigator.clipboard.writeText(text);
  }

  const selectedFiling = filings.find((f) => f.accession === accession);

  return (
    <div className="space-y-6">
      <AgentCard>
        <Field label="Filing to summarize" hint={`${filings.length} recent filings`}>
          <select
            value={accession}
            onChange={(e) => setAccession(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 h-11 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all"
          >
            {filings.map((f) => (
              <option key={f.accession} value={f.accession}>
                {f.form} · {f.filingDateDisplay} · {f.description.slice(0, 60)}
              </option>
            ))}
          </select>
          {selectedFiling && (
            <a
              href={selectedFiling.url}
              target="_blank"
              rel="noopener"
              className="mt-2 inline-block text-xs text-[var(--muted)] hover:text-[var(--accent-ink)]"
            >
              View original on EDGAR ↗
            </a>
          )}
        </Field>

        <PrimaryButton onClick={submit} disabled={pending || !accession}>
          {pending ? 'Summarizing' : 'Summarize'}
        </PrimaryButton>

        <PoweredBy text="Filing Summarizer agent · structured IR briefing" />
      </AgentCard>

      {error && <ErrorBox error={error} />}
      {pending && <LoadingBox label="Filing Summarizer is reading the document and building your briefing" />}

      {summary && source && (
        <>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5 space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-1.5">
                Headline
              </div>
              <h2 className="text-lg font-semibold leading-snug text-[var(--fg)]">
                {summary.headline}
              </h2>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-1.5">
                TL;DR
              </div>
              <p className="text-sm leading-relaxed text-[var(--fg-soft)]">{summary.tldr}</p>
            </div>
          </div>

          <Section title="Material events" items={summary.materialEvents} />
          <Section title="Numbers" items={summary.numbers} mono />
          <Section title="Forward-looking" items={summary.forwardLooking} />
          <Section title="Risk changes" items={summary.riskChanges} />
          <Section title="Next steps for your IR team" items={summary.nextSteps} accent />

          <div className="text-xs text-[var(--muted)]">
            <span className="mono">Source:</span>{' '}
            <a href={source.url} target="_blank" rel="noopener" className="hover:text-[var(--accent-ink)]">
              {source.form} · {source.filingDate}
            </a>
          </div>

          <LastMileDelivery onCopy={copyAll} />
        </>
      )}
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-2">
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className={cn(
              'flex gap-2 text-sm leading-relaxed text-[var(--fg-soft)]',
              mono && 'mono tabular',
              accent && 'text-[var(--fg)]'
            )}
          >
            <span className={cn('shrink-0', accent ? 'text-[var(--accent-ink)]' : 'text-[var(--muted-soft)]')}>·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
