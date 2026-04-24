import { encodeFunctionData } from 'viem'
import type { Abi } from 'viem'

const MSG_CALL_TYPE_URL = '/minievm.evm.v1.MsgCall'

interface EvmCallInput {
  sender: string
  contractAddress: string
  abi: Abi
  functionName: string
  args: readonly unknown[]
  value?: bigint
}

export function buildEvmCallMsg(input: EvmCallInput): { typeUrl: string; value: Record<string, unknown> } {
  const data = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    args: input.args as readonly unknown[],
  })

  return {
    typeUrl: MSG_CALL_TYPE_URL,
    value: {
      sender: input.sender,
      contractAddr: input.contractAddress,
      input: data.startsWith('0x') ? data.slice(2) : data,
      value: input.value ? input.value.toString() : '0',
      accessList: [],
    },
  }
}
