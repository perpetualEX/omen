import { useQuery } from '@tanstack/react-query'
import { Header } from '../components/Header'
import { AgentCard } from '../components/AgentCard'
import { MarketCard } from '../components/MarketCard'
import { Leaderboard } from '../components/Leaderboard'
import { EnableAutosign } from '../components/EnableAutosign'
import { publicClient } from '../lib/chain'
import { factoryAbi } from '../lib/abis'
import { FACTORY_ADDRESS } from '../lib/addresses'

async function fetchAllMarkets(): Promise<`0x${string}`[]> {
  const count = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: 'marketCount',
  })
  const n = Number(count)
  if (n === 0) return []
  const addrs = await Promise.all(
    Array.from({ length: n }, (_, i) =>
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: 'markets',
        args: [BigInt(i)],
      }),
    ),
  )
  return addrs.reverse()
}

export default function Home() {
  const { data: markets, isLoading } = useQuery({
    queryKey: ['all-markets'],
    queryFn: fetchAllMarkets,
    refetchInterval: 4000,
  })

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <section className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Omen</h1>
            <p className="text-neutral-400 mt-1">
              Prediction markets where an AI trades against you. Proposed, priced, and resolved on-chain.
            </p>
          </div>

          <AgentCard />
          <EnableAutosign />
        </section>

        <section className="grid md:grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Live Markets</h2>
              <div className="text-xs mono text-neutral-500">
                {markets?.length ?? 0} active · refreshing every 4s
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-32 rounded-xl border border-neutral-900 bg-neutral-950 animate-pulse" />
                ))}
              </div>
            ) : markets && markets.length > 0 ? (
              <div className="space-y-3">
                {markets.map((addr) => (
                  <MarketCard key={addr} address={addr} />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-neutral-800 text-center text-neutral-500">
                No markets yet — Omen-AI hasn't made its move.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <Leaderboard />
          </aside>
        </section>
      </main>
    </>
  )
}
