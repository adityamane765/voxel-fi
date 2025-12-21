import { describe, it, expect } from "vitest";
import supertest from "supertest";
import { createServer } from "../server";

const app = createServer();
const request = supertest(app);

describe("ZK API", () => {
  it("generates and verifies proof", async () => {
    const prove = await request.post("/zk/prove").send({
      secret: "test",
    });

    expect(prove.status).toBe(200);

    const verify = await request.post("/zk/verify").send(prove.body);
    expect(verify.body.verified).toBe(true);
  });
});
