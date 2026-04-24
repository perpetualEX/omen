import { useUsernameQuery } from '@initia/interwovenkit-react'
import { AGENT_ADDRESS } from '../lib/addresses'

const BOARD: { addr: `0x${string}`; pnlUsd: number; bets: number }[] = [
  { addr: AGENT_ADDRESS, pnlUsd: 0, bets: 3 },
]

function Row({
  rank, addr, pnlUsd, bets, isAgent,
}: {
  rank: number
  addr: `0x${string}`
  pnlUsd: number
  bets: number
  isAgent?: boolean
}) {
  const { data: username } = useUsernameQuery(addr)
  const name = username ? `${username}.init` : `${addr.slice(0, 6)}…${addr.slice(-4)}`

  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${isAgent ? 'bg-violet-500/5 border border-violet-500/30' : 'hover:bg-neutral-900'}`}>
      <div className="flex items-center gap-3">
        <div className="w-6 text-center text-neutral-600 mono text-sm">{rank}</div>
        <div>
          <div className={`text-sm font-medium ${isAgent ? 'text-violet-300' : 'text-neutral-200'}`}>
            {isAgent && <span className="text-xs mr-1">🤖</span>}
            {name}
          </div>
          <div className="text-xs text-neutral-600 mono">{bets} active</div>
        </div>
      </div>
      <div className={`mono text-sm ${pnlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {pnlUsd >= 0 ? '+' : ''}${pnlUsd.toFixed(0)}
      </div>
    </div>
  )
}

export function Leaderboard() {
  return (
    <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-950">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Leaderboard</h3>
        <div className="text-xs text-neutral-500 mono">HUMANS vs AI</div>
      </div>

      <div className="space-y-1">
        {BOARD.map((row, i) => (
          <Row
            key={row.addr}
            rank={i + 1}
            addr={row.addr}
            pnlUsd={row.pnlUsd}
            bets={row.bets}
            isAgent={row.addr.toLowerCase() === AGENT_ADDRESS.toLowerCase()}
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-900 text-xs text-neutral-500 mono">
        Updates after bets resolve. Identity via .init usernames.
      </div>
    </div>
  )
}
