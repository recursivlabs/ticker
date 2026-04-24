# Ticker

The AI workspace for Investor Relations.

Built on [Recursiv](https://recursiv.io). Uses SEC EDGAR for public filings. FactSet-ready for consensus estimates, analyst tracking, and peer benchmarking.

## Features (v1)

- **Ticker-first UX**: search any public company, land on a company profile hub
- **Company profile** (`/t/[symbol]`): exec info, earnings countdown, recent 8-K filings, analyst coverage, peer set
- **CEO Quote Generator**: draft quotes in your CEO's voice from prior press releases, every line cited to its source
- **Consensus Delta**: analyst-by-analyst estimate tracking between any two dates (FactSet-gated)
- **Peer Benchmark**: compare peers on any metric, auto-peer set from SIC + size

## Stack

- Next.js 14 (App Router)
- Tailwind (dark theme)
- `@recursiv/sdk` for auth, agents, billing
- SEC EDGAR APIs for company facts, filings, tickers
- Gemini 3.1 Pro via Recursiv agents for quote drafting

## Env

```
RECURSIV_API_KEY=sk_live_...
TICKER_QUOTE_AGENT_ID=<uuid>
```

Create the Quote Drafter agent on Recursiv with the CEO-voice system prompt documented in `src/actions/quote.ts`.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Deploy

Deployed via Recursiv + Coolify at `ticker.on.recursiv.io`.
