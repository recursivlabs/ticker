'use client';

import Link from 'next/link';
import { TickerSearch } from './ticker-search';

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          Ticker
          <span className="ml-1 text-[var(--muted)] text-xs font-normal">on Recursiv</span>
        </Link>

        <div className="flex-1 max-w-sm">
          <TickerSearch compact />
        </div>

        <div className="hidden md:flex items-center gap-1 text-sm text-[var(--muted)]">
          <a
            href="https://www.sec.gov/edgar"
            target="_blank"
            rel="noopener"
            className="rounded-md px-3 py-1.5 hover:text-[var(--fg)] transition-colors"
          >
            EDGAR
          </a>
          <span className="inline-flex items-center gap-1 rounded-md px-3 py-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            FactSet: ready
          </span>
        </div>
      </div>
    </nav>
  );
}
