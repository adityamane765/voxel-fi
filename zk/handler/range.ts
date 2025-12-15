import { groth16 } from "snarkjs";
import fs from "fs";
import type { ZKResult } from "./types";

export async function proveRange(
  value: string,
  min: string,
  max: string
): Promise<ZKResult> {
  const input = { value, min, max };

  const { proof, publicSignals } = await groth16.fullProve(
    input,
    "zk/build_rp/range_js/range_proof.wasm",
    "zk/build_rp/range/range.zkey"
  );

  const vk = JSON.parse(
    fs.readFileSync("zk/build_rp/range/range_vk.json", "utf8")
  );

  const verified = await groth16.verify(vk, publicSignals, proof);

  return { verified, publicSignals, proof };
}
