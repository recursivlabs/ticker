'use client';

import { cn } from '@/lib/utils';

export function AgentCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5 space-y-5">
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs font-medium text-[var(--fg-soft)]">{label}</div>
        {hint && <div className="text-[11px] text-[var(--muted-soft)]">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function PoweredBy({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-[var(--muted-soft)] mono">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
      <span>Powered by Recursiv · {text}</span>
    </div>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium text-[var(--fg-soft)]">{title}</h2>
      {actionLabel && onAction && (
        <button onClick={onAction} className="text-xs text-[var(--muted)] hover:text-[var(--accent-ink)]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingBox({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5 flex items-center gap-3 text-sm text-[var(--muted)]">
      <span className="inline-block h-2 w-2 rounded-full bg-accent pulse-dot" />
      <span>{label}...</span>
    </div>
  );
}

export function ErrorBox({ error }: { error: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
      {error}
    </div>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg bg-accent text-white font-medium h-11 text-sm disabled:opacity-40 hover:bg-accent-hover transition-colors"
    >
      {children}
    </button>
  );
}

export function SourcePicker({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-raised)]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-left"
      >
        <span className="text-[var(--fg-soft)]">{label}</span>
        <span className="text-[var(--muted)] text-xs">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && <div className="border-t border-[var(--border)]">{children}</div>}
    </div>
  );
}

export function FilingChecklist<T extends { accession?: string; accessionNumber?: string; form: string; filingDate: string; description?: string }>({
  filings,
  selected,
  onToggle,
}: {
  filings: T[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
      {filings.map((f) => {
        const key = (f.accession ?? f.accessionNumber)!;
        const isSelected = selected.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={cn(
              'w-full text-left px-4 py-2.5 transition-colors flex items-start gap-2',
              isSelected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--border-soft)]'
            )}
          >
            <div
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center',
                isSelected ? 'border-accent bg-accent text-white' : 'border-[var(--border)]'
              )}
            >
              {isSelected && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {f.description && (
                <div className="text-sm truncate text-[var(--fg)]">{f.description}</div>
              )}
              <div className="text-[11px] text-[var(--muted)] mono">
                {f.form} · {f.filingDate}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
