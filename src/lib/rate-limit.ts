/**
 * Rate Limiting Utilities
 * 
 * Problem: Need rate limiting for character figure generation to prevent abuse
 * Solution: Implement simple in-memory rate limiting with Redis fallback option
 * 
 * Features:
 * - Per-user rate limiting
 * - Different limits for different user tiers
 * - Sliding window approach
 * - Memory-based storage (can be extended to Redis)
 */

import type { RateLimitInfo } from '@/types/character-figure';

/**
 * Rate limit configurations for different user tiers and endpoints
 */
export const RATE_LIMITS = {
  CHARACTER_GENERATION: {
    FREE_USER_HOURLY: 5,
    FREE_USER_DAILY: 20,
    PRO_USER_HOURLY: 25,
    PRO_USER_DAILY: 100,
    PREMIUM_USER_HOURLY: 50,
    PREMIUM_USER_DAILY: 200
  },
  GALLERY_ACTIONS: {
    HOURLY: 100, // Likes, bookmarks, etc.
    DAILY: 500
  },
  API_REQUESTS: {
    HOURLY: 200, // General API requests
    DAILY: 1000
  }
};

/**
 * In-memory rate limit store
 * In production, this should be replaced with Redis or similar
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number; requests: number[] }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): { count: number; resetTime: number; requests: number[] } | null {
    return this.store.get(key) || null;
  }

  set(key: string, value: { count: number; resetTime: number; requests: number[] }) {
    this.store.set(key, value);
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

const rateLimitStore = new RateLimitStore();

/**
 * User tier determination
 */
export type UserTier = 'free' | 'pro' | 'premium';

export function getUserTier(userCredits?: any): UserTier {
  // Simple tier determination logic
  // In production, this should check subscription status
  if (!userCredits) return 'free';
  
  if (userCredits.is_recharged) {
    return userCredits.left_credits > 100 ? 'premium' : 'pro';
  }
  
  return 'free';
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimit {
  private windowSizeMs: number;
  private maxRequests: number;

  constructor(windowSizeMs: number, maxRequests: number) {
    this.windowSizeMs = windowSizeMs;
    this.maxRequests = maxRequests;
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - this.windowSizeMs;
    
    let entry = rateLimitStore.get(key);
    
    if (!entry) {
      entry = { count: 0, resetTime: now + this.windowSizeMs, requests: [] };
    }

    // Filter out requests outside the current window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    
    const currentCount = entry.requests.length;
    const allowed = currentCount < this.maxRequests;
    
    if (allowed) {
      entry.requests.push(now);
      entry.count = entry.requests.length;
      entry.resetTime = Math.max(entry.resetTime, now + this.windowSizeMs);
    }

    rateLimitStore.set(key, entry);

    return {
      allowed,
      remaining: Math.max(0, this.maxRequests - entry.requests.length),
      resetTime: entry.resetTime
    };
  }
}

/**
 * Rate limit presets for different endpoints
 */
export const rateLimiters = {
  characterGeneration: {
    free: new SlidingWindowRateLimit(60 * 60 * 1000, RATE_LIMITS.CHARACTER_GENERATION.FREE_USER_HOURLY), // 1 hour
    pro: new SlidingWindowRateLimit(60 * 60 * 1000, RATE_LIMITS.CHARACTER_GENERATION.PRO_USER_HOURLY),
    premium: new SlidingWindowRateLimit(60 * 60 * 1000, RATE_LIMITS.CHARACTER_GENERATION.PREMIUM_USER_HOURLY)
  },
  galleryActions: new SlidingWindowRateLimit(60 * 60 * 1000, RATE_LIMITS.GALLERY_ACTIONS.HOURLY),
  apiRequests: new SlidingWindowRateLimit(60 * 60 * 1000, RATE_LIMITS.API_REQUESTS.HOURLY)
};

/**
 * Check rate limit for character generation
 */
export async function checkCharacterGenerationRateLimit(
  userUuid: string,
  userTier: UserTier
): Promise<RateLimitInfo & { allowed: boolean }> {
  const limiter = rateLimiters.characterGeneration[userTier];
  const result = await limiter.checkLimit(`char_gen:${userUuid}`);
  
  const hourlyLimit = RATE_LIMITS.CHARACTER_GENERATION[`${userTier.toUpperCase()}_USER_HOURLY` as keyof typeof RATE_LIMITS.CHARACTER_GENERATION];
  const dailyLimit = RATE_LIMITS.CHARACTER_GENERATION[`${userTier.toUpperCase()}_USER_DAILY` as keyof typeof RATE_LIMITS.CHARACTER_GENERATION];

  return {
    allowed: result.allowed,
    remaining_requests: result.remaining,
    reset_at: new Date(result.resetTime).toISOString(),
    limit_per_hour: hourlyLimit,
    limit_per_day: dailyLimit
  };
}

/**
 * Check rate limit for gallery actions
 */
export async function checkGalleryActionRateLimit(
  userUuid: string
): Promise<RateLimitInfo & { allowed: boolean }> {
  const result = await rateLimiters.galleryActions.checkLimit(`gallery_action:${userUuid}`);
  
  return {
    allowed: result.allowed,
    remaining_requests: result.remaining,
    reset_at: new Date(result.resetTime).toISOString(),
    limit_per_hour: RATE_LIMITS.GALLERY_ACTIONS.HOURLY,
    limit_per_day: RATE_LIMITS.GALLERY_ACTIONS.DAILY
  };
}

/**
 * Check general API rate limit
 */
export async function checkApiRateLimit(
  userUuid: string
): Promise<RateLimitInfo & { allowed: boolean }> {
  const result = await rateLimiters.apiRequests.checkLimit(`api:${userUuid}`);
  
  return {
    allowed: result.allowed,
    remaining_requests: result.remaining,
    reset_at: new Date(result.resetTime).toISOString(),
    limit_per_hour: RATE_LIMITS.API_REQUESTS.HOURLY,
    limit_per_day: RATE_LIMITS.API_REQUESTS.DAILY
  };
}

/**
 * Helper function to extract client IP from request
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || cfIP || 'unknown';
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit<T extends any[]>(
  rateLimitFn: (userUuid: string, ...args: T) => Promise<RateLimitInfo & { allowed: boolean }>,
  errorMessage: string = 'Rate limit exceeded'
) {
  return async (userUuid: string, ...args: T) => {
    const rateLimitResult = await rateLimitFn(userUuid, ...args);
    
    if (!rateLimitResult.allowed) {
      throw new Error(`${errorMessage}. Try again at ${rateLimitResult.reset_at}`);
    }
    
    return rateLimitResult;
  };
}

/**
 * Cleanup rate limit store (useful for tests)
 */
export function clearRateLimitStore() {
  rateLimitStore.clear();
}