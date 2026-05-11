import { notFound } from 'next/navigation';
import { getCompanyByTicker } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { getSampleTranscripts } from '@/lib/sample-transcripts';
import { TranscriptWorkbench } from '@/components/transcript-workbench';

export const revalidate = 3600;

export default async function TranscriptPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const override = getOverride(symbol);
  const categories = override.categories ?? [];
  const samples = getSampleTranscripts(symbol);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          Earnings Transcript Summarizer
        </h1>
        <p className="mt-2 text-base text-[var(--muted)] max-w-2xl leading-relaxed">
          Paste a corrected earnings transcript. The agent organizes it by your focus categories,
          extracts the bottom line, pulls executive highlights, and drafts the email you would send
          to your distribution list.
        </p>
      </div>

      <TranscriptWorkbench
        symbol={symbol}
        companyName={company.name}
        categories={categories}
        samples={samples}
      />
    </div>
  );
}
