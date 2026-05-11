// Stock price snapshot from Yahoo Finance's public chart endpoint.
// No auth required, occasional rate-limit, graceful fallback to null
// when the endpoint fails. Cached for 5 minutes per ticker.

type Snapshot = {
  symbol: string;
  last: number;
  previousClose: number;
  changePct: number;
  currency: string;
  asOfMs: number;
};

const CACHE = new Map<string, Snapshot>();
const TTL_MS = 5 * 60_000;

export async function getStockSnapshot(symbol: string): Promise<Snapshot | null> {
  const upper = symbol.toUpperCase();
  const cached = CACHE.get(upper);
  if (cached && Date.now() - cached.asOfMs < TTL_MS) return cached;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upper)}?interval=1d&range=2d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15',
        Accept: 'application/json',
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
            currency?: string;
          };
        }>;
      };
    };
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const last = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    if (typeof last !== 'number' || typeof prev !== 'number' || prev === 0) return null;
    const changePct = ((last - prev) / prev) * 100;
    const snap: Snapshot = {
      symbol: upper,
      last,
      previousClose: prev,
      changePct,
      currency: meta.currency ?? 'USD',
      asOfMs: Date.now(),
    };
    CACHE.set(upper, snap);
    return snap;
  } catch {
    return null;
  }
}

export function formatStockMove(snap: Snapshot | null): string {
  if (!snap) return 'Stock movement not yet available.';
  const dir = snap.changePct >= 0 ? 'up' : 'down';
  const abs = Math.abs(snap.changePct).toFixed(2);
  return `Stock is trading ${dir} ${abs}% at $${snap.last.toFixed(2)} ${snap.currency}.`;
}
