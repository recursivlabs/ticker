import { notFound } from 'next/navigation';
import { getCompanyByTicker, filterFilings } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { QuoteWorkbench } from '@/components/quote-workbench';

export const revalidate = 3600;

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: { symbol: string };
  searchParams: { exec?: string };
}) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const override = getOverride(symbol);
  const pressReleases = filterFilings(company.filings, ['8-K'], 10);
  const executives = override.executives ?? [];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          Quote &amp; Press Release Drafter
        </h1>
        <p className="mt-2 text-base text-[var(--muted)] max-w-2xl leading-relaxed">
          Pick the speaker. Pick the format. The agent drafts in that exec&rsquo;s actual voice
          using only their prior attributed statements.
        </p>
      </div>

      <QuoteWorkbench
        symbol={symbol}
        companyName={company.name}
        executives={executives}
        preselectedExecId={searchParams.exec}
        filings={pressReleases.map((f) => ({
          accessionNumber: f.accessionNumber,
          form: f.form,
          filingDate: f.filingDate,
          description: f.primaryDocDescription ?? f.primaryDocument,
          url: f.url,
        }))}
      />
    </div>
  );
}
