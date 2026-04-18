import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Authenticated user context attached to the request.
 */
export interface AuthUser {
  id: string;
  role: "admin" | "user";
  authMethod: "api-key" | "jwt";
}

// Extend Express Request to carry auth context
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Returns the JWT secret from environment, throwing if not configured.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "change-me") {
    throw new Error(
      "JWT_SECRET is not configured. Set a strong secret in your .env file.",
    );
  }
  return secret;
}

/**
 * Returns the set of valid API keys from the API_KEYS env var.
 */
function getValidApiKeys(): Set<string> {
  const raw = process.env.API_KEYS ?? "";
  return new Set(
    raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  );
}

/**
 * Validates an API key against the configured key list.
 *
 * Timing-safe by construction: we SHA-256 both the input and every valid
 * key before comparison, so every `timingSafeEqual` call runs on equal
 * 32-byte buffers. This removes the length side-channel that a naive
 * `inputBuf.length === validBuf.length` early-return leaks, and the
 * accumulator avoids a short-circuit on the first match (each candidate
 * costs the same wall time regardless of where the match lives).
 */
function validateApiKey(key: string): boolean {
  const validKeys = getValidApiKeys();
  if (validKeys.size === 0) return false;

  const inputDigest = createHash("sha256").update(key).digest();
  let matched = false;
  for (const validKey of validKeys) {
    const validDigest = createHash("sha256").update(validKey).digest();
    if (timingSafeEqual(inputDigest, validDigest)) {
      matched = true;
    }
  }
  return matched;
}

/**
 * Verifies a JWT token and returns the decoded payload.
 *
 * `algorithms: ["HS256"]` is pinned explicitly to defuse the alg-confusion
 * family of attacks: without it, a token with `alg: "none"` (unsigned) or
 * `alg: "RS256"` (where an attacker could get the server to treat the HMAC
 * secret as an RSA public key) could pass verification. We sign with HS256
 * in `generateToken`; we accept only HS256 here.
 */
function verifyJwt(token: string): AuthUser {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"],
  }) as jwt.JwtPayload;

  return {
    id: decoded.sub ?? "unknown",
    role: decoded.role === "admin" ? "admin" : "user",
    authMethod: "jwt",
  };
}

/**
 * Express middleware that authenticates requests via API key or JWT.
 *
 * Supported schemes:
 * - `x-api-key` header with a valid API key
 * - `Authorization: Bearer <jwt>` header with a valid JWT
 *
 * On success, populates `req.user` with the authenticated user context.
 * On failure, responds with 401 Unauthorized.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // --- API Key authentication ---
  const apiKey = req.headers["x-api-key"];
  if (typeof apiKey === "string" && apiKey.length > 0) {
    if (validateApiKey(apiKey)) {
      req.user = {
        id: `apikey:${apiKey.slice(0, 4)}****`,
        role: "user",
        authMethod: "api-key",
      };
      next();
      return;
    }
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  // --- JWT Bearer token authentication ---
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token.length === 0) {
      res.status(401).json({ error: "Bearer token is empty" });
      return;
    }

    try {
      req.user = verifyJwt(token);
      next();
      return;
    } catch (err) {
      const message =
        err instanceof jwt.TokenExpiredError
          ? "Token has expired"
          : err instanceof jwt.JsonWebTokenError
            ? "Invalid token"
            : "Authentication failed";
      res.status(401).json({ error: message });
      return;
    }
  }

  // --- No credentials provided ---
  res.status(401).json({
    error: "Authentication required",
    hint: "Provide an x-api-key header or Authorization: Bearer <token>",
  });
}

/**
 * Generates a signed JWT for the given user.
 *
 * @param userId  - Unique user identifier (stored as `sub` claim)
 * @param role    - User role, defaults to "user"
 * @param expiresIn - Token expiry (default "24h")
 * @returns Signed JWT string
 */
export function generateToken(
  userId: string,
  role: "admin" | "user" = "user",
  expiresIn: StringValue | number = "24h",
): string {
  const secret = getJwtSecret();
  // Pin HS256 on signing too, so issued tokens match exactly what
  // `verifyJwt` will accept.
  return jwt.sign({ sub: userId, role }, secret, {
    expiresIn,
    algorithm: "HS256",
  });
}
