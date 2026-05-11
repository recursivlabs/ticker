'use client';

import { useEffect, useState } from 'react';

export function useBoilerplate(symbol: string, fallback: string | null) {
  const [value, setValue] = useState<string>(fallback ?? '');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ticker:boilerplate:${symbol}`);
      if (raw) setValue(raw);
      else if (fallback) setValue(fallback);
    } catch {
      // ignore
    }
  }, [symbol, fallback]);

  function persist(next: string) {
    setValue(next);
    try {
      localStorage.setItem(`ticker:boilerplate:${symbol}`, next);
    } catch {
      // ignore
    }
  }

  return { value, set: persist };
}

export function BoilerplateCard({
  symbol,
  fallback,
}: {
  symbol: string;
  fallback: string | null;
}) {
  const { value, set } = useBoilerplate(symbol, fallback);
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
            About-the-company boilerplate
          </div>
          <div className="mt-0.5 text-sm text-[var(--muted)]">
            Appended to every press release the agent drafts.
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 h-8 inline-flex items-center hover:border-accent/40 hover:text-[var(--accent-ink)] transition-colors"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder="About AutoNation, Inc..."
          className="w-full h-32 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10 transition-all resize-y"
        />
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-raised)]/60 px-4 py-3 text-sm text-[var(--fg-soft)] leading-relaxed">
          {value || (
            <span className="text-[var(--muted-soft)] italic">
              No boilerplate set. Click Edit to add one.
            </span>
          )}
        </div>
      )}
      <div className="mt-2 text-[10px] text-[var(--muted-soft)]">
        Saved locally · cloud sync activates with sign-in
      </div>
    </div>
  );
}
