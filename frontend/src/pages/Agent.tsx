import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatUnits } from 'viem'
import { useUsernameQuery } from '@initia/interwovenkit-react'
import { Header } from '../components/Header'
import { publicClient } from '../lib/chain'
import { erc20Abi, factoryAbi, marketAbi } from '../lib/abis'
import { USDC_ADDRESS, FACTORY_ADDRESS, AGENT_ADDRESS } from '../lib/addresses'

async function fetchAgentStats() {
  const [balance, count] = await Promise.all([
    publicClient.readContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [AGENT_ADDRESS] }),
    publicClient.readContract({ address: FACTORY_ADDRESS, abi: factoryAbi, functionName: 'marketCount' }),
  ])

  const n = Number(count)
  const addrs = n === 0 ? [] : await Promise.all(
    Array.from({ length: n }, (_, i) =>
      publicClient.readContract({ address: FACTORY_ADDRESS, abi: factoryAbi, functionName: 'markets', args: [BigInt(i)] })
    ),
  )

  const markets = await Promise.all(
    addrs.map(async (addr) => {
      const [question, outcome, priceYesBps, yesShares, noShares] = await Promise.all([
        publicClient.readContract({ address: addr, abi: marketAbi, functionName: 'question' }),
        publicClient.readContract({ address: addr, abi: marketAbi, functionName: 'outcome' }),
        publicClient.readContract({ address: addr, abi: marketAbi, functionName: 'priceYes' }),
        publicClient.readContract({ address: addr, abi: marketAbi, functionName: 'yesShares', args: [AGENT_ADDRESS] }),
        publicClient.readContract({ address: addr, abi: marketAbi, functionName: 'noShares', args: [AGENT_ADDRESS] }),
      ])
      return { addr, question, outcome: Number(outcome), priceYesBps, yesShares, noShares }
    }),
  )

  return { balance, markets: markets.reverse() }
}

export default function AgentPage() {
  const { data } = useQuery({
    queryKey: ['agent-profile'],
    queryFn: fetchAgentStats,
    refetchInterval: 5000,
  })

  const { data: username } = useUsernameQuery(AGENT_ADDRESS)

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <section className="relative overflow-hidden p-8 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-black to-orange-500/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl opacity-30 -translate-y-32 translate-x-32 pointer-events-none" />
          <div className="relative flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-4xl">🤖</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-semibold">Omen-AI</h1>
                <span className="mono text-xs px-2 py-1 rounded-md bg-violet-500/20 text-violet-300">AGENT</span>
              </div>
              <div className="mt-1 text-neutral-400 mono text-sm">
                {username ? `${username}.init` : `${AGENT_ADDRESS.slice(0, 10)}…${AGENT_ADDRESS.slice(-6)}`}
              </div>
              <p className="mt-4 text-neutral-200 leading-relaxed">
                An autonomous market maker. Watches Ethereum mainnet for interesting signals. Proposes
                prediction markets with specific resolvable questions. Takes positions with real reasoning,
                real money. Resolves them objectively when time is up.
              </p>
              <p className="mt-2 text-neutral-400 text-sm">You're welcome to bet against it.</p>
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-3 gap-4 mono">
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500">Book</div>
              <div className="text-2xl text-neutral-100 mt-1">
                ${data ? Number(formatUnits(data.balance, 6)).toFixed(0) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500">Markets</div>
              <div className="text-2xl text-neutral-100 mt-1">{data?.markets.length ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500">Status</div>
              <div className="text-2xl mt-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400">LIVE</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4">Agent's Open Positions</h2>
          <div className="space-y-2">
            {data?.markets.map((m) => {
              const yesBet = m.yesShares > 0n
              const position = yesBet ? 'YES' : m.noShares > 0n ? 'NO' : null
              const shares = yesBet ? m.yesShares : m.noShares
              return (
                <Link
                  key={m.addr}
                  to={`/market/${m.addr}`}
                  className="block p-4 rounded-xl border border-neutral-900 bg-neutral-950 hover:border-neutral-700 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-neutral-200">{m.question}</div>
                      {position && (
                        <div className="mt-2 flex items-center gap-2 text-xs mono">
                          <span className={`px-2 py-0.5 rounded-md ${position === 'YES' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {position}
                          </span>
                          <span className="text-neutral-500">{Number(formatUnits(shares, 6)).toFixed(0)} shares</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right mono text-xs">
                      <div className="text-neutral-500 uppercase tracking-wider">YES</div>
                      <div className="text-neutral-200 text-lg">{(Number(m.priceYesBps) / 100).toFixed(1)}¢</div>
                    </div>
                  </div>
                </Link>
              )
            })}
            {data?.markets.length === 0 && (
              <div className="p-8 rounded-xl border border-dashed border-neutral-800 text-center text-neutral-500">
                Omen-AI hasn't opened any positions yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
