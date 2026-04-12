import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { timingSafeEqual } from "node:crypto";

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
 * Uses constant-time comparison to mitigate timing attacks.
 */
function validateApiKey(key: string): boolean {
  const validKeys = getValidApiKeys();
  if (validKeys.size === 0) return false;

  const inputBuf = Buffer.from(key);
  for (const validKey of validKeys) {
    const validBuf = Buffer.from(validKey);
    if (
      inputBuf.length === validBuf.length &&
      timingSafeEqual(inputBuf, validBuf)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Verifies a JWT token and returns the decoded payload.
 */
function verifyJwt(token: string): AuthUser {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

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
  return jwt.sign({ sub: userId, role }, secret, { expiresIn });
}
