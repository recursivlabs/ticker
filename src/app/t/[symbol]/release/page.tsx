import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker, filterFilings } from '@/lib/edgar';
import { ReleaseWorkbench } from '@/components/release-workbench';

export const revalidate = 3600;

export default async function ReleasePage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const pressReleases = filterFilings(company.filings, ['8-K'], 10);

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center gap-3 text-sm">
        <Link href={`/t/${symbol}`} className="text-[var(--muted)] hover:text-[var(--fg)]">
          ← {symbol}
        </Link>
        <span className="text-[var(--muted)]">/</span>
        <span>Press Release Drafter</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Press Release Drafter · <span className="text-accent">{symbol}</span>
          <span className="text-[var(--muted)] text-base font-normal ml-2">
            {company.name}
          </span>
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Full press release in your company&rsquo;s voice, trained on your prior releases.
        </p>
      </div>

      <ReleaseWorkbench
        symbol={symbol}
        filings={pressReleases.map((f) => ({
          accession: f.accessionNumber,
          form: f.form,
          filingDate: f.filingDate,
          description: f.primaryDocDescription ?? f.primaryDocument,
          url: f.url,
        }))}
      />
    </div>
  );
}
