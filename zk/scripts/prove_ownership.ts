import { groth16 } from "snarkjs";
import fs from "fs";

async function main() {
  const input = {
    secret: "123456789",
    commitment: "123456789" // Poseidon(secret)
  };

  const { proof, publicSignals } =
    await groth16.fullProve(
      input,
      "build/ownership.wasm",
      "build/ownership.zkey"
    );

  fs.writeFileSync("proof.json", JSON.stringify(proof));
  fs.writeFileSync("public.json", JSON.stringify(publicSignals));
}

main();
