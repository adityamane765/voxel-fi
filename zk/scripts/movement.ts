import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// please update the module address after deployment, this was the address at the time when I conductd the ZK testing
export const MODULE_ADDRESS ="0x3f63188f87dd105ef83155fdb2a10f5050a70f6dc9ad59ac184054dd23eff5c4";

const config = new AptosConfig({
  fullnode: "https://testnet.movementnetwork.xyz/v1",
  indexer: "https://hasura.testnet.movementnetwork.xyz/v1/graphql",
  network: Network.CUSTOM,
});

export const aptos = new Aptos(config);