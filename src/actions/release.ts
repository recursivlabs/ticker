'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import {
  getCompanyByTicker,
  filterFilings,
  fetchFilingText,
  type Filing,
} from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';

export type ReleaseInput = {
  symbol: string;
  topic: string;
  selectedAccessionNumbers: string[];
};

export type PressRelease = {
  dateline: string;
  headline: string;
  subheadline: string;
  body: string[];
  quote: { text: string; attributedTo: string };
  boilerplate: string;
  forwardLookingStatement: string;
  sourcesUsed: string[];
};

export type ReleaseResult =
  | {
      ok: true;
      release: PressRelease;
      citations: { label: string; url: string }[];
    }
  | { ok: false; error: string };

const AGENT_ID = process.env.TICKER_RELEASE_AGENT_ID;

export async function draftRelease(input: ReleaseInput): Promise<ReleaseResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) return { ok: false, error: 'TICKER_RELEASE_AGENT_ID not configured' };

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found on EDGAR` };

    const override = getOverride(input.symbol);
    const ceoLabel =
      override.ceo && override.ceo.title
        ? `${override.ceo.name}, ${override.ceo.title}`
        : override.ceo?.name ?? `${company.name} CEO`;
    const hq = override.hq ?? '';

    const pressReleases = filterFilings(company.filings, ['8-K'], 12);
    const selected = pressReleases.filter((f) =>
      input.selectedAccessionNumbers.includes(f.accessionNumber)
    );
    const toUse = selected.length > 0 ? selected : pressReleases.slice(0, 3);

    const corpusParts = await Promise.all(
      toUse.slice(0, 3).map(async (f) => {
        try {
          const raw = await fetchFilingText(f);
          return {
            filing: f,
            text: raw
              .replace(/[ -]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 2500),
          };
        } catch {
          return { filing: f, text: '' };
        }
      })
    );

    const corpus = corpusParts
      .filter((p) => p.text.length > 300)
      .map(
        (p, i) =>
          `[filing ${i + 1} | ${p.filing.form} | ${p.filing.filingDate} | accession:${p.filing.accessionNumber}]\n${p.text}`
      )
      .join('\n\n');

    const userMessage = `Draft a complete press release for ${company.name} (${input.symbol}).

Topic: ${input.topic}

HQ location for dateline: ${hq || 'use a reasonable default based on the company'}
CEO for the quote: ${ceoLabel}

Prior ${company.name} releases (use for voice/tonality and boilerplate):

${corpus}

Return ONLY valid JSON matching your schema.`;

    const r = getRecursiv();
    const stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from release agent' };

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, error: 'Could not parse release agent response' };

    const parsed = JSON.parse(jsonMatch[0]) as PressRelease;

    const citations = (parsed.sourcesUsed ?? [])
      .map((acc) => {
        const f = toUse.find((x) => x.accessionNumber === acc);
        if (!f) return null;
        return { label: `${f.form} · ${f.filingDate}`, url: f.url };
      })
      .filter((c): c is { label: string; url: string } => c !== null);

    return { ok: true, release: parsed, citations };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function listReleaseSources(symbol: string): Promise<Filing[]> {
  const company = await getCompanyByTicker(symbol);
  if (!company) return [];
  return filterFilings(company.filings, ['8-K'], 10);
}
