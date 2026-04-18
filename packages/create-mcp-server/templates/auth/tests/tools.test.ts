import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

process.env.JWT_SECRET = "test-secret-for-tools";
process.env.API_KEYS = "k1";

const { registerTools } = await import("../src/tools.js");
import type { AuthUser } from "../src/auth.js";

async function spawnPair(user: AuthUser) {
  const server = new McpServer(
    { name: "test", version: "0.0.0" },
    { capabilities: { tools: {} } },
  );
  registerTools(server, user);

  const client = new Client(
    { name: "test-client", version: "0.0.0" },
    { capabilities: {} },
  );
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(st), client.connect(ct)]);
  return { server, client };
}

function textOf(result: {
  content: Array<{ type: string; text?: string }>;
}): string {
  const first = result.content[0];
  if (first.type !== "text" || typeof first.text !== "string") {
    throw new Error("Expected text content");
  }
  return first.text;
}

describe("registerTools — per-request user isolation", () => {
  it("binds whoami to the user passed at registration time (no module-level state leak)", async () => {
    const userA: AuthUser = {
      id: "alice",
      role: "user",
      authMethod: "api-key",
    };
    const userB: AuthUser = { id: "bob", role: "admin", authMethod: "jwt" };

    const a = await spawnPair(userA);
    const b = await spawnPair(userB);

    const ra = (await a.client.callTool({ name: "whoami", arguments: {} })) as {
      content: Array<{ type: string; text?: string }>;
    };
    const rb = (await b.client.callTool({ name: "whoami", arguments: {} })) as {
      content: Array<{ type: string; text?: string }>;
    };

    const parsedA = JSON.parse(textOf(ra));
    const parsedB = JSON.parse(textOf(rb));

    expect(parsedA.id).toBe("alice");
    expect(parsedA.role).toBe("user");
    expect(parsedB.id).toBe("bob");
    expect(parsedB.role).toBe("admin");

    await a.client.close();
    await a.server.close();
    await b.client.close();
    await b.server.close();
  });

  it("generate-token is forbidden for non-admin users regardless of other active sessions", async () => {
    // Spawn an admin server first. If tools.ts still used a module-level
    // `currentUser`, registering the second (non-admin) server would leave
    // the admin as the "current" user, and the non-admin's generate-token
    // call would succeed. With per-request closure binding it must NOT.
    const admin = await spawnPair({
      id: "admin-1",
      role: "admin",
      authMethod: "jwt",
    });
    const user = await spawnPair({
      id: "user-1",
      role: "user",
      authMethod: "api-key",
    });

    const result = (await user.client.callTool({
      name: "generate-token",
      arguments: { userId: "victim", role: "admin" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(textOf(result));
    expect(parsed.error).toBe("Forbidden");

    await admin.client.close();
    await admin.server.close();
    await user.client.close();
    await user.server.close();
  });

  it("concurrent calls to whoami on independently-bound servers do not cross-contaminate", async () => {
    // Spin up many pairs at once and fire whoami in parallel — with
    // closure binding each response must match its own user.
    const users: AuthUser[] = Array.from({ length: 8 }, (_, i) => ({
      id: `u-${i}`,
      role: i % 2 === 0 ? "admin" : "user",
      authMethod: "jwt",
    }));

    const pairs = await Promise.all(users.map(spawnPair));

    const responses = await Promise.all(
      pairs.map((p) =>
        p.client.callTool({ name: "whoami", arguments: {} }) as Promise<{
          content: Array<{ type: string; text?: string }>;
        }>,
      ),
    );

    for (let i = 0; i < users.length; i++) {
      const parsed = JSON.parse(textOf(responses[i]));
      expect(parsed.id).toBe(users[i].id);
      expect(parsed.role).toBe(users[i].role);
    }

    for (const p of pairs) {
      await p.client.close();
      await p.server.close();
    }
  });
});
