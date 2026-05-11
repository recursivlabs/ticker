// Sample earnings call transcripts pre-loaded so the Transcript
// Summarizer can be demoed without a live FactSet feed.
// These are synthetic transcripts designed to cover the IR focus
// categories Bryan defined per company, written in the actual
// executives' voice patterns observed in their real prior calls.
// They are NOT actual earnings call records.

export type SampleTranscript = {
  ticker: string;
  label: string;
  quarter: string;
  callDate: string;
  text: string;
};

const AN_Q4_2025: SampleTranscript = {
  ticker: 'AN',
  label: 'Q4 2025 Earnings Call (sample)',
  quarter: 'Q4 2025',
  callDate: '2026-02-13',
  text: `Operator: Good morning, and welcome to AutoNation's fourth quarter 2025 earnings call. I would now like to turn the call over to Derek Fiebig, Vice President of Investor Relations. Please go ahead.

Derek Fiebig: Thank you, operator, and good morning, everyone. Joining me today are Mike Manley, our Chief Executive Officer, and Tom Szlosek, our Chief Financial Officer. Before we begin, I'd like to remind everyone that this call may contain forward-looking statements. Please refer to our SEC filings for a discussion of the risks and uncertainties. With that, I'll turn the call over to Mike.

Mike Manley: Thanks, Derek. Good morning, everyone, and thank you for joining us. We finished 2025 with solid execution across every part of our business. In Q4, total revenue was $7.0 billion, up 4% year-over-year, with new vehicle gross profit per vehicle retailed coming in at $3,250, modestly above where we were in Q3 and reflecting continued discipline in our pricing approach. Used vehicle unit sales grew 6% year-over-year in the quarter, and we are seeing the early benefits of the operational changes we made in the second half of 2025.

I'm particularly pleased with our customer financial services performance this quarter. Profit per vehicle retailed in CFS was $2,540 in Q4, up $90 from the year-ago period. That reflects deeper attachment of F&I products and the work we have done with our finance and insurance team to standardize processes across the network. The captive finance business is now in its third year of operation, and the portfolio continues to perform in line with our underwriting expectations. We ended the year with $2.4 billion of receivables in AutoNation Finance, generating meaningful earnings contribution and importantly giving us a more durable relationship with our customers.

After sales, which is our parts and service business, posted same-store revenue growth of 5% in the quarter, with gross profit growth slightly higher than that. This is the most predictable, recurring revenue stream in our business, and we have been very intentional about investing behind it.

Tom Szlosek: Thanks, Mike. Looking at the consolidated numbers for the quarter — and Derek will walk through segment detail in a moment — adjusted EPS was $4.85, up 7% versus prior year on the back of solid operating performance and a lower share count. SG&A as a percentage of gross profit was 65.4% in Q4, which is essentially flat with prior year despite continued investments in technology and in our parts and service capacity. We continue to target SG&A leverage as we move through 2026.

On capital allocation, we repurchased $360 million of stock in Q4 at an average price of approximately $172 per share, bringing full-year buybacks to roughly $1.2 billion. We ended the quarter with leverage at 2.4 times adjusted EBITDAR, comfortably within our target range. Our priorities for 2026 remain consistent: invest behind the business, do disciplined tuck-in acquisitions when the numbers work, and return excess capital to shareholders.

Mike Manley: Looking ahead, the consumer environment remains broadly stable. We are watching affordability carefully, particularly at the lower end of the market, but the credit quality of our retail book and the strength of our parts and service backlog give us confidence in 2026. With that, operator, we'll open the line for questions.

Operator: Our first question comes from Adam Jonas at Morgan Stanley.

Adam Jonas: Good morning. Mike, can you talk about used vehicle unit economics heading into the spring selling season? And separately, where you are on the AutoNation USA rollout?

Mike Manley: Sure, Adam. On used, the actions we took in Q3 around inventory sourcing and turn velocity are starting to show. Used GPU was $1,710 in Q4, up sequentially, and we believe we can sustain that range as we move into the spring. On AutoNation USA, we now have 32 stores open, and the units sold per store in mature locations continued to track ahead of plan.

Operator: The next question comes from John Murphy at BofA.

John Murphy: Thanks. Tom, on SG&A, can you frame the leverage opportunity for 2026 a bit more concretely?

Tom Szlosek: Yes, John. We have line of sight to roughly 100 basis points of SG&A leverage as a percentage of gross profit in 2026, weighted toward the back half. The drivers are continued automation in the back office, the rebadging work we completed in Q3, and naturally lower variable costs as we annualize some of the parts and service investments we made.

Operator: Our next question comes from Rajat Gupta at JPMorgan.

Rajat Gupta: Hey. Mike, captive finance — how should we think about portfolio growth from here? And related, any change in your view on credit quality?

Mike Manley: Rajat, the portfolio will continue to grow but at a more measured pace than we saw in 2024. We are intentionally being disciplined on underwriting. 30-plus day delinquencies at the end of Q4 were 2.1%, which is in line with our internal guardrails and below where the broader industry sits today.

Operator: Our final question comes from Daniel Imbro at Stephens.

Daniel Imbro: Hi. Last one for Mike — capital allocation looking out the next 12 months. With the stock where it is, should we continue to expect repurchase to be the primary use of cash?

Mike Manley: Daniel, our approach has not changed. The first call on capital is the business itself. After that, we look at attractive acquisitions, and we do see a few in the pipeline. Beyond that, we will continue to be active on the buyback consistent with our long-stated discipline. We bought back over 5% of the company in 2025, and we expect to be similarly active in 2026 at the right prices.

Operator: That concludes our Q&A session. I'll turn the call back to Mike for closing remarks.

Mike Manley: Thanks, everyone, for joining today. We feel very good about how 2025 finished and about the setup for 2026. Tom, Derek, and I look forward to seeing many of you on the road in the coming weeks.

Operator: This concludes the call. Thank you for joining.`,
};

const SAMPLES: SampleTranscript[] = [AN_Q4_2025];

export function getSampleTranscripts(ticker: string): SampleTranscript[] {
  const t = ticker.toUpperCase();
  return SAMPLES.filter((s) => s.ticker === t);
}
