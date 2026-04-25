import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker } from '@/lib/edgar';

export const revalidate = 3600;

const DATA_SOURCES = [
  { name: 'FactSet', description: 'Consensus, transcripts, fundamentals, ownership' },
  { name: 'S&P Global', description: 'Capital IQ fundamentals and ratings' },
  { name: 'Nasdaq IR Intelligence', description: 'Shareholder targeting, peer surveillance' },
  { name: 'Q4', description: 'IR website, investor CRM, events' },
];

const OUTPUTS = [
  {
    name: 'OneDrive Excel',
    description: 'Where your ThinkCell-bound deck lives. Updates flow here.',
  },
  { name: 'SharePoint', description: 'Shared workbooks for the IR team' },
  { name: 'Google Sheets', description: 'For Google Workspace teams' },
  { name: 'Outlook', description: 'Email finished drafts to colleagues' },
  { name: 'Microsoft Teams', description: 'Notify when peer 8-Ks drop' },
];

export default async function ConnectPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  return (
    <div className="max-w-3xl mx-auto py-6 fade-in">
      <div className="flex items-center justify-center gap-2 mb-10 text-xs text-[var(--muted-soft)]">
        <Step n={1} done label="Ticker" />
        <Line />
        <Step n={2} active label="Connect" />
        <Line />
        <Step n={3} label="Workbench" />
      </div>

      <div className="text-center space-y-2 mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          Wire up your IR workflow
        </h1>
        <p className="text-base text-[var(--muted)] max-w-lg mx-auto">
          Bring your data sources and output destinations. Then choose how autonomous each routine
          should be.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Section
          icon="↓"
          title="Data sources"
          subtitle="Where context comes in"
          items={DATA_SOURCES}
        />
        <Section
          icon="↑"
          title="Output destinations"
          subtitle="Where work flows out, live"
          items={OUTPUTS}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--accent-soft)] p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white shrink-0 mono text-sm">
            i
          </span>
          <div className="text-sm text-[var(--fg-soft)] leading-relaxed space-y-2">
            <div>
              <span className="font-medium text-[var(--fg)]">Pick your level of autonomy, per
              routine.</span> Use Ticker as a manual workbench. Or schedule routines to run on
              their own. Or trigger them on peer 8-Ks, analyst changes, or earnings T-7. Auto-publish
              what you trust, queue the rest for review. You stay in control.
            </div>
            <div className="text-[var(--muted)]">
              <span className="font-medium text-[var(--fg-soft)]">Zero-touch ThinkCell:</span>{' '}
              connect OneDrive once. Every agent run updates a designated Excel file. Your
              ThinkCell-bound deck refreshes the next time you open it.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href={`/t/${symbol}`}
          className="inline-flex items-center gap-2 rounded-lg bg-accent text-white font-medium px-6 h-11 text-sm hover:bg-accent-hover transition-colors"
        >
          Open workbench →
        </Link>
        <p className="text-xs text-[var(--muted-soft)]">
          Skip for now. Connect anytime from the sidebar.
        </p>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  items,
}: {
  icon: string;
  title: string;
  subtitle: string;
  items: { name: string; description: string }[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--border-soft)]/40">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold">
          {icon}
        </span>
        <div>
          <div className="text-sm font-medium text-[var(--fg)]">{title}</div>
          <div className="text-[11px] text-[var(--muted)]">{subtitle}</div>
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {items.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[var(--border-soft)]/40 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--fg)] truncate">{p.name}</div>
              <div className="text-xs text-[var(--muted)] truncate">{p.description}</div>
            </div>
            <button
              disabled
              className="shrink-0 rounded-md bg-[var(--border-soft)] px-3 h-8 text-xs text-[var(--muted-soft)] font-medium cursor-not-allowed"
            >
              Soon
            </button>
          </div>
        ))}
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
