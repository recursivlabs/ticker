'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import {
  getCompanyByTicker,
  filterFilings,
  getFilingExhibits,
  findEarningsPresentation,
  findEarningsPressRelease,
} from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { formatStockMove, getStockSnapshot } from '@/lib/stock-price';
import { parseAgentJson } from '@/lib/parse-json';

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

export type Attachment = {
  label: string;
  url: string;
  type: 'presentation' | 'transcript' | 'press_release';
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
        attachments: Attachment[];
        stockMove?: {
          last: number;
          changePct: number;
          formatted: string;
        };
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

    // Real-time enrichment: pull stock snapshot + most recent 8-K
    // exhibits in parallel. Both are best-effort — failures don't
    // block the summary.
    const [stockSnap, recentExhibits] = await Promise.all([
      getStockSnapshot(input.symbol),
      (async () => {
        const recent = filterFilings(company.filings, ['8-K'], 5);
        if (recent.length === 0) return [];
        const exhibits = await getFilingExhibits(recent[0], company.cik);
        return exhibits;
      })(),
    ]);

    const presentation = findEarningsPresentation(recentExhibits);
    const pressRelease = findEarningsPressRelease(recentExhibits);
    const stockMoveText = formatStockMove(stockSnap);

    const userMessage = `Summarize this earnings call transcript for ${company.name} (${input.symbol}), ${input.quarter}${input.callDate ? `, call date ${input.callDate}` : ''}.

Today's stock movement context: ${stockMoveText}
Use this directly in the stockMoveContext field — do not fabricate a different number.

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

    const parsed = parseAgentJson<Partial<TranscriptSummary>>(content);
    const summary = normalizeTranscriptSummary(parsed, categories);

    const attachments: Attachment[] = [];
    if (presentation) {
      attachments.push({
        label: presentation.description || presentation.name || 'Earnings presentation',
        url: presentation.url,
        type: 'presentation',
      });
    }
    if (pressRelease) {
      attachments.push({
        label: pressRelease.description || pressRelease.name || 'Earnings press release',
        url: pressRelease.url,
        type: 'press_release',
      });
    }

    return {
      ok: true,
      summary,
      meta: {
        ticker: input.symbol.toUpperCase(),
        companyName: company.name,
        quarter: input.quarter,
        callDate: input.callDate ?? '',
        categoriesUsed: categories,
        attachments,
        stockMove: stockSnap
          ? {
              last: stockSnap.last,
              changePct: stockSnap.changePct,
              formatted: stockMoveText,
            }
          : undefined,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Guarantee the shape the UI assumes. Agents occasionally omit fields,
// return null instead of [], or skip a category. Without this, the
// render explodes on .map/.length of undefined.
function normalizeTranscriptSummary(
  parsed: Partial<TranscriptSummary>,
  categoriesUsed: string[]
): TranscriptSummary {
  const cats = Array.isArray(parsed.categories) ? parsed.categories : [];
  const normalizedCats: CategorySummary[] = categoriesUsed.map((name) => {
    const match = cats.find(
      (c) => typeof c?.category === 'string' && c.category.toLowerCase() === name.toLowerCase()
    );
    if (!match) {
      return { category: name, bullets: [], bottomLine: '', notDiscussed: true };
    }
    return {
      category: match.category || name,
      bullets: Array.isArray(match.bullets) ? match.bullets.filter(Boolean) : [],
      bottomLine: typeof match.bottomLine === 'string' ? match.bottomLine : '',
      notDiscussed: Boolean(match.notDiscussed),
    };
  });

  return {
    headline: typeof parsed.headline === 'string' ? parsed.headline : '',
    stockMoveContext:
      typeof parsed.stockMoveContext === 'string' ? parsed.stockMoveContext : '',
    greeting: typeof parsed.greeting === 'string' ? parsed.greeting : '',
    categories: normalizedCats,
    execHighlights: Array.isArray(parsed.execHighlights)
      ? parsed.execHighlights.filter(
          (e): e is ExecHighlight =>
            !!e && typeof e.exec === 'string' && typeof e.quote === 'string'
        )
      : [],
    qaThemes: Array.isArray(parsed.qaThemes)
      ? parsed.qaThemes.filter((q): q is string => typeof q === 'string')
      : [],
    sentimentArc: typeof parsed.sentimentArc === 'string' ? parsed.sentimentArc : '',
  };
}
