import { notFound } from 'next/navigation';
import { getCompanyByTicker, filterFilings } from '@/lib/edgar';
import { ScriptWorkbench } from '@/components/script-workbench';

export const revalidate = 3600;

export default async function ScriptPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const sources = filterFilings(company.filings, ['8-K', '10-Q'], 10);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          Earnings Call Script
        </h1>
        <p className="mt-2 text-base text-[var(--muted)]">
          Draft prepared remarks for your CEO and CFO in their own voice, from your prior transcripts.
        </p>
      </div>

      <ScriptWorkbench
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
