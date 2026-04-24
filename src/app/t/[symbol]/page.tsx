import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker, filterFilings } from '@/lib/edgar';
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
  const pressReleases = filterFilings(company.filings, ['8-K'], 6);
  const quarterlyReports = filterFilings(company.filings, ['10-Q'], 3);
  const annualReports = filterFilings(company.filings, ['10-K'], 2);

  const lastReport = quarterlyReports[0] || annualReports[0];
  const lastReportDate = lastReport?.reportDate ? new Date(lastReport.reportDate) : null;
  const nextEarnings = estimateNextEarnings(lastReportDate, company.fiscalYearEnd);

  const sectorLabel = override.sectorLabel ?? company.sicDescription ?? '-';
  const ceo = override.ceo;
  const cfo = override.cfo;
  const hq = override.hq;

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          Welcome back to {company.name}
        </h1>
        <p className="mt-2 text-base text-[var(--muted)]">
          Pick a workflow from the left, or start from the recent activity below.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-3">
            Company profile
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {ceo && (
              <div>
                <dt className="text-[var(--muted)]">CEO</dt>
                <dd className="font-medium text-[var(--fg)] mt-0.5">{ceo.name}</dd>
              </div>
            )}
            {cfo && (
              <div>
                <dt className="text-[var(--muted)]">CFO</dt>
                <dd className="font-medium text-[var(--fg)] mt-0.5">{cfo.name}</dd>
              </div>
            )}
            {hq && (
              <div>
                <dt className="text-[var(--muted)]">HQ</dt>
                <dd className="font-medium text-[var(--fg)] mt-0.5">{hq}</dd>
              </div>
            )}
            <div>
              <dt className="text-[var(--muted)]">Sector</dt>
              <dd className="font-medium text-[var(--fg)] mt-0.5">{sectorLabel}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Fiscal year end</dt>
              <dd className="font-medium text-[var(--fg)] mt-0.5 mono">{company.fiscalYearEnd ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">CIK</dt>
              <dd className="font-medium text-[var(--fg)] mt-0.5 mono">{company.cik}</dd>
            </div>
          </dl>
        </div>

        <EarningsCountdown targetISO={nextEarnings.toISOString()} />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
              Recent 8-K filings
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              Click any filing to summarize it in seconds.
            </div>
          </div>
          <a
            href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${company.cik}&type=8-K&dateb=&owner=include&count=40`}
            target="_blank"
            rel="noopener"
            className="text-xs text-[var(--muted)] hover:text-[var(--accent-ink)]"
          >
            View all on EDGAR →
          </a>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {pressReleases.length === 0 && (
            <div className="p-5 text-sm text-[var(--muted)]">No recent 8-K filings.</div>
          )}
          {pressReleases.map((f) => (
            <div
              key={f.accessionNumber}
              className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-[var(--border-soft)]/50 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--fg)] truncate">
                  {f.primaryDocDescription || f.primaryDocument}
                </div>
                <div className="text-xs text-[var(--muted)] mono mt-0.5">
                  {f.form} · {f.accessionNumber}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/t/${symbol}/summarize?accession=${f.accessionNumber}`}
                  className="text-[11px] rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 font-medium text-[var(--fg-soft)] opacity-0 group-hover:opacity-100 hover:border-accent/40 hover:text-[var(--accent-ink)] transition-all"
                >
                  Summarize →
                </Link>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener"
                  className="text-xs mono tabular text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  {humanDate(f.filingDate)}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
