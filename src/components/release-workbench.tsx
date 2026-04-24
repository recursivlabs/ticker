'use client';

import { useState, useTransition } from 'react';
import { draftRelease, type PressRelease } from '@/actions/release';
import { cn } from '@/lib/utils';

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

  function copyFullRelease() {
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
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr] lg:items-start">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] lg:sticky lg:top-20">
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
            Prior releases ({filings.length})
          </div>
          <span className="text-[10px] text-[var(--muted)]">{selected.size} selected</span>
        </div>
        <p className="px-4 pb-2 text-xs text-[var(--muted)]">
          Select 2-5 prior 8-Ks to match tonality and boilerplate from.
        </p>
        <div className="divide-y divide-[var(--border)] max-h-[520px] overflow-y-auto">
          {filings.map((f) => {
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
                      'mt-0.5 h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center',
                      isSelected
                        ? 'border-accent bg-accent text-[var(--bg)]'
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
                    <div className="text-[11px] text-[var(--muted)] mono">{f.form} · {f.filingDate}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-4 lg:sticky lg:top-20">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-2">
            What&rsquo;s the release about?
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Announcing a new digital retail platform launching May 15th that lets customers purchase vehicles entirely online with home delivery..."
            className="w-full h-56 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-accent/60 transition-colors resize-none"
          />
        </div>

        <button
          onClick={submit}
          disabled={pending || !topic.trim() || selected.size === 0}
          className="w-full rounded-md bg-accent text-[var(--bg)] font-medium py-2.5 text-sm disabled:opacity-40 hover:bg-accent-hover transition-colors"
        >
          {pending ? 'Drafting...' : 'Draft full release'}
        </button>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
            {error}
          </div>
        )}

        <div className="text-[10px] text-[var(--muted)] mono">
          Powered by Recursiv · voice matched to prior filings
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
            Generated release
          </div>
          {release && (
            <button
              onClick={copyFullRelease}
              className="text-[11px] text-[var(--muted)] hover:text-accent"
            >
              Copy all
            </button>
          )}
        </div>

        {!release && !pending && !error && (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-6 text-center text-sm text-[var(--muted)]">
            Your draft press release will appear here, fully formatted with dateline, headline, body, CEO quote, and boilerplate.
          </div>
        )}

        {pending && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-accent pulse-dot" />
            Reading prior releases and drafting...
          </div>
        )}

        {release && (
          <article
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-sm leading-relaxed space-y-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <div className="mono text-xs text-[var(--muted)] uppercase tracking-wide">
              {release.dateline}
            </div>
            <h2 className="text-xl font-semibold leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              {release.headline}
            </h2>
            {release.subheadline && (
              <div className="text-base italic text-[var(--muted)]">{release.subheadline}</div>
            )}
            {release.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <blockquote className="border-l-2 border-accent/40 pl-4 italic text-[var(--muted)]">
              &ldquo;{release.quote.text}&rdquo; {release.quote.attributedTo}
            </blockquote>
            {release.boilerplate && (
              <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
                <div className="font-mono uppercase tracking-wider mb-1 not-italic" style={{ fontFamily: 'ui-monospace, monospace' }}>
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
        )}

        {release && citations.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/50 p-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">
              Voice sourced from
            </div>
            <div className="flex flex-wrap gap-1.5">
              {citations.map((c, i) => (
                <a
                  key={i}
                  href={c.url}
                  target="_blank"
                  rel="noopener"
                  className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] mono hover:border-accent/40 hover:text-accent transition-colors"
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
