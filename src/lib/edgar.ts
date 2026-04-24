const UA = 'Ticker ticker@recursiv.io';
const SEC_BASE = 'https://www.sec.gov';
const DATA_BASE = 'https://data.sec.gov';

async function secFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      ...init?.headers,
    },
    next: { revalidate: 3600 },
  });
}

export type TickerRecord = {
  cik: string;
  ticker: string;
  title: string;
};

let _tickerCache: TickerRecord[] | null = null;

export async function loadTickers(): Promise<TickerRecord[]> {
  if (_tickerCache) return _tickerCache;
  const res = await secFetch(`${SEC_BASE}/files/company_tickers.json`);
  if (!res.ok) throw new Error(`EDGAR tickers fetch failed: ${res.status}`);
  const data = (await res.json()) as Record<string, { cik_str: number; ticker: string; title: string }>;
  _tickerCache = Object.values(data).map((row) => ({
    cik: String(row.cik_str).padStart(10, '0'),
    ticker: row.ticker.toUpperCase(),
    title: row.title,
  }));
  return _tickerCache;
}

export async function findTicker(symbol: string): Promise<TickerRecord | null> {
  const list = await loadTickers();
  const s = symbol.toUpperCase();
  return list.find((t) => t.ticker === s) ?? null;
}

export async function searchTickers(query: string, limit = 10): Promise<TickerRecord[]> {
  const list = await loadTickers();
  const q = query.toUpperCase();
  if (!q) return [];
  const starts = list.filter((t) => t.ticker.startsWith(q));
  if (starts.length >= limit) return starts.slice(0, limit);
  const nameMatch = list.filter(
    (t) => !t.ticker.startsWith(q) && t.title.toUpperCase().includes(q)
  );
  return [...starts, ...nameMatch].slice(0, limit);
}

export type Filing = {
  accessionNumber: string;
  filingDate: string;
  reportDate?: string;
  form: string;
  primaryDocument: string;
  primaryDocDescription?: string;
  url: string;
};

export type CompanySubmissions = {
  cik: string;
  name: string;
  tickers: string[];
  sic: string;
  sicDescription: string;
  fiscalYearEnd: string;
  addresses?: Record<string, unknown>;
  filings: Filing[];
};

export async function getCompanySubmissions(cik: string): Promise<CompanySubmissions> {
  const padded = cik.padStart(10, '0');
  const res = await secFetch(`${DATA_BASE}/submissions/CIK${padded}.json`);
  if (!res.ok) throw new Error(`EDGAR submissions fetch failed: ${res.status}`);
  const data = await res.json();
  const recent = data.filings?.recent;
  const filings: Filing[] = [];
  if (recent) {
    const count = recent.accessionNumber?.length ?? 0;
    for (let i = 0; i < count; i++) {
      const accession: string = recent.accessionNumber[i];
      const accessionDashless = accession.replace(/-/g, '');
      const primaryDoc: string = recent.primaryDocument[i];
      filings.push({
        accessionNumber: accession,
        filingDate: recent.filingDate[i],
        reportDate: recent.reportDate?.[i] || undefined,
        form: recent.form[i],
        primaryDocument: primaryDoc,
        primaryDocDescription: recent.primaryDocDescription?.[i] || undefined,
        url: `${SEC_BASE}/Archives/edgar/data/${parseInt(padded, 10)}/${accessionDashless}/${primaryDoc}`,
      });
    }
  }
  return {
    cik: padded,
    name: data.name,
    tickers: data.tickers ?? [],
    sic: data.sic,
    sicDescription: data.sicDescription,
    fiscalYearEnd: data.fiscalYearEnd,
    addresses: data.addresses,
    filings,
  };
}

export function filterFilings(filings: Filing[], forms: string[], limit = 10): Filing[] {
  return filings.filter((f) => forms.includes(f.form)).slice(0, limit);
}

export async function getCompanyByTicker(symbol: string): Promise<CompanySubmissions | null> {
  const record = await findTicker(symbol);
  if (!record) return null;
  return getCompanySubmissions(record.cik);
}

export async function fetchFilingText(filing: Filing): Promise<string> {
  const res = await secFetch(filing.url, { headers: { Accept: 'text/html' } });
  if (!res.ok) throw new Error(`Filing fetch failed: ${res.status}`);
  const html = await res.text();
  return stripHtml(html);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function sicToPeerSet(sic: string): string[] {
  const PEER_MAP: Record<string, string[]> = {
    '5521': ['AN', 'KMX', 'LAD', 'SAH', 'GPI', 'ABG', 'PAG'],
    '5500': ['AN', 'KMX', 'LAD', 'SAH', 'GPI', 'ABG', 'PAG'],
    '7372': ['MSFT', 'ORCL', 'ADBE', 'CRM', 'INTU', 'NOW'],
    '2834': ['JNJ', 'PFE', 'MRK', 'ABBV', 'LLY', 'BMY'],
    '6021': ['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS'],
  };
  return PEER_MAP[sic] ?? [];
}
