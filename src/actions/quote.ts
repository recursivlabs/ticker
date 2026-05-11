'use server';

import { getRecursiv, hasRecursivKey } from '@/lib/recursiv';
import { getCompanyByTicker, filterFilings, fetchFilingText, type Filing } from '@/lib/edgar';
import { getOverride } from '@/lib/overrides';
import { getExecQuotes } from '@/lib/exec-profiles';
import { parseAgentJson } from '@/lib/parse-json';

export type QuoteContentType = 'quote' | 'release' | 'commentary';

export type QuoteInput = {
  symbol: string;
  topic: string;
  tonality: string;
  selectedAccessionNumbers: string[];
  // Per Bryan's spec: drafts use a specific exec's voice corpus, not
  // a generic company corpus. The Quote Generator gets passed an
  // execId (defaults to CEO).
  execId?: string;
  contentType?: QuoteContentType;
};

export type GeneratedQuote = {
  quote: string;
  citation: { label: string; url: string }[];
};

export type QuoteResult =
  | {
      ok: true;
      quotes: GeneratedQuote[];
      sourcesUsed: { accession: string; label: string; url: string; filingDate: string }[];
      execUsed: { id: string; name: string; title: string } | null;
    }
  | { ok: false; error: string };

const QUOTE_AGENT_ID = process.env.TICKER_QUOTE_AGENT_ID;

