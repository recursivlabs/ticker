'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import { getCompanyByTicker, filterFilings, fetchFilingText } from '@/lib/edgar';

export type RiskDiffInput = {
  symbol: string;
  currentAccession?: string;
  priorAccession?: string;
};

export type RiskDiff = {
  summary: string;
  added: { risk: string; significance: string }[];
  removed: { risk: string; significance: string }[];
  reworded: {
    risk: string;
    prior: string;
    current: string;
    substantiveChange: string;
  }[];
  unchanged: number;
  materialityRead: string;
};

export type RiskDiffResult =
  | {
      ok: true;
      diff: RiskDiff;
      sources: {
        current: { filingDate: string; accession: string; url: string };
        prior: { filingDate: string; accession: string; url: string };
      };
    }
  | { ok: false; error: string };

const AGENT_ID = process.env.TICKER_RISK_AGENT_ID;

function extractRiskFactors(text: string): string {
  const normalized = text
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try multiple heading patterns. 10-Ks vary wildly in formatting.
  const startPatterns = [
    /Item\s*1A\.?\s*[—–-]?\s*Risk\s*Factors/i,
    /ITEM\s*1A[\.\s]+RISK\s*FACTORS/,
    /Item\s*1A\b[\s\S]{0,30}?Risk\s*Factors/i,
    /\bRisk\s*Factors\b/i,
  ];

  let start = -1;
  for (const pattern of startPatterns) {
    const m = normalized.match(pattern);
    if (m && m.index !== undefined && m.index > 1000) {
      start = m.index;
      break;
    }
  }

  if (start === -1) {
    // Last resort: skip the cover page and grab a generous chunk.
    return normalized.slice(5000, 25000);
  }

  const afterStart = normalized.slice(start);
  const endPatterns = [
    /Item\s*1B\b/i,
    /Item\s*2\.?\s*Properties/i,
    /Unresolved\s*Staff\s*Comments/i,
  ];
  let end = afterStart.length;
  for (const pattern of endPatterns) {
    const m = afterStart.match(pattern);
    if (m && m.index !== undefined && m.index > 2000) {
      end = m.index;
      break;
    }
  }

  return afterStart.slice(0, Math.min(end, 25000));
}

export async function diffRiskFactors(input: RiskDiffInput): Promise<RiskDiffResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) return { ok: false, error: 'TICKER_RISK_AGENT_ID not configured' };

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found on EDGAR` };

    const annualReports = filterFilings(company.filings, ['10-K'], 5);
    if (annualReports.length < 2) {
      return {
        ok: false,
        error: `Need at least two 10-K filings on EDGAR, found ${annualReports.length} for ${input.symbol}`,
      };
    }

    const currentFiling =
      (input.currentAccession &&
        annualReports.find((f) => f.accessionNumber === input.currentAccession)) ||
      annualReports[0];
    const priorFiling =
      (input.priorAccession &&
        annualReports.find((f) => f.accessionNumber === input.priorAccession)) ||
      annualReports.find((f) => f.accessionNumber !== currentFiling.accessionNumber) ||
      annualReports[1];

    if (currentFiling.accessionNumber === priorFiling.accessionNumber) {
      return { ok: false, error: 'Pick two different 10-Ks to compare' };
    }

    const [currentRaw, priorRaw] = await Promise.all([
      fetchFilingText(currentFiling).catch((e) => `__ERROR__:${e?.message ?? 'fetch failed'}`),
      fetchFilingText(priorFiling).catch((e) => `__ERROR__:${e?.message ?? 'fetch failed'}`),
    ]);

    if (currentRaw.startsWith('__ERROR__:')) {
      return { ok: false, error: `Could not fetch current 10-K (${currentFiling.filingDate}): ${currentRaw.slice(10)}` };
    }
    if (priorRaw.startsWith('__ERROR__:')) {
      return { ok: false, error: `Could not fetch prior 10-K (${priorFiling.filingDate}): ${priorRaw.slice(10)}` };
    }
    if (currentRaw.length < 2000) {
      return { ok: false, error: `Current 10-K body returned only ${currentRaw.length} chars after HTML strip; the primary document may be a cover page wrapper.` };
    }
    if (priorRaw.length < 2000) {
      return { ok: false, error: `Prior 10-K body returned only ${priorRaw.length} chars after HTML strip; the primary document may be a cover page wrapper.` };
    }

    const currentRisks = extractRiskFactors(currentRaw).slice(0, 4500);
    const priorRisks = extractRiskFactors(priorRaw).slice(0, 4500);

    if (currentRisks.length < 800) {
      return {
        ok: false,
        error: `Risk Factors section not located in current 10-K (extracted ${currentRisks.length} chars). The filing may use non-standard section headings.`,
      };
    }
    if (priorRisks.length < 800) {
      return {
        ok: false,
        error: `Risk Factors section not located in prior 10-K (extracted ${priorRisks.length} chars). The filing may use non-standard section headings.`,
      };
    }

    const userMessage = `Compare the Risk Factors sections from two ${company.name} (${input.symbol}) 10-Ks.

CURRENT 10-K (filed ${currentFiling.filingDate}):
${currentRisks}

PRIOR 10-K (filed ${priorFiling.filingDate}):
${priorRisks}

Return ONLY the JSON object as specified in your system instructions.`;

    const r = getRecursiv();
    const stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from risk diff agent' };

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, error: 'Could not parse risk diff response' };

    const parsed = JSON.parse(jsonMatch[0]) as RiskDiff;

    return {
      ok: true,
      diff: parsed,
      sources: {
        current: {
          filingDate: currentFiling.filingDate,
          accession: currentFiling.accessionNumber,
          url: currentFiling.url,
        },
        prior: {
          filingDate: priorFiling.filingDate,
          accession: priorFiling.accessionNumber,
          url: priorFiling.url,
        },
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
