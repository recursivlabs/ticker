'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import { getCompanyByTicker, filterFilings, fetchFilingText } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';

export type ScriptInput = {
  symbol: string;
  quarter: string;
  highlights: string;
  selectedTranscriptAccessions: string[];
};

export type EarningsScript = {
  prepared_remarks: {
    ceo: { section: string; content: string }[];
    cfo: { section: string; content: string }[];
  };
  speakerNotes: string[];
  timing: { ceoEstimatedMinutes: number; cfoEstimatedMinutes: number };
  sourcesUsed: string[];
};

export type ScriptResult =
  | { ok: true; script: EarningsScript; citations: { label: string; url: string }[] }
  | { ok: false; error: string };

const AGENT_ID = process.env.TICKER_SCRIPT_AGENT_ID;

export async function draftScript(input: ScriptInput): Promise<ScriptResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) return { ok: false, error: 'TICKER_SCRIPT_AGENT_ID not configured' };

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found on EDGAR` };

    const override = getOverride(input.symbol);
    const ceo = override.ceo?.name ?? `${company.name} CEO`;
    const cfo = override.cfo?.name ?? `${company.name} CFO`;

    // Use 8-Ks (earnings releases) + 10-Qs as proxy for prior transcripts
    const sources = filterFilings(company.filings, ['8-K', '10-Q'], 12);
    const selected = sources.filter((f) =>
      input.selectedTranscriptAccessions.includes(f.accessionNumber)
    );
    const toUse = selected.length > 0 ? selected : sources.slice(0, 3);

    const corpusParts = await Promise.all(
      toUse.slice(0, 3).map(async (f) => {
        try {
          const raw = await fetchFilingText(f);
          return {
            filing: f,
            text: raw
              .replace(/[\x00-\x1F\x7F]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 1800),
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
          `[source ${i + 1} | ${p.filing.form} | ${p.filing.filingDate} | accession:${p.filing.accessionNumber}]\n${p.text}`
      )
      .join('\n\n');

    const userMessage = `Draft an earnings call script for ${company.name} (${input.symbol}) for ${input.quarter}.

CEO: ${ceo}
CFO: ${cfo}

Current-quarter highlights the team wants to cover:
${input.highlights}

Prior ${company.name} filings and releases (use for voice/tonality/rhythm):

${corpus}

Return ONLY valid JSON matching your schema.`;

    const r = getRecursiv();
    const stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from script agent' };

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, error: 'Could not parse script agent response' };

    const parsed = JSON.parse(jsonMatch[0]) as EarningsScript;

    const citations = (parsed.sourcesUsed ?? [])
      .map((acc) => {
        const f = toUse.find((x) => x.accessionNumber === acc);
        if (!f) return null;
        return { label: `${f.form} · ${f.filingDate}`, url: f.url };
      })
      .filter((c): c is { label: string; url: string } => c !== null);

    return { ok: true, script: parsed, citations };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
