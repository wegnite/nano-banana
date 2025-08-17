/**
 * 归因分析API
 * 
 * 问题：需要分析用户归因数据以获取营销洞察
 * 解决方案：提供全面的归因分析端点
 * 
 * 功能特性：
 * - 用户获取渠道分析
 * - 转化漏斗追踪
 * - 设备和地理位置分析
 * - 按渠道计算ROI（投资回报率）
 */

import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { sql, eq, and, gte, lte, isNotNull } from "drizzle-orm";
import { getUserUuid } from "@/services/user";

/**
 * GET /api/attribution/analytics
 * 
 * 查询参数：
 * - type: 'overview' | 'channels' | 'devices' | 'locations' | 'conversions' (分析类型)
 * - start_date: ISO日期字符串（开始日期）
 * - end_date: ISO日期字符串（结束日期）
 * - group_by: 'day' | 'week' | 'month' (分组方式)
 */
export async function GET(request: NextRequest) {
  try {
    // 检查管理员授权
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("Unauthorized");
    }
    
    // TODO: 添加管理员权限检查
    // const isAdmin = await checkIfUserIsAdmin(userUuid);
    // if (!isAdmin) {
    //   return respErr("Forbidden");
    // }
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "overview";
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    
    // 构建日期范围过滤器
    const dateFilters = [];
    if (startDate) {
      dateFilters.push(gte(users.created_at, new Date(startDate)));
    }
    if (endDate) {
      dateFilters.push(lte(users.created_at, new Date(endDate)));
    }
    
    // 根据分析类型返回相应数据
    switch (type) {
      case "overview":
        return await getOverviewAnalytics(dateFilters);
      
      case "channels":
        return await getChannelAnalytics(dateFilters);
      
      case "devices":
        return await getDeviceAnalytics(dateFilters);
      
      case "locations":
        return await getLocationAnalytics(dateFilters);
      
      case "conversions":
        return await getConversionAnalytics(dateFilters);
      
      default:
        return respErr("Invalid analytics type");
    }
  } catch (error) {
    console.error("Attribution analytics error:", error);
    return respErr("Failed to fetch analytics");
  }
}

/**
 * 获取归因概览指标
 * 包括总用户数、按来源分组的用户数、付费用户数据
 */
