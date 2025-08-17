/**
 * 用户归因服务
 * 
 * 问题：需要追踪用户来源和转化路径
 * 解决方案：通过UTM参数、Referrer、设备信息实现全面的归因追踪
 * 
 * 本服务处理：
 * - UTM参数解析
 * - Referrer来源分析
 * - User Agent解析
 * - IP地理定位
 * - 归因Cookie管理
 */

import { headers, cookies } from "next/headers";

// 类型定义
export interface AttributionData {
  // UTM参数
  source?: string;      // utm_source 或 ref 参数
  medium?: string;      // utm_medium 媒介
  campaign?: string;    // utm_campaign 活动
  term?: string;        // utm_term 关键词
  content?: string;     // utm_content 内容
  
  // 页面信息
  landing?: string;     // 着陆页URL
  referrer?: string;    // HTTP Referrer
  
  // 设备信息
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  
  // 位置信息（基于IP）
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  timezone?: string;
  
  // 浏览器信息
  language?: string;
  screenResolution?: string;
  viewportSize?: string;
  colorDepth?: number;
  
  // 会话信息
  visitorId?: string;
  sessionId?: string;
  timestamp?: number;
}

export interface AttributionCookie {
  first: AttributionData;  // 首次触点归因
  last: AttributionData;   // 最后触点归因
  visitor: {
    id: string;
    sessionId: string;
    visitCount: number;
  };
}

// 常量定义
const ATTRIBUTION_COOKIE_NAME = 'user_attribution';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30天（秒）

// 已知来源映射
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
  't.co': { source: 'twitter', medium: 'social' },
};

/**
 * 解析URL中的UTM参数
 */
export function parseUTMParams(url: string): Partial<AttributionData> {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    return {
      source: params.get('utm_source') || params.get('ref') || params.get('f') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      term: params.get('utm_term') || undefined,
      content: params.get('utm_content') || undefined,
      landing: urlObj.pathname,
    };
  } catch {
    return {};
  }
}

/**
 * 解析Referrer识别来源
 */
export function parseReferrer(referrer: string): { source?: string; medium?: string } {
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
 * 解析User Agent字符串
 */
export function parseUserAgent(ua: string): Partial<AttributionData> {
  if (!ua) return {};
  
  const result: Partial<AttributionData> = {
    userAgent: ua,
  };
  
  // Device type detection
  if (/iPad|Tablet/i.test(ua)) {
    result.deviceType = 'tablet';
  } else if (/Mobile|Android|iPhone/i.test(ua)) {
    result.deviceType = 'mobile';
  } else {
    result.deviceType = 'desktop';
  }
  
  // OS detection
  if (/Windows NT 10/i.test(ua)) {
    result.os = 'Windows';
    result.osVersion = '10';
  } else if (/Windows NT 11/i.test(ua)) {
    result.os = 'Windows';
    result.osVersion = '11';
  } else if (/Mac OS X (\d+[._]\d+)/i.test(ua)) {
    result.os = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+)/i);
    if (match) result.osVersion = match[1].replace('_', '.');
  } else if (/Android (\d+[._]\d+)/i.test(ua)) {
    result.os = 'Android';
    const match = ua.match(/Android (\d+[._]\d+)/i);
    if (match) result.osVersion = match[1];
  } else if (/iPhone OS (\d+[._]\d+)/i.test(ua)) {
    result.os = 'iOS';
    const match = ua.match(/iPhone OS (\d+[._]\d+)/i);
    if (match) result.osVersion = match[1].replace('_', '.');
  } else if (/Linux/i.test(ua)) {
    result.os = 'Linux';
  }
  
  // Browser detection
  if (/Chrome\/(\d+)/i.test(ua) && !/Edge|OPR/i.test(ua)) {
    result.browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/i);
    if (match) result.browserVersion = match[1];
  } else if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)) {
    result.browser = 'Safari';
    const match = ua.match(/Version\/(\d+)/i);
    if (match) result.browserVersion = match[1];
  } else if (/Firefox\/(\d+)/i.test(ua)) {
    result.browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/i);
    if (match) result.browserVersion = match[1];
  } else if (/Edge\/(\d+)/i.test(ua) || /Edg\/(\d+)/i.test(ua)) {
    result.browser = 'Edge';
    const match = ua.match(/(?:Edge|Edg)\/(\d+)/i);
    if (match) result.browserVersion = match[1];
  }
  
  return result;
}

/**
 * 解析IP获取地理位置（使用免费API）
 * 注意：生产环境建议使用更可靠的服务
 */
