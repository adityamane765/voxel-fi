import * as snarkjs from "snarkjs";
import fs from "fs";
import { poseidonHash } from "./poseidon";
import type { ZKResult } from "./types";

const { groth16 } = snarkjs;

export async function proveOwnership(secret: string): Promise<ZKResult> {
  const commitment = await poseidonHash([BigInt(secret)]);

  const input = {
    secret,
    commitment,
  };

  const { proof, publicSignals } = await groth16.fullProve(
    input,
    "build_ow/ownership_js/ownership.wasm",
    "build_ow/ownership.zkey"
  );

  const vk = JSON.parse(
    fs.readFileSync("build_ow/ownership_vk.json", "utf8")
  );

  const verified = await groth16.verify(vk, publicSignals, proof);

  return { verified, publicSignals, proof };
}