async function getOverviewAnalytics(dateFilters: any[]) {
  const database = db();
  
  // 统计有归因数据的总用户数
  const totalUsersResult = await database
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(
      isNotNull(users.attribution_source),
      ...dateFilters
    ));
  
  // 按来源统计用户数
  const usersBySource = await database
    .select({
      source: users.attribution_source,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(and(
      isNotNull(users.attribution_source),
      ...dateFilters
    ))
    .groupBy(users.attribution_source);
  
  // 按来源统计付费用户和收入
  const paidUsersBySource = await database
    .select({
      source: users.attribution_source,
      count: sql<number>`count(distinct ${users.uuid})`,
      revenue: sql<number>`sum(${orders.amount})`,
    })
    .from(users)
    .innerJoin(orders, eq(users.uuid, orders.user_uuid))
    .where(and(
      isNotNull(users.attribution_source),
      eq(orders.status, "paid"),
      ...dateFilters
    ))
    .groupBy(users.attribution_source);
  
  return respData({
    total_users: totalUsersResult[0]?.count || 0,
    users_by_source: usersBySource,
    paid_users_by_source: paidUsersBySource,
  });
}

/**
 * 获取渠道特定分析
 * 包括来源、媒介、活动的详细数据和转化率
 */
async function getChannelAnalytics(dateFilters: any[]) {
  const database = db();
  
  const channelData = await database
    .select({
      source: users.attribution_source,           // 来源（如：google, facebook）
      medium: users.attribution_medium,           // 媒介（如：cpc, social）
      campaign: users.attribution_campaign,       // 活动名称
      users: sql<number>`count(distinct ${users.uuid})`,                    // 用户数
      orders: sql<number>`count(distinct ${orders.order_no})`,              // 订单数
      revenue: sql<number>`coalesce(sum(${orders.amount}), 0)`,            // 总收入
      avg_order_value: sql<number>`coalesce(avg(${orders.amount}), 0)`,    // 平均订单价值
      conversion_rate: sql<number>`                                         // 转化率
        round(
          count(distinct ${orders.user_uuid})::numeric / 
          count(distinct ${users.uuid})::numeric * 100, 
          2
        )
      `,
    })
    .from(users)
    .leftJoin(
      orders,
      and(
        eq(users.uuid, orders.user_uuid),
        eq(orders.status, "paid")
      )
    )
    .where(and(
      isNotNull(users.attribution_source),
      ...dateFilters
    ))
    .groupBy(
      users.attribution_source,
      users.attribution_medium,
      users.attribution_campaign
    )
    .orderBy(sql`revenue desc`);  // 按收入降序排列
  
  return respData({
    channels: channelData,
    total_channels: channelData.length,
  });
}

/**
 * 获取设备分析数据
 * 包括设备类型、操作系统、浏览器的分布
 */
async function getDeviceAnalytics(dateFilters: any[]) {
  const database = db();
  
  // 设备类型分析（桌面、移动、平板）
  const deviceTypes = await database
    .select({
      device_type: users.first_device_type,
      users: sql<number>`count(distinct ${users.uuid})`,
      orders: sql<number>`count(distinct ${orders.order_no})`,
      revenue: sql<number>`coalesce(sum(${orders.amount}), 0)`,
    })
    .from(users)
    .leftJoin(
      orders,
      and(
        eq(users.uuid, orders.user_uuid),
        eq(orders.status, "paid")
      )
    )
    .where(and(
      isNotNull(users.first_device_type),
      ...dateFilters
    ))
    .groupBy(users.first_device_type);
  
  // 操作系统分析（Windows、Mac、iOS、Android等）
  const operatingSystems = await database
    .select({
      os: users.first_os,
      users: sql<number>`count(distinct ${users.uuid})`,
      orders: sql<number>`count(distinct ${orders.order_no})`,
      revenue: sql<number>`coalesce(sum(${orders.amount}), 0)`,
    })
    .from(users)
    .leftJoin(
      orders,
      and(
        eq(users.uuid, orders.user_uuid),
        eq(orders.status, "paid")
      )
    )
    .where(and(
      isNotNull(users.first_os),
      ...dateFilters
    ))
    .groupBy(users.first_os);
  
  // 浏览器分析（Chrome、Safari、Firefox等）
  const browsers = await database
    .select({
      browser: users.first_browser,
      users: sql<number>`count(distinct ${users.uuid})`,
      orders: sql<number>`count(distinct ${orders.order_no})`,
      revenue: sql<number>`coalesce(sum(${orders.amount}), 0)`,
    })
    .from(users)
    .leftJoin(
      orders,
      and(
        eq(users.uuid, orders.user_uuid),
        eq(orders.status, "paid")
      )
    )
    .where(and(
      isNotNull(users.first_browser),
      ...dateFilters
    ))
    .groupBy(users.first_browser);
  
  return respData({
    device_types: deviceTypes,
    operating_systems: operatingSystems,
    browsers: browsers,
  });
}

/**
 * 获取地理位置分析
 * 包括国家和城市级别的用户分布
 */
async function getLocationAnalytics(dateFilters: any[]) {
  const database = db();
  
  // 国家分布（按用户数排序）
  const countries = await database
    .select({
      country: users.first_country,
      users: sql<number>`count(distinct ${users.uuid})`,
      orders: sql<number>`count(distinct ${orders.order_no})`,
      revenue: sql<number>`coalesce(sum(${orders.amount}), 0)`,
    })
    .from(users)
    .leftJoin(
      orders,
      and(
        eq(users.uuid, orders.user_uuid),
        eq(orders.status, "paid")
      )
    )
    .where(and(
      isNotNull(users.first_country),
      ...dateFilters
    ))
    .groupBy(users.first_country)
    .orderBy(sql`users desc`)
    .limit(20);  // 只返回前20个国家
  
  // 城市分布（包含省份和国家信息，前20个城市）
  const cities = await database
    .select({
      city: users.first_city,
      region: users.first_region,      // 省份/州
      country: users.first_country,
      users: sql<number>`count(distinct ${users.uuid})`,
      orders: sql<number>`count(distinct ${orders.order_no})`,
      revenue: sql<number>`coalesce(sum(${orders.amount}), 0)`,
    })
    .from(users)
    .leftJoin(
      orders,
      and(
        eq(users.uuid, orders.user_uuid),
        eq(orders.status, "paid")
      )
    )
    .where(and(
      isNotNull(users.first_city),
      ...dateFilters
    ))
    .groupBy(
      users.first_city,
      users.first_region,
      users.first_country
    )
    .orderBy(sql`users desc`)
    .limit(20);  // 只返回前20个城市
  
  return respData({
    countries: countries,
    cities: cities,
  });
}

/**
 * 获取转化漏斗分析
 * 分析从用户注册到付费的完整转化路径
 */
async function getConversionAnalytics(dateFilters: any[]) {
  const database = db();
  
  // 按来源分析转化漏斗
  const conversionFunnel = await database
    .select({
      source: users.attribution_source,                                              // 来源
      total_users: sql<number>`count(distinct ${users.uuid})`,                      // 总用户数
      users_with_orders: sql<number>`count(distinct case when ${orders.order_no} is not null then ${users.uuid} end)`,  // 有订单的用户数
      paid_users: sql<number>`count(distinct case when ${orders.status} = 'paid' then ${users.uuid} end)`,            // 付费用户数
      total_revenue: sql<number>`coalesce(sum(case when ${orders.status} = 'paid' then ${orders.amount} end), 0)`,    // 总收入
      avg_revenue_per_user: sql<number>`                                                                               // 每用户平均收入（ARPU）
        coalesce(
          sum(case when ${orders.status} = 'paid' then ${orders.amount} end)::numeric / 
          nullif(count(distinct ${users.uuid}), 0),
          0
        )
      `,
      conversion_rate: sql<number>`                                                                                    // 付费转化率
        round(
          count(distinct case when ${orders.status} = 'paid' then ${users.uuid} end)::numeric / 
          nullif(count(distinct ${users.uuid}), 0)::numeric * 100,
          2
        )
      `,
    })
    .from(users)
    .leftJoin(orders, eq(users.uuid, orders.user_uuid))
    .where(and(
      isNotNull(users.attribution_source),
      ...dateFilters
    ))
    .groupBy(users.attribution_source)
    .orderBy(sql`total_revenue desc`);  // 按总收入降序排列
  
  // 订单设备归因分析（分析下单时的设备类型）
  const orderDevices = await database
    .select({
      device_type: orders.order_device_type,
      orders: sql<number>`count(*)`,                         // 订单数量
      revenue: sql<number>`sum(${orders.amount})`,          // 总收入
      avg_order_value: sql<number>`avg(${orders.amount})`,  // 平均订单金额
    })
    .from(orders)
    .where(and(
      eq(orders.status, "paid"),
      isNotNull(orders.order_device_type)
    ))
    .groupBy(orders.order_device_type);
  
  return respData({
    conversion_funnel: conversionFunnel,
    order_devices: orderDevices,
  });
}