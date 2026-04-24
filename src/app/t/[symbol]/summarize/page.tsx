import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker, filterFilings } from '@/lib/edgar';
import { humanDate } from '@/lib/dates';
import { FilingSummarizer } from '@/components/filing-summarizer';

export const revalidate = 3600;

export default async function SummarizePage({
  params,
  searchParams,
}: {
  params: { symbol: string };
  searchParams: { accession?: string };
}) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const filings = filterFilings(company.filings, ['8-K', '10-Q', '10-K'], 15);

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center gap-3 text-sm">
        <Link href={`/t/${symbol}`} className="text-[var(--muted)] hover:text-[var(--fg)]">
          ← {symbol}
        </Link>
        <span className="text-[var(--muted)]">/</span>
        <span>Filing Summarizer</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Filing Summarizer · <span className="text-accent">{symbol}</span>
          <span className="text-[var(--muted)] text-base font-normal ml-2">
            {company.name}
          </span>
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pick any recent SEC filing. Get a crisp IR briefing in seconds.
        </p>
      </div>

      <FilingSummarizer
        symbol={symbol}
        preselectedAccession={searchParams.accession}
        filings={filings.map((f) => ({
          accession: f.accessionNumber,
          form: f.form,
          filingDate: f.filingDate,
          filingDateDisplay: humanDate(f.filingDate),
          description: f.primaryDocDescription ?? f.primaryDocument,
          url: f.url,
        }))}
      />
    </div>
  );
}
