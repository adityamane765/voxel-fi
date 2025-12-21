import express from "express";
import bodyParser from "body-parser";

import { liquidityRouter } from "../routes/liquidity.js";
import { positionRouter } from "../routes/position.js";
import { zkRouter } from "../routes/zk.js";

export function createTestApp() {
  const app = express();
  app.use(bodyParser.json());

  app.use("/liquidity", liquidityRouter);
  app.use("/position", positionRouter);
  app.use("/zk", zkRouter);

  return app;
}
