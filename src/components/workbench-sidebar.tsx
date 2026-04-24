'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type Tool = {
  href: string;
  label: string;
  group: 'Overview' | 'Draft' | 'Prepare' | 'Analyze';
  description?: string;
};

export function WorkbenchSidebar({ symbol, companyName }: { symbol: string; companyName: string }) {
  const pathname = usePathname();
  const base = `/t/${symbol}`;

  const tools: Tool[] = [
    { href: base, label: 'Overview', group: 'Overview' },
    { href: `${base}/quote`, label: 'CEO Quote', group: 'Draft' },
    { href: `${base}/release`, label: 'Press Release', group: 'Draft' },
    { href: `${base}/script`, label: 'Earnings Script', group: 'Draft' },
    { href: `${base}/qa`, label: 'Q&A Prep', group: 'Prepare' },
    { href: `${base}/summarize`, label: 'Filing Summarizer', group: 'Analyze' },
    { href: `${base}/risk-diff`, label: 'Risk Factor Diff', group: 'Analyze' },
  ];

  const groups: Tool['group'][] = ['Overview', 'Draft', 'Prepare', 'Analyze'];

  return (
    <aside className="lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--card)] flex flex-col">
      <div className="p-6 border-b border-[var(--border)]">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors mb-4"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z" />
          </svg>
          Switch company
        </Link>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
          Focusing on
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-tight mono">{symbol}</span>
        </div>
        <div className="mt-0.5 text-sm text-[var(--muted)] truncate">{companyName}</div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {groups.map((group) => {
          const groupTools = tools.filter((t) => t.group === group);
          return (
            <div key={group}>
              <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
                {group}
              </div>
              <div className="space-y-0.5">
                {groupTools.map((tool) => {
                  const isActive =
                    tool.href === base
                      ? pathname === base
                      : pathname === tool.href || pathname.startsWith(tool.href + '/');
                  return (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium'
                          : 'text-[var(--fg-soft)] hover:bg-[var(--border-soft)]'
                      )}
                    >
                      {tool.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-2">
          Connections
        </div>
        <Link
          href={`/t/${symbol}/connect`}
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--fg-soft)] hover:bg-[var(--border-soft)] transition-colors"
        >
          <span>Manage connections</span>
          <span className="text-[10px] rounded-full bg-[var(--border-soft)] px-2 py-0.5 text-[var(--muted)]">
            None yet
          </span>
        </Link>
      </div>

      <div className="border-t border-[var(--border)] p-4 text-[10px] text-[var(--muted-soft)]">
        <span className="mono">Ticker</span> · Powered by Recursiv
      </div>
    </aside>
  );
}
