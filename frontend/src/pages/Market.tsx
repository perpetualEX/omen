import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatUnits } from 'viem'
import { useInterwovenKit } from '@initia/interwovenkit-react'
import { Header } from '../components/Header'
import { BetPanel } from '../components/BetPanel'
import { EnableAutosign } from '../components/EnableAutosign'
import { publicClient } from '../lib/chain'
import { marketAbi } from '../lib/abis'

const OUTCOMES = ['Open for betting', 'Resolved YES ✅', 'Resolved NO ❌', 'Invalid ⚠️']

export default function MarketPage() {
  const { address } = useParams<{ address: string }>()
  const marketAddr = address as `0x${string}`
  const kit = useInterwovenKit()

  const { data } = useQuery({
    queryKey: ['market-detail', marketAddr],
    queryFn: async () => {
      const [question, priceYesBps, outcome, resolutionTime, totalCollateral, userYes, userNo] = await Promise.all([
        publicClient.readContract({ address: marketAddr, abi: marketAbi, functionName: 'question' }),
        publicClient.readContract({ address: marketAddr, abi: marketAbi, functionName: 'priceYes' }),
        publicClient.readContract({ address: marketAddr, abi: marketAbi, functionName: 'outcome' }),
        publicClient.readContract({ address: marketAddr, abi: marketAbi, functionName: 'resolutionTime' }),
        publicClient.readContract({ address: marketAddr, abi: marketAbi, functionName: 'totalCollateral' }),
        kit.hexAddress
          ? publicClient.readContract({ address: marketAddr, abi: marketAbi, functionName: 'yesShares', args: [kit.hexAddress as `0x${string}`] })
          : Promise.resolve(0n),
        kit.hexAddress
          ? publicClient.readContract({ address: marketAddr, abi: marketAbi, functionName: 'noShares', args: [kit.hexAddress as `0x${string}`] })
          : Promise.resolve(0n),
      ])
      return { question, priceYesBps, outcome: Number(outcome), resolutionTime, totalCollateral, userYes, userNo }
    },
    refetchInterval: 3000,
    enabled: !!marketAddr,
  })

  if (!data) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="h-48 rounded-xl border border-neutral-900 bg-neutral-950 animate-pulse" />
        </main>
      </>
    )
  }

  const yesPct = Number(data.priceYesBps) / 100
  const noPct = 100 - yesPct
  const tvl = Number(formatUnits(data.totalCollateral, 6))
  const resolvesAt = new Date(Number(data.resolutionTime) * 1000)

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-300">← all markets</Link>

        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs mono px-2 py-1 rounded-md ${
              data.outcome === 0 ? 'bg-neutral-900 text-neutral-400' :
              data.outcome === 1 ? 'bg-emerald-500/10 text-emerald-400' :
              data.outcome === 2 ? 'bg-red-500/10 text-red-400' :
              'bg-yellow-500/10 text-yellow-400'
            }`}>
              {OUTCOMES[data.outcome]}
            </span>
            <span className="text-xs mono text-neutral-600">resolves {resolvesAt.toLocaleString()}</span>
          </div>
          <h1 className="text-2xl font-semibold leading-tight">{data.question}</h1>
        </div>

        <div className="grid md:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-950 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Market Odds</h3>
                <div className="text-xs mono text-neutral-500">${tvl.toFixed(0)} TVL</div>
              </div>

              <div className="flex gap-3 mono">
                <div className="flex-1 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/30">
                  <div className="text-xs text-emerald-400/70 uppercase tracking-wider">YES</div>
                  <div className="text-2xl text-emerald-400 mt-1">{yesPct.toFixed(1)}¢</div>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-red-500/5 border border-red-500/30">
                  <div className="text-xs text-red-400/70 uppercase tracking-wider">NO</div>
                  <div className="text-2xl text-red-400 mt-1">{noPct.toFixed(1)}¢</div>
                </div>
              </div>

              <div className="h-2 rounded-full bg-red-500/20 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${yesPct}%` }} />
              </div>
            </div>

            {(data.userYes > 0n || data.userNo > 0n) && (
              <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-950">
                <h3 className="font-medium mb-3">Your Position</h3>
                <div className="grid grid-cols-2 gap-4 mono text-sm">
                  <div>
                    <div className="text-xs text-neutral-500">YES shares</div>
                    <div className="text-emerald-400">{formatUnits(data.userYes, 6)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">NO shares</div>
                    <div className="text-red-400">{formatUnits(data.userNo, 6)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs mono px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300">🤖 AGENT</span>
                <span className="text-xs text-neutral-500 mono">Omen-AI created this market</span>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                The AI proposed this question based on live Ethereum mainnet signals and took an initial
                position. View its reasoning and P&L on the{' '}
                <Link to="/agent" className="text-violet-400 hover:text-violet-300 underline">agent profile</Link>.
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <EnableAutosign />
            {data.outcome === 0 && <BetPanel marketAddress={marketAddr} />}
          </aside>
        </div>
      </main>
    </>
  )
}
