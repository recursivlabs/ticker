'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import { getCompanyByTicker, filterFilings, fetchFilingText } from '@/lib/edgar';

export type RiskDiffInput = {
  symbol: string;
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
  // Heuristic: find "Item 1A" / "Risk Factors" through "Item 1B" or "Item 2"
  const normalized = text.replace(/\s+/g, ' ');
  const startMatch = normalized.match(/Item\s*1A\.?\s*Risk\s*Factors/i);
  if (!startMatch || startMatch.index === undefined) {
    return normalized.slice(0, 15000);
  }
  const start = startMatch.index;
  const afterStart = normalized.slice(start);
  const endMatch = afterStart.match(/Item\s*1B\.|Item\s*2\.|Unresolved\s*Staff\s*Comments/i);
  const end = endMatch && endMatch.index ? endMatch.index : 20000;
  return afterStart.slice(0, Math.min(end, 20000));
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
        error: `Need two 10-K filings on EDGAR, found ${annualReports.length} for ${input.symbol}`,
      };
    }

    const [currentFiling, priorFiling] = [annualReports[0], annualReports[1]];
    const [currentRaw, priorRaw] = await Promise.all([
      fetchFilingText(currentFiling).catch(() => ''),
      fetchFilingText(priorFiling).catch(() => ''),
    ]);

    const currentRisks = extractRiskFactors(currentRaw).slice(0, 4500);
    const priorRisks = extractRiskFactors(priorRaw).slice(0, 4500);

    if (currentRisks.length < 500 || priorRisks.length < 500) {
      return {
        ok: false,
        error: 'Could not extract Risk Factors sections from both 10-Ks',
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
