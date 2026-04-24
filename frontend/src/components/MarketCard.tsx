import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicClient } from '../lib/chain'
import { marketAbi } from '../lib/abis'
import { formatUnits } from 'viem'

const OUTCOME_LABELS = ['Open', 'Resolved YES', 'Resolved NO', 'Invalid']

async function fetchMarketSummary(address: `0x${string}`) {
  const [question, priceYesBps, outcome, resolutionTime, totalCollateral] = await Promise.all([
    publicClient.readContract({ address, abi: marketAbi, functionName: 'question' }),
    publicClient.readContract({ address, abi: marketAbi, functionName: 'priceYes' }),
    publicClient.readContract({ address, abi: marketAbi, functionName: 'outcome' }),
    publicClient.readContract({ address, abi: marketAbi, functionName: 'resolutionTime' }),
    publicClient.readContract({ address, abi: marketAbi, functionName: 'totalCollateral' }),
  ])
  return { question, priceYesBps, outcome: Number(outcome), resolutionTime, totalCollateral }
}

export function MarketCard({ address }: { address: `0x${string}` }) {
  const { data, isLoading } = useQuery({
    queryKey: ['market-summary', address],
    queryFn: () => fetchMarketSummary(address),
    refetchInterval: 3000,
  })

  if (isLoading || !data) {
    return <div className="h-32 rounded-xl border border-neutral-900 bg-neutral-950 animate-pulse" />
  }

  const yesPct = Number(data.priceYesBps) / 100
  const noPct = 100 - yesPct
  const volume = Number(formatUnits(data.totalCollateral, 6))
  const resolvesIn = Number(data.resolutionTime) - Math.floor(Date.now() / 1000)
  const resolveLabel = data.outcome !== 0
    ? OUTCOME_LABELS[data.outcome]
    : resolvesIn > 3600
      ? `in ${Math.floor(resolvesIn / 3600)}h`
      : resolvesIn > 0
        ? `in ${Math.max(1, Math.floor(resolvesIn / 60))}m`
        : 'due'

  return (
    <Link
      to={`/market/${address}`}
      className="block p-5 rounded-xl border border-neutral-900 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-900 transition group"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="font-medium text-neutral-100 leading-snug group-hover:text-white flex-1">
          {data.question}
        </div>
        <div className="text-xs mono text-neutral-500 whitespace-nowrap">{resolveLabel}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-neutral-900 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${yesPct}%` }} />
        </div>
        <div className="flex gap-2 mono text-xs">
          <span className="text-emerald-400">{yesPct.toFixed(1)}¢ YES</span>
          <span className="text-neutral-600">|</span>
          <span className="text-red-400">{noPct.toFixed(1)}¢ NO</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-neutral-500 mono flex gap-4">
        <span>${volume.toFixed(0)} vol</span>
        <span className="text-neutral-700">·</span>
        <span>{address.slice(0, 6)}…{address.slice(-4)}</span>
      </div>
    </Link>
  )
}
