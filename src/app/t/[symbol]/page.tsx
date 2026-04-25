import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker, filterFilings, sicToPeerSet } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { estimateNextEarnings, humanDate } from '@/lib/dates';
import { EarningsCountdown } from '@/components/earnings-countdown';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  const name = company?.name ?? symbol;
  return {
    title: `${symbol} · ${name}`,
    description: `IR workbench for ${name} (${symbol}).`,
  };
}

export default async function CompanyOverview({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const override = getOverride(symbol);
  const pressReleases = filterFilings(company.filings, ['8-K'], 5);
  const quarterlyReports = filterFilings(company.filings, ['10-Q'], 1);
  const annualReports = filterFilings(company.filings, ['10-K'], 1);

  const lastReport = quarterlyReports[0] || annualReports[0];
  const lastReportDate = lastReport?.reportDate ? new Date(lastReport.reportDate) : null;
  const nextEarnings = estimateNextEarnings(lastReportDate, company.fiscalYearEnd);

  const sectorLabel = override.sectorLabel ?? company.sicDescription ?? '-';
  const ceo = override.ceo;
  const cfo = override.cfo;
  const peers = override.peers ?? sicToPeerSet(company.sic).filter((t) => t !== symbol);
  const coverage = override.analystCoverage ?? [];

  return (
    <div className="space-y-6 fade-in">
      {/* Hero */}
      <div className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--accent-soft)]/40 p-6 md:p-8 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] mono">
                {symbol}
              </h1>
              <span className="text-xl text-[var(--fg-soft)] truncate">{company.name}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 flex-wrap text-sm text-[var(--muted)]">
              <span className="rounded-full bg-[var(--bg-raised)] border border-[var(--border)] px-2.5 py-0.5">
                {sectorLabel}
              </span>
              <span>FY end <span className="text-[var(--fg-soft)] mono">{company.fiscalYearEnd ?? '-'}</span></span>
              <span>CIK <span className="text-[var(--fg-soft)] mono">{company.cik}</span></span>
            </div>
          </div>

          <PriceTile />
        </div>
      </div>

      {/* Top row: 3 tiles */}
      <div className="grid gap-4 md:grid-cols-3">
        <EarningsCountdown targetISO={nextEarnings.toISOString()} />

        <ConsensusTile hasData={Boolean(override.analystCoverage)} symbol={symbol} />

        <CoverageTile coverage={coverage} symbol={symbol} />
      </div>

      {/* Leadership card */}
      {(ceo || cfo) && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
                Leadership voice
              </div>
              <div className="mt-0.5 text-sm text-[var(--muted)]">
                Draft quotes, scripts, and Q&A in their actual voice.
              </div>
            </div>
            <Link
              href={`/t/${symbol}/quote`}
              className="text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3 h-8 inline-flex items-center hover:border-accent/40 hover:text-[var(--accent-ink)] transition-colors"
            >
              Draft a quote →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ceo && <ExecChip name={ceo.name} title={ceo.title ?? 'CEO'} accent />}
            {cfo && <ExecChip name={cfo.name} title={cfo.title ?? 'CFO'} />}
          </div>
        </div>
      )}

      {/* Recent activity + Peers */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <RecentActivity symbol={symbol} pressReleases={pressReleases} cik={company.cik} />

        <div className="space-y-4">
          <PeerSet symbol={symbol} peers={peers} />
          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
}

function PriceTile() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-raised)]/60 px-5 py-3 min-w-[200px]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
        Last price
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-semibold mono tabular text-[var(--muted-soft)]">--.--</span>
        <span className="text-xs text-[var(--muted-soft)]">USD</span>
      </div>
      <div className="mt-1 text-[11px] text-[var(--muted-soft)]">
        Connect a data source for live prices
      </div>
    </div>
  );
}

function ConsensusTile({ hasData, symbol }: { hasData: boolean; symbol: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
          Consensus snapshot
        </div>
        {!hasData && <Pill>FactSet</Pill>}
      </div>
      {hasData ? (
        <>
          <div className="mt-3 mono tabular flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[var(--fg)]">$2.11</span>
            <span className="text-xs text-rose-600">-$0.03 wk</span>
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">EPS consensus · Q1 2026</div>
          <Sparkline trend="down" />
        </>
      ) : (
        <>
          <div className="mt-3 mono tabular text-3xl font-semibold text-[var(--muted-soft)]">$-.--</div>
          <div className="mt-1 text-xs text-[var(--muted-soft)]">EPS consensus · connect FactSet</div>
          <Link
            href={`/t/${symbol}/connect`}
            className="mt-3 inline-block text-xs text-[var(--accent-ink)] hover:underline"
          >
            Connect FactSet →
          </Link>
        </>
      )}
    </div>
  );
}

