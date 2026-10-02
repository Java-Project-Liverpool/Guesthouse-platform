const MINIMUM_SECRET_BYTES = 32;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < MINIMUM_SECRET_BYTES) {
    throw new Error(`JWT_SECRET must be configured with at least ${MINIMUM_SECRET_BYTES} bytes.`);
  }

  return secret;
}
