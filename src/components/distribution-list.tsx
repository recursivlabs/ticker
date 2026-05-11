'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function useDistributionList(symbol: string) {
  const [emails, setEmails] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ticker:dist:${symbol}`);
      if (raw) setEmails(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [symbol]);

  function persist(next: string[]) {
    setEmails(next);
    try {
      localStorage.setItem(`ticker:dist:${symbol}`, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  return { emails, set: persist };
}

export function DistributionListEditor({
  symbol,
  onClose,
}: {
  symbol: string;
  onClose: () => void;
}) {
  const { emails, set } = useDistributionList(symbol);
  const [draft, setDraft] = useState('');

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return;
    if (emails.includes(v)) return;
    set([...emails, v]);
    setDraft('');
  }

  function remove(e: string) {
    set(emails.filter((x) => x !== e));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--fg)]/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <div className="text-sm font-medium text-[var(--fg)]">
              Distribution list · {symbol}
            </div>
            <div className="text-xs text-[var(--muted)]">
              Recipients for emailed briefings
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--border-soft)] transition-colors text-[var(--muted)]"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add();
              }}
              placeholder="name@example.com"
              type="email"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 h-10 text-sm outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all"
            />
            <button
              onClick={add}
              disabled={!draft.trim()}
              className="rounded-lg bg-accent text-white font-medium px-4 h-10 text-sm disabled:opacity-40 hover:bg-accent-hover transition-colors"
            >
              Add
            </button>
          </div>

          {emails.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-soft)]">
              No recipients yet. Add the people who should receive briefings for {symbol}.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--bg-raised)]">
              {emails.map((e) => (
                <div key={e} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-[var(--fg-soft)] truncate">{e}</span>
                  <button
                    onClick={() => remove(e)}
                    className="text-xs text-[var(--muted)] hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-[11px] text-[var(--muted-soft)]">
            Saved locally · cloud sync activates with sign-in. Connect Outlook on the Connections
            page to actually deliver.
          </div>
        </div>
      </div>
    </div>
  );
}

export function DistributionListPill({
  symbol,
  onClick,
}: {
  symbol: string;
  onClick: () => void;
}) {
  const { emails } = useDistributionList(symbol);
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 h-8 text-xs transition-colors',
        emails.length > 0
          ? 'border-[var(--accent-ink)]/30 bg-[var(--accent-soft)] text-[var(--accent-ink)]'
          : 'border-[var(--border)] bg-[var(--bg-raised)] text-[var(--fg-soft)] hover:border-accent/40 hover:text-[var(--accent-ink)]'
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
        <path d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {emails.length > 0 ? `${emails.length} recipient${emails.length === 1 ? '' : 's'}` : 'Set recipients'}
    </button>
  );
}
