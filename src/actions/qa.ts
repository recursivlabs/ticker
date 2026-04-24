'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import { getCompanyByTicker, filterFilings, fetchFilingText } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';

export type QaInput = {
  symbol: string;
  currentContext: string;
  selectedAccessions: string[];
};

export type QaQuestion = {
  question: string;
  askedBy: string;
  category: string;
  difficulty: 'soft' | 'medium' | 'hard' | string;
  whyNow: string;
  suggestedAnswer: {
    framework: string;
    pivotPoints: string[];
    numbersToHave: string[];
    landminesToAvoid: string[];
  };
};

export type QaResult =
  | {
      ok: true;
      questions: QaQuestion[];
      topThreeToRehearse: string[];
      citations: { label: string; url: string }[];
    }
  | { ok: false; error: string };

const AGENT_ID = process.env.TICKER_QA_AGENT_ID;

export async function prepareQa(input: QaInput): Promise<QaResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) return { ok: false, error: 'TICKER_QA_AGENT_ID not configured' };

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found on EDGAR` };

    const override = getOverride(input.symbol);
    const analystList = override.analystCoverage
      ? override.analystCoverage.map((a) => `${a.analyst} (${a.firm})`).join(', ')
      : 'typical sell-side coverage';

    const sources = filterFilings(company.filings, ['8-K', '10-Q', '10-K'], 12);
    const selected = sources.filter((f) =>
      input.selectedAccessions.includes(f.accessionNumber)
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

    const userMessage = `Prepare an analyst Q&A brief for ${company.name} (${input.symbol}).

Known sell-side coverage: ${analystList}

Current-quarter context (recent disclosures, results, strategy):
${input.currentContext}

Prior ${company.name} filings for pattern-matching what analysts historically ask:

${corpus}

Return ONLY valid JSON matching your schema. Generate 10-15 questions.`;

    const r = getRecursiv();
    const stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from Q&A agent' };

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, error: 'Could not parse Q&A agent response' };

    const parsed = JSON.parse(jsonMatch[0]) as {
      questions: QaQuestion[];
      topThreeToRehearse: string[];
    };

    const citations = toUse.map((f) => ({
      label: `${f.form} · ${f.filingDate}`,
      url: f.url,
    }));

    return {
      ok: true,
      questions: parsed.questions ?? [],
      topThreeToRehearse: parsed.topThreeToRehearse ?? [],
      citations,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
