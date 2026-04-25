import { TickerSearch } from '@/components/ticker-search';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      <div className="w-full max-w-xl -mt-12 fade-in">
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="text-2xl font-semibold tracking-tight text-[var(--fg)]">
            Ticker
          </span>
        </div>

        <TickerSearch />

        <p className="mt-8 text-center text-sm text-[var(--muted)]">
          The IR workbench. As manual or autonomous as you want.
        </p>
        <p className="mt-1 text-center text-xs text-[var(--muted-soft)]">
          Enter your company&rsquo;s ticker to begin.
        </p>
      </div>

      <div className="absolute bottom-6 text-xs text-[var(--muted-soft)]">
        Powered by{' '}
        <a href="https://recursiv.io" className="hover:text-[var(--muted)]">
          Recursiv
        </a>
      </div>
    </div>
  );
}
