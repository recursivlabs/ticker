export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
  future: boolean;
};

export function diffCountdown(target: Date, from: Date = new Date()): Countdown {
  const ms = target.getTime() - from.getTime();
  const abs = Math.abs(ms);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes, totalMs: ms, future: ms > 0 };
}

export function estimateNextEarnings(lastReport: Date | null, fiscalYearEnd?: string): Date {
  if (lastReport) {
    const next = new Date(lastReport);
    next.setDate(next.getDate() + 91);
    return next;
  }
  // Fallback: next quarterly based on a typical calendar
  const now = new Date();
  const month = now.getMonth();
  const quarterEnd = [2, 5, 8, 11][Math.floor(month / 3)];
  const year = quarterEnd < month ? now.getFullYear() + 1 : now.getFullYear();
  const est = new Date(year, quarterEnd, 28);
  est.setDate(est.getDate() + 21);
  return est;
}

export function humanDate(input: string | Date | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
