/**
 * Character Figure 专用订阅信贷管理服务
 * 
 * 功能说明：
 * - 实现月度重置的订阅信贷系统
 * - 区分订阅信贷和永久积分
 * - 支持不同计划的限制和重置策略
 * 
 * 信贷类型：
 * - SUBSCRIPTION_CREDIT: 订阅信贷，每月重置
 * - PERMANENT_CREDIT: 永久积分，不会过期
 * - BONUS_CREDIT: 奖励积分，有过期时间
 * 
 * @module services/character-subscription
 */

import { db } from "@/db";
import { subscriptions, credits } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { SubscriptionPlan } from "./subscription";

/**
 * Character Figure 信贷类型
 * 区分不同类型的信贷以便于管理和重置
 */
export enum CharacterCreditType {
  SUBSCRIPTION = "subscription_credit",  // 订阅信贷，月度重置
  PERMANENT = "permanent_credit",        // 永久积分，不过期
  BONUS = "bonus_credit",                // 奖励积分，有过期时间
  TRIAL_PACK = "trial_pack_credit",     // 试用包积分，一次性
}

/**
 * 信贷余额查询结果
 */
export interface CharacterCreditBalance {
  subscriptionCredits: number;    // 当前月度订阅信贷
  permanentCredits: number;       // 永久积分余额
  bonusCredits: number;           // 奖励积分余额
  totalUsable: number;            // 可用总额
  nextResetDate?: Date;           // 下次重置日期
  planType: SubscriptionPlan;     // 当前计划类型
}

/**
 * 获取用户完整的信贷余额情况
 * 
 * 查询策略：
 * 1. 获取用户当前订阅计划
 * 2. 计算订阅信贷余额（基于月度限制-已用量）
 * 3. 统计永久积分和奖励积分
 * 4. 返回完整的余额信息
 * 
 * @param userUuid 用户UUID
 * @returns 完整的信贷余额信息
 */
export async function getCharacterCreditBalance(userUuid: string): Promise<CharacterCreditBalance> {
  try {
    // 获取用户当前订阅
    const [subscription] = await db()
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.user_uuid, userUuid))
      .limit(1);

    const planType = (subscription?.plan_id as SubscriptionPlan) || SubscriptionPlan.FREE;
    
    // Free用户特殊处理 - 基于每日限制
    if (planType === SubscriptionPlan.FREE) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // 查询今日已使用次数
      const { character_generations } = await import('@/db/schema');
      const { count } = await import('drizzle-orm');
      
      const [dailyUsage] = await db()
        .select({ count: count() })
        .from(character_generations)
        .where(
          and(
            eq(character_generations.user_uuid, userUuid),
            and(
              gte(character_generations.created_at, today),
              lte(character_generations.created_at, tomorrow)
            )
          )
        );
      
      const usedToday = Number(dailyUsage?.count || 0);
      const dailyLimit = 1; // Free用户每日1次
      
      return {
        subscriptionCredits: Math.max(0, dailyLimit - usedToday),
        permanentCredits: 0, // Free用户暂不支持永久积分
        bonusCredits: 0,
        totalUsable: Math.max(0, dailyLimit - usedToday),
        nextResetDate: tomorrow,
        planType,
      };
    }
    
    // 订阅用户处理
    if (!subscription) {
      return {
        subscriptionCredits: 0,
        permanentCredits: 0,
        bonusCredits: 0,
        totalUsable: 0,
        planType,
      };
    }
    
    // 计算订阅信贷余额
    const monthlyLimit = subscription.monthly_limit || 0;
    const usedThisMonth = subscription.used_this_month || 0;
    const subscriptionCredits = Math.max(0, monthlyLimit - usedThisMonth);
    
    // 查询永久积分和奖励积分（从credits表）
    const currentTime = new Date();
    
    // 永久积分 - 没有过期时间的积分
    const [permanentResult] = await db()
      .select({ 
        total: sql<number>`COALESCE(SUM(${credits.credits}), 0)` 
      })
      .from(credits)
      .where(
        and(
          eq(credits.user_uuid, userUuid),
          eq(credits.trans_type, CharacterCreditType.PERMANENT),
          // 永久积分的expired_at为null或者很远的未来
          sql`${credits.expired_at} IS NULL OR ${credits.expired_at} > ${new Date(2099, 0, 1)}`
        )
      );
    
    // 奖励积分 - 有过期时间且未过期的积分
    const [bonusResult] = await db()
      .select({ 
        total: sql<number>`COALESCE(SUM(${credits.credits}), 0)` 
      })
      .from(credits)
      .where(
        and(
          eq(credits.user_uuid, userUuid),
          eq(credits.trans_type, CharacterCreditType.BONUS),
          gte(credits.expired_at, currentTime) // 未过期
        )
      );
    
    const permanentCredits = Number(permanentResult?.total || 0);
    const bonusCredits = Number(bonusResult?.total || 0);
    const totalUsable = subscriptionCredits + permanentCredits + bonusCredits;
    
    return {
      subscriptionCredits,
      permanentCredits,
      bonusCredits,
      totalUsable,
      nextResetDate: subscription.current_period_end,
      planType,
    };
    
  } catch (error) {
    console.error("获取用户信贷余额失败:", error);
    return {
      subscriptionCredits: 0,
      permanentCredits: 0,
      bonusCredits: 0,
      totalUsable: 0,
      planType: SubscriptionPlan.FREE,
    };
  }
}

