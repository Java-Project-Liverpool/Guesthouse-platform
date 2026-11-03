import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

export class GoogleAuthNotConfiguredError extends Error {
  constructor() {
    super("Google authentication is not configured.");
    this.name = "GoogleAuthNotConfiguredError";
  }
}

export class InvalidGoogleIdentityError extends Error {
  constructor() {
    super("Google sign-in could not be verified.");
    this.name = "InvalidGoogleIdentityError";
  }
}

export interface VerifiedGoogleIdentity {
  sub: string;
  email: string;
  name?: string;
}

export async function verifyGoogleIdentity(idToken: string): Promise<VerifiedGoogleIdentity> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new GoogleAuthNotConfiguredError();

  const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  const issuerIsGoogle = payload?.iss === "accounts.google.com" || payload?.iss === "https://accounts.google.com";
  const tokenIsCurrent = typeof payload?.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);

  if (
    !payload ||
    !issuerIsGoogle ||
    payload.aud !== clientId ||
    !tokenIsCurrent ||
    !payload.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    throw new InvalidGoogleIdentityError();
  }

  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: typeof payload.name === "string" ? payload.name : undefined
  };
}

export function isGoogleVerifierUnavailable(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const response = "response" in error && typeof error.response === "object" && error.response !== null
    ? error.response as { status?: unknown }
    : undefined;
  if (typeof response?.status === "number" && (response.status >= 500 || response.status === 429)) {
    return true;
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  return ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ENOTFOUND"].includes(code);
}
