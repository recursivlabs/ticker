'use client';

import Link from 'next/link';

const TAPE = [
  { ticker: 'AAPL', price: '173.42', change: '+1.24' },
  { ticker: 'MSFT', price: '418.05', change: '+3.88' },
  { ticker: 'NVDA', price: '117.23', change: '-0.92' },
  { ticker: 'TSLA', price: '267.10', change: '+5.45' },
  { ticker: 'AMZN', price: '182.91', change: '+0.78' },
  { ticker: 'GOOGL', price: '166.44', change: '+1.12' },
  { ticker: 'META', price: '521.20', change: '+8.44' },
  { ticker: 'AN', price: '138.42', change: '+1.67' },
  { ticker: 'JPM', price: '198.77', change: '-0.33' },
  { ticker: 'V', price: '278.51', change: '+1.04' },
  { ticker: 'KMX', price: '87.22', change: '-0.44' },
  { ticker: 'LAD', price: '302.11', change: '+2.18' },
  { ticker: 'SPY', price: '548.30', change: '+2.91' },
  { ticker: 'QQQ', price: '478.64', change: '+3.22' },
];

export function TickerTape() {
  const doubled = [...TAPE, ...TAPE];
  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg)] overflow-hidden">
      <div className="flex whitespace-nowrap animate-[ticker_80s_linear_infinite] py-1.5">
        {doubled.map((t, i) => {
          const isUp = t.change.startsWith('+');
          return (
            <Link
              key={`${t.ticker}-${i}`}
              href={`/t/${t.ticker}`}
              className="inline-flex items-center gap-2 px-4 text-xs font-mono hover:bg-neutral-900 transition-colors"
            >
              <span className="font-semibold">{t.ticker}</span>
              <span className="text-[var(--muted)]">{t.price}</span>
              <span className={isUp ? 'text-accent' : 'text-rose-400'}>
                {t.change}
              </span>
              <span className="text-[var(--border)]">•</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
