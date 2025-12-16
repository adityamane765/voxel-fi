import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { CONFIG } from "../config.js";

export const aptos = new Aptos(
  new AptosConfig({
    network: Network.CUSTOM,
    fullnode: CONFIG.RPC,
  })
);