function CoverageTile({
  coverage,
  symbol,
}: {
  coverage: { analyst: string; firm: string; rating?: string; priceTarget?: string }[];
  symbol: string;
}) {
  const hasData = coverage.length > 0;
  const buys = coverage.filter((a) =>
    /buy|outperform|overweight/i.test(a.rating ?? '')
  ).length;
  const holds = coverage.filter((a) =>
    /hold|neutral|market\s*perform/i.test(a.rating ?? '')
  ).length;
  const sells = coverage.filter((a) =>
    /sell|underperform|underweight/i.test(a.rating ?? '')
  ).length;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
          Analyst coverage
        </div>
        {!hasData && <Pill>FactSet</Pill>}
      </div>

      {hasData ? (
        <>
          <div className="mt-3 mono tabular text-3xl font-semibold text-[var(--fg)]">
            {coverage.length}
            <span className="ml-1 text-xs font-normal text-[var(--muted)]">analysts</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px]">
            <RatingBadge label="Buy" count={buys} tone="buy" />
            <RatingBadge label="Hold" count={holds} tone="hold" />
            <RatingBadge label="Sell" count={sells} tone="sell" />
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 mono tabular text-3xl font-semibold text-[var(--muted-soft)]">--</div>
          <div className="mt-1 text-xs text-[var(--muted-soft)]">
            Connect FactSet for analyst-by-analyst coverage
          </div>
          <Link
            href={`/t/${symbol}/connect`}
            className="mt-3 inline-block text-xs text-[var(--accent-ink)] hover:underline"
          >
            Connect FactSet →
          </Link>
        </>
      )}
    </div>
  );
}

function RatingBadge({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'buy' | 'hold' | 'sell';
}) {
  const colors = {
    buy: 'bg-emerald-100 text-emerald-700',
    hold: 'bg-slate-100 text-slate-600',
    sell: 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 font-medium mono tabular ${colors[tone]}`}>
      {count} {label}
    </span>
  );
}

function Sparkline({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const path =
    trend === 'down'
      ? 'M0 8 L20 6 L40 9 L60 7 L80 14 L100 18'
      : trend === 'up'
        ? 'M0 18 L20 14 L40 15 L60 9 L80 6 L100 4'
        : 'M0 12 L20 10 L40 13 L60 11 L80 12 L100 12';
  return (
    <svg viewBox="0 0 100 24" className="mt-3 h-6 w-full">
      <path
        d={path}
        fill="none"
        stroke={trend === 'down' ? '#e11d48' : trend === 'up' ? '#10b981' : '#94a3b8'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExecChip({ name, title, accent }: { name: string; title: string; accent?: boolean }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-3">
      <div
        className={
          'h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ' +
          (accent
            ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
            : 'bg-[var(--border-soft)] text-[var(--muted)]')
        }
      >
        {initials}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-[var(--fg)] truncate">{name}</div>
        <div className="text-xs text-[var(--muted)]">{title}</div>
      </div>
    </div>
  );
}

function RecentActivity({
  symbol,
  pressReleases,
  cik,
}: {
  symbol: string;
  pressReleases: ReturnType<typeof filterFilings>;
  cik: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
            Recent filings
          </div>
          <div className="mt-0.5 text-sm text-[var(--muted)]">
            Click any to summarize in seconds.
          </div>
        </div>
        <a
          href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=8-K&dateb=&owner=include&count=40`}
          target="_blank"
          rel="noopener"
          className="text-xs text-[var(--muted)] hover:text-[var(--accent-ink)]"
        >
          EDGAR ↗
        </a>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {pressReleases.length === 0 && (
          <div className="p-5 text-sm text-[var(--muted)]">No recent filings.</div>
        )}
        {pressReleases.map((f) => (
          <div
            key={f.accessionNumber}
            className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[var(--border-soft)]/40 transition-colors group"
          >
            <div className="min-w-0 flex-1 flex items-start gap-3">
              <span className="mt-0.5 text-[10px] mono font-semibold rounded bg-[var(--accent-soft)] text-[var(--accent-ink)] px-1.5 py-0.5 shrink-0">
                {f.form}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--fg)] truncate">
                  {f.primaryDocDescription || f.primaryDocument}
                </div>
                <div className="text-xs text-[var(--muted)] mono">
                  {humanDate(f.filingDate)}
                </div>
              </div>
            </div>
            <Link
              href={`/t/${symbol}/summarize?accession=${f.accessionNumber}`}
              className="text-[11px] rounded-md border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-1 font-medium text-[var(--fg-soft)] opacity-0 group-hover:opacity-100 hover:border-accent/40 hover:text-[var(--accent-ink)] transition-all shrink-0"
            >
              Summarize →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeerSet({ symbol, peers }: { symbol: string; peers: string[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
            Peer set
          </div>
          <div className="mt-0.5 text-sm text-[var(--muted)]">
            {peers.length > 0 ? `${peers.length} comparable companies` : 'Detect peers from SIC code'}
          </div>
        </div>
        {peers.length > 0 && (
          <Link
            href={`/t/${symbol}/peers`}
            className="text-xs text-[var(--muted)] hover:text-[var(--accent-ink)]"
          >
            Benchmark →
          </Link>
        )}
      </div>
      {peers.length === 0 ? (
        <div className="p-5 pt-0 text-sm text-[var(--muted)]">No peers identified.</div>
      ) : (
        <div className="grid grid-cols-3 divide-x divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {peers.slice(0, 6).map((p) => (
            <Link
              key={p}
              href={`/t/${p}`}
              className="px-4 py-3 hover:bg-[var(--border-soft)]/40 transition-colors text-center"
            >
              <div className="mono font-semibold text-sm text-[var(--fg)]">{p}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingEvents() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-raised)]/60 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
          Upcoming events
        </div>
        <Pill>FactSet</Pill>
      </div>
      <div className="text-sm text-[var(--muted-soft)]">
        Earnings calls, conferences, NDRs, investor days. Connect FactSet to see your
        company&rsquo;s and peers&rsquo; calendar in one place.
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono uppercase tracking-wider text-amber-700">
      {children}
    </span>
  );
}
