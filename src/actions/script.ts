'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import { getCompanyByTicker, filterFilings, fetchFilingText } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { parseAgentJson } from '@/lib/parse-json';

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

    const parsed = parseAgentJson<EarningsScript>(content);

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

// ============================================================================
// REUSE + DELTA MODE
//
// Bryan's spec: IR teams reuse last quarter's script and only change
// what materially shifted. The agent extracts numbers/metrics from the
// prior script, the user fills in the new values, the agent drafts a
// new script preserving structure and voice.
// ============================================================================

export type ScriptMetric = {
  id: string;
  context: string;
  priorValue: string;
  description: string;
};

export type ExtractMetricsResult =
  | { ok: true; metrics: ScriptMetric[] }
  | { ok: false; error: string };

export async function extractScriptMetrics(
  symbol: string,
  priorScriptText: string
): Promise<ExtractMetricsResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) return { ok: false, error: 'TICKER_SCRIPT_AGENT_ID not configured' };

    const company = await getCompanyByTicker(symbol);
    if (!company) return { ok: false, error: `Ticker ${symbol} not found` };

    if (priorScriptText.trim().length < 500) {
      return { ok: false, error: 'Paste the full prior earnings script (at least a few paragraphs).' };
    }

    const cleaned = priorScriptText
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/\s+\n/g, '\n')
      .trim()
      .slice(0, 12000);

    const userMessage = `You are analyzing a prior earnings call script for ${company.name} (${symbol}). Identify every quantitative metric, percentage, dollar figure, count, or guidance number that would need updating for a new quarter.

For each metric, return:
- id: short kebab-case identifier (e.g. 'new-gpu')
- context: 5-15 word phrase showing where it sits in the script (e.g. 'new vehicle GPU')
- priorValue: the literal value from the prior script (e.g. '$3,250')
- description: 1-line description of what this metric represents

[prior script]
${cleaned}
[end prior script]

Return ONLY valid JSON matching this exact shape:
{"metrics":[{"id":"string","context":"string","priorValue":"string","description":"string"}]}

15-30 metrics is typical for a quarterly script. Be thorough — IR teams update many small numbers each quarter. No preamble, no markdown fences.`;

    const r = getRecursiv();
    const stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from script agent' };

    const parsed = parseAgentJson<{ metrics: ScriptMetric[] }>(content);
    return { ok: true, metrics: parsed.metrics ?? [] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export type ReuseScriptInput = {
  symbol: string;
  priorScriptText: string;
  quarter: string;
  newValues: Record<string, string>;
  qualitativeNotes: string;
};

export async function reuseScript(input: ReuseScriptInput): Promise<ScriptResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) return { ok: false, error: 'TICKER_SCRIPT_AGENT_ID not configured' };

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found` };

    const cleaned = input.priorScriptText
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/\s+\n/g, '\n')
      .trim()
      .slice(0, 12000);

    const valuesBlock = Object.entries(input.newValues)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n');

    const userMessage = `Draft a new earnings call script for ${company.name} (${input.symbol}) ${input.quarter} by reusing the prior script below and substituting only the values that changed. Preserve the prior script's structure, sequencing, voice, and language exactly — buy-side analysts track sentiment arcs across quarters and consistency is the feature.

[prior script]
${cleaned}
[end prior script]

New values to substitute (metric id → new value; if a value is not listed here, keep the prior value):
${valuesBlock || '(none provided yet)'}

${input.qualitativeNotes ? `Qualitative changes the IR team called out for this quarter:\n${input.qualitativeNotes}\n` : ''}

Output the new script in the standard schema:
{"prepared_remarks":{"ceo":[{"section":"string","content":"string"}],"cfo":[{"section":"string","content":"string"}]},"speakerNotes":["string"],"timing":{"ceoEstimatedMinutes":number,"cfoEstimatedMinutes":number},"sourcesUsed":["reuse-template"]}

Rules:
- Match the prior script's sentence structure, vocabulary, and hedging patterns as closely as possible
- Only change wording where a new value or qualitative note requires it
- Flag any specific judgment-call substitutions in speakerNotes
- Do NOT invent new metrics that were not in the prior script + new values list
- Return ONLY the JSON object. No preamble, no markdown fences.`;

    const r = getRecursiv();
    const stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from script agent' };

    const parsed = parseAgentJson<EarningsScript>(content);
    return {
      ok: true,
      script: parsed,
      citations: [{ label: 'Reused from your prior script', url: '#' }],
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
