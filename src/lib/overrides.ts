// Hand-curated company metadata for high-profile demo tickers.
// EDGAR gives us filings and fiscal calendar but exec profiles + IR
// focus categories require either hand-curation (today) or FactSet's
// people-designation + custom-taxonomy data (post-partnership).

export type Executive = {
  id: string;
  name: string;
  title: string;
  role: 'ceo' | 'cfo' | 'ir' | 'coo' | 'other';
  // True if this exec is on earnings calls / public speaking record
  speaksPublicly: boolean;
};

export type CompanyOverride = {
  ceo?: { name: string; title?: string };
  cfo?: { name: string; title?: string };
  irContact?: { name: string; title?: string };
  hq?: string;
  sectorLabel?: string;
  peers?: string[];
  analystCoverage?: { analyst: string; firm: string; rating?: string; priceTarget?: string }[];
  // IROs track their business by specific, company-shaped buckets.
  // These categories drive how the Transcript Summarizer agent
  // organizes earnings calls + peer commentary.
  categories?: string[];
  // Per-exec voice profiles. The Quote, Script, and Press Release
  // agents draft in a specific exec's voice based on this list.
  executives?: Executive[];
  // The company's standard about-the-company paragraph appended to
  // press releases. Live numbers (revenue, store count, etc.) would
  // come from FactSet at partnership time; today this is the static
  // shell.
  boilerplate?: string;
};

export const OVERRIDES: Record<string, CompanyOverride> = {
  AN: {
    ceo: { name: 'Mike Manley', title: 'CEO' },
    cfo: { name: 'Thomas Szlosek', title: 'CFO' },
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
    categories: [
      'New vehicle retail',
      'Used vehicle retail',
      'Customer financial services',
      'After sales / parts & service',
      'Captive finance',
      'SG&A as % of gross',
      'Capital allocation',
    ],
    executives: [
      { id: 'manley', name: 'Mike Manley', title: 'Chief Executive Officer', role: 'ceo', speaksPublicly: true },
      { id: 'szlosek', name: 'Thomas Szlosek', title: 'Chief Financial Officer', role: 'cfo', speaksPublicly: true },
      { id: 'fiebig', name: 'Derek Fiebig', title: 'VP, Investor Relations', role: 'ir', speaksPublicly: true },
    ],
    boilerplate:
      'AutoNation, Inc. (NYSE: AN), a Fortune 150 company, is one of the largest automotive retailers in the United States. AutoNation owns and operates approximately 350 vehicle franchises across 18 states. The company offers a diverse range of automotive products and services, including new and used vehicles, parts and service, customer financial services, and AutoNation USA used-vehicle stores.',
  },
  ABG: {
    ceo: { name: 'David Hult', title: 'CEO' },
    cfo: { name: 'Daniel Clara', title: 'CFO' },
    hq: 'Duluth, GA',
    sectorLabel: 'Auto Retail',
    peers: ['AN', 'KMX', 'LAD', 'SAH', 'GPI', 'PAG'],
    categories: [
      'New vehicle retail',
      'Used vehicle retail',
      'F&I per retail unit',
      'Parts and service',
      'Clicklane digital platform',
      'SG&A as % of gross',
      'Capital allocation & acquisitions',
    ],
    executives: [
      { id: 'hult', name: 'David Hult', title: 'President & CEO', role: 'ceo', speaksPublicly: true },
      { id: 'clara', name: 'Daniel Clara', title: 'SVP, Operations', role: 'coo', speaksPublicly: true },
      { id: 'panayotov', name: 'Michael Welch', title: 'CFO', role: 'cfo', speaksPublicly: true },
      { id: 'thoms', name: 'Chris Reeves', title: 'VP, Finance & Treasurer', role: 'ir', speaksPublicly: true },
    ],
    boilerplate:
      'Asbury Automotive Group, Inc. (NYSE: ABG), headquartered in Duluth, GA, is one of the largest automotive retailers in the U.S., with 156 new vehicle dealerships consisting of 196 franchises representing 31 brands. Asbury also operates Clicklane, an end-to-end digital retail platform that enables consumers to purchase vehicles entirely online.',
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
    categories: [
      'iPhone revenue',
      'Services revenue',
      'Wearables, Home & Accessories',
      'Mac + iPad',
      'Greater China',
      'Gross margin',
      'Capital return program',
    ],
    executives: [
      { id: 'cook', name: 'Tim Cook', title: 'Chief Executive Officer', role: 'ceo', speaksPublicly: true },
      { id: 'parekh', name: 'Kevan Parekh', title: 'Chief Financial Officer', role: 'cfo', speaksPublicly: true },
    ],
  },
  MSFT: {
    ceo: { name: 'Satya Nadella', title: 'CEO' },
    cfo: { name: 'Amy Hood', title: 'CFO' },
    hq: 'Redmond, WA',
    sectorLabel: 'Software',
    peers: ['GOOGL', 'AMZN', 'META', 'ORCL', 'CRM', 'ADBE'],
    categories: [
      'Azure cloud',
      'AI & Copilot',
      'Productivity (Microsoft 365)',
      'Personal Computing',
      'Gaming',
      'Capital expenditures',
      'Operating margin',
    ],
    executives: [
      { id: 'nadella', name: 'Satya Nadella', title: 'Chief Executive Officer', role: 'ceo', speaksPublicly: true },
      { id: 'hood', name: 'Amy Hood', title: 'Chief Financial Officer', role: 'cfo', speaksPublicly: true },
    ],
  },
  TSLA: {
    ceo: { name: 'Elon Musk', title: 'CEO' },
    cfo: { name: 'Vaibhav Taneja', title: 'CFO' },
    hq: 'Austin, TX',
    sectorLabel: 'Automotive & Energy',
    peers: ['F', 'GM', 'RIVN', 'LCID', 'NIO', 'LI'],
    categories: [
      'Vehicle deliveries',
      'Automotive gross margin (ex credits)',
      'Energy generation & storage',
      'Full Self-Driving',
      'Cybertruck ramp',
      'Capex & cash flow',
      'AI & robotics',
    ],
    executives: [
      { id: 'musk', name: 'Elon Musk', title: 'Chief Executive Officer', role: 'ceo', speaksPublicly: true },
      { id: 'taneja', name: 'Vaibhav Taneja', title: 'Chief Financial Officer', role: 'cfo', speaksPublicly: true },
    ],
  },
  V: {
    ceo: { name: 'Ryan McInerney', title: 'CEO' },
    cfo: { name: 'Chris Suh', title: 'CFO' },
    hq: 'San Francisco, CA',
    sectorLabel: 'Payments',
    peers: ['MA', 'AXP', 'PYPL', 'FIS', 'FISV', 'DFS'],
    categories: [
      'Payments volume',
      'Cross-border transactions',
      'Value-added services',
      'New flows (B2B, P2P, G2C)',
      'Operating expenses',
      'Client incentives',
      'Capital return',
    ],
    executives: [
      { id: 'mcinerney', name: 'Ryan McInerney', title: 'Chief Executive Officer', role: 'ceo', speaksPublicly: true },
      { id: 'suh', name: 'Chris Suh', title: 'Chief Financial Officer', role: 'cfo', speaksPublicly: true },
    ],
  },
};

export function getOverride(ticker: string): CompanyOverride {
  return OVERRIDES[ticker.toUpperCase()] ?? {};
}

export function getCategories(ticker: string): string[] {
  return getOverride(ticker).categories ?? [];
}

export function getExecutives(ticker: string): Executive[] {
  return getOverride(ticker).executives ?? [];
}
