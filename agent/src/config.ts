import 'dotenv/config'
import { createPublicClient, createWalletClient, http, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

function required(name: string): string {
  const v = process.env[name]
  if (!v || v === '0x' || v === 'sk-ant-') {
    throw new Error(`Missing required env var: ${name}`)
  }
  return v
}

export const config = {
  // Rollup
  chainId: required('OMEN_CHAIN_ID'),
  evmChainId: Number(required('OMEN_EVM_CHAIN_ID')),
  rpcUrl: required('OMEN_RPC_URL'),
  explorerUrl: required('OMEN_EXPLORER_URL'),

  // Contracts
  collateral: required('COLLATERAL_TOKEN_ADDRESS') as `0x${string}`,
  treasury: required('TREASURY_ADDRESS') as `0x${string}`,
  factory: required('MARKET_FACTORY_ADDRESS') as `0x${string}`,

  // Agent identity
  agentKey: required('AGENT_PRIVATE_KEY') as `0x${string}`,
  agentAddress: required('AGENT_ADDRESS') as `0x${string}`,

  // AI
  anthropicKey: required('ANTHROPIC_API_KEY'),

  // External
  ethRpcUrl: process.env.ETH_MAINNET_RPC_URL ?? 'https://eth.llamarpc.com',
} as const

// --- Viem clients ---
export const omenChain = defineChain({
  id: config.evmChainId,
  name: 'Omen',
  nativeCurrency: { name: 'Omen', symbol: 'OMEN', decimals: 18 },
  rpcUrls: { default: { http: [config.rpcUrl] } },
  blockExplorers: { default: { name: 'InitiaScan', url: config.explorerUrl } },
})

export const agentAccount = privateKeyToAccount(config.agentKey)

export const publicClient = createPublicClient({
  chain: omenChain,
  transport: http(config.rpcUrl),
})

export const walletClient = createWalletClient({
  account: agentAccount,
  chain: omenChain,
  transport: http(config.rpcUrl),
})

export const ethPublicClient = createPublicClient({
  transport: http(config.ethRpcUrl),
})
