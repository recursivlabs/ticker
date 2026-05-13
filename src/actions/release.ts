'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import {
  getCompanyByTicker,
  filterFilings,
  fetchFilingText,
  type Filing,
} from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { parseAgentJson } from '@/lib/parse-json';

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
    let stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    if (!stream.content) {
      // Gemini cold-start can return an empty stream once. Retry once.
      stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    }
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from release agent' };

    const parsed = parseAgentJson<PressRelease>(content);

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

// ============================================================================
// REVERSE-ENGINEERING WORKFLOW
//
// Bryan's spec: user pastes a prior similar press release. The agent
// recognizes the template (M&A, results, guidance update, etc.) and
// asks targeted gap-filling questions. User fills the slots, agent
// drafts a new release in the exact same shape.
// ============================================================================

export type ReleaseSlot = {
  id: string;
  question: string;
  hint: string;
  type: 'text' | 'number' | 'date' | 'longtext';
};

export type ReleaseTemplate = {
  announcementType: string;
  headlinePattern: string;
  structureNotes: string;
  slots: ReleaseSlot[];
};

export type AnalyzeResult =
  | { ok: true; template: ReleaseTemplate }
  | { ok: false; error: string };

export async function analyzeReleaseTemplate(
  symbol: string,
  priorReleaseText: string
): Promise<AnalyzeResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) return { ok: false, error: 'TICKER_RELEASE_AGENT_ID not configured' };

    const company = await getCompanyByTicker(symbol);
    if (!company) return { ok: false, error: `Ticker ${symbol} not found` };

    if (priorReleaseText.trim().length < 200) {
      return { ok: false, error: 'Paste the full prior press release (at least a few paragraphs).' };
    }

    const cleaned = priorReleaseText
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/\s+\n/g, '\n')
      .trim()
      .slice(0, 8000);

    const userMessage = `You are working with ${company.name} (${symbol}) in reverse-engineering mode. The user pasted a prior press release below. Your job:

1. Identify the announcement TYPE (e.g., M&A acquisition, results release, guidance update, executive appointment, dividend, buyback authorization, product launch).
2. Extract the structural pattern of the release (headline shape, body paragraph sequence, boilerplate position).
3. Decide the targeted, minimal set of questions you need answered to draft a NEW release in the SAME shape for a NEW occurrence of this same type of announcement. Each question should be specific and varied (where, when, how much, who, why now, what's different) — not generic.

[prior release text]
${cleaned}
[end prior release]

Return ONLY valid JSON matching this exact shape:
{
  "announcementType": "string, the recognized announcement type",
  "headlinePattern": "string, the pattern of how this company writes headlines for this kind of news",
  "structureNotes": "string, 2-3 sentences on the body structure observed",
  "slots": [
    {"id": "string short id like 'targets'", "question": "string, the question to ask the user", "hint": "string, 1-line tip on what the prior release had here", "type": "text | number | date | longtext"}
  ]
}

5-8 slots. Specific, not generic. No preamble, no markdown fences.`;

    const r = getRecursiv();
    let stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    if (!stream.content) {
      stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    }
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from release agent' };

    const parsed = parseAgentJson<ReleaseTemplate>(content);
    return { ok: true, template: parsed };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export type DraftFromTemplateInput = {
  symbol: string;
  template: ReleaseTemplate;
  answers: Record<string, string>;
  priorReleaseText: string;
};

export async function draftFromTemplate(
  input: DraftFromTemplateInput
): Promise<ReleaseResult> {
  try {
    if (!hasRecursivKey()) return { ok: false, error: 'RECURSIV_API_KEY not configured' };
    if (!AGENT_ID) return { ok: false, error: 'TICKER_RELEASE_AGENT_ID not configured' };

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found` };

    const override = getOverride(input.symbol);
    const ceoLabel =
      override.ceo && override.ceo.title
        ? `${override.ceo.name}, ${override.ceo.title}`
        : override.ceo?.name ?? `${company.name} CEO`;
    const hq = override.hq ?? '';

    const cleaned = input.priorReleaseText
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/\s+\n/g, '\n')
      .trim()
      .slice(0, 6000);

    const answersBlock = input.template.slots
      .map((s) => `${s.id} (${s.question}): ${input.answers[s.id] ?? '[not provided]'}`)
      .join('\n');

    const userMessage = `Draft a NEW press release for ${company.name} (${input.symbol}) using the prior release below as the structural and voice template.

Announcement type: ${input.template.announcementType}
Headline pattern: ${input.template.headlinePattern}
Structure: ${input.template.structureNotes}

HQ for dateline: ${hq || 'use a reasonable default for this company'}
Quote attribution default: ${ceoLabel}

User-provided answers to the template slots:
${answersBlock}

Use the prior release as the structural and tonal template. Match its voice exactly. Replace prior-specific details with the user's new answers above. Keep boilerplate close to verbatim if the user did not request changes.

[prior release used as template]
${cleaned}
[end prior release]

Return ONLY valid JSON matching the PressRelease schema:
{"dateline":"string","headline":"string","subheadline":"string","body":["string"],"quote":{"text":"string","attributedTo":"string"},"boilerplate":"string","forwardLookingStatement":"string","sourcesUsed":["template"]}

No preamble, no markdown fences.`;

    const r = getRecursiv();
    let stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    if (!stream.content) {
      stream = await r.agents.chatStreamText(AGENT_ID, { message: userMessage });
    }
    const content = stream.content || '';
    if (!content) return { ok: false, error: 'No response from release agent' };

    const parsed = parseAgentJson<PressRelease>(content);
    return {
      ok: true,
      release: parsed,
      citations: [{ label: 'Reverse-engineered from your prior release', url: '#' }],
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
