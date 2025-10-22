import { createWsClient } from "polkadot-api/ws"

const endpoints = {
  dot: [
    "wss://rpc.ibp.network/polkadot",
    "wss://polkadot.dotters.network",
    "wss://rpc-polkadot.luckyfriday.io",
    "wss://polkadot.api.onfinality.io/public-ws",
  ],
  ksm: [
    "wss://sys.ibp.network/statemine",
    "wss://asset-hub-kusama.dotters.network",
    "wss://rpc-asset-hub-kusama.luckyfriday.io",
    "wss://asset-hub-kusama-rpc.dwellir.com",
  ],
  pas: [
    "wss://sys.ibp.network/asset-hub-paseo",
    "wss://asset-hub-paseo.dotters.network",
    "wss://pas-rpc.stakeworld.io/assethub",
    "wss://asset-hub-paseo-rpc.dwellir.com",
  ],
  wnd: [
    "wss://westend-asset-hub-rpc.polkadot.io",
    "wss://asset-hub-westend-rpc.dwellir.com",
    "wss://westmint-rpc-tn.dwellir.com",
  ],
}

export const getClient = (chain: string) => {
  const endpointsList = endpoints[chain as keyof typeof endpoints]
  if (!endpointsList) throw new Error(`Non supported chain ${chain}`)
  return createWsClient(endpointsList)
}
