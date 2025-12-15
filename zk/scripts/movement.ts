import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";

export const MODULE_ADDRESS =
  "0x237c534771bd2790ae97480b03a19274ee8a296666055f2bef1fd5cb8ecd00a8";

export const aptos = new Aptos(
  new AptosConfig({
    network: "testnet" as any,
    fullnode: "https://rpc.testnet.movementlabs.xyz/v1",
  })
);
