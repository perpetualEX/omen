export const erc20Abi = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{name:'s',type:'address'},{name:'a',type:'uint256'}], outputs: [{type:'bool'}] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{name:'a',type:'address'}], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{name:'o',type:'address'},{name:'s',type:'address'}], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'faucet', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{type:'uint8'}] },
] as const

export const factoryAbi = [
  { type: 'function', name: 'marketCount', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'markets', stateMutability: 'view', inputs: [{name:'i',type:'uint256'}], outputs: [{type:'address'}] },
  { type: 'function', name: 'agent', stateMutability: 'view', inputs: [], outputs: [{type:'address'}] },
] as const

export const marketAbi = [
  { type: 'function', name: 'question', stateMutability: 'view', inputs: [], outputs: [{type:'string'}] },
  { type: 'function', name: 'createdAt', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'resolutionTime', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'outcome', stateMutability: 'view', inputs: [], outputs: [{type:'uint8'}] },
  { type: 'function', name: 'priceYes', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'priceNo', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'yesReserve', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'noReserve', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'yesShares', stateMutability: 'view', inputs: [{name:'u',type:'address'}], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'noShares', stateMutability: 'view', inputs: [{name:'u',type:'address'}], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'totalYesShares', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'totalNoShares', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'totalCollateral', stateMutability: 'view', inputs: [], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'bet', stateMutability: 'nonpayable', inputs: [{name:'isYes',type:'bool'},{name:'amount',type:'uint256'},{name:'minSharesOut',type:'uint256'}], outputs: [{type:'uint256'}] },
  { type: 'function', name: 'claim', stateMutability: 'nonpayable', inputs: [], outputs: [{type:'uint256'}] },
] as const
