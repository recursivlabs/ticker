'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import { getCompanyByTicker } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';

export type TranscriptInput = {
  symbol: string;
  transcript: string;
  quarter: string;
  callDate?: string;
  categoriesOverride?: string[];
};

export type CategorySummary = {
  category: string;
  bullets: string[];
  bottomLine: string;
  notDiscussed: boolean;
};

export type ExecHighlight = {
  exec: string;
  quote: string;
  context: string;
};

export type TranscriptSummary = {
  headline: string;
  stockMoveContext: string;
  greeting: string;
  categories: CategorySummary[];
  execHighlights: ExecHighlight[];
  qaThemes: string[];
  sentimentArc: string;
};

export type TranscriptResult =
  | {
      ok: true;
      summary: TranscriptSummary;
      meta: {
        ticker: string;
        companyName: string;
        quarter: string;
        callDate: string;
        categoriesUsed: string[];
      };
    }
  | { ok: false; error: string };

const AGENT_ID = process.env.TICKER_TRANSCRIPT_AGENT_ID;

export async function summarizeTranscript(input: TranscriptInput): Promise<TranscriptResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) {
      return {
        ok: false,
        error:
          'TICKER_TRANSCRIPT_AGENT_ID not configured. Create the IR Earnings Transcript Summarizer agent on Recursiv and add its ID to env.',
      };
    }

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found on EDGAR` };

    const override = getOverride(input.symbol);
    const categories = input.categoriesOverride ?? override.categories ?? [];

    if (categories.length === 0) {
      return {
        ok: false,
        error: `No focus categories defined for ${input.symbol}. Add them on the company Overview before running.`,
      };
    }

    const transcript = input.transcript
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/\s+\n/g, '\n')
      .trim()
      .slice(0, 18000);

    if (transcript.length < 500) {
      return { ok: false, error: 'Transcript is too short. Paste the full earnings call text.' };
    }

    const userMessage = `Summarize this earnings call transcript for ${company.name} (${input.symbol}), ${input.quarter}${input.callDate ? `, call date ${input.callDate}` : ''}.

The user's focus categories for this company:
${categories.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Organize the transcript by these exact categories. Use the category names verbatim.

[transcript]
${transcript}
[end transcript]

Return ONLY the JSON object as specified in your system instructions.`;

    const r = getRecursiv();
    const stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from transcript summarizer agent' };

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, error: 'Could not parse transcript summarizer response' };

    const parsed = JSON.parse(jsonMatch[0]) as TranscriptSummary;

    return {
      ok: true,
      summary: parsed,
      meta: {
        ticker: input.symbol.toUpperCase(),
        companyName: company.name,
        quarter: input.quarter,
        callDate: input.callDate ?? '',
        categoriesUsed: categories,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
