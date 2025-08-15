/**
 * 积分模型层
 * 
 * 功能说明：
 * 处理所有与积分表相关的数据库操作
 * 管理用户积分的增减和查询
 * 
 * 积分系统特点：
 * - 每笔积分变动都有独立记录
 * - 支持积分过期机制
 * - 可追溯每笔积分的来源
 * 
 * @module models/credit
 */

import { credits } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, and, gte, asc } from "drizzle-orm";

/**
 * 插入积分记录
 * 
 * @param {typeof credits.$inferInsert} data - 积分数据对象
 * @returns {Promise} 创建成功的积分记录
 * 
 * 必填字段：
 * - trans_no: 交易号（唯一）
 * - user_uuid: 用户标识
 * - trans_type: 交易类型
 * - credits: 积分数量（正数增加，负数减少）
 * 
 * 选填字段：
 * - order_no: 关联订单号
 * - expired_at: 过期时间
 * 
 * 使用场景：
 * - 用户充值
 * - 系统赠送
 * - 积分消费
 */
export async function insertCredit(
  data: typeof credits.$inferInsert
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db().insert(credits).values(data).returning();

  return credit;
}

/**
 * 通过交易号查找积分记录
 * 
 * @param {string} trans_no - 交易号
 * @returns {Promise} 找到的积分记录
 * 
 * 使用场景：
 * - 查询交易详情
 * - 验证交易是否存在
 * - 对账和审计
 */
export async function findCreditByTransNo(
  trans_no: string
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db()
    .select()
    .from(credits)
    .where(eq(credits.trans_no, trans_no))
    .limit(1);

  return credit;
}

/**
 * 通过订单号查找积分记录
 * 
 * @param {string} order_no - 订单号
 * @returns {Promise} 找到的积分记录
 * 
 * 使用场景：
 * - 检查订单是否已充值（防止重复）
 * - 查询订单对应的积分信息
 * - 订单退款处理
 * 
 * 注意：
 * - 一个订单只应对应一条积分记录
 * - 用于保证幂等性
 */
export async function findCreditByOrderNo(
  order_no: string
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db()
    .select()
    .from(credits)
    .where(eq(credits.order_no, order_no))
    .limit(1);

  return credit;
}

/**
 * 获取用户有效积分列表
 * 
 * @param {string} user_uuid - 用户唯一标识
 * @returns {Promise} 有效积分记录数组
 * 
 * 有效积分定义：
 * - 未过期（expired_at >= 当前时间）
 * - 属于指定用户
 * 
 * 排序规则：
 * - 按过期时间升序（先过期的在前）
 * - 支持 FIFO 消费策略
 * 
 * 使用场景：
 * - 计算用户剩余积分
 * - 积分消费时选择批次
 * - 显示积分明细
 * 
 * 性能优化：
 * - expired_at 字段应建立索引
 * - 结果可缓存短时间
 */
export async function getUserValidCredits(
  user_uuid: string
): Promise<(typeof credits.$inferSelect)[] | undefined> {
  const now = new Date().toISOString();
  const data = await db()
    .select()
    .from(credits)
    .where(
      and(
        gte(credits.expired_at, new Date(now)),  // 只获取未过期的
        eq(credits.user_uuid, user_uuid)
      )
    )
    .orderBy(asc(credits.expired_at));  // 先过期的排在前面

  return data;
}

/**
 * 分页获取用户积分记录
 * 
 * @param {string} user_uuid - 用户唯一标识
 * @param {number} page - 页码，从 1 开始，默认 1
 * @param {number} limit - 每页数量，默认 50
 * @returns {Promise} 积分记录数组
 * 
 * 特点：
 * - 包括所有积分记录（有效和过期）
 * - 按创建时间倒序（最新的在前）
 * - 支持分页查询
 * 
 * 使用场景：
 * - 用户积分明细页面
 * - 积分流水查询
 * - 管理后台积分管理
 * 
 * 注意：
 * - 包含正负积分记录
 * - 需要前端计算汇总
 */
export async function getCreditsByUserUuid(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<(typeof credits.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(credits)
    .where(eq(credits.user_uuid, user_uuid))
    .orderBy(desc(credits.created_at))  // 最新的在前
    .limit(limit)
    .offset((page - 1) * limit);

  return data;
}
