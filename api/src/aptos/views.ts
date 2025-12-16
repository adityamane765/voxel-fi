import { Aptos } from "@aptos-labs/ts-sdk";

const MODULE =
  "0x4e2e65c099323ccc865047636f9b418554ef9e5443db68571910b3f9567cb3c0";
const COIN = "0x1::aptos_coin::AptosCoin";

export async function getVaultReserves(
  aptos: Aptos,
  admin: string
): Promise<[number, number]> {
  const res = await aptos.view({
    payload: {
      function: `${MODULE}::vault::get_reserves`,
      typeArguments: [COIN, COIN],
      functionArguments: [admin],
    },
  });

  return [Number(res[0]), Number(res[1])];
}

export async function getPosition(
  aptos: Aptos,
  owner: string,
  positionId: number
) {
  return aptos.view({
    payload: {
      function: `${MODULE}::fractal_position::get_position`,
      functionArguments: [owner, positionId],
    },
  });
}

export async function liquidityAtPrice(
  aptos: Aptos,
  owner: string,
  positionId: number,
  price: number
): Promise<number> {
  const res = await aptos.view({
    payload: {
      function: `${MODULE}::fractal_position::liquidity_at_price`,
      functionArguments: [owner, positionId, price],
    },
  });

  return Number(res[0]);
}

export async function queryOctree(
  aptos: Aptos,
  admin: string,
  priceBucket: number,
  vol: number,
  depth: number
): Promise<number> {
  const res = await aptos.view({
    payload: {
      function: `${MODULE}::spatial_octree::query`,
      functionArguments: [admin, priceBucket, vol, depth],
    },
  });

  return Number(res[0]);
}
