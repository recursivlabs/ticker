'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Suggestion = { ticker: string; title: string };

export function TickerSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ac.signal });
      if (!res.ok) return;
      const data = (await res.json()) as Suggestion[];
      setSuggestions(data);
      setCursor(0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 120);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === '/' || e.key === 'k') && (e.metaKey || e.ctrlKey || e.key === '/')) {
        if (e.key === '/' && !(e.metaKey || e.ctrlKey)) {
          if (document.activeElement instanceof HTMLInputElement) return;
          if (document.activeElement instanceof HTMLTextAreaElement) return;
        }
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function submit(ticker: string) {
    if (!ticker.trim()) return;
    router.push(`/t/${ticker.toUpperCase().trim()}`);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 focus-within:border-accent/60 transition-colors">
        <svg className="h-4 w-4 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (suggestions[cursor]) submit(suggestions[cursor].ticker);
              else submit(query);
            } else if (e.key === 'Escape') {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={compact ? 'Ticker or company...' : 'Enter a ticker (AAPL, AN, MSFT, TSLA)'}
          className={cn(
            'flex-1 bg-transparent outline-none placeholder:text-[var(--muted)]',
            compact ? 'text-sm' : 'text-base'
          )}
          spellCheck={false}
          autoComplete="off"
        />
        <kbd className="hidden md:inline-block rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] font-mono">
          /
        </kbd>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-md border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button
              key={s.ticker}
              onMouseDown={() => submit(s.ticker)}
              onMouseEnter={() => setCursor(i)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors',
                cursor === i ? 'bg-accent-subtle text-accent' : 'hover:bg-neutral-900'
              )}
            >
              <span className="font-mono font-semibold">{s.ticker}</span>
              <span className="text-[var(--muted)] truncate ml-4">{s.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
