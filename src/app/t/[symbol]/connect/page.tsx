import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker } from '@/lib/edgar';

export const revalidate = 3600;

const PROVIDERS = [
  {
    name: 'FactSet',
    description: 'Consensus, transcripts, fundamentals, ownership',
  },
  {
    name: 'S&P Global',
    description: 'Capital IQ fundamentals and ratings',
  },
  {
    name: 'Nasdaq IR Intelligence',
    description: 'Shareholder targeting and peer surveillance',
  },
  {
    name: 'Q4',
    description: 'IR website, investor CRM, events',
  },
];

export default async function ConnectPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  return (
    <div className="max-w-2xl mx-auto py-8 fade-in">
      <div className="flex items-center justify-center gap-2 mb-10 text-xs text-[var(--muted-soft)]">
        <Step n={1} done label="Ticker" />
        <Line />
        <Step n={2} active label="Connect" />
        <Line />
        <Step n={3} label="Workbench" />
      </div>

      <div className="text-center space-y-2 mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          Connect your tools
        </h1>
        <p className="text-base text-[var(--muted)] max-w-md mx-auto">
          Bring your existing entitlements so the agents work on your real data.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)] overflow-hidden shadow-sm">
        {PROVIDERS.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--border-soft)]/40 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-base font-medium text-[var(--fg)]">{p.name}</div>
              <div className="text-sm text-[var(--muted)] truncate">{p.description}</div>
            </div>
            <button
              disabled
              className="shrink-0 rounded-lg bg-[var(--border-soft)] px-4 h-9 text-sm text-[var(--muted-soft)] font-medium cursor-not-allowed"
            >
              Soon
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href={`/t/${symbol}`}
          className="inline-flex items-center gap-2 rounded-lg bg-accent text-white font-medium px-6 h-11 text-sm hover:bg-accent-hover transition-colors"
        >
          Open workbench →
        </Link>
        <p className="text-xs text-[var(--muted-soft)]">
          You can connect tools anytime from the sidebar.
        </p>
      </div>
    </div>
  );
}

function Step({ n, label, active, done }: { n: number; label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={
          'inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-semibold ' +
          (done
            ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
            : active
              ? 'bg-accent text-white'
              : 'bg-[var(--border-soft)] text-[var(--muted-soft)]')
        }
      >
        {done ? '✓' : n}
      </span>
      <span
        className={
          active ? 'text-[var(--fg)] font-medium' : done ? 'text-[var(--fg-soft)]' : 'text-[var(--muted-soft)]'
        }
      >
        {label}
      </span>
    </div>
  );
}

function Line() {
  return <span className="w-6 h-px bg-[var(--border)]" />;
}
