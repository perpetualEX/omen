'use client'

import { useInterwovenKit } from '@initia/interwovenkit-react'
import { BetButton } from '@/components/BetButton'
import { DepositDrawer } from '@/components/DepositDrawer'
import { Leaderboard } from '@/components/Leaderboard'
import { MarketFeed } from '@/components/MarketFeed'
import { EnableAutosign } from '@/components/EnableAutosign'

export default function Home() {
  const { address, openConnect, username } = useInterwovenKit()

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Omen</h1>
          <p className="text-gray-400 mt-1">Prediction markets, resolved by chain state.</p>
        </div>
        <div>
          {address ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">
                {username ? `${username}.init` : `${address.slice(0, 6)}…${address.slice(-4)}`}
              </span>
              <DepositDrawer />
            </div>
          ) : (
            <button
              onClick={openConnect}
              className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200"
            >
              Connect
            </button>
          )}
        </div>
      </header>

      {address && <EnableAutosign />}

      <section className="grid md:grid-cols-[1fr_320px] gap-8">
        <MarketFeed />
        <Leaderboard />
      </section>
    </main>
  )
}
