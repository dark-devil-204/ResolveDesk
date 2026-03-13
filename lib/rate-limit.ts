import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

type RateProfile = "write" | "auth" | "auth-sensitive" | "public-intake";

type RateResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, MemoryBucket>();

const hasUpstashConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasUpstashConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const ratelimits = redis
  ? {
      write: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(120, "1 m"),
        prefix: "rl:write",
      }),
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(40, "10 m"),
        prefix: "rl:auth",
      }),
      "auth-sensitive": new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(12, "10 m"),
        prefix: "rl:auth-sensitive",
      }),
      "public-intake": new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(8, "10 m"),
        prefix: "rl:public-intake",
      }),
    }
  : null;

const localPolicy: Record<RateProfile, { max: number; windowMs: number }> = {
  write: { max: 120, windowMs: 60_000 },
  auth: { max: 40, windowMs: 10 * 60_000 },
  "auth-sensitive": { max: 12, windowMs: 10 * 60_000 },
  "public-intake": { max: 8, windowMs: 10 * 60_000 },
};

function localLimit(profile: RateProfile, key: string): RateResult {
  const policy = localPolicy[profile];
  const now = Date.now();
  const storeKey = `${profile}:${key}`;
  const existing = memoryStore.get(storeKey);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(storeKey, {
      count: 1,
      resetAt: now + policy.windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(policy.windowMs / 1000),
    };
  }

  if (existing.count >= policy.max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      ),
    };
  }

  existing.count += 1;
  memoryStore.set(storeKey, existing);

  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function getClientRateKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") ?? "ua:unknown";
  return `${ip ?? "ip:unknown"}:${userAgent.slice(0, 64)}`;
}

export async function limitRequest(
  profile: RateProfile,
  key: string,
): Promise<RateResult> {
  if (!ratelimits) {
    return localLimit(profile, key);
  }

  try {
    const result = await ratelimits[profile].limit(key);

    return {
      allowed: result.success,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      ),
    };
  } catch {
    return localLimit(profile, key);
  }
}
