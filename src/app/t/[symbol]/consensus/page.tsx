import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';

export const revalidate = 3600;

const SAMPLE_DELTAS = [
  { analyst: 'Adam Jonas', firm: 'Morgan Stanley', old: 2.15, new: 2.05, delta: -0.1 },
  { analyst: 'John Murphy', firm: 'BofA', old: 2.18, new: 2.15, delta: -0.03 },
  { analyst: 'Rajat Gupta', firm: 'JPMorgan', old: 2.1, new: 2.1, delta: 0 },
  { analyst: 'Daniel Imbro', firm: 'Stephens', old: 2.22, new: 2.18, delta: -0.04 },
  { analyst: 'David Whiston', firm: 'Morningstar', old: 2.12, new: 2.09, delta: -0.03 },
];

export default async function ConsensusPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const override = getOverride(symbol);
  const isDemo = symbol === 'AN';

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center gap-3 text-sm">
        <Link href={`/t/${symbol}`} className="text-[var(--muted)] hover:text-[var(--fg)]">
          ← {symbol}
        </Link>
        <span className="text-[var(--muted)]">/</span>
        <span>Consensus Delta</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Consensus Delta · <span className="text-accent">{symbol}</span>
          <span className="text-[var(--muted)] text-base font-normal ml-2">
            {company.name}
          </span>
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Track how analyst estimates moved between any two dates. Export to Excel + linked PowerPoint.
        </p>
      </div>

      {/* Connect FactSet banner */}
      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 pulse-dot" />
            <div>
              <div className="font-medium text-amber-300">FactSet entitlements required for live data</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                Analyst-by-analyst consensus is gated by FactSet. Showing sample {symbol} data below.
              </div>
            </div>
          </div>
          <button className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-400/20">
            Connect FactSet
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">
              Metric
            </div>
            <select className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm">
              <option>EPS</option>
              <option>Revenue</option>
              <option>EBITDA</option>
              <option>Price Target</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">
              Period
            </div>
            <select className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm">
              <option>Q1 2026</option>
              <option>Q2 2026</option>
              <option>FY 2026</option>
              <option>FY 2027</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">
              From
            </div>
            <input
              type="date"
              defaultValue="2026-02-15"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm mono"
            />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">
              To
            </div>
            <input
              type="date"
              defaultValue="2026-04-24"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm mono"
            />
          </div>
        </div>
      </div>

      {/* Sample table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--muted)] uppercase font-mono">
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5">Analyst</th>
              <th className="text-left px-4 py-2.5">Firm</th>
              <th className="text-right px-4 py-2.5">Old</th>
              <th className="text-right px-4 py-2.5">New</th>
              <th className="text-right px-4 py-2.5">Δ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {(isDemo ? SAMPLE_DELTAS : []).map((row) => {
              const pos = row.delta > 0;
              const neg = row.delta < 0;
              return (
                <tr key={row.analyst}>
                  <td className="px-4 py-2.5">{row.analyst}</td>
                  <td className="px-4 py-2.5 text-[var(--muted)]">{row.firm}</td>
                  <td className="px-4 py-2.5 text-right mono tabular">${row.old.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right mono tabular">${row.new.toFixed(2)}</td>
                  <td
                    className={
                      'px-4 py-2.5 text-right mono tabular ' +
                      (pos ? 'text-accent' : neg ? 'text-rose-400' : 'text-[var(--muted)]')
                    }
                  >
                    {row.delta === 0 ? '-' : `${pos ? '+' : ''}${row.delta.toFixed(2)}`}
                  </td>
                </tr>
              );
            })}
            {!isDemo && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                  Connect FactSet to load analyst-by-analyst data for {symbol}.
                </td>
              </tr>
            )}
          </tbody>
          {isDemo && (
            <tfoot className="border-t-2 border-[var(--border)] bg-[var(--card-elevated)]">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 font-medium">Consensus</td>
                <td className="px-4 py-2.5 text-right mono tabular">$2.14</td>
                <td className="px-4 py-2.5 text-right mono tabular">$2.11</td>
                <td className="px-4 py-2.5 text-right mono tabular text-rose-400">-0.03</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Exports */}
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
