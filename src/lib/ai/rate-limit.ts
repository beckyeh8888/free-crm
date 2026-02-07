/**
 * AI Rate Limiting
 *
 * Prevents excessive AI API usage per user/organization.
 *
 * ISO 27001 A.12.1.3 (Capacity Management)
 */

import { AIRateLimitError } from './errors';

// ============================================
// In-Memory Rate Limiter (no external deps)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

function checkLimit(key: string, maxRequests: number, windowMs: number): boolean {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================
// Rate Limit Functions
// ============================================

const ONE_MINUTE = 60 * 1000;

/**
 * Rate limit for AI chat: 30 requests/minute per user
 */
export async function checkAIChatRateLimit(userId: string): Promise<void> {
  const allowed = checkLimit(`ai:chat:${userId}`, 30, ONE_MINUTE);
  if (!allowed) throw new AIRateLimitError();
}

/**
 * Rate limit for email draft: 10 requests/minute per user
 */
export async function checkAIEmailDraftRateLimit(userId: string): Promise<void> {
  const allowed = checkLimit(`ai:email:${userId}`, 10, ONE_MINUTE);
  if (!allowed) throw new AIRateLimitError();
}

/**
 * Rate limit for insights: 5 requests/minute per organization
 */
export async function checkAIInsightsRateLimit(organizationId: string): Promise<void> {
  const allowed = checkLimit(`ai:insights:${organizationId}`, 5, ONE_MINUTE);
  if (!allowed) throw new AIRateLimitError();
}

/**
 * Rate limit for settings test connection: 5 requests/minute per organization
 */
export async function checkAISettingsTestRateLimit(organizationId: string): Promise<void> {
  const allowed = checkLimit(`ai:test:${organizationId}`, 5, ONE_MINUTE);
  if (!allowed) throw new AIRateLimitError();
}
