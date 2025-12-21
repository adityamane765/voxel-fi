import { Router, Request, Response } from "express";
import { generateProof } from "../zk/prover.js";
import { verifyProof } from "../zk/verifier.js";

export const zkRouter = Router();

zkRouter.post("/prove", async (req: Request, res: Response) => {
  try {
    console.log("=== ZK Prove Request ===");
    console.log("Request body:", req.body);
    
    const proof = await generateProof(req.body);
    
    console.log("✓ Proof generated successfully");
    console.log("Proof:", proof);
    
    res.json(proof);
  } catch (e) {
    console.error("=== Proof Generation Error ===");
    console.error("Error:", e);
    console.error("Stack:", e instanceof Error ? e.stack : "No stack");
    console.error("Message:", e instanceof Error ? e.message : String(e));
    
    res.status(500).json({ 
      error: "Proof generation failed",
      details: e instanceof Error ? e.message : String(e)
    });
  }
});

zkRouter.post("/verify", async (req: Request, res: Response) => {
  try {
    console.log("=== ZK Verify Request ===");
    console.log("Request body:", req.body);
    
    const { proof, publicSignals } = req.body;
    
    if (!proof || !publicSignals) {
      console.error("❌ Missing proof or publicSignals");
      return res.status(400).json({ 
        verified: false,
        error: "Missing proof or publicSignals" 
      });
    }
    
    const ok = await verifyProof(proof, publicSignals);
    
    console.log("✓ Verification result:", ok);
    
    res.json({ verified: ok });
  } catch (e) {
    console.error("=== Verification Error ===");
    console.error("Error:", e);
    console.error("Stack:", e instanceof Error ? e.stack : "No stack");
    console.error("Message:", e instanceof Error ? e.message : String(e));
    
    res.status(500).json({ 
      verified: false,
      error: e instanceof Error ? e.message : String(e)
    });
  }
});