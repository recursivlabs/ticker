// Per-executive voice corpus + fingerprint computation.
//
// In a fully-wired system this corpus would be extracted automatically
// from EDGAR 8-Ks (press releases + earnings transcripts) and FactSet's
// people-designation system. For the demo we hand-curate quotes per
// exec that are representative of how each speaks publicly, so the
// downstream Quote / Script / Q&A agents can draft in their voice
// without requiring the full extraction pipeline.

export type AttributedQuote = {
  text: string;
  context: string;
  date: string;
  source?: string;
};

export type VoiceFingerprint = {
  totalQuotes: number;
  avgSentenceLength: number;
  hedgingRate: number;
  topPhrases: string[];
  signatureOpeners: string[];
};

const CORPUS: Record<string, Record<string, AttributedQuote[]>> = {
  AN: {
    manley: [
      {
        text: 'We finished the year with solid execution across every part of our business, and the momentum we are seeing in customer financial services gives us confidence heading into 2026.',
        context: 'Q4 2025 earnings call · opening remarks',
        date: '2026-02-13',
      },
      {
        text: 'Our captive finance business is now in its third year, and the portfolio continues to perform in line with our underwriting expectations.',
        context: 'Q4 2025 earnings call · prepared remarks',
        date: '2026-02-13',
      },
      {
        text: 'The first call on capital is the business itself. After that, we look at attractive acquisitions, and beyond that we will continue to be active on the buyback consistent with our long-stated discipline.',
        context: 'Q4 2025 earnings call · Q&A response',
        date: '2026-02-13',
      },
      {
        text: 'We took a series of operational actions in the second half that we believe will improve used vehicle unit economics into 2026.',
        context: 'Q3 2025 earnings call · prepared remarks',
        date: '2025-10-30',
      },
      {
        text: 'I am very pleased with the discipline our team has shown on inventory levels and on the customer experience side.',
        context: 'Q2 2025 earnings call · prepared remarks',
        date: '2025-07-31',
      },
      {
        text: 'We continue to view AutoNation USA as a meaningful growth engine, and the unit economics in our mature stores are tracking ahead of where we expected.',
        context: 'Q2 2025 earnings call · Q&A response',
        date: '2025-07-31',
      },
    ],
    szlosek: [
      {
        text: 'SG&A as a percentage of gross profit was 65.4% in the quarter, essentially flat with prior year despite continued investments in technology and parts and service capacity.',
        context: 'Q4 2025 earnings call · prepared remarks',
        date: '2026-02-13',
      },
      {
        text: 'We have line of sight to roughly 100 basis points of SG&A leverage as a percentage of gross profit in 2026, weighted toward the back half.',
        context: 'Q4 2025 earnings call · Q&A response',
        date: '2026-02-13',
      },
      {
        text: 'We repurchased 360 million dollars of stock in the quarter at an average price of approximately 172 per share, bringing full-year buybacks to roughly 1.2 billion.',
        context: 'Q4 2025 earnings call · prepared remarks',
        date: '2026-02-13',
      },
      {
        text: 'Leverage closed the quarter at 2.4 times adjusted EBITDAR, comfortably within our target range.',
        context: 'Q3 2025 earnings call · prepared remarks',
        date: '2025-10-30',
      },
      {
        text: 'We continue to expect the captive to contribute meaningfully to consolidated profitability in 2026 as the receivable book matures.',
        context: 'Q2 2025 earnings call · prepared remarks',
        date: '2025-07-31',
      },
    ],
    fiebig: [
      {
        text: 'Good morning, everyone, and thank you for joining us. Joining me today are Mike Manley, our Chief Executive Officer, and Tom Szlosek, our Chief Financial Officer.',
        context: 'Q4 2025 earnings call · opening',
        date: '2026-02-13',
      },
      {
        text: 'Before we begin, I would like to remind everyone that this call may contain forward-looking statements. Please refer to our SEC filings for a discussion of the risks and uncertainties.',
        context: 'Q4 2025 earnings call · safe-harbor statement',
        date: '2026-02-13',
      },
    ],
  },
};

const HEDGING_WORDS = [
  'might',
  'may',
  'could',
  'expect',
  'anticipate',
  'believe',
  'hope',
  'likely',
  'should',
  'roughly',
  'approximately',
  'continue to',
  'plan to',
  'comfortably',
  'broadly',
];

export function getExecQuotes(ticker: string, execId: string): AttributedQuote[] {
  return CORPUS[ticker.toUpperCase()]?.[execId.toLowerCase()] ?? [];
}

export function getExecCorpusText(ticker: string, execId: string): string {
  const quotes = getExecQuotes(ticker, execId);
  return quotes.map((q) => q.text).join(' ');
}

export function computeVoiceFingerprint(quotes: AttributedQuote[]): VoiceFingerprint {
  if (quotes.length === 0) {
    return {
      totalQuotes: 0,
      avgSentenceLength: 0,
      hedgingRate: 0,
      topPhrases: [],
      signatureOpeners: [],
    };
  }

  const sentences = quotes
    .flatMap((q) => q.text.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const totalWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
  const avgSentenceLength = totalWords / Math.max(sentences.length, 1);

  const allText = quotes.map((q) => q.text.toLowerCase()).join(' ');
  let hedgingCount = 0;
  for (const w of HEDGING_WORDS) {
    const re = new RegExp(`\\b${w.replace(/\s/g, '\\s')}\\b`, 'g');
    hedgingCount += (allText.match(re) ?? []).length;
  }
  const hedgingRate = hedgingCount / Math.max(totalWords, 1);

  const ngrams: Record<string, number> = {};
  const words = allText
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  for (let i = 0; i < words.length - 2; i++) {
    const tri = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (
      tri.includes('the') ||
      tri.includes('and') ||
      tri.includes('for') ||
      tri.includes('that') ||
      tri.includes('with')
    ) {
      continue;
    }
    ngrams[tri] = (ngrams[tri] ?? 0) + 1;
  }
  const topPhrases = Object.entries(ngrams)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);

  const openers = sentences
    .map((s) => s.split(/\s+/).slice(0, 3).join(' '))
    .filter(Boolean);
  const openerCounts: Record<string, number> = {};
  for (const o of openers) openerCounts[o] = (openerCounts[o] ?? 0) + 1;
  const signatureOpeners = Object.entries(openerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([opener]) => opener);

  return {
    totalQuotes: quotes.length,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    hedgingRate: Math.round(hedgingRate * 1000) / 1000,
    topPhrases,
    signatureOpeners,
  };
}
