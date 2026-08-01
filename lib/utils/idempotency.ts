import { NextRequest } from "next/server";

// In-memory fallback cache for idempotency keys (cleared periodically or backed by Redis if available)
const inMemoryIdempotencyCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function getIdempotencyKey(req: NextRequest | Request): string | null {
  return req.headers.get("x-idempotency-key") || req.headers.get("idempotency-key") || null;
}

export function checkIdempotency(key: string): { hit: boolean; response?: any } {
  // Purge expired keys
  const now = Date.now();
  for (const [k, value] of inMemoryIdempotencyCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      inMemoryIdempotencyCache.delete(k);
    }
  }

  const cached = inMemoryIdempotencyCache.get(key);
  if (cached && now - cached.timestamp <= CACHE_TTL_MS) {
    return { hit: true, response: cached.response };
  }

  return { hit: false };
}

export function storeIdempotency(key: string, responseData: any): void {
  if (!key) return;
  inMemoryIdempotencyCache.set(key, {
    response: responseData,
    timestamp: Date.now(),
  });
}
