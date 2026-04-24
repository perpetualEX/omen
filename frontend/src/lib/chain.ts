import { createPublicClient, http, defineChain } from 'viem'
import { EVM_CHAIN_ID, RPC_URL, EXPLORER_URL } from './addresses'

export const omenChain = defineChain({
  id: EVM_CHAIN_ID,
  name: 'Omen',
  nativeCurrency: { name: 'Omen', symbol: 'OMEN', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: 'InitiaScan', url: EXPLORER_URL } },
})

export const publicClient = createPublicClient({
  chain: omenChain,
  transport: http(RPC_URL),
})
