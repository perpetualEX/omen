'use client'

import { InterwovenKitProvider } from '@initia/interwovenkit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import '@initia/interwovenkit-react/styles.css'

// ----------------------------------------------------------------------------
// 1. Define the Omen rollup as a viem chain.
//    Replace evm_chain_id with the real one after deployment.
// ----------------------------------------------------------------------------

export const omenChain = defineChain({
  id: 0, // REPLACE with actual evm_chain_id after rollup deploy
  name: 'Omen',
  nativeCurrency: { name: 'INIT', symbol: 'INIT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://json-rpc.omen-testnet-1.initia.tech'] },
  },
  blockExplorers: {
    default: { name: 'InitiaScan', url: 'https://scan.initia.xyz/omen-testnet-1' },
  },
})

const wagmiConfig = createConfig({
  chains: [omenChain],
  transports: {
    [omenChain.id]: http(),
  },
})

const queryClient = new QueryClient()

// ----------------------------------------------------------------------------
// 2. InterwovenKitProvider wires up wallet connect + autosign + bridge.
//    defaultChainId must match the Cosmos chain ID (NOT the evm_chain_id).
// ----------------------------------------------------------------------------

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InterwovenKitProvider defaultChainId="omen-testnet-1">
          {children}
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
