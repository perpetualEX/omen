export const CHAIN_ID = import.meta.env.VITE_OMEN_CHAIN_ID || 'omen-1'
export const EVM_CHAIN_ID = Number(import.meta.env.VITE_OMEN_EVM_CHAIN_ID || '3165038479798559')
export const RPC_URL = import.meta.env.VITE_OMEN_RPC_URL || 'http://localhost:8545'
export const REST_URL = import.meta.env.VITE_OMEN_REST_URL || 'http://localhost:1317'
export const EXPLORER_URL = import.meta.env.VITE_OMEN_EXPLORER_URL || ''

export const USDC_ADDRESS = (import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS ||
  '0xCc3fBE3b260C2A147e16c516FbC0c03152015608') as `0x${string}`
export const FACTORY_ADDRESS = (import.meta.env.VITE_MARKET_FACTORY_ADDRESS ||
  '0x48eCa970472BFd5F2567dfA07f35f52DD36444fA') as `0x${string}`
export const TREASURY_ADDRESS = (import.meta.env.VITE_TREASURY_ADDRESS ||
  '0x1c39b077277BEFec0A2CA8FAaA6A797E92c45ac3') as `0x${string}`
export const AGENT_ADDRESS = (import.meta.env.VITE_AGENT_ADDRESS ||
  '0x500b7143E7EAD3a5ed623204850b24042aB0d049') as `0x${string}`
