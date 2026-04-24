'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Suggestion = { ticker: string; title: string };

export function TickerSearch({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
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
    if (size === 'lg') inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && !(e.metaKey || e.ctrlKey)) {
        if (document.activeElement instanceof HTMLInputElement) return;
        if (document.activeElement instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [size]);

  function submit(ticker: string) {
    if (!ticker.trim()) return;
    router.push(`/t/${ticker.toUpperCase().trim()}/connect`);
    setOpen(false);
    setQuery('');
  }

  const isLarge = size === 'lg';

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/10 transition-all',
          isLarge ? 'px-5 py-4 shadow-md' : 'px-3 py-2'
        )}
      >
        <svg
          className={cn('text-[var(--muted-soft)]', isLarge ? 'h-5 w-5' : 'h-4 w-4')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
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
          placeholder={isLarge ? 'Your company ticker' : 'Ticker or company'}
          className={cn(
            'flex-1 bg-transparent outline-none placeholder:text-[var(--muted-soft)]',
            isLarge ? 'text-lg' : 'text-sm'
          )}
          spellCheck={false}
          autoComplete="off"
        />
        {isLarge && query.trim() && (
          <button
            onClick={() => submit(suggestions[cursor]?.ticker ?? query)}
            className="rounded-lg bg-accent text-white font-medium px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
          >
            Enter →
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button
              key={s.ticker}
              onMouseDown={() => submit(s.ticker)}
              onMouseEnter={() => setCursor(i)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                cursor === i ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'hover:bg-[var(--border-soft)]'
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
