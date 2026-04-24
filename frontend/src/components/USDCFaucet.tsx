import { useInterwovenKit } from '@initia/interwovenkit-react'
import { useState } from 'react'
import { erc20Abi } from '../lib/abis'
import { USDC_ADDRESS } from '../lib/addresses'
import { buildEvmCallMsg } from '../lib/evm-call'

export function USDCFaucet() {
  const kit = useInterwovenKit()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function onClick() {
    if (!kit.isConnected) return
    setLoading(true)
    setStatus(null)
    try {
      const msg = buildEvmCallMsg({
        sender: kit.initiaAddress,
        contractAddress: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'faucet',
        args: [],
      })
      const txHash = await kit.requestTxSync({ messages: [msg] })
      setStatus(`✓ +1,000 oUSDC (${txHash.slice(0, 8)}…)`)
    } catch (err) {
      setStatus(`Error: ${(err as Error).message.slice(0, 40)}`)
    } finally {
      setLoading(false)
      setTimeout(() => setStatus(null), 6000)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={loading}
        className="px-3 py-1.5 text-sm rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition disabled:opacity-50"
        title="Claim 1,000 test USDC (once per hour)"
      >
        {loading ? '…' : '＋ oUSDC'}
      </button>
      {status && (
        <div className="absolute top-full right-0 mt-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-xs mono whitespace-nowrap">
          {status}
        </div>
      )}
    </div>
  )
}
