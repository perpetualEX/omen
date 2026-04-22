'use client'

import { useInterwovenKit } from '@initia/interwovenkit-react'

/**
 * Opens the Interwoven Bridge widget.
 * Satisfies the "Interwoven Bridge" required feature for submission.
 */
export function DepositDrawer() {
  const { openBridge } = useInterwovenKit()

  return (
    <button
      onClick={() => openBridge()}
      className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
    >
      Deposit USDC
    </button>
  )
}
