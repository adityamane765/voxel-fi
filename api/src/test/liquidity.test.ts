import { describe, it, expect } from "vitest";
import supertest from "supertest";
import { createServer } from "../server";

const app = createServer();
const request = supertest(app);

describe("Liquidity API", () => {
  it("returns liquidity at price", async () => {
    const res = await request.get("/liquidity").query({
      owner: "0x4e2e65c099323ccc865047636f9b418554ef9e5443db68571910b3f9567cb3c0",
      positionId: 1,
      price: 1000,
    });

    expect(res.body.liquidity).toBeDefined();
    expect(Number(res.body.liquidity)).toBeGreaterThan(0);
  });
});