export async function parseIPLocation(ip: string): Promise<Partial<AttributionData>> {
  // 跳过本地/私有IP
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      ip,
      country: 'Local',
      countryCode: 'XX',
      city: 'Localhost',
    };
  }
  
  try {
    // 使用ip-api.com免费版（限制每分钟45次请求）
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,timezone`, {
      next: { revalidate: 3600 } // 缓存1小时
    });
    
    if (!response.ok) throw new Error('Failed to fetch IP location');
    
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        ip,
        country: data.country,
        countryCode: data.countryCode,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
      };
    }
  } catch (error) {
    console.error('Failed to parse IP location:', error);
  }
  
  return { ip };
}

/**
 * 生成唯一访客ID
 */
export function generateVisitorId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成会话ID
 */
export function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 从请求中获取归因数据
 */
export async function getAttributionFromRequest(
  request: Request,
  url: string
): Promise<AttributionData> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const referrer = headersList.get('referer') || '';
  const language = headersList.get('accept-language')?.split(',')[0] || '';
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
             headersList.get('x-real-ip') || '';
  
  // 解析UTM参数
  const utmData = parseUTMParams(url);
  
  // 如果没有UTM来源，解析referrer
  let referrerData = {};
  if (!utmData.source && referrer) {
    referrerData = parseReferrer(referrer);
  }
  
  // 解析User Agent
  const deviceData = parseUserAgent(userAgent);
  
  // 解析IP位置（异步）
  const locationData = await parseIPLocation(ip);
  
  return {
    ...utmData,
    ...referrerData,
    ...deviceData,
    ...locationData,
    referrer,
    language,
    timestamp: Date.now(),
  };
}

/**
 * 获取或创建归因Cookie
 */
export async function getOrCreateAttributionCookie(): Promise<AttributionCookie> {
  const cookieStore = await cookies();
  const existingCookie = cookieStore.get(ATTRIBUTION_COOKIE_NAME);
  
  if (existingCookie) {
    try {
      return JSON.parse(existingCookie.value);
    } catch {
      // Cookie无效，创建新的
    }
  }
  
  // 创建新的归因Cookie
  const visitorId = generateVisitorId();
  const sessionId = generateSessionId();
  
  const newCookie: AttributionCookie = {
    first: {},
    last: {},
    visitor: {
      id: visitorId,
      sessionId,
      visitCount: 1,
    },
  };
  
  return newCookie;
}

/**
 * 保存归因Cookie
 */
export async function saveAttributionCookie(data: AttributionCookie) {
  const cookieStore = await cookies();
  
  cookieStore.set(ATTRIBUTION_COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * 更新归因数据
 */
export async function updateAttribution(attributionData: AttributionData) {
  const cookie = await getOrCreateAttributionCookie();
  
  // 如果首次触点归因为空，更新它
  if (!cookie.first.source) {
    cookie.first = { ...attributionData };
  }
  
  // 始终更新最后触点归因
  cookie.last = { ...attributionData };
  
  // 增加访问次数
  cookie.visitor.visitCount++;
  
  // 如需要更新会话（如：30分钟无活动后）
  const lastTimestamp = cookie.last.timestamp || 0;
  const thirtyMinutes = 30 * 60 * 1000;
  if (Date.now() - lastTimestamp > thirtyMinutes) {
    cookie.visitor.sessionId = generateSessionId();
  }
  
  await saveAttributionCookie(cookie);
  
  return cookie;
}

/**
 * 获取用于数据库存储的归因数据
 */
export function getAttributionForStorage(cookie: AttributionCookie): Record<string, any> {
  const first = cookie.first;
  
  return {
    attribution_source: first.source,
    attribution_medium: first.medium,
    attribution_campaign: first.campaign,
    attribution_term: first.term,
    attribution_content: first.content,
    attribution_landing: first.landing,
    first_visit_at: first.timestamp ? new Date(first.timestamp) : new Date(),
    first_referrer: first.referrer,
    first_user_agent: first.userAgent,
    first_ip_address: first.ip,
    first_country: first.country,
    first_region: first.region,
    first_city: first.city,
    first_device_type: first.deviceType,
    first_os: first.os,
    first_browser: first.browser,
    first_language: first.language,
  };
}

/**
 * 获取用于订单存储的归因数据
 */
export function getOrderAttributionForStorage(attributionData: AttributionData): Record<string, any> {
  return {
    order_source: attributionData.source,
    order_medium: attributionData.medium,
    order_campaign: attributionData.campaign,
    order_device_type: attributionData.deviceType,
    order_os: attributionData.os,
    order_browser: attributionData.browser,
    order_user_agent: attributionData.userAgent,
    order_ip_address: attributionData.ip,
    order_country: attributionData.country,
    order_region: attributionData.region,
    order_city: attributionData.city,
    order_page_url: attributionData.landing,
    order_session_id: attributionData.sessionId,
  };
}