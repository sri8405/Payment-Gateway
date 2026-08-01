import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse, type NextRequest } from "next/server";

type RateLimitName = "donations:create" | "payments:create-order" | "payments:verify" | "admin:login" | "payments:webhook" | "donations:search-receipts";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

const limiters: Record<RateLimitName, Ratelimit | null> = {
  "donations:create": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "ratelimit:donations:create",
      })
    : null,
  "payments:create-order": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "ratelimit:payments:create-order",
      })
    : null,
  "payments:verify": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "ratelimit:payments:verify",
      })
    : null,
  "admin:login": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "5 m"),
        prefix: "ratelimit:admin:login",
      })
    : null,
  "payments:webhook": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        prefix: "ratelimit:payments:webhook",
      })
    : null,
  "donations:search-receipts": redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "ratelimit:donations:search-receipts",
      })
    : null,
};

function getClientIp(req: NextRequest | Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function enforceRateLimit(req: NextRequest | Request, name: RateLimitName) {
  const limiter = limiters[name];

  if (!limiter) {
    console.warn(`[RateLimit Warning] Limiter '${name}' unconfigured due to missing Redis environment variables.`);
    return null;
  }

  const result = await limiter.limit(`${name}:${getClientIp(req)}`);
  if (result.success) {
    return null;
  }

  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
      },
    }
  );
}
