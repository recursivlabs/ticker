import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://ticker.on.recursiv.io'),
  title: {
    default: 'Ticker · The IRO workbench',
    template: '%s · Ticker',
  },
  description:
    'Focused workbench for Investor Relations professionals. Built on the knowledge base of your company. Powered by Recursiv.',
  openGraph: {
    title: 'Ticker · The IRO workbench',
    description:
      'Focused workbench for Investor Relations professionals. Powered by Recursiv.',
    url: 'https://ticker.on.recursiv.io',
    siteName: 'Ticker',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ticker · The IRO workbench',
    description:
      'Focused workbench for Investor Relations professionals. Powered by Recursiv.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] font-sans text-[var(--fg)] antialiased">
        {children}
      </body>
    </html>
  );
}
