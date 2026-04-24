import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker } from '@/lib/edgar';

export const revalidate = 3600;

const PROVIDERS = [
  {
    name: 'FactSet',
    description: 'Consensus estimates, analyst ratings, historical transcripts, fundamentals',
    gradient: 'from-blue-50 to-indigo-50',
    primary: true,
  },
  {
    name: 'S&P Global',
    description: 'Capital IQ fundamentals, credit ratings, ownership data',
    gradient: 'from-amber-50 to-orange-50',
  },
  {
    name: 'Nasdaq IR Intelligence',
    description: 'Shareholder targeting, peer surveillance, investor CRM',
    gradient: 'from-cyan-50 to-sky-50',
  },
  {
    name: 'Q4',
    description: 'IR website, investor CRM, events platform',
    gradient: 'from-violet-50 to-purple-50',
  },
];

export default async function ConnectPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-center gap-2 text-xs text-[var(--muted-soft)]">
        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold">
          ✓
        </span>
        <span>Ticker</span>
        <span className="text-[var(--border)]">/</span>
        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-accent text-white font-semibold">
          2
        </span>
        <span className="text-[var(--fg)] font-medium">Connect your tools</span>
        <span className="text-[var(--border)]">/</span>
        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[var(--border-soft)] text-[var(--muted-soft)]">
          3
        </span>
        <span>Workbench</span>
      </div>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          Connect the tools you already use for {company.name}
        </h1>
        <p className="mt-2 text-base text-[var(--muted)] max-w-2xl leading-relaxed">
          Ticker fences itself around your company&rsquo;s data. Log into your existing
          entitlements and we&rsquo;ll use them securely to enrich every workflow. You can skip this
          for now and add connections later.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PROVIDERS.map((p) => (
          <div
            key={p.name}
            className={
              'rounded-2xl border border-[var(--border)] bg-gradient-to-br ' +
              p.gradient +
              ' p-5 hover:shadow-md transition-all'
            }
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-[var(--fg)]">{p.name}</h3>
              {p.primary && (
                <span className="text-[10px] rounded-full bg-white/70 backdrop-blur-sm px-2 py-0.5 font-mono uppercase tracking-wider text-[var(--accent-ink)]">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--fg-soft)] leading-relaxed min-h-[40px]">
              {p.description}
            </p>
            <button
              disabled
              className="mt-4 w-full rounded-lg bg-white/60 border border-white/50 backdrop-blur-sm py-2 text-sm font-medium text-[var(--fg-soft)] cursor-not-allowed"
            >
              Connect {p.name} · coming soon
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)]">
          Don&rsquo;t have these yet? You can still use everything that works on public SEC data.
        </p>
        <Link
          href={`/t/${symbol}`}
          className="inline-flex items-center gap-2 rounded-lg bg-accent text-white font-medium px-5 py-2.5 text-sm hover:bg-accent-hover transition-colors"
        >
          Skip for now, open workbench →
        </Link>
      </div>
    </div>
  );
}
