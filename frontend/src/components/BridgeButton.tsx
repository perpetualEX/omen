import { useInterwovenKit } from '@initia/interwovenkit-react'

export function BridgeButton() {
  const { openBridge } = useInterwovenKit()

  return (
    <button
      onClick={() => openBridge()}
      className="px-3 py-1.5 text-sm rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition"
      title="Bridge USDC from any chain to Omen via Interwoven Bridge"
    >
      ↗ Bridge
    </button>
  )
}
