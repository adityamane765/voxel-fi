import express from "express";
import cors from "cors";
import { positionRouter } from "./routes/position.js";
import { liquidityRouter } from "./routes/liquidity.js";
import { zkRouter } from "./routes/zk.js";

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/position", positionRouter);
  app.use("/liquidity", liquidityRouter);
  app.use("/zk", zkRouter);

  return app;
}
