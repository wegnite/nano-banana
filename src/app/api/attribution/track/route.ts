/**
 * 访问追踪 API
 * 
 * 问题：需要实时记录用户访问数据到 visitor_logs 表
 * 解决方案：提供一个 API 端点，在页面加载时调用
 * 
 * 功能：
 * - 记录每次页面访问
 * - 保存 UTM 参数
 * - 记录设备信息
 * - 存储到 visitor_logs 表
 */

import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { db } from "@/db";
import { visitorLogs } from "@/db/schema";
import { headers, cookies } from "next/headers";
import {
  getOrCreateAttributionCookie,
  parseUserAgent,
  parseIPLocation,
  parseUTMParams,
  parseReferrer,
} from "@/services/attribution";
import { getUserUuid } from "@/services/user";

export async function POST(request: NextRequest) {
  try {
    // 获取请求数据
    const body = await request.json();
    const { page_url, referrer: clientReferrer } = body;
    
    // 获取用户信息（如果已登录）
    const userUuid = await getUserUuid();
    
    // 获取归因 Cookie
    const attributionCookie = await getOrCreateAttributionCookie();
    
    // 获取请求头信息
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const serverReferrer = headersList.get('referer') || clientReferrer || '';
    const language = headersList.get('accept-language')?.split(',')[0] || '';
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || '';
    
    // 解析 UTM 参数
    const utmData = parseUTMParams(page_url || request.url);
    
    // 解析 Referrer（如果没有 UTM source）
    let referrerData: { source?: string; medium?: string } = {};
    if (!utmData.source && serverReferrer) {
      referrerData = parseReferrer(serverReferrer);
    }
    
    // 解析设备信息
    const deviceData = parseUserAgent(userAgent);
    
    // 解析IP位置（异步）
    const locationData = await parseIPLocation(ip);
    
    // 准备访问日志数据
    const logData = {
      visitor_id: attributionCookie.visitor.id,
      user_uuid: userUuid || null,
      session_id: attributionCookie.visitor.sessionId,
      visited_at: new Date(),
      page_url: page_url || '/',
      referrer: serverReferrer || null,
      
      // UTM 参数
      utm_source: utmData.source || referrerData.source || null,
      utm_medium: utmData.medium || referrerData.medium || null,
      utm_campaign: utmData.campaign || null,
      utm_term: utmData.term || null,
      utm_content: utmData.content || null,
      
      // 设备信息
      user_agent: userAgent || null,
      device_type: deviceData.deviceType || null,
      os: deviceData.os || null,
      os_version: deviceData.osVersion || null,
      browser: deviceData.browser || null,
      browser_version: deviceData.browserVersion || null,
      
      // 位置信息
      ip_address: ip || null,
      country: locationData.country || null,
      country_code: locationData.countryCode || null,
      region: locationData.region || null,
      city: locationData.city || null,
      timezone: locationData.timezone || null,
      
      // 其他
      language: language || null,
      screen_resolution: body.screen_resolution || null,
      viewport_size: body.viewport_size || null,
      color_depth: body.color_depth || null,
    };
    
    // 保存到数据库
    const database = db();
    const [insertedLog] = await database
      .insert(visitorLogs)
      .values(logData)
      .returning();
    
    console.log('访问日志已记录:', {
      visitor_id: logData.visitor_id,
      source: logData.utm_source,
      page: logData.page_url,
      device: logData.device_type,
    });
    
    return respData({
      success: true,
      visitor_id: attributionCookie.visitor.id,
      session_id: attributionCookie.visitor.sessionId,
      log_id: insertedLog.id,
    });
    
  } catch (error) {
    console.error('记录访问日志失败:', error);
    return respErr('Failed to track visit');
  }
}

/**
 * GET 请求 - 获取当前访客的归因信息
 */
export async function GET(request: NextRequest) {
  try {
    // 获取归因 Cookie
    const attributionCookie = await getOrCreateAttributionCookie();
    
    // 获取用户 UUID（如果已登录）
    const userUuid = await getUserUuid();
    
    return respData({
      visitor: attributionCookie.visitor,
      first_touch: attributionCookie.first,
      last_touch: attributionCookie.last,
      is_logged_in: !!userUuid,
      user_uuid: userUuid,
    });
    
  } catch (error) {
    console.error('获取归因信息失败:', error);
    return respErr('Failed to get attribution');
  }
}