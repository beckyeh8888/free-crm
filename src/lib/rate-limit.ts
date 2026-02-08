/**
 * In-memory Rate Limiter
 *
 * Simple sliding-window rate limiter for API endpoints.
 * Uses in-memory storage — suitable for single-instance deployments.
 * For distributed deployments, replace with @upstash/ratelimit.
 *
 * ISO 27001 A.12.6.1 - Technical Vulnerability Management (CWE-400)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  readonly limit: number;
  /** Window duration in seconds */
  readonly windowSeconds: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean expired entries (every 60s)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 60_000);
  // Allow Node.js to exit even if interval is running
  if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref();
  }
}

interface RateLimitResult {
  readonly success: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: number;
}

/**
 * Check rate limit for a given key.
 * Returns { success: true } if within limit, { success: false } if exceeded.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // New or expired entry
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  // Within window
  entry.count++;
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ============================================
// Pre-configured Rate Limiters
// ============================================

/** AI endpoints: 20 requests per 60 seconds per user */
export const AI_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowSeconds: 60,
};

/** Auth endpoints: 10 requests per 60 seconds per IP */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowSeconds: 60,
};

/** General API: 100 requests per 60 seconds per user */
export const API_RATE_LIMIT: RateLimitConfig = {
  limit: 100,
  windowSeconds: 60,
};

// ============================================
// Helper: Extract client identifier
// ============================================

/**
 * Get a rate limit key from request (user ID or IP fallback)
 */
export function getRateLimitKey(
  prefix: string,
  userId?: string,
  request?: Request
): string {
  if (userId) return `${prefix}:user:${userId}`;

  // Fallback to IP
  const forwarded = request?.headers?.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  return `${prefix}:ip:${ip}`;
}
