import "dotenv/config";

export const CONFIG = {
  PORT: Number(process.env.PORT || 8080),
  RPC: process.env.APTOS_RPC!,
  MODULE: process.env.MODULE_ADDRESS!,
  COIN: "0x1::aptos_coin::AptosCoin",
};
