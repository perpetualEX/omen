import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { config } from './config.js'
import { Outcome, resolveMarket, snapshotMarket, type MarketSnapshot } from './chain.js'
import { gatherSignals } from './signals.js'

const anthropic = new Anthropic({ apiKey: config.anthropicKey })

const ResolutionSchema = z.object({
  outcome: z.enum(['YES', 'NO', 'INVALID']),
  reasoning: z.string().min(10).max(300),
})

/**
 * Decide how to resolve a market by asking Claude to evaluate the question
 * against fresh signals. Returns the outcome + a short reasoning.
 */
async function decideOutcome(market: MarketSnapshot): Promise<{ outcome: Outcome; reasoning: string }> {
  const signals = await gatherSignals()
  const resolvedAt = Number(market.resolutionTime)
  const nowSec = Math.floor(Date.now() / 1000)

  const prompt = `You are the resolver for an on-chain prediction market. Your job is to objectively determine the outcome.

Market question: "${market.question}"
Market resolution time (unix): ${resolvedAt} (now: ${nowSec})

Current verifiable signals:
- ETH price: $${signals.ethPriceUsd.toFixed(2)}
- BTC price: $${signals.btcPriceUsd.toFixed(2)}
- Mainnet gas: ${signals.gasPriceGwei.toFixed(2)} gwei
- Eth block number: ${signals.blockNumber}

Output the outcome based on whether the question is clearly TRUE (YES), clearly FALSE (NO), or cannot be objectively verified (INVALID).

Reply with ONLY JSON: {"outcome": "YES" | "NO" | "INVALID", "reasoning": "brief objective justification citing the signals"}`

  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const parsed = ResolutionSchema.parse(JSON.parse(text))
  const outcome = parsed.outcome === 'YES' ? Outcome.YES : parsed.outcome === 'NO' ? Outcome.NO : Outcome.INVALID
  return { outcome, reasoning: parsed.reasoning }
}

/**
 * Scan all markets, resolve those past their resolution time that haven't been resolved yet.
 */
export async function resolveDueMarkets(getCount: () => Promise<bigint>, getMarket: (i: bigint) => Promise<`0x${string}`>): Promise<number> {
  const count = await getCount()
  const now = BigInt(Math.floor(Date.now() / 1000))
  let resolved = 0

  for (let i = 0n; i < count; i++) {
    const addr = await getMarket(i)
    const snap = await snapshotMarket(addr)
    if (snap.outcome !== Outcome.UNRESOLVED) continue
    if (snap.resolutionTime > now) continue

    try {
      console.log(`[resolver] deciding "${snap.question}"`)
      const { outcome, reasoning } = await decideOutcome(snap)
      console.log(`[resolver] → ${Outcome[outcome]}: ${reasoning}`)
      await resolveMarket(addr, outcome)
      resolved++
    } catch (err) {
      console.error(`[resolver] failed for ${addr}:`, err)
    }
  }

  return resolved
}
