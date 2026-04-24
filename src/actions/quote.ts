'use server';

import { getRecursiv } from '@/lib/recursiv';
import { getCompanyByTicker, filterFilings, fetchFilingText, type Filing } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';

export type QuoteInput = {
  symbol: string;
  topic: string;
  tonality: string;
  selectedAccessionNumbers: string[];
};

export type GeneratedQuote = {
  quote: string;
  citation: { label: string; url: string }[];
};

export type QuoteResult =
  | {
      ok: true;
      quotes: GeneratedQuote[];
      sourcesUsed: { accession: string; label: string; url: string; filingDate: string }[];
    }
  | { ok: false; error: string };

const QUOTE_AGENT_ID = process.env.TICKER_QUOTE_AGENT_ID;

export async function generateQuotes(input: QuoteInput): Promise<QuoteResult> {
  try {
    if (!QUOTE_AGENT_ID) {
      return {
        ok: false,
        error:
          'Quote agent not configured. Set TICKER_QUOTE_AGENT_ID in env. Create a quote drafting agent in the Ticker project on Recursiv.',
      };
    }

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found on EDGAR` };

    const override = getOverride(input.symbol);
    const ceoName = override.ceo?.name ?? 'the CEO';
    const ceoTitle = override.ceo?.title ?? 'CEO';

    const pressReleases = filterFilings(company.filings, ['8-K'], 12);
    const selected = pressReleases.filter((f) =>
      input.selectedAccessionNumbers.includes(f.accessionNumber)
    );
    const toUse = selected.length > 0 ? selected : pressReleases.slice(0, 3);

    const corpusParts = await Promise.all(
      toUse.slice(0, 4).map(async (f) => {
        try {
          const text = await fetchFilingText(f);
          return { filing: f, text: text.slice(0, 8000) };
        } catch {
          return { filing: f, text: '' };
        }
      })
    );

    const corpus = corpusParts
      .filter((p) => p.text.length > 500)
      .map(
        (p, i) =>
          `<filing index="${i}" form="${p.filing.form}" filed="${p.filing.filingDate}" accession="${p.filing.accessionNumber}">\n${p.text}\n</filing>`
      )
      .join('\n\n');

    const userMessage = `Draft 5 quote options for ${ceoName} (${ceoTitle} of ${company.name}, ticker ${input.symbol}).

Topic: ${input.topic}

Tonality: ${input.tonality}

Prior ${company.name} filings (use these for voice/tonality matching):

${corpus}

Return ONLY valid JSON matching:
{"quotes": [{"quote": "string (1-3 sentences)", "sourceAccessions": ["accession string", ...]}, ...]}

Rules:
- 5 distinct options
- Match observed vocabulary, rhythm, stance from the filings
- Do NOT invent numerical figures not already disclosed
- sourceAccessions lists the filings whose tonality most influenced each draft`;

    const r = getRecursiv();
    const response = await r.agents.chat(QUOTE_AGENT_ID, { message: userMessage });

    const content = extractText(response);
    if (!content) return { ok: false, error: 'No response from quote agent' };

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, error: 'Could not parse quote agent response' };

    const parsed = JSON.parse(jsonMatch[0]) as {
      quotes: { quote: string; sourceAccessions?: string[] }[];
    };

    const quotes: GeneratedQuote[] = parsed.quotes.map((q) => {
      const cits = (q.sourceAccessions ?? [])
        .map((acc) => {
          const filing = toUse.find((f) => f.accessionNumber === acc);
          if (!filing) return null;
          return {
            label: `${filing.form} · ${filing.filingDate}`,
            url: filing.url,
          };
        })
        .filter((c): c is { label: string; url: string } => c !== null);
      return { quote: q.quote, citation: cits };
    });

    return {
      ok: true,
      quotes,
      sourcesUsed: toUse.map((f) => ({
        accession: f.accessionNumber,
        label: `${f.form} · ${f.filingDate}`,
        url: f.url,
        filingDate: f.filingDate,
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function extractText(response: unknown): string {
  if (!response || typeof response !== 'object') return '';
  const r = response as Record<string, unknown>;
  if (typeof r.message === 'string') return r.message;
  if (typeof r.content === 'string') return r.content;
  if (typeof r.text === 'string') return r.text;
  if (r.data && typeof r.data === 'object') {
    const d = r.data as Record<string, unknown>;
    if (typeof d.message === 'string') return d.message;
    if (typeof d.content === 'string') return d.content;
  }
  return '';
}

export async function listSourceFilings(symbol: string): Promise<Filing[]> {
  const company = await getCompanyByTicker(symbol);
  if (!company) return [];
  return filterFilings(company.filings, ['8-K'], 10);
}
