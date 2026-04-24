import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker, filterFilings } from '@/lib/edgar';
import { RiskDiffWorkbench } from '@/components/risk-diff-workbench';

export const revalidate = 3600;

export default async function RiskDiffPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const annualReports = filterFilings(company.filings, ['10-K'], 3);

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center gap-3 text-sm">
        <Link href={`/t/${symbol}`} className="text-[var(--muted)] hover:text-[var(--fg)]">
          ← {symbol}
        </Link>
        <span className="text-[var(--muted)]">/</span>
        <span>Risk Factor Diff</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Risk Factor Diff · <span className="text-accent">{symbol}</span>
          <span className="text-[var(--muted)] text-base font-normal ml-2">
            {company.name}
          </span>
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          What changed in the 10-K Risk Factors section year over year. Added, removed, substantively reworded.
        </p>
      </div>

      <RiskDiffWorkbench
        symbol={symbol}
        annualReports={annualReports.map((f) => ({
          accession: f.accessionNumber,
          filingDate: f.filingDate,
          url: f.url,
        }))}
      />
    </div>
  );
}
