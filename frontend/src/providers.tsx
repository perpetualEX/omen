import type { ReactNode } from 'react'
import { InterwovenKitProvider, TESTNET } from '@initia/interwovenkit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { CHAIN_ID, RPC_URL } from './lib/addresses'
import { omenChain } from './lib/chain'
import '@initia/interwovenkit-react/styles.css'

const wagmiConfig = createConfig({
  chains: [omenChain],
  transports: { [omenChain.id]: http(RPC_URL) },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId={CHAIN_ID}
          theme="dark"
          enableAutoSign={{ [CHAIN_ID]: ['/minievm.evm.v1.MsgCall'] }}
        >
          {children}
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
