import * as snarkjs from "snarkjs";
import fs from "fs";

const { groth16 } = snarkjs;

async function main() {
  const input = {
    secret: "123456789",
    commitment: "YOUR_POSEIDON_HASH"
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

  console.log("Verified:", verified);
}

main();
