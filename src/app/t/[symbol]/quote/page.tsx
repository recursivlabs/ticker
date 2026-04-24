import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker, filterFilings } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { QuoteWorkbench } from '@/components/quote-workbench';

export const revalidate = 3600;

export default async function QuotePage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const override = getOverride(symbol);
  const ceo = override.ceo?.name ?? 'the CEO';
  const ceoTitle = override.ceo?.title ?? 'CEO';
  const pressReleases = filterFilings(company.filings, ['8-K'], 10);

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center gap-3 text-sm">
        <Link href={`/t/${symbol}`} className="text-[var(--muted)] hover:text-[var(--fg)]">
          ← {symbol}
        </Link>
        <span className="text-[var(--muted)]">/</span>
        <span>CEO Quote Generator</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Draft a quote for{' '}
          <span className="text-accent">{ceo}</span>
          <span className="text-[var(--muted)] text-base font-normal ml-2">
            {ceoTitle} · {company.name}
          </span>
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Select prior filings to match tonality. Every draft is cited to its sources.
        </p>
      </div>

      <QuoteWorkbench
        symbol={symbol}
        ceoName={ceo}
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
