import { ethPublicClient } from './config.js'
import { formatUnits } from 'viem'

/**
 * Gathers real signals from Ethereum mainnet that Claude can use to generate
 * interesting market ideas. Everything here is cheap, cached-friendly, and reliable.
 */
export interface EthSignals {
  timestamp: number
  blockNumber: bigint
  gasPriceGwei: number
  ethPriceUsd: number
  btcPriceUsd: number
  trendingTokens: { symbol: string; priceUsd: number; change24h: number }[]
  topGasGuzzlers: { address: string; label?: string }[]
}

export async function gatherSignals(): Promise<EthSignals> {
  const [blockNumber, gasPrice, prices] = await Promise.all([
    ethPublicClient.getBlockNumber(),
    ethPublicClient.getGasPrice(),
    fetchTopPrices(),
  ])

  return {
    timestamp: Math.floor(Date.now() / 1000),
    blockNumber,
    gasPriceGwei: Number(formatUnits(gasPrice, 9)),
    ethPriceUsd: prices.eth,
    btcPriceUsd: prices.btc,
    trendingTokens: prices.trending,
    topGasGuzzlers: [
      { address: '0x1f9090aae28b8a3dceadf281b0f12828e676c326', label: 'Vitalik.eth (1)' },
      { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', label: 'Vitalik.eth (main)' },
      { address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', label: 'Uniswap V2 Router' },
      { address: '0xe592427a0aece92de3edee1f18e0157c05861564', label: 'Uniswap V3 Router' },
      { address: '0xbcb91e689114b9cc865ad7871845c95241df4105', label: 'Aave V3 Pool' },
    ],
  }
}

async function fetchTopPrices(): Promise<{
  eth: number
  btc: number
  trending: { symbol: string; priceUsd: number; change24h: number }[]
}> {
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h',
    )
    if (!r.ok) throw new Error(`CoinGecko ${r.status}`)
    const data = (await r.json()) as Array<{
      symbol: string
      current_price: number
      price_change_percentage_24h: number
    }>

    const eth = data.find((t) => t.symbol === 'eth')?.current_price ?? 0
    const btc = data.find((t) => t.symbol === 'btc')?.current_price ?? 0

    const trending = data.slice(0, 8).map((t) => ({
      symbol: t.symbol.toUpperCase(),
      priceUsd: t.current_price,
      change24h: t.price_change_percentage_24h ?? 0,
    }))

    return { eth, btc, trending }
  } catch (err) {
    console.warn('[signals] price fetch failed, returning zeros:', err)
    return { eth: 0, btc: 0, trending: [] }
  }
}
