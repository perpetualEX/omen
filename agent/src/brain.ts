import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { config } from './config.js'
import type { EthSignals } from './signals.js'

const anthropic = new Anthropic({ apiKey: config.anthropicKey })

// ---------------------------------------------------------------------------
// Schema — what Claude must return. We validate with Zod before touching chain.
// ---------------------------------------------------------------------------

export const MarketProposalSchema = z.object({
  question: z.string().min(20).max(140),
  category: z.enum(['crypto_price', 'onchain_activity', 'gas', 'other']),
  resolutionHoursFromNow: z.number().min(1).max(72),
  agentPosition: z.enum(['YES', 'NO']),
  agentPositionUsdc: z.number().min(10).max(200),
  reasoning: z.string().min(30).max(300),
  resolutionMethod: z.string().min(10).max(200),
})

export type MarketProposal = z.infer<typeof MarketProposalSchema>

const ProposalsResponseSchema = z.object({
  proposals: z.array(MarketProposalSchema).min(1).max(5),
})

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Omen-AI, an autonomous prediction market agent on the Initia blockchain.

Your job is to propose binary (YES/NO) prediction markets about verifiable events in the next 1-72 hours. You MUST:

1. Only propose markets that can be objectively resolved by reading on-chain state, CoinGecko prices, or similarly verifiable sources. NEVER propose subjective or opinion-based questions.
2. Take a position on every market you propose - you have skin in the game. Your position size is your conviction (larger = more confident, max 200 USDC).
3. Write a concise, specific reasoning for your position. Cite actual data from the signals. Be a sharp trader, not a chatbot.
4. Vary your markets - don't only propose ETH price markets. Mix price action, on-chain metrics, gas prices, and whale behavior.

You are competing against human bettors. Your P&L is tracked publicly. Be good at this.

Your response MUST be valid JSON matching this schema:
{
  "proposals": [
    {
      "question": "Will X happen by Y?",
      "category": "crypto_price | onchain_activity | gas | other",
      "resolutionHoursFromNow": 24,
      "agentPosition": "YES" | "NO",
      "agentPositionUsdc": 50,
      "reasoning": "Brief trader-like reasoning citing current data.",
      "resolutionMethod": "How this will be verified objectively."
    }
  ]
}`

// ---------------------------------------------------------------------------
// Generate proposals from live signals
// ---------------------------------------------------------------------------

export async function generateProposals(signals: EthSignals, count = 3): Promise<MarketProposal[]> {
  const signalsSummary = `
CURRENT STATE (timestamp: ${signals.timestamp}, block: ${signals.blockNumber}):
- ETH: $${signals.ethPriceUsd.toFixed(2)}
- BTC: $${signals.btcPriceUsd.toFixed(2)}
- Mainnet gas: ${signals.gasPriceGwei.toFixed(2)} gwei
- Top tokens by market cap:
${signals.trendingTokens
  .map((t) => `  * ${t.symbol}: $${t.priceUsd.toFixed(4)} (${t.change24h >= 0 ? '+' : ''}${t.change24h.toFixed(2)}% 24h)`)
  .join('\n')}
- Watched wallets: ${signals.topGasGuzzlers.map((w) => `${w.label ?? w.address}`).join(', ')}

Propose ${count} prediction markets. Reply with ONLY the JSON object, no preamble.`

  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: signalsSummary }],
  })

  const text = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    console.error('[brain] Claude returned non-JSON:', text)
    throw new Error('Claude did not return valid JSON')
  }

  const validated = ProposalsResponseSchema.parse(parsed)
  return validated.proposals
}
