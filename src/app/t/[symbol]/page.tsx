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
    title: `${symbol} · ${name} · Ticker`,
    description: `IR workspace for ${name} (${symbol}). Draft quotes, track consensus, benchmark peers.`,
  };
}

export default async function CompanyProfile({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const override = getOverride(symbol);
  const pressReleases = filterFilings(company.filings, ['8-K'], 6);
  const annualReports = filterFilings(company.filings, ['10-K'], 2);
  const quarterlyReports = filterFilings(company.filings, ['10-Q'], 3);

  const lastReport = quarterlyReports[0] || annualReports[0];
  const lastReportDate = lastReport?.reportDate ? new Date(lastReport.reportDate) : null;
  const nextEarnings = estimateNextEarnings(lastReportDate, company.fiscalYearEnd);

  const peers =
    override.peers ??
    sicToPeerSet(company.sic).filter((t) => t !== symbol);

  const sectorLabel = override.sectorLabel ?? company.sicDescription ?? '-';
  const ceo = override.ceo;
  const cfo = override.cfo;
  const hq = override.hq;

  return (
    <div className="space-y-6 py-4">
      {/* Header strip */}
      <div className="flex items-baseline justify-between flex-wrap gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-4xl font-semibold tracking-tight mono">{symbol}</h1>
          <span className="text-xl text-[var(--fg)]">{company.name}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
          <span className="rounded-md border border-[var(--border)] px-2 py-0.5">{sectorLabel}</span>
          <span>FY end: <span className="text-[var(--fg)] mono">{company.fiscalYearEnd ?? '-'}</span></span>
          <span>CIK: <span className="text-[var(--fg)] mono">{company.cik}</span></span>
        </div>
      </div>

      {/* Top row: overview + countdown + quick actions */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
        {/* Company overview */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
            Company
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            {ceo && (
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">CEO</dt>
                <dd>{ceo.name}</dd>
              </div>
            )}
            {cfo && (
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">CFO</dt>
                <dd>{cfo.name}</dd>
              </div>
            )}
            {hq && (
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">HQ</dt>
                <dd>{hq}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Sector (SIC)</dt>
              <dd className="mono">{company.sic}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Tickers</dt>
              <dd className="mono">{company.tickers.join(', ')}</dd>
            </div>
          </dl>
        </div>

        {/* Earnings countdown */}
        <EarningsCountdown targetISO={nextEarnings.toISOString()} />

        {/* Quick actions */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
            Quick actions
          </div>
          <div className="mt-3 grid gap-2">
            <ActionLink href={`/t/${symbol}/quote`} badge="Draft" title="CEO Quote Generator" />
            <ActionLink href={`/t/${symbol}/consensus`} badge="Analyze" title="Consensus Delta" />
            <ActionLink href={`/t/${symbol}/peers`} badge="Benchmark" title="Peer Benchmark" />
            <div className="rounded-md border border-dashed border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)]">
              <span className="mono">Earnings Script</span> · coming soon
            </div>
          </div>
        </div>
      </div>

      {/* Recent press releases */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
            Recent 8-K filings
          </div>
          <a
            href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${company.cik}&type=8-K&dateb=&owner=include&count=40`}
            target="_blank"
            rel="noopener"
            className="text-xs text-[var(--muted)] hover:text-accent"
          >
            View all on EDGAR →
          </a>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {pressReleases.length === 0 && (
            <div className="p-4 text-sm text-[var(--muted)]">No recent 8-K filings.</div>
          )}
          {pressReleases.map((f) => (
            <a
              key={f.accessionNumber}
              href={f.url}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-between px-4 py-3 hover:bg-[var(--card-elevated)] transition-colors text-sm"
            >
              <div className="min-w-0">
                <div className="truncate">{f.primaryDocDescription || f.primaryDocument}</div>
                <div className="text-xs text-[var(--muted)] mono">{f.form} · Accession {f.accessionNumber}</div>
              </div>
              <div className="text-xs mono tabular text-[var(--muted)] ml-4 shrink-0">
                {humanDate(f.filingDate)}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Analyst coverage + peers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              Analyst coverage
            </div>
            {!override.analystCoverage && (
              <span className="text-[10px] rounded border border-amber-400/20 bg-amber-400/5 px-1.5 py-0.5 text-amber-400 font-mono">
                FactSet required
              </span>
            )}
          </div>
          {override.analystCoverage ? (
            <div className="divide-y divide-[var(--border)]">
              {override.analystCoverage.map((a) => (
                <div key={a.analyst} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <div>{a.analyst}</div>
                    <div className="text-xs text-[var(--muted)]">{a.firm}</div>
                  </div>
                  <div className="text-xs mono tabular text-right">
                    <div className="text-accent">{a.rating}</div>
                    <div className="text-[var(--muted)]">{a.priceTarget}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-[var(--muted)]">
              Connect FactSet to populate analyst-by-analyst ratings, price targets, and estimates.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              Peer set
            </div>
            <span className="text-[10px] text-[var(--muted)]">{peers.length} peers</span>
          </div>
          {peers.length === 0 ? (
            <div className="p-4 text-sm text-[var(--muted)]">No peers identified.</div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {peers.map((p) => (
                <Link
                  key={p}
                  href={`/t/${p}`}
                  className="px-4 py-3 hover:bg-[var(--card-elevated)] transition-colors"
                >
                  <div className="mono font-semibold">{p}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Social hint */}
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">
            <span className="mono">0</span> IR professionals following <span className="mono">{symbol}</span>
          </span>
          <button
            disabled
            className="rounded-md border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"
          >
            Sign in to follow (v2)
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionLink({ href, badge, title }: { href: string; badge: string; title: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 hover:border-accent/40 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className="inline-block rounded bg-accent-subtle px-1.5 py-0.5 text-[10px] font-mono font-medium text-accent">
          {badge}
        </span>
        <span className="text-sm group-hover:text-accent transition-colors">{title}</span>
      </div>
      <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity text-sm">→</span>
    </Link>
  );
}
