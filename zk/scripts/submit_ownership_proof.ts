import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { aptos, MODULE_ADDRESS } from "./movement";
import { proveOwnership } from "../handler";
import * as crypto from "crypto";

async function main() {
  const privateKeyHex = process.env.PRIVATE_KEY;
  if (!privateKeyHex) {
    throw new Error("PRIVATE_KEY not set");
  }

  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  const account = Account.fromPrivateKey({ privateKey });

  console.log("Using address:", account.accountAddress.toString());

  // Step 0: Check if commitment exists
  let commitmentExists = false;
  try {
    console.log("Checking for existing commitment...");
    await aptos.getAccountResource({
      accountAddress: account.accountAddress,
      resourceType: `${MODULE_ADDRESS}::zk_verifier::Commitment`,
    });
    console.log("Commitment already exists");
    commitmentExists = true;
  } catch (error) {
    console.log("No commitment found");
  }

  if (!commitmentExists) {
    console.log("Creating commitment...");
    const commitmentHash = Array.from(crypto.randomBytes(32));
    
    const commitTx = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::zk_verifier::commit_position`,
        functionArguments: [commitmentHash],
      },
    });

    const commitPending = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: commitTx,
    });

    console.log("Tx hash:", commitPending.hash);
    await aptos.waitForTransaction({ transactionHash: commitPending.hash });
    console.log("Commitment created ✅");
  }

  // ZK proof
  console.log("\nGenerating ZK proof...");
  const secret = "123456789";
  const zkResult = await proveOwnership(secret);

  if (!zkResult.verified) {
    throw new Error("ZK proof verification failed");
  }
  console.log("ZK proof verified ✅");

  // On-chain verification
  console.log("\nSubmitting on-chain verification...");
  const tx = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::zk_verifier::verify_proof`,
      functionArguments: [
        account.accountAddress.toString(),
        true,
      ],
    },
  });

  const pending = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction: tx,
  });

  console.log("Tx hash:", pending.hash);
  const result = await aptos.waitForTransaction({ transactionHash: pending.hash });
  
  console.log("\nResult:", result.success ? "SUCCESS ✅" : "FAILED ❌");
}

main().catch(console.error);