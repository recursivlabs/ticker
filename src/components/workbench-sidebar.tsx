'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function WorkbenchSidebar({ symbol, companyName }: { symbol: string; companyName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/t/${symbol}`;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const agents: { href: string; label: string }[] = [
    { href: `${base}/quote`, label: 'CEO Quote' },
    { href: `${base}/release`, label: 'Press Release' },
    { href: `${base}/script`, label: 'Earnings Script' },
    { href: `${base}/qa`, label: 'Q&A Prep' },
    { href: `${base}/summarize`, label: 'Filing Summarizer' },
    { href: `${base}/risk-diff`, label: 'Risk Factor Diff' },
  ];

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-[var(--border)]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--fg)] transition-colors mb-3"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
            <path d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z" />
          </svg>
          Switch company
        </Link>
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
          Focusing on
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-tight mono">{symbol}</span>
        </div>
        <div className="mt-0.5 text-sm text-[var(--muted)] truncate">{companyName}</div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-0.5">
          <Link
            href={base}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === base
                ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium'
                : 'text-[var(--fg-soft)] hover:bg-[var(--border-soft)]'
            )}
          >
            Overview
          </Link>
        </div>

        <div>
          <div className="px-3 pb-1.5 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent pulse-dot" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
              IR Agents
            </span>
          </div>
          <div className="space-y-0.5">
            {agents.map((agent) => {
              const isActive = pathname === agent.href || pathname.startsWith(agent.href + '/');
              return (
                <Link
                  key={agent.href}
                  href={agent.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium'
                      : 'text-[var(--fg-soft)] hover:bg-[var(--border-soft)]'
                  )}
                >
                  {agent.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-[var(--border)] p-3 space-y-0.5">
        <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
          Workflow
        </div>
        <Link
          href={`/t/${symbol}/routines`}
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === `/t/${symbol}/routines`
              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium'
              : 'text-[var(--fg-soft)] hover:bg-[var(--border-soft)]'
          )}
        >
          <span>Routines</span>
          <span className="text-[10px] rounded-full bg-[var(--border-soft)] px-2 py-0.5 text-[var(--muted)]">
            Manual
          </span>
        </Link>
        <Link
          href={`/t/${symbol}/connect`}
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === `/t/${symbol}/connect`
              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium'
              : 'text-[var(--fg-soft)] hover:bg-[var(--border-soft)]'
          )}
        >
          <span>Connections</span>
          <span className="text-[10px] rounded-full bg-[var(--border-soft)] px-2 py-0.5 text-[var(--muted)]">
            None
          </span>
        </Link>
      </div>

      <div className="border-t border-[var(--border)] p-4 text-[10px] text-[var(--muted-soft)]">
        <span className="mono">Ticker</span> · Powered by Recursiv
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[var(--border-soft)] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
            Focusing on
          </div>
          <div className="flex items-center justify-center gap-2 -mt-0.5">
            <span className="mono text-sm font-semibold">{symbol}</span>
            <span className="text-xs text-[var(--muted)] truncate">{companyName}</span>
          </div>
        </div>
        <Link
          href="/"
          aria-label="Switch company"
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[var(--border-soft)] transition-colors text-[var(--muted)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </Link>
      </header>

      {/* Mobile drawer backdrop */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-[var(--fg)]/30 backdrop-blur-sm"
        />
      )}

      {/* Sidebar: desktop = static column, mobile = slide-in drawer */}
      <aside
        className={cn(
          'bg-[var(--card)] border-[var(--border)] flex flex-col',
          'lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:border-r',
          'fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs border-r shadow-2xl transition-transform duration-200',
          'lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-semibold">Ticker</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--border-soft)] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
