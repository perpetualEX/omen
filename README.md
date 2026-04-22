# Omen

> Autonomous prediction markets for on-chain events, powered by AI agents that propose, price, and resolve markets without human operators.

**Built for the INITIATE Hackathon by Initia — DeFi track (AI-enhanced).**

---

## The Problem

Prediction markets are one of the oldest ideas in crypto, but they all have the same bottleneck: **humans**. Humans propose markets, humans resolve them, humans dispute them. That's slow, expensive, and doesn't scale to the long tail of things people actually want to bet on — like on-chain events that are, by definition, verifiable without a human in the loop.

## The Solution

Omen is a prediction market where an AI agent does three things no human operator can do at scale:

1. **Proposes markets** by watching on-chain activity and identifying interesting, resolvable questions. ("Will wallet 0xABC deposit to Protocol X before Friday?")
2. **Prices them** using an LMSR market maker, so there's always liquidity.
3. **Resolves them automatically** by querying chain state at expiry. No disputes. No oracles. The chain *is* the oracle.

Users just bet. And because Omen runs on its own Initia rollup with autosign enabled, they don't sign transactions either — it feels like a normal app.

## Why an Initia Appchain

- **100ms blocks** let us settle bets instantly, which matters for short-duration markets.
- **Auto-signing** makes placing a bet feel like liking a tweet — no wallet pop-up.
- **Interwoven Bridge** lets users bring USDC from anywhere without learning what a bridge is.
- **.init usernames** turn leaderboards from hex soup into something readable.
- **We keep the revenue.** Fees from every bet flow to the Omen treasury, not a shared sequencer.

## Architecture

```
Frontend (Next.js + InterwovenKit)
        │
        ▼
Omen Appchain (MiniEVM)
  ├── MarketFactory.sol   — only agent can spawn markets
  ├── PredictionMarket.sol — LMSR pricing, YES/NO shares
  └── Treasury.sol        — fee collection
        ▲
        │
AI Agent (Node.js, off-chain)
  ├── Proposes markets from on-chain activity
  └── Resolves markets at expiry by reading chain state
```

## Required Initia Features

| Feature | Where it lives |
|---|---|
| Own appchain/rollup | MiniEVM rollup, chain ID `omen-testnet-1` |
| `@initia/interwovenkit-react` | `frontend/app/providers.tsx` |
| Autosign | `frontend/components/BetButton.tsx` — enabled on first bet |
| Interwoven Bridge | `frontend/components/DepositDrawer.tsx` |
| .init usernames | `frontend/components/Leaderboard.tsx` |

## Demo

- **Live app:** https://omen-demo.vercel.app *(replace)*
- **Rollup explorer:** https://scan.initia.xyz/omen-testnet-1 *(replace)*
- **Demo video:** https://loom.com/... *(replace)*
- **Deployment tx:** `0x...` *(replace)*

## Repo Layout

```
omen/
├── contracts/       # Foundry project for Solidity contracts
├── frontend/        # Next.js 14 app with InterwovenKit
├── agent/           # Node.js agent that proposes + resolves markets
└── .initia/
    └── submission.json
```

## Running Locally

See `contracts/README.md`, `frontend/README.md`, and `agent/README.md` for per-component setup.

## Revenue Model

- 2% fee on every bet
- 5% fee on market resolution (of total pool)
- Fees accrue to the Omen treasury, denominated in USDC

At hackathon scale this is meaningless. At 10k daily active users betting $5 average, it's ~$40k/month gross. The model is the same one Polymarket proved works.

## What's Next

- Multi-outcome markets (currently binary only)
- Dispute window with economic finality (currently AI-resolved, period)
- Mobile app with push notifications when markets approach resolution

## Team

*Fill in.*

## License

MIT
