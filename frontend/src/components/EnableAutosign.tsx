import { useInterwovenKit } from '@initia/interwovenkit-react'
import { useState } from 'react'
import { CHAIN_ID } from '../lib/addresses'

export function EnableAutosign() {
  const { autoSign, isConnected } = useInterwovenKit()
  const [error, setError] = useState<string | null>(null)

  if (!isConnected) return null
  const isEnabled = autoSign?.isEnabledByChain?.[CHAIN_ID]
  if (isEnabled) {
    return (
      <div className="px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-sm flex items-center gap-2 mono text-emerald-400">
        <span className="text-lg">✓</span>
        Autosign enabled for omen-1 · your bets go through without prompts
      </div>
    )
  }

  async function enable() {
    setError(null)
    try {
      await autoSign.enable(CHAIN_ID)
    } catch (err) {
      setError((err as Error).message.slice(0, 80))
    }
  }

  return (
    <div className="px-5 py-4 rounded-xl border border-violet-500/30 bg-violet-500/5 flex items-center gap-4">
      <div className="text-2xl">⚡</div>
      <div className="flex-1">
        <div className="font-medium text-violet-300">Enable Autosign</div>
        <div className="text-sm text-neutral-400">
          Tap once. Bet, claim, trade without signing prompts — powered by Initia's session keys.
        </div>
        {error && <div className="text-xs text-red-400 mt-1 mono">{error}</div>}
      </div>
      <button
        onClick={enable}
        disabled={autoSign.isLoading}
        className="px-4 py-2 rounded-md bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium disabled:opacity-50"
      >
        {autoSign.isLoading ? 'Enabling…' : 'Enable'}
      </button>
    </div>
  )
}
