import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const MODULE_ADDRESS =
  "0x4e2e65c099323ccc865047636f9b418554ef9e5443db68571910b3f9567cb3c0";

const config = new AptosConfig({
  fullnode: "https://testnet.movementnetwork.xyz/v1",
  indexer: "https://hasura.testnet.movementnetwork.xyz/v1/graphql",
  network: Network.CUSTOM,
});

export const aptos = new Aptos(config);