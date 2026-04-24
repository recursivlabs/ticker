'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import { getCompanyByTicker, fetchFilingText } from '@/lib/edgar';

export type SummarizeInput = {
  symbol: string;
  accession: string;
};

export type FilingSummary = {
  headline: string;
  tldr: string;
  materialEvents: string[];
  numbers: string[];
  forwardLooking: string[];
  riskChanges: string[];
  nextSteps: string[];
};

export type SummarizeResult =
  | {
      ok: true;
      summary: FilingSummary;
      source: { form: string; filingDate: string; accession: string; url: string };
    }
  | { ok: false; error: string };

const AGENT_ID = process.env.TICKER_SUMMARIZER_AGENT_ID;

export async function summarizeFiling(input: SummarizeInput): Promise<SummarizeResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) return { ok: false, error: 'TICKER_SUMMARIZER_AGENT_ID not configured' };

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found on EDGAR` };

    const filing = company.filings.find((f) => f.accessionNumber === input.accession);
    if (!filing) return { ok: false, error: 'Filing not found in recent history' };

    const raw = await fetchFilingText(filing);
    const text = raw
      .replace(/[ -]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);

    const userMessage = `Summarize this ${filing.form} from ${company.name} (${input.symbol}), filed ${filing.filingDate}.

[filing text]
${text}
[end filing text]

Return ONLY the JSON object as specified in your system instructions.`;

    const r = getRecursiv();
    const stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from summarizer agent' };

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, error: 'Could not parse summarizer response' };

    const parsed = JSON.parse(jsonMatch[0]) as FilingSummary;

    return {
      ok: true,
      summary: parsed,
      source: {
        form: filing.form,
        filingDate: filing.filingDate,
        accession: filing.accessionNumber,
        url: filing.url,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
