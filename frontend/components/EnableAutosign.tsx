'use client'

import { useInterwovenKit } from '@initia/interwovenkit-react'
import { useState } from 'react'

/**
 * Banner that prompts user to enable autosign.
 * Key demo moment: user taps once, and every subsequent bet is signless.
 */
export function EnableAutosign() {
  const { autoSign } = useInterwovenKit()
  const [loading, setLoading] = useState(false)

  if (autoSign?.isEnabled) {
    return (
      <div className="mb-8 px-4 py-3 rounded-lg bg-green-900/30 border border-green-700 text-sm">
        ✓ Autosign enabled. Your bets will go through without signing prompts.
      </div>
    )
  }

  return (
    <div className="mb-8 px-4 py-3 rounded-lg bg-blue-900/30 border border-blue-700 flex items-center justify-between">
      <div className="text-sm">
        <div className="font-medium">Skip the signing prompts</div>
        <div className="text-gray-400">
          Enable autosign once — bet, trade, and resolve without ever clicking "confirm" again.
        </div>
      </div>
      <button
        onClick={async () => {
          try {
            setLoading(true)
            await autoSign.enable()
          } finally {
            setLoading(false)
          }
        }}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Enabling…' : 'Enable autosign'}
      </button>
    </div>
  )
}
