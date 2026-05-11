import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompanyByTicker } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { computeVoiceFingerprint, getExecQuotes } from '@/lib/exec-profiles';
import { humanDate } from '@/lib/dates';

export const revalidate = 3600;

export default async function ExecProfilePage({
  params,
}: {
  params: { symbol: string; execId: string };
}) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  const override = getOverride(symbol);
  const exec = override.executives?.find((e) => e.id === params.execId.toLowerCase());
  if (!exec) notFound();

  const quotes = getExecQuotes(symbol, exec.id);
  const fingerprint = computeVoiceFingerprint(quotes);
  const hasCorpus = quotes.length > 0;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <Link href={`/t/${symbol}/people`} className="hover:text-[var(--fg)]">
          Leadership
        </Link>
        <span className="text-[var(--muted-soft)]">/</span>
        <span className="text-[var(--fg-soft)]">{exec.name}</span>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--accent-soft)]/30 p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar name={exec.name} accent={exec.role === 'ceo'} />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)]">
              {exec.name}
            </h1>
            <div className="mt-1 text-base text-[var(--muted)]">{exec.title}</div>
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-0.5 text-[var(--fg-soft)]">
                {company.name}
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-2.5 py-0.5 text-[var(--muted)] mono uppercase tracking-wider">
                {exec.role}
              </span>
              {exec.speaksPublicly && (
                <span className="rounded-full border border-[var(--accent-ink)]/20 bg-[var(--accent-soft)] px-2.5 py-0.5 text-[var(--accent-ink)]">
                  Speaks on calls
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={`/t/${symbol}/quote?exec=${exec.id}`}
              className="rounded-lg bg-accent text-white font-medium px-4 h-9 text-sm inline-flex items-center hover:bg-accent-hover transition-colors"
            >
              Draft in their voice →
            </Link>
          </div>
        </div>
      </div>

      {hasCorpus ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="Attributed quotes" value={String(fingerprint.totalQuotes)} />
            <Metric label="Avg sentence" value={`${fingerprint.avgSentenceLength}w`} hint="words" />
            <Metric
              label="Hedging rate"
              value={`${(fingerprint.hedgingRate * 100).toFixed(1)}%`}
              hint="of words"
            />
            <Metric label="Top phrases" value={String(fingerprint.topPhrases.length)} hint="3-grams ≥ 2" />
          </div>

          {fingerprint.topPhrases.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-3">
                Recurring phrases
              </div>
              <div className="flex flex-wrap gap-2">
                {fingerprint.topPhrases.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1 text-xs text-[var(--fg-soft)] mono"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
                Attributed quotes timeline
              </div>
              <div className="mt-0.5 text-sm text-[var(--muted)]">
                The corpus the draft agents use when speaking as {exec.name}.
              </div>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {quotes.map((q, i) => (
                <div key={i} className="px-5 py-4">
                  <blockquote className="text-sm leading-relaxed text-[var(--fg)]">
                    &ldquo;{q.text}&rdquo;
                  </blockquote>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[var(--muted)] italic">{q.context}</span>
                    <span className="text-[var(--muted-soft)] mono tabular">
                      {humanDate(q.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)] text-[11px] text-[var(--muted-soft)] flex items-center justify-between">
              <span>
                Sourced from EDGAR 8-Ks + transcripts. FactSet linkage activates with partnership.
              </span>
              <Link
                href={`/t/${symbol}/quote?exec=${exec.id}`}
                className="text-[var(--accent-ink)] hover:underline"
              >
                Draft new →
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
          <div className="text-sm font-medium text-[var(--fg)] mb-1">Voice profile pending</div>
          <div className="text-sm text-[var(--muted)] max-w-md mx-auto">
            We have not yet extracted {exec.name}&rsquo;s attributed quotes from prior filings. The
            voice fingerprint will populate as the extraction pipeline runs.
          </div>
        </div>
      )}
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
        'h-16 w-16 shrink-0 rounded-full flex items-center justify-center text-xl font-semibold ' +
        (accent
          ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
          : 'bg-[var(--border-soft)] text-[var(--muted)]')
      }
    >
      {initials}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)]">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold mono tabular text-[var(--fg)]">{value}</span>
        {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      </div>
    </div>
  );
}
