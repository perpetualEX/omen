import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicClient } from '../lib/chain'
import { erc20Abi, factoryAbi } from '../lib/abis'
import { USDC_ADDRESS, FACTORY_ADDRESS, AGENT_ADDRESS } from '../lib/addresses'
import { formatUnits } from 'viem'

export function AgentCard() {
  const { data } = useQuery({
    queryKey: ['agent-stats'],
    queryFn: async () => {
      const [balance, marketCount] = await Promise.all([
        publicClient.readContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [AGENT_ADDRESS] }),
        publicClient.readContract({ address: FACTORY_ADDRESS, abi: factoryAbi, functionName: 'marketCount' }),
      ])
      return { balance, marketCount: Number(marketCount) }
    },
    refetchInterval: 10_000,
  })

  return (
    <Link
      to="/agent"
      className="block relative overflow-hidden p-6 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-black to-orange-500/5 hover:border-violet-500/60 transition"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl opacity-30 -translate-y-20 translate-x-20 pointer-events-none" />

      <div className="relative flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-xl">🤖</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Omen-AI</h3>
            <span className="mono text-xs px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300">AGENT</span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            An autonomous trader that proposes markets from live on-chain data, takes positions with real reasoning, and resolves them. You can bet against it.
          </p>
          <div className="mt-4 flex gap-6 mono text-sm">
            <div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">Book</div>
              <div className="text-neutral-200">${data ? Number(formatUnits(data.balance, 6)).toFixed(0) : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">Markets</div>
              <div className="text-neutral-200">{data?.marketCount ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">Status</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
