import { useInterwovenKit } from '@initia/interwovenkit-react'
import { Link } from 'react-router-dom'
import { BridgeButton } from './BridgeButton'
import { USDCFaucet } from './USDCFaucet'

export function Header() {
  const kit = useInterwovenKit()

  return (
    <header className="border-b border-neutral-900 sticky top-0 bg-black/80 backdrop-blur-md z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 group-hover:rotate-12 transition" />
          <div>
            <div className="font-semibold tracking-tight">Omen</div>
            <div className="text-[10px] text-neutral-500 mono uppercase tracking-widest">
              Autonomous Markets · omen-1
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/agent" className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition">
            Meet Omen-AI
          </Link>

          {kit.isConnected ? (
            <>
              <USDCFaucet />
              <BridgeButton />
              <button
                onClick={kit.openWallet}
                className="px-3 py-1.5 text-sm rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition mono"
              >
                {kit.username ? `${kit.username}.init` : `${kit.hexAddress?.slice(0, 6)}…${kit.hexAddress?.slice(-4)}`}
              </button>
            </>
          ) : (
            <button
              onClick={kit.openConnect}
              className="px-4 py-1.5 text-sm rounded-md bg-white text-black font-medium hover:bg-neutral-200 transition"
            >
              Connect
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
