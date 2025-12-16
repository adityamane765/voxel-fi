import { Router } from "express";
import { getPosition } from "../aptos/views.js";
import { aptos } from "../aptos/client.js";

export const positionRouter = Router();

positionRouter.get("/", async (req, res) => {
  try {
    const { owner, positionId } = req.query;

    if (!owner || positionId === undefined) {
      return res.status(400).json({
        error: "Missing owner or positionId",
      });
    }

    const result = await getPosition(
      aptos,
      owner as string,
      Number(positionId)
    );

    res.json({
      id: result[0],
      owner: result[1],
      liquidity: result[2],
      priceCenter: result[3],
      spread: result[4],
      fractalType: result[5],
      depth: result[6],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch position" });
  }
});
