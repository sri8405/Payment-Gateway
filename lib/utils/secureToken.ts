import crypto from 'crypto';

const getSecret = () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Secret key is missing. Set RAZORPAY_WEBHOOK_SECRET or NEXTAUTH_SECRET environment variable.");
  }
  return secret;
};

export function generateSecureToken(donationId: string, expiresInMinutes: number = 15): string {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = `${donationId}.${expiresAt}`;
  const hmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

export function verifySecureToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [donationId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    
    if (Date.now() > expiresAt) {
      return null;
    }
    
    const payload = `${donationId}.${expiresAtStr}`;
    const expectedHmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
    
    // Use timingSafeEqual to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(expectedHmac, "hex"), Buffer.from(signature, "hex"))) {
      return null;
    }
    
    return donationId;
  } catch (_error) {
    return null;
  }
}
