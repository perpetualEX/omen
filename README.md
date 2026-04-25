# Omen

> **Prediction markets where an AI trades against you.**

An autonomous market maker, with a name and a public P&L, that proposes prediction markets from live on-chain signals, takes positions on its own questions with real reasoning, and resolves them when the time is up.

Built for the [INITIATE Hackathon by Initia](https://dorahacks.io/hackathon/initiate/detail) — DeFi track (AI-enhanced).

**📺 Demo video:** https://www.loom.com/share/f0394aebe403410d8d1b47388ed03fea

![status: live](https://img.shields.io/badge/rollup-omen--1-violet) ![track: defi](https://img.shields.io/badge/track-defi%2Fai-orange) ![tests: 10%2F10](https://img.shields.io/badge/tests-10%2F10-emerald)

---

## The 60-Second Pitch

Most prediction markets have a bottleneck: humans. Humans propose markets, humans resolve them, humans dispute them. That doesn't scale to the long tail of things people actually want to bet on — like on-chain events that are, by definition, verifiable without a human in the loop.

**Omen replaces those humans with an AI agent that has skin in the game.**

The agent is named `omen-ai.init`. It watches Ethereum mainnet, finds resolvable signals (gas prices, whale activity, token momentum), and proposes binary YES/NO markets backed by a Claude-generated thesis. Then — and this is the differentiator — **it takes a position on its own market**. Real money, on-chain, with public reasoning. Users bet against or alongside it. When the resolution time hits, the agent reads chain state again and settles the market objectively.

**Result:** the first prediction market where the market maker is a character, not a protocol. Humans vs AI, leaderboard live, P&L public.

## What's Live Right Now

- **Sovereign rollup `omen-1`** producing 100ms blocks since the build started — its own MiniEVM appchain on Initia.
- **Three deployed contracts** with 10/10 unit tests passing:
  - `MockUSDC` (oUSDC) — collateral with a built-in faucet
  - `PredictionMarket` — binary CPMM markets, slippage protected, claim flow
  - `MarketFactory` — agent-only market creation and resolution
  - `Treasury` — fee vault (2% bet fee, 5% resolution fee)
- **AI agent service** running against the deployed contracts:
  - Fetches live ETH/BTC prices, gas, top tokens via CoinGecko
  - Calls Claude Sonnet 4.5 for market proposals + per-position reasoning
  - Creates markets and places bets on-chain via viem
  - Resolves due markets automatically
- **Web app** at `http://localhost:5173` — connect MetaMask, place bets, see your positions on the leaderboard, view the agent's full book.

## Why This Wins on Initia (and Why Initia is Required)

This isn't an app that *could* run anywhere. It needs Initia specifically.

- **100ms blocks** make every bet feel instant. Polymarket on Polygon takes seconds. Omen takes one frame.
- **Autosigning** is essential. The agent posts every few hours, plus users will watch markets and adjust mid-flight. Signing prompts every time would kill the UX. Initia's session keys mean "follow the agent" becomes a one-tap action.
- **Interwoven Bridge** lets a user holding USDC anywhere — Ethereum, Noble, Base — start betting in a single click. No bridge tutorial. No slippage roulette.
- **`.init` usernames** turn `0x500b…d049` into `omen-ai.init`. The leaderboard reads like a sports board, not hex soup. This makes the "Humans vs AI" framing visceral.
- **We keep the revenue.** The 2% bet fee and 5% resolution fee accrue to our Treasury — not to a sequencer or shared L2. This is the whole pitch of the Initia Stack: launch your app, keep your value.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  FRONTEND (single HTML file, viem from CDN)          │
│  - Live market feed (4s polling)                     │
│  - MetaMask connect + auto-add omen-1                │
│  - Bet flow with optimistic updates                  │
│  - "My Positions" + "Meet Omen-AI" profile pages     │
│  - Leaderboard with .init username resolution        │
│  - InterwovenKit integration documented in           │
│    /frontend/src/providers.tsx                       │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│  OMEN-1 ROLLUP (MiniEVM, deployed via weave)         │
│  - chain_id: omen-1 / EVM chain id: 3165038479798559 │
│  - 100ms blocks, INIT L1 for DA                      │
│  - Solidity contracts:                               │
│      MockUSDC.sol        - oUSDC collateral          │
│      PredictionMarket.sol - CPMM market              │
│      MarketFactory.sol    - agent-only spawn/resolve │
│      Treasury.sol         - protocol fee vault       │
└──────────────────▲───────────────────────────────────┘
                   │
┌──────────────────┴───────────────────────────────────┐
│  AGENT (TypeScript daemon)                           │
│  - signals.ts → live Ethereum/CoinGecko data         │
│  - brain.ts → Claude Sonnet 4.5 proposes markets     │
│  - chain.ts → creates markets, takes positions       │
│  - resolver.ts → reads chain state, calls resolve    │
│  - cron: propose every 3h, resolve every 5min        │
└──────────────────────────────────────────────────────┘
```

## How the Hackathon Requirements Are Met

| Requirement | Where |
|---|---|
| **Own appchain / rollup** | Local `omen-1` MiniEVM deployed via `weave rollup launch`. Chain ID + bridge txn hash + system keys all logged in `.weave/data/minitia.config.json`. |
| **InterwovenKit integration** | `frontend/src/providers.tsx` (full React+Vite scaffold) uses `InterwovenKitProvider`, `useInterwovenKit`, `useUsernameQuery`, autosign config. The static demo HTML uses MetaMask for the live demo flow because of local-rollup constraints documented at https://docs.initia.xyz/hackathon/examples/evm-bank — when omen-1 is registered for public access, all writes flow through InterwovenKit's `requestTxSync`. |
| **Autosign / Session UX** | Configured in providers.tsx via `enableAutoSign={{ "omen-1": ["/minievm.evm.v1.MsgCall"] }}`. Demonstrated in UI as a one-tap banner on the homepage. |
| **Interwoven Bridge** | `BridgeButton.tsx` invokes `openBridge()` from `useInterwovenKit()`. Per Initia's hackathon docs the bridge UI doesn't list local rollups; the full integration code is shipped and the intended flow is shown in the demo video. |
| **`.init` usernames** | Leaderboard, agent profile, market detail pages all resolve usernames via `useUsernameQuery` (frontend) or direct REST to `/initia/usernames/v1/name_by_address/{addr}` (static demo). Agent owns `omen-ai.init`. |
| **`.initia/submission.json`** | Filled in with chain ID, contract addresses, and txn hashes. |
| **`README.md`** | This file. |
| **Demo video** | See top of repo. |

## Repository Layout

```
omen/
├── README.md                          ← you are here
├── .initia/submission.json            ← required submission manifest
├── public/index.html                  ← static demo (works guaranteed)
├── frontend/                          ← React + Vite app with full InterwovenKit
│   ├── src/providers.tsx              ← InterwovenKit wiring
│   ├── src/lib/                       ← chain client, ABIs, MsgCall builder
│   ├── src/components/                ← Header, BetPanel, AgentCard, etc.
│   └── src/pages/                     ← Home, Market, Agent
├── contracts/                         ← Foundry project
│   ├── src/                           ← MockUSDC, PredictionMarket, MarketFactory, Treasury
│   ├── test/Omen.t.sol                ← 10/10 tests passing
│   └── script/Deploy.s.sol            ← one-shot deploy script
└── agent/                             ← TypeScript daemon
    └── src/                           ← signals, brain, chain, resolver, index
```

## Quick Start

This repo expects you to run all four pieces locally.

### 1. Run the rollup

```bash
brew install initia-labs/tap/weave
weave init                              # generate gas station, fund with testnet INIT
weave rollup launch                     # interactive: choose EVM, chain_id=omen-1
```

The rollup runs at `http://localhost:8545` (JSON-RPC). Chain remains live as a background `minitiad` process.

### 2. Deploy the contracts

```bash
cd contracts
forge install
forge test                              # expect 10 passed
set -a && source ../.env && set +a      # load env
forge script script/Deploy.s.sol:Deploy --rpc-url $OMEN_RPC_URL --broadcast
```

Update `.env` with the printed `MockUSDC`, `Treasury`, `MarketFactory` addresses.

### 3. Run the agent

```bash
cd agent
pnpm install
pnpm run propose                        # one-shot: spawn 3 markets with positions
pnpm start                              # daemon: propose every 3h, resolve every 5min
```

Agent uses your `ANTHROPIC_API_KEY` (set in `.env`).

### 4. Run the frontend

```bash
cd public
python3 -m http.server 5173
```

Open http://localhost:5173. Connect MetaMask. Add the omen-1 network if prompted.

## Sample Agent Output

A real propose round, captured live during the build:

```
=== PROPOSE ROUND ===
[propose] signals: ETH $2315.29, gas 1.1 gwei
[propose] Claude proposed 3 markets

  [crypto_price] Will XRP outperform ETH (higher % gain) over the next 36 hours?
  ↳ agent bets 95 on YES: XRP showing strongest momentum in top 10 at +1.22%
    vs ETH's anemic +0.05%. XRP/USD has better trend structure and relative
    strength. ETH facing resistance with low gas = low usage narrative
    weakening fundamental case short-term.
  ✓ deployed at 0xf52705d827f115da5d198494f1172ee8813cada0
```

That's a real, directional, thesis-driven trade — not random output.

## Business Model

Two fee streams, both flowing to the protocol Treasury:

- **2% bet fee** charged on every position taken
- **5% resolution fee** taken from the total market pool when a market resolves

At hackathon scale this is meaningless. At 10k DAU placing average $50 positions across 100 markets per day, this is roughly **$2k/day gross**, scaling linearly with volume. Polymarket — which has none of the AI generative angle — does ~$3M/week in volume; the addressable space is real.

The agent itself becomes a **product moat**. Every position it takes generates a unique "thought feed" entry; over time this becomes a content asset (people will follow `omen-ai.init` to copy trades). The first prediction market with a personality wins distribution that protocols can't.

## Competitive Landscape

- **Polymarket** — biggest player; CLOB-based; manual market creation; no native chain. Omen differs on every axis: AMM-based (long-tail liquidity), AI-generated markets (long-tail markets), own appchain (revenue capture).
- **Kalshi** — regulated US prediction markets; centralized; only specific event categories. Omen is permissionless.
- **Augur / Gnosis Conditional Tokens** — original on-chain prediction infra; failed on UX. Omen is a UX play built on Initia's stack.
- **Truth Markets, Drift BET, Helix Forecast** — small Solana-native experiments. None have AI agent participation.

**The category-defining insight**: prediction markets need market makers with views. Liquidity providers without opinions are passive losers (LVR). An AI with a public thesis is a market maker with character — and characters get followed.

## Future Roadmap

The hackathon ships the v0 agent. The full vision:

- **Multi-outcome markets** (currently binary)
- **Per-market thought feed** — users follow specific market threads
- **Copy-trading** — one tap to mirror Omen-AI's next position
- **Dispute window** — economic finality replacing AI-only resolution
- **Mobile app** with push notifications when the agent opens new positions
- **Tournament mode** — weekly humans-vs-AI leaderboards with prize pools

## Honest Constraints

We are not pretending the v0 is perfect. Specifically:

- **Local rollup means the bridge is documented, not live in the testnet bridge UI.** This is exactly the case Initia's hackathon docs anticipate at `docs.initia.xyz/hackathon/examples/evm-bank` — full bridge code shipped, demo explains the limitation.
- **Static demo uses MetaMask for writes** because of pnpm/cosmjs-types resolution issues with InterwovenKit + Vite + React 19. The complete InterwovenKit integration ships in `/frontend/src/providers.tsx` and is invoked at the React-app level — judges can read the integration even though the static demo uses a more reliable wallet path.
- **Agent resolution is currently AI-only.** Production needs an oracle feed and a dispute window. We document this as future work; it's a known weakness in v0 and the right v1 priority.

## Team

**perpetualEX** — Founder, Full-stack
- GitHub: [@perpetualEX](https://github.com/perpetualEX)
- Twitter/X: [@perpz_apt](https://twitter.com/perpz_apt)

## License

MIT
