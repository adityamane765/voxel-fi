import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { aptos, MODULE_ADDRESS } from "./movement";
import { proveOwnership } from "../handler";
import * as crypto from "crypto";

async function main() {
  const privateKeyHex = process.env.PRIVATE_KEY;
  if (!privateKeyHex) {
    throw new Error("PRIVATE_KEY not set");
  }

  const nftAddress = process.env.NFT_ADDRESS;
  if (!nftAddress) {
    throw new Error("NFT_ADDRESS environment variable not set.");
  }

  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  const account = Account.fromPrivateKey({ privateKey });

  console.log("Using account address:", account.accountAddress.toString());
  console.log("Using NFT address:", nftAddress);

  // Extract position_id from the NFT using a view function
  let positionId: string;
  try {
    const positionIdResult = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::fractal_position::get_position_id_from_nft`,
        functionArguments: [nftAddress],
      },
    });
    positionId = positionIdResult[0] as string;
    console.log(`Extracted Position ID from NFT: ${positionId}`);
  } catch (error) {
    console.error("Error extracting Position ID from NFT:", error);
    throw new Error("Failed to get position ID from NFT.");
  }


  // Step 0: Check if commitment exists
  let commitmentExists = false;
  try {
    console.log("Checking for existing commitment for Position ID:", positionId);
    await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::zk_verifier::get_commitment`,
        functionArguments: [account.accountAddress.toString(), positionId],
      },
    });
    console.log("Commitment already exists");
    commitmentExists = true;
  } catch (error) {
    console.log("No commitment found for Position ID:", positionId);
  }

  if (!commitmentExists) {
    console.log("Creating commitment...");
    const commitmentHash = `0x${crypto.randomBytes(32).toString("hex")}`;

    const commitTx = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::zk_verifier::commit_position`,
        functionArguments: [positionId, commitmentHash],
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
        positionId,
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