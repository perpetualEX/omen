# Omen Contracts

Solidity contracts for Omen, deployed to the Omen MiniEVM rollup.

## Setup

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge install foundry-rs/forge-std --no-commit
```

## Build

```bash
forge build
```

## Test

```bash
forge test -vvv
```

## Deploy to Omen rollup

```bash
export OMEN_RPC_URL=https://json-rpc.omen-testnet-1.initia.tech
export AGENT_ADDRESS=0x...            # the AI agent's signing address
export COLLATERAL_TOKEN=0x...         # USDC on your rollup
export PRIVATE_KEY=0x...              # deployer key

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $OMEN_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

After deploy, update `.initia/submission.json` with the Treasury and MarketFactory addresses, then also update `frontend/lib/addresses.ts` and `agent/src/config.ts`.

## Contract Overview

- **PredictionMarket.sol** — binary YES/NO market with CPMM pricing. Resolved by the factory (which is called by the agent).
- **MarketFactory.sol** — only the agent address can `createMarket()` or `resolveMarket()`.
- **Treasury.sol** — collects the 2% bet fee and 5% resolution fee.

## Security Notes (for judges)

This is hackathon code. Production would need:
- Replace the agent EOA with a threshold-signed oracle (or a dispute game with economic finality)
- Add a pause mechanism on the factory
- Add a per-market creation bond to prevent spam
- Formal LMSR (log-based cost fn) for bounded loss guarantees
- Audits
