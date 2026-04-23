import cron from 'node-cron'
import { agentAccount, config, publicClient } from './config.js'
import { gatherSignals } from './signals.js'
import { generateProposals } from './brain.js'
import { createMarketFromProposal, getMarketAt, getMarketCount } from './chain.js'
import { resolveDueMarkets } from './resolver.js'
import { erc20Abi } from './abis.js'
import { formatUnits } from 'viem'

const MODE = process.argv[2] ?? 'daemon'

// ---------------------------------------------------------------------------
// One proposing round
// ---------------------------------------------------------------------------

async function proposeRound(): Promise<void> {
  console.log('\n=== PROPOSE ROUND ===')
  const signals = await gatherSignals()
  console.log(`[propose] signals: ETH $${signals.ethPriceUsd}, gas ${signals.gasPriceGwei.toFixed(1)} gwei`)

  const proposals = await generateProposals(signals, 3)
  console.log(`[propose] Claude proposed ${proposals.length} markets`)

  for (const p of proposals) {
    console.log(`\n  [${p.category}] ${p.question}`)
    console.log(`  ↳ agent bets ${p.agentPositionUsdc} on ${p.agentPosition}: ${p.reasoning}`)
    try {
      const { market } = await createMarketFromProposal(p)
      console.log(`  ✓ deployed at ${market}`)
    } catch (err) {
      console.error(`  ✗ failed:`, (err as Error).message)
    }
  }
}

// ---------------------------------------------------------------------------
// One resolving round
// ---------------------------------------------------------------------------

async function resolveRound(): Promise<void> {
  console.log('\n=== RESOLVE ROUND ===')
  const resolved = await resolveDueMarkets(getMarketCount, getMarketAt)
  console.log(`[resolve] resolved ${resolved} markets`)
}

// ---------------------------------------------------------------------------
// Startup banner
// ---------------------------------------------------------------------------

async function banner(): Promise<void> {
  const balance = await publicClient.readContract({
    address: config.collateral,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [agentAccount.address],
  })
  const count = await getMarketCount()

  console.log('\n╔═══════════════════════════════════════╗')
  console.log('║        OMEN-AI AGENT STARTING         ║')
  console.log('╚═══════════════════════════════════════╝')
  console.log(`  Agent address: ${agentAccount.address}`)
  console.log(`  USDC balance:  ${formatUnits(balance, 6)}`)
  console.log(`  Markets live:  ${count}`)
  console.log(`  Mode:          ${MODE}`)
  console.log('')
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

async function main() {
  await banner()

  if (MODE === 'propose-once') {
    await proposeRound()
    return
  }
  if (MODE === 'resolve-once') {
    await resolveRound()
    return
  }
  if (MODE === 'once') {
    await proposeRound()
    await resolveRound()
    return
  }

  // Daemon: propose every 3h, resolve every 5min
  console.log('[daemon] scheduling: propose=every 3h, resolve=every 5min')

  cron.schedule('0 */3 * * *', () => {
    proposeRound().catch((e) => console.error('[propose] cron error:', e))
  })

  cron.schedule('*/5 * * * *', () => {
    resolveRound().catch((e) => console.error('[resolve] cron error:', e))
  })

  // Kick off an immediate propose round so you see activity right away
  await proposeRound()
  await resolveRound()
}

main().catch((err) => {
  console.error('fatal:', err)
  process.exit(1)
})
