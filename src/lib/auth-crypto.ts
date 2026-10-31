import crypto from "crypto";

const DEFAULT_SECRET = process.env.BETTER_AUTH_SECRET || "camp-budget-tracker-better-auth-secret-key-2026";

/**
 * Hash a plain text password using Node.js scrypt with a unique random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a plain text password against a stored salt:hash string
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash) return false;
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(hash, "hex"));
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

/**
 * Cryptographically sign a string payload with HMAC-SHA256
 */
export function signPayload(data: string, secret: string = DEFAULT_SECRET): string {
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${hmac}.${Buffer.from(data, "utf8").toString("base64url")}`;
}

/**
 * Verify an HMAC-SHA256 signed payload and return original string if authentic
 */
export function verifySignedPayload(signedValue?: string | null, secret: string = DEFAULT_SECRET): string | null {
  if (!signedValue || !signedValue.includes(".")) return null;
  try {
    const [signature, base64UrlData] = signedValue.split(".");
    if (!signature || !base64UrlData) return null;
    const rawData = Buffer.from(base64UrlData, "base64url").toString("utf8");
    const expectedSignature = crypto.createHmac("sha256", secret).update(rawData).digest("hex");

    if (
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return rawData;
    }
    return null;
  } catch {
    return null;
  }
}
