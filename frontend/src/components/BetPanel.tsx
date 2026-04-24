import { useInterwovenKit } from '@initia/interwovenkit-react'
import { useState } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { publicClient } from '../lib/chain'
import { erc20Abi, marketAbi } from '../lib/abis'
import { USDC_ADDRESS, CHAIN_ID } from '../lib/addresses'
import { buildEvmCallMsg } from '../lib/evm-call'

export function BetPanel({ marketAddress }: { marketAddress: `0x${string}` }) {
  const kit = useInterwovenKit()
  const qc = useQueryClient()
  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [amount, setAmount] = useState('10')
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const { data: balance } = useQuery({
    queryKey: ['usdc-balance', kit.hexAddress],
    queryFn: async () => {
      if (!kit.hexAddress) return 0n
      return publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [kit.hexAddress as `0x${string}`],
      })
    },
    enabled: !!kit.hexAddress,
    refetchInterval: 5000,
  })

  async function placeBet() {
    if (!kit.isConnected) {
      kit.openConnect()
      return
    }
    setPending(true)
    setStatus(null)
    try {
      const parsed = parseUnits(amount, 6)

      const approveMsg = buildEvmCallMsg({
        sender: kit.initiaAddress,
        contractAddress: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [marketAddress, parsed],
      })

      const betMsg = buildEvmCallMsg({
        sender: kit.initiaAddress,
        contractAddress: marketAddress,
        abi: marketAbi,
        functionName: 'bet',
        args: [side === 'YES', parsed, 0n],
      })

      const txHash = await kit.requestTxSync({ messages: [approveMsg, betMsg] })
      setStatus(`✓ bet placed · ${txHash.slice(0, 10)}…`)
      qc.invalidateQueries({ queryKey: ['market-summary', marketAddress] })
      qc.invalidateQueries({ queryKey: ['market-detail', marketAddress] })
      qc.invalidateQueries({ queryKey: ['usdc-balance'] })
    } catch (err) {
      setStatus(`error: ${(err as Error).message.slice(0, 80)}`)
    } finally {
      setPending(false)
    }
  }

  const balanceFmt = balance ? Number(formatUnits(balance, 6)) : 0
  const autosignOn = kit.autoSign?.isEnabledByChain?.[CHAIN_ID]

  return (
    <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-950 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Place a bet</h3>
        <div className="text-xs text-neutral-500 mono">bal: {balanceFmt.toFixed(2)} oUSDC</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide('YES')}
          className={`py-3 rounded-lg border font-medium transition ${
            side === 'YES' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          YES
        </button>
        <button
          onClick={() => setSide('NO')}
          className={`py-3 rounded-lg border font-medium transition ${
            side === 'NO' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          NO
        </button>
      </div>

      <div>
        <label className="text-xs text-neutral-500 mono block mb-1">amount (oUSDC)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 mono focus:outline-none focus:border-neutral-600"
            min="1"
            step="1"
            disabled={pending}
          />
          {[10, 50, 100].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v.toString())}
              className="px-3 py-2 rounded-lg border border-neutral-800 text-sm mono text-neutral-400 hover:text-neutral-200 hover:border-neutral-600"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={placeBet}
        disabled={pending || !amount || Number(amount) <= 0}
        className={`w-full py-3 rounded-lg font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
          side === 'YES' ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-red-500 hover:bg-red-400 text-black'
        }`}
      >
        {pending ? 'submitting…' : kit.isConnected ? `Bet ${amount} oUSDC on ${side}` : 'Connect to bet'}
      </button>

      {status && <div className="text-xs mono text-neutral-400">{status}</div>}

      {autosignOn && (
        <div className="text-xs text-emerald-400/70 mono flex items-center gap-1">
          ⚡ autosign on · no wallet prompt
        </div>
      )}
    </div>
  )
}
