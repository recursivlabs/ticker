import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Nav } from '@/components/nav';
import { TickerTape } from '@/components/ticker-tape';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Ticker · AI workspace for Investor Relations',
  description:
    'Draft CEO quotes, track consensus, benchmark peers, and ship earnings materials faster. Built on EDGAR, FactSet-ready.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] font-sans text-[var(--fg)] antialiased">
        <TickerTape />
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mt-24 border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
          <span className="font-mono">Ticker</span> · Data from{' '}
          <a href="https://www.sec.gov/edgar" className="hover:text-[var(--fg)]">
            EDGAR
          </a>{' '}
          · FactSet-ready · Built on{' '}
          <a href="https://recursiv.io" className="hover:text-[var(--fg)]">
            Recursiv
          </a>
        </footer>
      </body>
    </html>
  );
}
