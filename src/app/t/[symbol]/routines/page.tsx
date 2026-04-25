import { notFound } from 'next/navigation';
import { getCompanyByTicker } from '@/lib/edgar';
import { RoutinesPanel } from '@/components/routines';

export const revalidate = 3600;

const AGENTS = [
  {
    key: 'quote',
    name: 'CEO Quote',
    description: 'Drafts press-release quotes in your CEO’s voice.',
  },
  {
    key: 'release',
    name: 'Press Release',
    description: 'Drafts full press releases from your prior style.',
  },
  {
    key: 'script',
    name: 'Earnings Script',
    description: 'Drafts CEO + CFO prepared remarks for earnings calls.',
  },
  {
    key: 'qa',
    name: 'Q&A Prep',
    description: 'Anticipates analyst questions with suggested answers.',
  },
  {
    key: 'summarize',
    name: 'Filing Summarizer',
    description: 'Decodes any 8-K, 10-Q, or 10-K into a structured briefing.',
  },
  {
    key: 'risk-diff',
    name: 'Risk Factor Diff',
    description: 'Compares year-over-year Risk Factors changes in 10-Ks.',
  },
];

export default async function RoutinesPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">Routines</h1>
        <p className="mt-2 text-base text-[var(--muted)] max-w-2xl leading-relaxed">
          Each agent can run manually, on a schedule, or in response to events. Pick what flows
          straight to your tools and what queues for your review. You stay in control, however
          much runs without you.
        </p>
      </div>

      <RoutinesPanel symbol={symbol} agents={AGENTS} />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)] p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white shrink-0 mono text-sm">
            i
          </span>
          <div className="text-sm text-[var(--fg-soft)] leading-relaxed">
            <span className="font-medium text-[var(--fg)]">How it works.</span> Schedule and event
            triggers activate once you wire up the matching connections. Until then, your routines
            stay in <span className="font-medium">Manual</span> mode (you click on the agent
            page). Configure away today, autonomy lights up the moment your data and output
            connections are live.
          </div>
        </div>
      </div>
    </div>
  );
}
