/**
 * Next.js Enhanced Middleware Configuration
 * 
 * Features:
 * 1. Internationalization (i18n) routing
 * 2. User attribution tracking
 * 3. Cookie-based visitor identification
 * 
 * How it works:
 * - Combines next-intl middleware with custom attribution tracking
 * - Tracks user source, device, and journey through the site
 * - Maintains both first-touch and last-touch attribution
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing);

// Constants
const ATTRIBUTION_COOKIE_NAME = 'user_attribution';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// Known referrer sources mapping
const REFERRER_SOURCES: Record<string, { source: string; medium: string }> = {
  'google.com': { source: 'google', medium: 'organic' },
  'bing.com': { source: 'bing', medium: 'organic' },
  'baidu.com': { source: 'baidu', medium: 'organic' },
  'facebook.com': { source: 'facebook', medium: 'social' },
  'twitter.com': { source: 'twitter', medium: 'social' },
  'x.com': { source: 'twitter', medium: 'social' },
  'linkedin.com': { source: 'linkedin', medium: 'social' },
  'instagram.com': { source: 'instagram', medium: 'social' },
  'youtube.com': { source: 'youtube', medium: 'social' },
  'reddit.com': { source: 'reddit', medium: 'social' },
  'github.com': { source: 'github', medium: 'referral' },
  'producthunt.com': { source: 'producthunt', medium: 'referral' },
};

/**
 * Parse UTM parameters from URL
 */
function parseUTMParams(url: URL) {
  const params = url.searchParams;
  
  return {
    source: params.get('utm_source') || params.get('ref') || params.get('f') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
    landing: url.pathname,
  };
}

/**
 * Parse referrer to identify source
 */
function parseReferrer(referrer: string | null): { source?: string; medium?: string } {
  if (!referrer) return { source: 'direct', medium: 'none' };
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    // Check known sources
    for (const [domain, info] of Object.entries(REFERRER_SOURCES)) {
      if (hostname.includes(domain)) {
        return info;
      }
    }
    
    // Default to referral
    return {
      source: hostname.replace('www.', ''),
      medium: 'referral'
    };
  } catch {
    return { source: 'unknown', medium: 'unknown' };
  }
}

/**
 * Generate unique IDs
 */
function generateVisitorId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Attribution tracking middleware
 */
async function attributionMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  const url = new URL(request.url);
  
  // Skip attribution for API routes and static files
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('.')
  ) {
    return response;
  }
  
  // Get existing attribution cookie
  const existingCookie = request.cookies.get(ATTRIBUTION_COOKIE_NAME);
  let attribution;
  
  try {
    attribution = existingCookie ? JSON.parse(existingCookie.value) : null;
  } catch {
    attribution = null;
  }
  
  // Parse current visit data
  const utmData = parseUTMParams(url);
  const referrer = request.headers.get('referer');
  const referrerData = !utmData.source ? parseReferrer(referrer) : {};
  
  const currentAttribution = {
    ...utmData,
    ...referrerData,
    referrer,
    timestamp: Date.now(),
  };
  
  // Initialize or update attribution
  if (!attribution) {
    // First visit - create new attribution
    attribution = {
      first: currentAttribution,
      last: currentAttribution,
      visitor: {
        id: generateVisitorId(),
        sessionId: generateSessionId(),
        visitCount: 1,
      },
    };
  } else {
    // Returning visitor - update last-touch attribution
    attribution.last = currentAttribution;
    attribution.visitor.visitCount++;
    
    // Update session if more than 30 minutes since last visit
    const lastTimestamp = attribution.last.timestamp || 0;
    const thirtyMinutes = 30 * 60 * 1000;
    if (Date.now() - lastTimestamp > thirtyMinutes) {
      attribution.visitor.sessionId = generateSessionId();
    }
  }
  
  // Set the attribution cookie
  response.cookies.set(ATTRIBUTION_COOKIE_NAME, JSON.stringify(attribution), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  
  // Add visitor ID to response headers for client-side access
  response.headers.set('X-Visitor-Id', attribution.visitor.id);
  response.headers.set('X-Session-Id', attribution.visitor.sessionId);
  
  return response;
}

/**
 * Main middleware function
 * Combines i18n and attribution tracking
 */
export default async function middleware(request: NextRequest) {
  // First, run the attribution middleware
  const attributionResponse = await attributionMiddleware(request);
  
  // Then run the i18n middleware
  const intlResponse = intlMiddleware(request);
  
  // Merge cookies from both responses
  if (attributionResponse.cookies.getAll().length > 0) {
    attributionResponse.cookies.getAll().forEach(cookie => {
      intlResponse.cookies.set(cookie);
    });
  }
  
  // Merge headers
  attributionResponse.headers.forEach((value, key) => {
    if (key.startsWith('X-')) {
      intlResponse.headers.set(key, value);
    }
  });
  
  return intlResponse;
}

/**
 * Middleware configuration
 * Defines which paths should be processed
 */
export const config = {
  matcher: [
    // Root path
    "/",
    // All supported language paths
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    // Exclude specific paths:
    // - Legal pages
    // - API routes
    // - Next.js internals
    // - Static files
    "/((?!privacy-policy|terms-of-service|api/|_next|_vercel|.*\\..*).*)",
  ],
};