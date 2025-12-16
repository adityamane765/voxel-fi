import { Router } from "express";
import { generateProof } from "../zk/prover.js";
import { verifyProof } from "../zk/verifier.js";

export const zkRouter = Router();

/**
 * Generate a ZK proof (off-chain)
 */
zkRouter.post("/prove", async (req, res) => {
  try {
    const { secret, positionId } = req.body;

    if (!secret || typeof positionId !== "number") {
      return res.status(400).json({ error: "Invalid input" });
    }

    const proof = await generateProof(secret, positionId);

    res.json(proof);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate proof" });
  }
});

/**
 * Verify a ZK proof (off-chain + on-chain hook later)
 */
zkRouter.post("/verify", async (req, res) => {
  try {
    const { proof, positionId, owner } = req.body;

    if (!proof || typeof positionId !== "number" || !owner) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const ok = await verifyProof(proof, positionId, owner);

    res.json({ verified: ok });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});
