import { Router } from "express";
import { liquidityAtPrice } from "../aptos/views.js";
import { aptos } from "../aptos/client.js";

export const liquidityRouter = Router();

liquidityRouter.get("/", async (req, res) => {
  try {
    const { owner, positionId, price } = req.query;

    if (!owner || !positionId || !price) {
      return res.status(400).json({
        error: "Missing owner, positionId, or price",
      });
    }

    const result = await liquidityAtPrice(
      aptos,
      owner as string,
      Number(positionId),
      Number(price)
    );

    res.json({ liquidity: result[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch liquidity" });
  }
});
