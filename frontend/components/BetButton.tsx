'use client'

import { useInterwovenKit } from '@initia/interwovenkit-react'
import { useState } from 'react'
import { encodeFunctionData, parseUnits } from 'viem'
import { predictionMarketAbi } from '@/lib/abis'

interface Props {
  marketAddress: `0x${string}`
  isYes: boolean
  priceBps: number   // spot price in bps
}

export function BetButton({ marketAddress, isYes, priceBps }: Props) {
  const { requestTxSync } = useInterwovenKit()
  const [amount, setAmount] = useState('10')
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const price = (priceBps / 100).toFixed(1)

  async function placeBet() {
    setPending(true)
    setStatus(null)
    try {
      const parsedAmount = parseUnits(amount, 6) // USDC has 6 decimals
      const data = encodeFunctionData({
        abi: predictionMarketAbi,
        functionName: 'bet',
        args: [isYes, parsedAmount, 0n /* minSharesOut for demo */],
      })

      const txHash = await requestTxSync({
        to: marketAddress,
        data,
        value: 0n,
      })

      setStatus(`✓ Bet placed — tx ${txHash.slice(0, 10)}…`)
    } catch (err: any) {
      setStatus(`Error: ${err?.message ?? 'unknown'}`)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${isYes ? 'border-green-700' : 'border-red-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-semibold ${isYes ? 'text-green-400' : 'text-red-400'}`}>
          {isYes ? 'YES' : 'NO'}
        </span>
        <span className="text-sm text-gray-400">{price}¢</span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-20 bg-black border border-gray-700 rounded px-2 py-1 text-sm"
          min="1"
          disabled={pending}
        />
        <button
          onClick={placeBet}
          disabled={pending}
          className={`flex-1 rounded px-3 py-1 text-sm font-medium disabled:opacity-50 ${
            isYes ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          {pending ? '…' : `Bet ${amount} USDC`}
        </button>
      </div>
      {status && <div className="mt-2 text-xs text-gray-400">{status}</div>}
    </div>
  )
}
