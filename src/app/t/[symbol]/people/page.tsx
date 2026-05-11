import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { getExecQuotes } from '@/lib/exec-profiles';

export const revalidate = 3600;

export default async function PeoplePage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const override = getOverride(symbol);
  const execs = override.executives ?? [];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
          {company.name} leadership
        </h1>
        <p className="mt-2 text-base text-[var(--muted)] max-w-2xl leading-relaxed">
          Each executive has their own voice profile built from prior public statements. Quote
          drafts, scripts, and Q&A prep use the selected exec&rsquo;s actual past words, not a
          generic company voice.
        </p>
      </div>

      {execs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
          No executive profiles yet for {symbol}. Profiles will populate from FactSet&rsquo;s
          people-designation system when connected.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {execs.map((e) => {
            const quotes = getExecQuotes(symbol, e.id);
            const hasCorpus = quotes.length > 0;
            return (
              <Link
                key={e.id}
                href={`/t/${symbol}/people/${e.id}`}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm hover:border-accent/40 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={e.name} accent={e.role === 'ceo'} />
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-medium text-[var(--fg)] truncate group-hover:text-[var(--accent-ink)]">
                      {e.name}
                    </div>
                    <div className="text-xs text-[var(--muted)] truncate">{e.title}</div>
                  </div>
                  {(e.role === 'ceo' || e.role === 'cfo' || e.role === 'ir' || e.role === 'coo') && (
                    <span className="text-[9px] mono uppercase tracking-wider rounded bg-[var(--border-soft)] px-1.5 py-0.5 text-[var(--muted)] shrink-0">
                      {e.role}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={
                      hasCorpus
                        ? 'text-[var(--accent-ink)] font-medium'
                        : 'text-[var(--muted-soft)]'
                    }
                  >
                    {hasCorpus
                      ? `${quotes.length} attributed ${quotes.length === 1 ? 'quote' : 'quotes'}`
                      : 'Voice profile pending'}
                  </span>
                  <span className="text-[var(--muted-soft)] group-hover:text-[var(--accent-ink)]">
                    View profile →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-raised)]/40 p-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-2">
          How voice profiles work
        </div>
        <p className="text-sm text-[var(--fg-soft)] leading-relaxed">
          A profile aggregates every attributed quote in press releases, every prepared remark on
          earnings calls, every Q&A response, and the speaking patterns underneath. Quote drafts
          and earnings scripts are conditioned on the selected exec&rsquo;s corpus only, never on
          a generic company voice. FactSet&rsquo;s people-designation system supplies the cross-
          company linkage in the wired-up version.
        </p>
      </div>
    </div>
  );
}

function Avatar({ name, accent }: { name: string; accent?: boolean }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
  return (
    <div
      className={
        'h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ' +
        (accent
          ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
          : 'bg-[var(--border-soft)] text-[var(--muted)]')
      }
    >
      {initials}
    </div>
  );
}
