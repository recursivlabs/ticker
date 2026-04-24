import { notFound } from 'next/navigation';
import { getCompanyByTicker, filterFilings } from '@/lib/edgar';
import { QaWorkbench } from '@/components/qa-workbench';

export const revalidate = 3600;

export default async function QaPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const sources = filterFilings(company.filings, ['8-K', '10-Q', '10-K'], 12);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          Q&A Preparation
        </h1>
        <p className="mt-2 text-base text-[var(--muted)]">
          Anticipate analyst questions for the next earnings call. Suggested answer frameworks, pivot
          points, and landmines to avoid.
        </p>
      </div>

      <QaWorkbench
        symbol={symbol}
        sources={sources.map((f) => ({
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
