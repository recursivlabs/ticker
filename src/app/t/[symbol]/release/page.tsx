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
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          Press Release Drafter
        </h1>
        <p className="mt-2 text-base text-[var(--muted)] max-w-2xl leading-relaxed">
          Full press release in your company&rsquo;s voice. Two paths: start from a topic and your
          prior releases set the voice, or paste a prior release and the agent extracts the
          template + asks targeted fill-in questions.
        </p>
      </div>

      <ReleaseWorkbench
        symbol={symbol}
        companyName={company.name}
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
