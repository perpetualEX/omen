import type { ReactNode } from 'react'
import { InterwovenKitProvider, TESTNET } from '@initia/interwovenkit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { CHAIN_ID, RPC_URL, REST_URL } from './lib/addresses'
import { omenChain } from './lib/chain'
import '@initia/interwovenkit-react/styles.css'

// InterwovenKit needs to know about omen-1 since it's not in the public registry.
// We describe it in the Initia chain-registry format.
const omenLayerRegistry = {
  chain_id: CHAIN_ID,
  chain_name: 'Omen',
  pretty_name: 'Omen',
  status: 'live' as const,
  network_type: 'testnet' as const,
  bech32_prefix: 'init',
  daemon_name: 'minitiad',
  node_home: '$HOME/.minitia',
  slip44: 118,
  apis: {
    rpc: [{ address: 'http://localhost:26657' }],
    rest: [{ address: REST_URL }],
    'json-rpc': [{ address: RPC_URL }],
  },
  fees: {
    fee_tokens: [{ denom: 'uomen', fixed_min_gas_price: 0 }],
  },
  staking: { staking_tokens: [{ denom: 'uomen' }] },
  metadata: {
    op_bridge_id: 1,
    executor_uri: '',
    ibc_channels: [],
    minitia: { type: 'minievm' as const, version: 'v1.2.15' },
    assetlist: '',
  },
}

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customChain={omenLayerRegistry as any}
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
