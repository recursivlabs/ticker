import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker, sicToPeerSet, loadTickers } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';

export const revalidate = 3600;

const SAMPLE_METRICS = {
  AN: {
    revenue: '$26.9B', netIncome: '$654M', eps: '2.11', evEbitda: '7.2x', priceTarget: '$141',
  },
  KMX: {
    revenue: '$26.5B', netIncome: '$537M', eps: '3.41', evEbitda: '12.5x', priceTarget: '$92',
  },
  LAD: {
    revenue: '$32.1B', netIncome: '$772M', eps: '28.84', evEbitda: '6.8x', priceTarget: '$310',
  },
  SAH: {
    revenue: '$14.4B', netIncome: '$322M', eps: '9.22', evEbitda: '6.1x', priceTarget: '$72',
  },
  GPI: {
    revenue: '$17.9B', netIncome: '$540M', eps: '40.21', evEbitda: '7.9x', priceTarget: '$380',
  },
  ABG: {
    revenue: '$14.8B', netIncome: '$482M', eps: '24.72', evEbitda: '7.1x', priceTarget: '$268',
  },
  PAG: {
    revenue: '$29.5B', netIncome: '$858M', eps: '12.78', evEbitda: '8.2x', priceTarget: '$165',
  },
};

export default async function PeersPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const override = getOverride(symbol);
  const peers = override.peers ?? sicToPeerSet(company.sic).filter((t) => t !== symbol);

  const tickerList = await loadTickers().catch(() => []);
  const peerRows = await Promise.all(
    [symbol, ...peers].map(async (t) => {
      const rec = tickerList.find((r) => r.ticker === t);
      return {
        ticker: t,
        name: rec?.title ?? t,
        metrics: (SAMPLE_METRICS as Record<string, Record<string, string>>)[t] ?? null,
      };
    })
  );

  const isDemo = symbol === 'AN';

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center gap-3 text-sm">
        <Link href={`/t/${symbol}`} className="text-[var(--muted)] hover:text-[var(--fg)]">
          ← {symbol}
        </Link>
        <span className="text-[var(--muted)]">/</span>
        <span>Peer Benchmark</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Peer Benchmark · <span className="text-accent">{symbol}</span>
          <span className="text-[var(--muted)] text-base font-normal ml-2">
            vs {peers.length} peers
          </span>
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Auto-peer set from SIC code + size. Click any metric to sort.
        </p>
      </div>

      {!isDemo && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-sm">
          <div className="font-medium text-amber-300 mb-1">FactSet required for live peer metrics</div>
          <div className="text-xs text-[var(--muted)]">
            Showing ticker list from EDGAR. Connect FactSet to populate revenue, EPS, EV/EBITDA, and analyst
            price targets across the full peer set.
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--muted)] uppercase font-mono">
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5">Ticker</th>
              <th className="text-left px-4 py-2.5">Company</th>
              <th className="text-right px-4 py-2.5">Revenue (TTM)</th>
              <th className="text-right px-4 py-2.5">Net Inc (TTM)</th>
              <th className="text-right px-4 py-2.5">EPS (TTM)</th>
              <th className="text-right px-4 py-2.5">EV/EBITDA</th>
              <th className="text-right px-4 py-2.5">Price Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {peerRows.map((row) => {
              const isSubject = row.ticker === symbol;
              const m = row.metrics;
              return (
                <tr key={row.ticker} className={isSubject ? 'bg-accent-subtle' : ''}>
                  <td className="px-4 py-2.5">
                    <Link href={`/t/${row.ticker}`} className="mono font-semibold hover:text-accent">
                      {row.ticker}
                    </Link>
                    {isSubject && (
                      <span className="ml-2 text-[10px] text-accent mono">subject</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--muted)] truncate max-w-[200px]">
                    {row.name}
                  </td>
                  <td className="px-4 py-2.5 text-right mono tabular">{m?.revenue ?? '-'}</td>
                  <td className="px-4 py-2.5 text-right mono tabular">{m?.netIncome ?? '-'}</td>
                  <td className="px-4 py-2.5 text-right mono tabular">{m?.eps ?? '-'}</td>
                  <td className="px-4 py-2.5 text-right mono tabular">{m?.evEbitda ?? '-'}</td>
                  <td className="px-4 py-2.5 text-right mono tabular">{m?.priceTarget ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm hover:border-accent/40">
          ↓ Excel (.xlsx)
        </button>
        <button className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm hover:border-accent/40">
          ↓ PowerPoint (linked)
        </button>
        <button className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm hover:border-accent/40">
          → Google Sheets
        </button>
        <button className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm hover:border-accent/40">
          → OneDrive
        </button>
      </div>
    </div>
  );
}