/**
 * 消费用户信贷
 * 
 * 消费优先级：
 * 1. 奖励积分（先过期的先消费）
 * 2. 永久积分 
 * 3. 订阅信贷
 * 
 * @param userUuid 用户UUID
 * @param amount 消费数量
 * @param generationId 关联的生成记录ID
 * @param description 消费描述
 * @returns 是否消费成功
 */
export async function consumeCharacterCredits(
  userUuid: string,
  amount: number = 1,
  generationId: string,
  description: string = "角色生成消费"
): Promise<{ success: boolean; message?: string }> {
  try {
    // 先检查余额
    const balance = await getCharacterCreditBalance(userUuid);
    
    if (balance.totalUsable < amount) {
      return {
        success: false,
        message: `信贷不足，需要 ${amount} 个，可用 ${balance.totalUsable} 个`
      };
    }
    
    let remainingAmount = amount;
    const consumptionRecords: Array<{
      type: CharacterCreditType;
      amount: number;
      source: string;
    }> = [];
    
    // 1. 优先消费奖励积分（按过期时间排序）
    if (remainingAmount > 0 && balance.bonusCredits > 0) {
      const bonusCreditsToConsume = Math.min(remainingAmount, balance.bonusCredits);
      
      // 记录奖励积分消费
      await recordCreditConsumption(
        userUuid,
        CharacterCreditType.BONUS,
        bonusCreditsToConsume,
        generationId,
        `${description} - 奖励积分消费`
      );
      
      consumptionRecords.push({
        type: CharacterCreditType.BONUS,
        amount: bonusCreditsToConsume,
        source: "奖励积分"
      });
      
      remainingAmount -= bonusCreditsToConsume;
    }
    
    // 2. 然后消费永久积分
    if (remainingAmount > 0 && balance.permanentCredits > 0) {
      const permanentCreditsToConsume = Math.min(remainingAmount, balance.permanentCredits);
      
      await recordCreditConsumption(
        userUuid,
        CharacterCreditType.PERMANENT,
        permanentCreditsToConsume,
        generationId,
        `${description} - 永久积分消费`
      );
      
      consumptionRecords.push({
        type: CharacterCreditType.PERMANENT,
        amount: permanentCreditsToConsume,
        source: "永久积分"
      });
      
      remainingAmount -= permanentCreditsToConsume;
    }
    
    // 3. 最后消费订阅信贷（通过更新订阅使用量）
    if (remainingAmount > 0 && balance.subscriptionCredits > 0) {
      const subscriptionCreditsToConsume = Math.min(remainingAmount, balance.subscriptionCredits);
      
      // 更新订阅表中的使用量
      await db()
        .update(subscriptions)
        .set({
          used_this_month: sql`${subscriptions.used_this_month} + ${subscriptionCreditsToConsume}`,
          updated_at: new Date(),
        })
        .where(eq(subscriptions.user_uuid, userUuid));
      
      consumptionRecords.push({
        type: CharacterCreditType.SUBSCRIPTION,
        amount: subscriptionCreditsToConsume,
        source: "订阅信贷"
      });
      
      remainingAmount -= subscriptionCreditsToConsume;
    }
    
    // 记录消费成功日志
    const consumptionSummary = consumptionRecords
      .map(record => `${record.source}:${record.amount}`)
      .join(", ");
    
    console.log(`用户 ${userUuid} 消费 ${amount} 个信贷成功: ${consumptionSummary}, 生成ID: ${generationId}`);
    
    return { success: true };
    
  } catch (error) {
    console.error("消费用户信贷失败:", error);
    return {
      success: false,
      message: "系统错误，请稍后重试"
    };
  }
}

