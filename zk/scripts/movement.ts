import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const MODULE_ADDRESS =
  "0xd074036289078d10cd2e4042d3013e6c5c5c8edad74896ecb4f317d6a5d56789";

const config = new AptosConfig({
  fullnode: "https://testnet.movementnetwork.xyz/v1",
  indexer: "https://hasura.testnet.movementnetwork.xyz/v1/graphql",
  network: Network.CUSTOM,
});

export const aptos = new Aptos(config);