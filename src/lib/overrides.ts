// Hand-curated company metadata for high-profile demo tickers.
// EDGAR gives us filings and fiscal calendar but exec names require
// parsing DEF 14A proxies (complex). This is a v1 shortcut for the
// tickers Bryan is most likely to demo. Any missing ticker falls back
// to EDGAR-derived data only.

export type CompanyOverride = {
  ceo?: { name: string; title?: string };
  cfo?: { name: string; title?: string };
  irContact?: { name: string; title?: string };
  hq?: string;
  sectorLabel?: string;
  peers?: string[];
  analystCoverage?: { analyst: string; firm: string; rating?: string; priceTarget?: string }[];
};

export const OVERRIDES: Record<string, CompanyOverride> = {
  AN: {
    ceo: { name: 'Mike Manley', title: 'CEO' },
    cfo: { name: 'Tom Szlosek', title: 'CFO' },
    hq: 'Fort Lauderdale, FL',
    sectorLabel: 'Auto Retail',
    peers: ['KMX', 'LAD', 'SAH', 'GPI', 'ABG', 'PAG'],
    analystCoverage: [
      { analyst: 'Adam Jonas', firm: 'Morgan Stanley', rating: 'Overweight', priceTarget: '$150' },
      { analyst: 'John Murphy', firm: 'BofA', rating: 'Buy', priceTarget: '$145' },
      { analyst: 'Rajat Gupta', firm: 'JPMorgan', rating: 'Neutral', priceTarget: '$132' },
      { analyst: 'Daniel Imbro', firm: 'Stephens', rating: 'Overweight', priceTarget: '$148' },
      { analyst: 'David Whiston', firm: 'Morningstar', rating: 'Hold', priceTarget: '$140' },
    ],
  },
  AAPL: {
    ceo: { name: 'Tim Cook', title: 'CEO' },
    cfo: { name: 'Kevan Parekh', title: 'CFO' },
    hq: 'Cupertino, CA',
    sectorLabel: 'Consumer Electronics',
    peers: ['MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'],
    analystCoverage: [
      { analyst: 'Dan Ives', firm: 'Wedbush', rating: 'Outperform', priceTarget: '$225' },
      { analyst: 'Katy Huberty', firm: 'Morgan Stanley', rating: 'Overweight', priceTarget: '$210' },
      { analyst: 'Toni Sacconaghi', firm: 'Bernstein', rating: 'Market Perform', priceTarget: '$180' },
    ],
  },
  MSFT: {
    ceo: { name: 'Satya Nadella', title: 'CEO' },
    cfo: { name: 'Amy Hood', title: 'CFO' },
    hq: 'Redmond, WA',
    sectorLabel: 'Software',
    peers: ['GOOGL', 'AMZN', 'META', 'ORCL', 'CRM', 'ADBE'],
  },
  TSLA: {
    ceo: { name: 'Elon Musk', title: 'CEO' },
    cfo: { name: 'Vaibhav Taneja', title: 'CFO' },
    hq: 'Austin, TX',
    sectorLabel: 'Automotive & Energy',
    peers: ['F', 'GM', 'RIVN', 'LCID', 'NIO', 'LI'],
  },
  V: {
    ceo: { name: 'Ryan McInerney', title: 'CEO' },
    cfo: { name: 'Chris Suh', title: 'CFO' },
    hq: 'San Francisco, CA',
    sectorLabel: 'Payments',
    peers: ['MA', 'AXP', 'PYPL', 'FIS', 'FISV', 'DFS'],
  },
};

export function getOverride(ticker: string): CompanyOverride {
  return OVERRIDES[ticker.toUpperCase()] ?? {};
}
