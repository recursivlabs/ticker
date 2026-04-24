'use client';

import { useEffect, useState } from 'react';
import { diffCountdown } from '@/lib/dates';

export function EarningsCountdown({ targetISO }: { targetISO: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(targetISO);
  const cd = diffCountdown(target, now);

  const label = cd.future
    ? 'Next earnings in'
    : 'Most recent earnings';

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2 mono tabular">
        <span className="text-3xl font-semibold text-accent">{cd.days}</span>
        <span className="text-xs text-[var(--muted)]">d</span>
        <span className="text-2xl font-semibold">{String(cd.hours).padStart(2, '0')}</span>
        <span className="text-xs text-[var(--muted)]">h</span>
        <span className="text-2xl font-semibold">{String(cd.minutes).padStart(2, '0')}</span>
        <span className="text-xs text-[var(--muted)]">m</span>
      </div>
      <div className="mt-1.5 text-xs text-[var(--muted)]">
        {target.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </div>
    </div>
  );
}
