import { parseUnits, type Address, type Hash } from 'viem'
import { config, publicClient, walletClient, agentAccount } from './config.js'
import { erc20Abi, factoryAbi, marketAbi } from './abis.js'
import type { MarketProposal } from './brain.js'

const SEED_USDC = 500n * 10n ** 6n // 500 USDC per side of CPMM reserve

// ---------------------------------------------------------------------------
// Ensure the factory is approved to spend the agent's USDC
// ---------------------------------------------------------------------------

async function ensureFactoryApproval(): Promise<void> {
  const allowance = await publicClient.readContract({
    address: config.collateral,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [agentAccount.address, config.factory],
  })

  if (allowance < 10n ** 30n) {
    console.log('[chain] granting factory allowance...')
    const hash = await walletClient.writeContract({
      address: config.collateral,
      abi: erc20Abi,
      functionName: 'approve',
      args: [config.factory, 2n ** 256n - 1n],
    })
    await publicClient.waitForTransactionReceipt({ hash })
    console.log(`[chain] factory approved (${hash})`)
  }
}

// ---------------------------------------------------------------------------
// Create a market from a proposal, then take the agent's stated position
// ---------------------------------------------------------------------------

export async function createMarketFromProposal(
  proposal: MarketProposal,
): Promise<{ market: Address; createTx: Hash; betTx: Hash | null }> {
  await ensureFactoryApproval()

  const resolutionTime = BigInt(Math.floor(Date.now() / 1000) + proposal.resolutionHoursFromNow * 3600)

  console.log(`[chain] creating market: "${proposal.question}"`)
  const createTx = await walletClient.writeContract({
    address: config.factory,
    abi: factoryAbi,
    functionName: 'createMarket',
    args: [proposal.question, resolutionTime, SEED_USDC],
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash: createTx })

  // Find the MarketCreated event to get the market address
  const marketLog = receipt.logs.find((l) => l.address.toLowerCase() === config.factory.toLowerCase())
  if (!marketLog) throw new Error('MarketCreated event not found')

  // The market address is the `market` indexed param (topic 1)
  const market = (`0x${marketLog.topics[1]?.slice(26)}` as Address) // strip 0x + 24 leading zeros
  console.log(`[chain] market deployed at ${market}`)

  // Approve the market to pull our bet collateral
  const betAmount = parseUnits(proposal.agentPositionUsdc.toString(), 6)
  const betApproveTx = await walletClient.writeContract({
    address: config.collateral,
    abi: erc20Abi,
    functionName: 'approve',
    args: [market, betAmount],
  })
  await publicClient.waitForTransactionReceipt({ hash: betApproveTx })

  // Place the agent's position
  console.log(`[chain] agent betting ${proposal.agentPositionUsdc} USDC on ${proposal.agentPosition}`)
  const betTx = await walletClient.writeContract({
    address: market,
    abi: marketAbi,
    functionName: 'bet',
    args: [proposal.agentPosition === 'YES', betAmount, 0n /* minSharesOut: accept any slippage for demo */],
  })
  await publicClient.waitForTransactionReceipt({ hash: betTx })
  console.log(`[chain] position opened (${betTx})`)

  return { market, createTx, betTx }
}

// ---------------------------------------------------------------------------
// Resolve a market (agent decides the outcome)
// ---------------------------------------------------------------------------

export enum Outcome {
  UNRESOLVED = 0,
  YES = 1,
  NO = 2,
  INVALID = 3,
}

export async function resolveMarket(market: Address, outcome: Outcome): Promise<Hash> {
  console.log(`[chain] resolving ${market} as ${Outcome[outcome]}`)
  const hash = await walletClient.writeContract({
    address: config.factory,
    abi: factoryAbi,
    functionName: 'resolveMarket',
    args: [market, outcome],
  })
  await publicClient.waitForTransactionReceipt({ hash })
  console.log(`[chain] resolved (${hash})`)
  return hash
}

// ---------------------------------------------------------------------------
// Read helpers for the resolver loop
// ---------------------------------------------------------------------------

export async function getMarketCount(): Promise<bigint> {
  return publicClient.readContract({
    address: config.factory,
    abi: factoryAbi,
    functionName: 'marketCount',
  })
}

export async function getMarketAt(index: bigint): Promise<Address> {
  return publicClient.readContract({
    address: config.factory,
    abi: factoryAbi,
    functionName: 'markets',
    args: [index],
  })
}

export interface MarketSnapshot {
  address: Address
  question: string
  resolutionTime: bigint
  outcome: number
  priceYesBps: bigint
}

export async function snapshotMarket(address: Address): Promise<MarketSnapshot> {
  const [question, resolutionTime, outcome, priceYesBps] = await Promise.all([
    publicClient.readContract({ address, abi: marketAbi, functionName: 'question' }),
    publicClient.readContract({ address, abi: marketAbi, functionName: 'resolutionTime' }),
    publicClient.readContract({ address, abi: marketAbi, functionName: 'outcome' }),
    publicClient.readContract({ address, abi: marketAbi, functionName: 'priceYes' }),
  ])

  return { address, question, resolutionTime, outcome: Number(outcome), priceYesBps }
}
