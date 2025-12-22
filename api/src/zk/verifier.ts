import * as snarkjs from "snarkjs";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VK_PATH = path.join(__dirname, "ownership_vk.json");

export async function verifyProof(
  proof: any,
  publicSignals: any
): Promise<boolean> {
  const vKey = JSON.parse(
    fs.readFileSync(VK_PATH, "utf-8")
  );

  return snarkjs.groth16.verify(
    vKey,
    publicSignals,
    proof
  );
}
