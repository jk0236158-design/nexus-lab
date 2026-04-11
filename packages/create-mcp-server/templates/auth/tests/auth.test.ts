import { describe, it, expect, beforeEach, vi } from "vitest";
import jwt from "jsonwebtoken";

// Set environment before importing modules
const TEST_JWT_SECRET = "test-secret-for-unit-tests";
const TEST_API_KEYS = "test-key-1,test-key-2";

process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.API_KEYS = TEST_API_KEYS;

// Dynamic import to ensure env is set before module loads
const { authMiddleware, generateToken } = await import("../src/auth.js");

// Helper to create mock Express objects
function createMockReq(headers: Record<string, string> = {}) {
  return {
    headers,
    user: undefined,
  } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
    setHeader(key: string, value: string) {
      res.headers[key] = value;
      return res;
    },
  };
  return res;
}

describe("API Key Authentication", () => {
  it("should authenticate with a valid API key", () => {
    const req = createMockReq({ "x-api-key": "test-key-1" });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeDefined();
    expect(req.user.authMethod).toBe("api-key");
  });

  it("should reject an invalid API key", () => {
    const req = createMockReq({ "x-api-key": "invalid-key" });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid API key");
  });

  it("should reject an empty API key", () => {
    const req = createMockReq({ "x-api-key": "" });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    // Empty key falls through to "no credentials" path
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});

describe("JWT Authentication", () => {
  it("should authenticate with a valid JWT", () => {
    const token = jwt.sign({ sub: "user-1", role: "admin" }, TEST_JWT_SECRET, {
      expiresIn: "1h",
    });
    const req = createMockReq({ authorization: `Bearer ${token}` });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe("user-1");
    expect(req.user.role).toBe("admin");
    expect(req.user.authMethod).toBe("jwt");
  });

  it("should reject an expired JWT", () => {
    const token = jwt.sign({ sub: "user-1" }, TEST_JWT_SECRET, {
      expiresIn: "-1s",
    });
    const req = createMockReq({ authorization: `Bearer ${token}` });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Token has expired");
  });

  it("should reject a JWT signed with wrong secret", () => {
    const token = jwt.sign({ sub: "user-1" }, "wrong-secret");
    const req = createMockReq({ authorization: `Bearer ${token}` });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  it("should reject an empty Bearer token", () => {
    const req = createMockReq({ authorization: "Bearer " });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Bearer token is empty");
  });
});

describe("No Credentials", () => {
  it("should return 401 with hint when no auth is provided", () => {
    const req = createMockReq({});
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Authentication required");
    expect(res.body.hint).toBeDefined();
  });
});

describe("generateToken", () => {
  it("should generate a valid JWT with correct claims", () => {
    const token = generateToken("user-42", "admin", "1h");
    const decoded = jwt.verify(token, TEST_JWT_SECRET) as jwt.JwtPayload;

    expect(decoded.sub).toBe("user-42");
    expect(decoded.role).toBe("admin");
    expect(decoded.exp).toBeDefined();
  });

  it("should default to 'user' role", () => {
    const token = generateToken("user-99");
    const decoded = jwt.verify(token, TEST_JWT_SECRET) as jwt.JwtPayload;

    expect(decoded.role).toBe("user");
  });
});
