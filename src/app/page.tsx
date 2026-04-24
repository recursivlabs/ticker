import Link from 'next/link';
import { TickerSearch } from '@/components/ticker-search';

const SUGGESTED = [
  { ticker: 'AN', name: 'AutoNation' },
  { ticker: 'AAPL', name: 'Apple' },
  { ticker: 'MSFT', name: 'Microsoft' },
  { ticker: 'TSLA', name: 'Tesla' },
  { ticker: 'V', name: 'Visa' },
];

const CAPABILITIES = [
  {
    href: '#quotes',
    badge: 'Draft',
    title: 'CEO Quote Generator',
    body: 'Draft quotes in your CEO’s voice from prior press releases. Every line cited to the source.',
  },
  {
    href: '#consensus',
    badge: 'Analyze',
    title: 'Consensus Delta',
    body: 'Before/after analyst consensus across any two dates. Exports to Excel and PowerPoint linked charts.',
  },
  {
    href: '#peers',
    badge: 'Benchmark',
    title: 'Peer Benchmark',
    body: 'Compare any metric across your peer set. Auto-peers from SIC + size, fully editable.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 py-8">
      <section className="mx-auto max-w-3xl text-center space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-dot" />
          Earnings season is here. Prep, release, respond. Faster.
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
          The AI workspace for
          <br />
          <span className="text-accent">Investor Relations.</span>
        </h1>
        <p className="text-[var(--muted)] text-lg max-w-xl mx-auto">
          Draft CEO quotes. Track consensus shifts. Benchmark peers. Ship earnings materials faster.
          Built on EDGAR, FactSet-ready.
        </p>
        <div className="max-w-lg mx-auto pt-4">
          <TickerSearch />
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
          <span className="text-[var(--muted)]">Try</span>
          {SUGGESTED.map((s) => (
            <Link
              key={s.ticker}
              href={`/t/${s.ticker}`}
              className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 font-mono text-xs hover:border-accent/40 hover:text-accent transition-colors"
            >
              {s.ticker}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {CAPABILITIES.map((c) => (
          <div
            key={c.title}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 hover:border-accent/30 transition-colors"
          >
            <div className="mb-3 inline-block rounded bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent">
              {c.badge}
            </div>
            <h2 className="mb-1.5 text-lg font-semibold">{c.title}</h2>
            <p className="text-sm leading-relaxed text-[var(--muted)]">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
        <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--muted)]">
          How it works
        </h3>
        <ol className="mt-4 space-y-3 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="font-mono text-accent">01</span>
            <span>
              <strong>Enter a ticker.</strong> We pull the company profile from EDGAR: exec names,
              fiscal calendar, recent press releases, analyst coverage, peer set.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-accent">02</span>
            <span>
              <strong>Pick a task.</strong> Draft a CEO quote, build a consensus delta, benchmark peers.
              Each tool inherits the company context automatically.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-accent">03</span>
            <span>
              <strong>Review and deliver.</strong> Every generation is cited to its source. Export to Word,
              Excel, PowerPoint or push straight to OneDrive/Google Docs.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-accent">04</span>
            <span>
              <strong>Plug in FactSet</strong> (optional) to enrich consensus, analyst tracking, and peer
              benchmarking with your firm’s entitlements.
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}