/**
 * 记录信贷消费到credits表
 */
async function recordCreditConsumption(
  userUuid: string,
  creditType: CharacterCreditType,
  amount: number,
  generationId: string,
  description: string
) {
  const { getSnowId } = await import("@/lib/hash");
  
  await db().insert(credits).values({
    trans_no: getSnowId(),
    user_uuid: userUuid,
    trans_type: `consume_${creditType}`,
    credits: -amount, // 负数表示消费
    order_no: generationId, // 关联生成记录
    created_at: new Date(),
  });
}

/**
 * 为用户添加试用包信贷（Trial购买后调用）
 * 
 * @param userUuid 用户UUID
 * @param orderNo 订单号
 * @returns 是否添加成功
 */
export async function addTrialPackCredits(
  userUuid: string,
  orderNo: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { getSnowId } = await import("@/lib/hash");
    
    // Trial包提供10次生成机会
    const trialCredits = 10;
    
    // 计算过期时间（Trial包永不过期，用户可以慢慢使用）
    const expiredAt = new Date(2099, 0, 1); // 设置一个很远的未来时间
    
    await db().insert(credits).values({
      trans_no: getSnowId(),
      user_uuid: userUuid,
      trans_type: CharacterCreditType.TRIAL_PACK,
      credits: trialCredits,
      order_no: orderNo,
      expired_at: expiredAt,
      created_at: new Date(),
    });
    
    console.log(`为用户 ${userUuid} 添加试用包信贷 ${trialCredits} 个，订单: ${orderNo}`);
    
    return { success: true };
    
  } catch (error) {
    console.error("添加试用包信贷失败:", error);
    return {
      success: false,
      message: "添加试用包信贷失败"
    };
  }
}

/**
 * 重置所有用户的月度订阅信贷（定时任务调用）
 * 
 * 重置逻辑：
 * 1. 找到所有活跃订阅且到达重置时间的用户
 * 2. 将 used_this_month 重置为 0
 * 3. 更新 current_period_start 和 current_period_end
 * 
 * @returns 重置的用户数量
 */
export async function resetMonthlySubscriptionCredits(): Promise<number> {
  try {
    const currentTime = new Date();
    
    // 查找需要重置的订阅
    const subscriptionsToReset = await db()
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          lte(subscriptions.current_period_end, currentTime)
        )
      );
    
    let resetCount = 0;
    
    for (const subscription of subscriptionsToReset) {
      // 计算新的计费周期
      const newPeriodStart = new Date(currentTime);
      const newPeriodEnd = new Date(currentTime);
      
      if (subscription.interval === "monthly") {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      } else if (subscription.interval === "yearly") {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      }
      
      // 重置使用量并更新周期
      await db()
        .update(subscriptions)
        .set({
          used_this_month: 0,
          current_period_start: newPeriodStart,
          current_period_end: newPeriodEnd,
          updated_at: currentTime,
        })
        .where(eq(subscriptions.id, subscription.id));
      
      resetCount++;
      
      console.log(`重置用户 ${subscription.user_uuid} 的月度信贷，计划: ${subscription.plan_id}`);
    }
    
    console.log(`月度信贷重置完成，共重置 ${resetCount} 个用户`);
    return resetCount;
    
  } catch (error) {
    console.error("重置月度订阅信贷失败:", error);
    return 0;
  }
}

/**
 * 清理过期的奖励积分
 * 
 * @returns 清理的积分记录数
 */
export async function cleanupExpiredBonusCredits(): Promise<number> {
  try {
    const currentTime = new Date();
    
    // 查找过期的奖励积分
    const expiredCredits = await db()
      .select()
      .from(credits)
      .where(
        and(
          eq(credits.trans_type, CharacterCreditType.BONUS),
          lte(credits.expired_at, currentTime)
        )
      );
    
    let cleanupCount = 0;
    
    for (const credit of expiredCredits) {
      // 将过期积分标记为已过期（通过添加一条负数记录）
      const { getSnowId } = await import("@/lib/hash");
      
      await db().insert(credits).values({
        trans_no: getSnowId(),
        user_uuid: credit.user_uuid,
        trans_type: "bonus_expired",
        credits: -credit.credits, // 负数，抵消过期积分
        order_no: credit.order_no,
        created_at: currentTime,
      });
      
      cleanupCount++;
    }
    
    console.log(`清理过期奖励积分完成，共清理 ${cleanupCount} 条记录`);
    return cleanupCount;
    
  } catch (error) {
    console.error("清理过期奖励积分失败:", error);
    return 0;
  }
}