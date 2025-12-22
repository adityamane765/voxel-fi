import * as snarkjs from "snarkjs";
import * as path from "path";
import { fileURLToPath } from "url";
import { buildPoseidon } from "circomlibjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ZkProof = {
  proof: any;
  publicSignals: any;
};

export async function generateProof(input: {
  secret: string | number;
}): Promise<ZkProof> {
  const wasmPath = path.join(__dirname, "ownership.wasm");
  const zkeyPath = path.join(__dirname, "ownership.zkey");

  let secretBigInt: bigint;
  if (typeof input.secret === "string") {
    secretBigInt = BigInt(
      "0x" + Buffer.from(input.secret)
        .toString("hex")
        .slice(0, 20)
    );
  } else {
    secretBigInt = BigInt(input.secret);
  }

  // Calculate the Poseidon hash commitment
  const poseidon = await buildPoseidon();
  const commitment = poseidon.F.toString(poseidon([secretBigInt]));

  const witness = {
    secret: secretBigInt.toString(),
    commitment: commitment,
  };

  console.log("Witness:", witness);

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    witness,
    wasmPath,
    zkeyPath
  );

  return { proof, publicSignals };
}