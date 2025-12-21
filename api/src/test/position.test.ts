import { describe, it, expect } from "vitest";
import supertest from "supertest";
import { createServer } from "../server";

const app = createServer();
const request = supertest(app);

describe("Position API", () => {
  it("fetches a position", async () => {
    const res = await request.get("/position").query({
      owner: "0x4e2e65c099323ccc865047636f9b418554ef9e5443db68571910b3f9567cb3c0",
      positionId: 1,
    });

    expect(res.status).toBe(200);
  });
});
