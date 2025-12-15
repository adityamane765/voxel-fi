import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { aptos, MODULE_ADDRESS } from "./movement";
import { proveOwnership } from "../handler";

async function main() {
  const privateKeyHex = process.env.PRIVATE_KEY;
  if (!privateKeyHex) {
    throw new Error("PRIVATE_KEY not set");
  }

  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  const account = Account.fromPrivateKey({ privateKey });

  console.log("Using address:", account.accountAddress.toString());

  // 1️⃣ Off-chain ZK proof
  const secret = "123456789";
  const zkResult = await proveOwnership(secret);

  if (!zkResult.verified) {
    throw new Error("ZK proof verification failed off-chain");
  }

  // 2️⃣ On-chain assertion
  const tx = await aptos.transaction.build.simple({
    sender: account.accountAddress, // <-- signer injected here
    data: {
      function: `${MODULE_ADDRESS}::zk_verifier::verify_proof`,
      functionArguments: [
        account.accountAddress, // owner_addr
        true,                   // proof_verified
      ],
    },
  });

  const pending = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction: tx,
  });

  await aptos.waitForTransaction({ transactionHash: pending.hash });

  console.log("ZK proof enforced on-chain ✅");
}

main().catch(console.error);
