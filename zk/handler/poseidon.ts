import { buildPoseidon } from "circomlibjs";

let poseidonInstance: any | null = null;

async function getPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

export async function poseidonHash(inputs: bigint[]): Promise<string> {
  const poseidon = await getPoseidon();
  const hash = poseidon(inputs);

  return poseidon.F.toString(hash);
}
