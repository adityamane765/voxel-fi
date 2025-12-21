import { Router, Request, Response } from "express";
import { liquidityAtPrice } from "../aptos/views.js";
import { aptos } from "../aptos/client.js";

export const liquidityRouter = Router();

liquidityRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { owner, positionId, price } = req.query;

    // Validate query parameters exist and are strings
    if (
      typeof owner !== "string" ||
      typeof positionId !== "string" ||
      typeof price !== "string"
    ) {
      return res.status(400).json({
        error: "Missing or invalid owner, positionId, or price parameters",
      });
    }

    // Validate numeric conversions
    const positionIdNum = Number(positionId);
    const priceNum = Number(price);

    if (isNaN(positionIdNum) || isNaN(priceNum)) {
      return res.status(400).json({
        error: "positionId and price must be valid numbers",
      });
    }

    // liquidityAtPrice returns a number directly, not an array
    const liquidity = await liquidityAtPrice(
      aptos,
      owner,
      positionIdNum,
      priceNum
    );

    res.json({ liquidity });
  } catch (err) {
    console.error("Liquidity fetch error:", err);
    res.status(500).json({
      error: "Failed to fetch liquidity",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});