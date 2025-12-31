import { aptos, MODULE_ADDRESS } from "./movement";

async function checkStatus() {
  // This is the account that ran the tests
  const ownerAddress = "0x3f63188f87dd105ef83155fdb2a10f5050a70f6dc9ad59ac184054dd23eff5c4";
  const positionIdToCheck = "1";

  console.log(`Checking proof status for Position #${positionIdToCheck} on account ${ownerAddress}...`);

  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::zk_verifier::is_proof_verified`,
        functionArguments: [ownerAddress, positionIdToCheck],
      },
    });

    console.log("\n--------------------------------");
    console.log(`Is proof verified for Position #${positionIdToCheck}? -> `, result[0]);
    console.log("--------------------------------\n");

    if (result[0] === true) {
      console.log("Hypothesis CONFIRMED: A nullifier for position #1 already exists on-chain.");
    } else {
      console.log("Hypothesis REJECTED: No nullifier exists for position #1. The issue lies elsewhere.");
    }

  } catch (error) {
    console.error("Error fetching proof status:", error);
  }
}

checkStatus();