export async function generateQuotes(input: QuoteInput): Promise<QuoteResult> {
  try {
    if (!hasRecursivKey()) {
      return {
        ok: false,
        error:
          'RECURSIV_API_KEY is not configured on this deployment. Set it in Coolify/Recursiv env, then redeploy.',
      };
    }
    if (!QUOTE_AGENT_ID) {
      return {
        ok: false,
        error:
          'Quote agent not configured. Set TICKER_QUOTE_AGENT_ID in env (agent id from the Ticker project on Recursiv).',
      };
    }

    const company = await getCompanyByTicker(input.symbol);
    if (!company) return { ok: false, error: `Ticker ${input.symbol} not found on EDGAR` };

    const override = getOverride(input.symbol);

    // Pick the speaker. Default to the first executive that speaks
    // publicly (typically CEO).
    const allExecs = override.executives ?? [];
    const chosenExec =
      (input.execId ? allExecs.find((e) => e.id === input.execId) : null) ??
      allExecs.find((e) => e.role === 'ceo') ??
      allExecs.find((e) => e.speaksPublicly) ??
      null;

    const speakerName =
      chosenExec?.name ??
      override.ceo?.name ??
      'the CEO';
    const speakerTitle =
      chosenExec?.title ??
      override.ceo?.title ??
      'CEO';

    const contentType: QuoteContentType = input.contentType ?? 'quote';

    // Voice corpus: prefer the exec's curated quotes from the people
    // profile if available, otherwise fall back to the broad 8-K corpus.
    const execCorpus =
      chosenExec && getExecQuotes(input.symbol, chosenExec.id).length > 0
        ? getExecQuotes(input.symbol, chosenExec.id)
        : [];

    const pressReleases = filterFilings(company.filings, ['8-K'], 12);
    const selected = pressReleases.filter((f) =>
      input.selectedAccessionNumbers.includes(f.accessionNumber)
    );
    const toUse = selected.length > 0 ? selected : pressReleases.slice(0, 3);

    let corpus: string;
    if (execCorpus.length > 0) {
      // Use the exec's attributed-quote corpus directly. Higher
      // fidelity than the company-wide 8-K text since each entry is
      // already an attributed exec statement.
      corpus = execCorpus
        .map(
          (q, i) =>
            `[quote ${i + 1} | ${q.context} | ${q.date}]\n${q.text}`
        )
        .join('\n\n');
    } else {
      const corpusParts = await Promise.all(
        toUse.slice(0, 3).map(async (f) => {
          try {
            const raw = await fetchFilingText(f);
            const text = raw
              .replace(/[\x00-\x1F\x7F]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 2000);
            return { filing: f, text };
          } catch {
            return { filing: f, text: '' };
          }
        })
      );
      corpus = corpusParts
        .filter((p) => p.text.length > 300)
        .map(
          (p, i) =>
            `[filing ${i + 1} | ${p.filing.form} | ${p.filing.filingDate} | accession:${p.filing.accessionNumber}]\n${p.text}`
        )
        .join('\n\n');
    }

    const outputInstructions =
      contentType === 'release'
        ? 'Draft 3 full press release options (headline + 2 body paragraphs + a quote from the speaker + boilerplate placeholder). Each option in the "quote" field of the JSON.'
        : contentType === 'commentary'
          ? `Draft 5 prepared-remarks options for ${speakerName} on this topic. These read like a section of an earnings-call script, not a press-release quote — 2-3 sentences, conversational, suitable for being read aloud.`
          : `Draft 5 press-release quote options attributable to ${speakerName}. Each quote is 1-3 sentences, suitable for a press release.`;

    const userMessage = `Draft for ${speakerName} (${speakerTitle} of ${company.name}, ticker ${input.symbol}).

Content type: ${contentType === 'release' ? 'Full press release' : contentType === 'commentary' ? 'Prepared-remarks commentary' : 'CEO/exec quote'}
Topic: ${input.topic}
Tonality: ${input.tonality}

Speaker's actual prior voice corpus (use this to match vocabulary, rhythm, hedging patterns, and stance):

${corpus}

${outputInstructions}

Return ONLY valid JSON matching:
{"quotes": [{"quote": "string", "sourceAccessions": ["accession string or quote-N marker", ...]}, ...]}

Rules:
- Match observed vocabulary, rhythm, hedging, and stance from the corpus above. Do not write in a generic CEO voice.
- Do NOT invent numerical figures not already disclosed in the corpus or topic description.
- sourceAccessions lists the corpus entries (accession numbers OR quote-N markers from the labels above) whose tonality most influenced each draft.`;

    const r = getRecursiv();
    const streamResult = await r.agents.chatStreamText(QUOTE_AGENT_ID, { message: userMessage });
    const content = streamResult.content || '';
    if (!content) return { ok: false, error: 'No response from quote agent' };

    const parsed = parseAgentJson<{
      quotes: { quote: string; sourceAccessions?: string[] }[];
    }>(content);

    const quotes: GeneratedQuote[] = parsed.quotes.map((q) => {
      const cits = (q.sourceAccessions ?? [])
        .map((acc) => {
          // Try to match against a filing accession first; fall back to
          // a corpus-quote marker.
          const filing = toUse.find((f) => f.accessionNumber === acc);
          if (filing) {
            return { label: `${filing.form} · ${filing.filingDate}`, url: filing.url };
          }
          const m = acc.match(/quote\s*(\d+)/i);
          if (m && execCorpus.length > 0) {
            const idx = parseInt(m[1], 10) - 1;
            const ex = execCorpus[idx];
            if (ex) return { label: `${ex.context} · ${ex.date}`, url: '#' };
          }
          return null;
        })
        .filter((c): c is { label: string; url: string } => c !== null);
      return { quote: q.quote, citation: cits };
    });

    return {
      ok: true,
      quotes,
      sourcesUsed: toUse.map((f) => ({
        accession: f.accessionNumber,
        label: `${f.form} · ${f.filingDate}`,
        url: f.url,
        filingDate: f.filingDate,
      })),
      execUsed: chosenExec
        ? { id: chosenExec.id, name: chosenExec.name, title: chosenExec.title }
        : null,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function listSourceFilings(symbol: string): Promise<Filing[]> {
  const company = await getCompanyByTicker(symbol);
  if (!company) return [];
  return filterFilings(company.filings, ['8-K'], 10);
}
