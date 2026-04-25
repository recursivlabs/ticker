'use client';

import { cn } from '@/lib/utils';

type Destination = {
  key: string;
  label: string;
  icon: React.ReactNode;
  ready?: boolean;
};

const DESTINATIONS: Destination[] = [
  {
    key: 'copy',
    label: 'Copy',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
    ),
  },
  {
    key: 'docx',
    label: 'Word',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  {
    key: 'gdoc',
    label: 'Google Doc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M8 12h8M8 16h8M8 8h2" />
      </svg>
    ),
  },
  {
    key: 'xlsx',
    label: 'Excel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 8l3 4 3-4M9 16l3-4 3 4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'sheet',
    label: 'Sheets',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
    ),
  },
  {
    key: 'pptx',
    label: 'PowerPoint',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M12 18v3M9 21h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 6-10 7L2 6" />
      </svg>
    ),
  },
  {
    key: 'slack',
    label: 'Slack',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <rect x="3" y="13" width="6" height="3" rx="1.5" />
        <rect x="13" y="3" width="3" height="6" rx="1.5" />
        <rect x="13" y="15" width="3" height="6" rx="1.5" />
        <rect x="15" y="13" width="6" height="3" rx="1.5" />
        <rect x="3" y="8" width="6" height="3" rx="1.5" />
        <rect x="8" y="3" width="3" height="6" rx="1.5" />
      </svg>
    ),
  },
];

export function LastMileDelivery({
  onCopy,
  className,
}: {
  onCopy?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-[var(--fg)]">Deliver this</div>
          <div className="text-xs text-[var(--muted)]">
            Send the output to the tools your team already uses.
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {DESTINATIONS.map((d) => {
          const enabled = d.ready;
          const onClick =
            d.key === 'copy' ? onCopy : undefined;
          return (
            <button
              key={d.key}
              onClick={onClick}
              disabled={!enabled}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                enabled
                  ? 'border-[var(--border)] bg-[var(--bg-raised)] text-[var(--fg-soft)] hover:border-accent/40 hover:text-[var(--accent-ink)]'
                  : 'border-[var(--border)] bg-[var(--border-soft)] text-[var(--muted-soft)] cursor-not-allowed'
              )}
              title={enabled ? d.label : `${d.label} · coming soon`}
            >
              <span className={enabled ? 'text-[var(--muted)]' : 'text-[var(--muted-soft)]'}>
                {d.icon}
              </span>
              <span className="truncate">{d.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-[10px] text-[var(--muted-soft)]">
        Connect your tools on the <span className="text-[var(--muted)]">Connections</span> page to
        light these up.
      </div>
    </div>
  );
}
