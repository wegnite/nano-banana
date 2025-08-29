/**
 * 订阅服务层
 * 
 * 管理用户订阅的核心业务逻辑
 * 包括订阅创建、更新、检查、使用量跟踪等
 */

import { db } from "@/db";
import { subscriptions, subscription_usage } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";

/**
 * Character Figure 订阅计划类型
 * 专门为角色图像生成平台设计的订阅层级
 */
export enum SubscriptionPlan {
  FREE = "free",        // 免费版：每日1次生成
  TRIAL = "trial",      // 试用版：$3.99获得10次生成
  PRO = "pro",         // 专业版：$10.99获得50次生成/月
  ULTRA = "ultra",     // 旗舰版：$34.99获得200次生成/月
}

/**
 * 订阅状态
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled", 
  EXPIRED = "expired",
  PAUSED = "paused",
}

/**
 * 计费周期
 */
export enum BillingInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  ONE_TIME = "one-time", // 用于 Trial 一次性购买
}

/**
 * Character Figure 专属订阅计划配置
 * 
 * 设计理念：
 * - Free: 让用户体验产品核心功能，每日1次生成限制
 * - Trial: 超值体验包，$3.99获得10次生成，建立价值感知
 * - Pro: 个人用户最佳选择，月费$10.99获得50次生成
 * - Ultra: 专业创作者版本，月费$34.99获得200次生成
 * 
 * 价值感知策略：
 * - Trial相当于单次生成仅$0.399，而实际单次生成价值$2-5
 * - 突出每月重置，避免积分囤积贬值
 * - 提供明确的升级路径和价值对比
 */
export const DEFAULT_PLANS = {
  [SubscriptionPlan.FREE]: {
    plan_id: SubscriptionPlan.FREE,
    plan_name: "免费体验版",
    plan_name_en: "Free",
    description: "每日免费体验角色生成功能",
    description_en: "Daily free character generation experience",
    monthly_price: 0,
    yearly_price: 0,
    currency: "USD",
    
    // 功能特性
    features: [
      "每日1次免费生成",
      "基础角色风格选择",
      "标准画质输出",
      "社区画廊浏览",
      "基础客服支持"
    ],
    features_en: [
      "1 free generation daily",
      "Basic character styles",
      "Standard quality output", 
      "Community gallery access",
      "Basic support"
    ],
    
    // 使用限制
    monthly_generation_limit: null, // Free用户不按月计算
    daily_generation_limit: 1,     // 每日1次限制
    credits_per_generation: 1,     // 每次生成消耗1积分
    
    // 功能权限
    allowed_styles: ["anime", "realistic", "cartoon"], // 基础风格
    allowed_quality: ["standard"],
    max_batch_size: 1,
    priority_queue: false,
    generation_speed: "standard",
    api_access: false,
    
    // 支持级别
    support_level: "community",
    
    // UI显示
    is_popular: false,
    is_recommended: false,
    badge: "",
    sort_order: 1,
  },
  
  [SubscriptionPlan.TRIAL]: {
    plan_id: SubscriptionPlan.TRIAL,
    plan_name: "超值试用包",
    plan_name_en: "Trial Pack",
    description: "一次性购买，10次高质量生成机会",
    description_en: "One-time purchase, 10 high-quality generations",
    monthly_price: 399,  // $3.99 一次性
    yearly_price: 399,   // 试用包不分年月
    currency: "USD",
    
    // 价值感知重点
    features: [
      "10次精品角色生成",
      "所有高级风格解锁",
      "高清画质输出(2K)",
      "优先生成队列",
      "无水印导出",
      "专属客服支持",
      "⭐ 单次仅$0.399，超值体验"
    ],
    features_en: [
      "10 premium character generations",
      "All premium styles unlocked", 
      "HD quality output (2K)",
      "Priority generation queue",
      "Watermark-free export",
      "Priority customer support",
      "⭐ Only $0.399 per generation"
    ],
    
    // 使用限制
    monthly_generation_limit: 10,   // 试用包总共10次
    daily_generation_limit: null,   // 无每日限制
    credits_per_generation: 1,
    
    // 功能权限
    allowed_styles: ["*"], // 所有风格
    allowed_quality: ["standard", "hd"],
    max_batch_size: 2,
    priority_queue: true,
    generation_speed: "fast",
    api_access: false,
    
    support_level: "priority",
    
    // UI显示
    is_popular: true,  // 标记为热门
    is_recommended: true,
    badge: "超值推荐",
    sort_order: 2,
    
    // 特殊标记
    is_one_time: true,  // 一次性购买
    value_highlight: "相比单次付费节省80%",
    urgency_text: "限时优惠价格",
  },
  
  [SubscriptionPlan.PRO]: {
    plan_id: SubscriptionPlan.PRO,
    plan_name: "专业创作版",
    plan_name_en: "Pro",
    description: "专业创作者的理想选择，每月50次生成",
    description_en: "Perfect for creators, 50 generations monthly",
    monthly_price: 1099, // $10.99
    yearly_price: 10990, // $109.90 (2个月免费)
    currency: "USD",
    
    features: [
      "每月50次专业生成",
      "全部角色风格库",
      "超高清输出(4K)",
      "优先处理队列",
      "批量生成(最多4张)",
      "高级编辑工具",
      "无限画廊存储",
      "邮件客服支持",
      "🎨 月度重置，确保新鲜感"
    ],
    features_en: [
      "50 professional generations monthly",
      "Complete character style library",
      "Ultra HD output (4K)", 
      "Priority processing queue",
      "Batch generation (up to 4)",
      "Advanced editing tools",
      "Unlimited gallery storage",
      "Email customer support",
      "🎨 Monthly reset for freshness"
    ],
    
    // 使用限制
    monthly_generation_limit: 50,
    daily_generation_limit: null,
    credits_per_generation: 1,
    
    // 功能权限
    allowed_styles: ["*"],
    allowed_quality: ["standard", "hd", "uhd"],
    max_batch_size: 4,
    priority_queue: true,
    generation_speed: "fast",
    api_access: true,
    
    support_level: "email",
    
    // UI显示
    is_popular: false,
    is_recommended: true,
    badge: "最受欢迎",
    sort_order: 3,
    
    // 价值对比
    value_highlight: "相比Trial节省55%单次成本",
    annual_savings: "年付可节省$21.98",
  },
  
  [SubscriptionPlan.ULTRA]: {
    plan_id: SubscriptionPlan.ULTRA,
    plan_name: "旗舰无限版", 
    plan_name_en: "Ultra",
    description: "专业团队版本，每月200次大容量生成",
    description_en: "For professional teams, 200 generations monthly",
    monthly_price: 3499, // $34.99
    yearly_price: 34990, // $349.90 (2个月免费)
    currency: "USD",
    
    features: [
      "每月200次旗舰生成",
      "独家角色风格库",
      "8K超清输出", 
      "最高优先级队列",
      "大批量生成(最多10张)",
      "AI风格定制训练",
      "商用授权许可",
      "私有画廊空间",
      "1对1专属客服",
      "API访问权限",
      "🏆 专业创作者首选"
    ],
    features_en: [
      "200 flagship generations monthly",
      "Exclusive character style library",
      "8K ultra HD output",
      "Highest priority queue", 
      "Bulk generation (up to 10)",
      "AI style custom training",
      "Commercial license included",
      "Private gallery space",
      "Dedicated 1-on-1 support",
      "Full API access",
      "🏆 Top choice for professionals"
    ],
    
    // 使用限制
    monthly_generation_limit: 200,
    daily_generation_limit: null,
    credits_per_generation: 1,
    
    // 功能权限
    allowed_styles: ["*"],
    allowed_quality: ["standard", "hd", "uhd", "8k"],
    max_batch_size: 10,
    priority_queue: true,
    generation_speed: "fastest",
    api_access: true,
    
    support_level: "dedicated",
    
    // UI显示
    is_popular: false,
    is_recommended: false,
    badge: "专业版",
    sort_order: 4,
    
    // 价值对比
    value_highlight: "相比Pro节约68%单次成本",
    annual_savings: "年付可节省$69.98", 
    commercial_license: true,
  },
};

/**
 * 获取用户当前的订阅信息
 */
export async function getUserSubscription(userUuid: string) {
  try {
    // 获取数据库实例（db是一个函数，需要调用）
    const [subscription] = await db()
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.user_uuid, userUuid),
          eq(subscriptions.status, SubscriptionStatus.ACTIVE)
        )
      )
      .limit(1);

    return subscription || null;
  } catch (error) {
    console.error("获取用户订阅失败:", error);
    return null;
  }
}

/**
 * 检查用户是否有活跃订阅
 */
export async function hasActiveSubscription(userUuid: string): Promise<boolean> {
  const subscription = await getUserSubscription(userUuid);
  
  if (!subscription) return false;
  
  // 检查订阅是否过期
  const now = new Date();
  if (subscription.current_period_end && subscription.current_period_end < now) {
    // 更新订阅状态为过期（db是函数，需要调用）
    await db()
      .update(subscriptions)
      .set({ status: SubscriptionStatus.EXPIRED })
      .where(eq(subscriptions.id, subscription.id));
    
    return false;
  }
  
  return subscription.status === SubscriptionStatus.ACTIVE;
}

/**
 * 获取用户的订阅计划详情
 */
export async function getUserSubscriptionPlan(userUuid: string) {
  const subscription = await getUserSubscription(userUuid);
  
  if (!subscription) {
    // 返回免费计划
    return DEFAULT_PLANS[SubscriptionPlan.FREE];
  }
  
  // 直接从 DEFAULT_PLANS 获取计划详情
  // 因为数据库中的 subscription_plans 表结构不包含所有字段
  return DEFAULT_PLANS[subscription.plan_id as SubscriptionPlan] || DEFAULT_PLANS[SubscriptionPlan.FREE];
}

/**
 * 检查用户是否可以进行角色生成
 * 
 * Character Figure 专用限制检查：
 * - Free: 每日1次限制
 * - Trial: 总共10次限制（一次性购买）
 * - Pro: 每月50次限制
 * - Ultra: 每月200次限制
 */
export async function canUseCharacterGeneration(
  userUuid: string,
  requestedStyle?: string,
  requestedQuality?: string
): Promise<{ 
  allowed: boolean; 
  reason?: string;
  remaining?: number;
  resetTime?: Date;
  suggestedUpgrade?: SubscriptionPlan;
}> {
  const subscription = await getUserSubscription(userUuid);
  const plan = await getUserSubscriptionPlan(userUuid);
  
  // Free 用户特殊处理 - 检查每日限制
  if (plan.plan_id === SubscriptionPlan.FREE) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 查询今日已使用次数 (这里需要从数据库查询，暂时用模拟逻辑)
    const usedToday = await getDailyUsageCount(userUuid, today);
    
    if (usedToday >= 1) {
      return {
        allowed: false,
        reason: "免费用户每日生成次数已用完",
        remaining: 0,
        resetTime: tomorrow,
        suggestedUpgrade: SubscriptionPlan.TRIAL
      };
    }
    
    // 检查风格权限
    if (requestedStyle && !plan.allowed_styles.includes("*") && 
        !plan.allowed_styles.includes(requestedStyle)) {
      return {
        allowed: false,
        reason: `风格 "${requestedStyle}" 需要升级订阅`,
        suggestedUpgrade: SubscriptionPlan.TRIAL
      };
    }
    
    return { 
      allowed: true, 
      remaining: 1 - usedToday,
      resetTime: tomorrow
    };
  }
  
  // 其他订阅用户检查
  if (!subscription) {
    return { 
      allowed: false, 
      reason: "需要有效订阅" 
    };
  }
  
  // 检查月度限制
  const monthlyLimit = plan.monthly_generation_limit;
  if (monthlyLimit !== null && monthlyLimit !== undefined) {
    const usedThisMonth = subscription.used_this_month || 0;
    
    if (usedThisMonth >= monthlyLimit) {
      // 建议升级方案
      let suggestedUpgrade: SubscriptionPlan | undefined;
      if (plan.plan_id === SubscriptionPlan.TRIAL) {
        suggestedUpgrade = SubscriptionPlan.PRO;
      } else if (plan.plan_id === SubscriptionPlan.PRO) {
        suggestedUpgrade = SubscriptionPlan.ULTRA;
      }
      
      return {
        allowed: false,
        reason: `本月生成次数已用完 (${monthlyLimit} 次)`,
        remaining: 0,
        resetTime: subscription.current_period_end,
        suggestedUpgrade
      };
    }
    
    return {
      allowed: true,
      remaining: monthlyLimit - usedThisMonth,
      resetTime: subscription.current_period_end
    };
  }
  
  // 检查质量权限
  if (requestedQuality && !plan.allowed_quality.includes(requestedQuality)) {
    const suggestedPlan = requestedQuality === "8k" ? SubscriptionPlan.ULTRA : 
                         requestedQuality === "uhd" ? SubscriptionPlan.PRO : SubscriptionPlan.TRIAL;
    
    return {
      allowed: false,
      reason: `"${requestedQuality}" 质量需要升级订阅`,
      suggestedUpgrade: suggestedPlan
    };
  }
  
  return { allowed: true };
}

/**
 * 获取用户今日已使用次数（Free用户专用）
 * 
 * @param userUuid 用户UUID
 * @param today 今日开始时间
 * @returns 今日已使用次数
 */
async function getDailyUsageCount(userUuid: string, today: Date): Promise<number> {
  try {
    // 查询 character_generations 表中今日的记录数
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { character_generations } = await import('@/db/schema');
    const { count } = await import('drizzle-orm');
    
    const result = await db()
      .select({ count: count() })
      .from(character_generations)
      .where(
        and(
          eq(character_generations.user_uuid, userUuid),
          and(
            lte(character_generations.created_at, tomorrow),
            lte(today, character_generations.created_at)
          )
        )
      );
    
    return Number(result[0]?.count || 0);
  } catch (error) {
    console.error("查询每日使用次数失败:", error);
    // 出错时返回最大值，阻止使用以确保安全
    return 999;
  }
}

/**
 * 检查用户是否可以使用特定功能（向后兼容）
 * @deprecated 请使用 canUseCharacterGeneration
 */
export async function canUseFeature(
  userUuid: string,
  feature: "text" | "image" | "video" | "character",
  model?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // 如果是角色生成，转发到新函数
  if (feature === "character") {
    const result = await canUseCharacterGeneration(userUuid);
    return {
      allowed: result.allowed,
      reason: result.reason
    };
  }
  
  // 其他功能保持原有逻辑（暂时兼容）
  const subscription = await getUserSubscription(userUuid);
  const plan = await getUserSubscriptionPlan(userUuid);
  
  if (!subscription && plan.plan_id !== SubscriptionPlan.FREE) {
    return { allowed: false, reason: "没有活跃订阅" };
  }
  
  // 简化的检查逻辑
  return { allowed: true };
}

/**
 * 记录角色生成使用情况（Character Figure专用）
 * 
 * @param userUuid 用户UUID
 * @param generationId 生成记录ID（关联character_generations表）
 * @param creditsUsed 本次消耗的积分数
 * @param style 使用的角色风格
 * @param prompt 用户输入的提示词
 */
export async function recordCharacterGenerationUsage(
  userUuid: string,
  generationId: string,
  creditsUsed: number = 1,
  style?: string,
  prompt?: string
) {
  try {
    const subscription = await getUserSubscription(userUuid);
    const plan = await getUserSubscriptionPlan(userUuid);
    
    // Free用户不需要记录订阅使用，只记录到character_generations表
    if (plan.plan_id === SubscriptionPlan.FREE) {
      console.log(`Free用户 ${userUuid} 完成角色生成，生成ID: ${generationId}`);
      return;
    }
    
    if (!subscription) {
      console.warn(`用户 ${userUuid} 没有活跃订阅但尝试记录使用`);
      return;
    }
    
    // 记录订阅使用详情
    await db().insert(subscription_usage).values({
      user_uuid: userUuid,
      subscription_id: subscription.id,
      usage_type: "character_generation" as const,
      model_used: style || "default",
      prompt: prompt?.substring(0, 1000) || "",
      result_id: generationId,
      credits_consumed: creditsUsed,
      count: 1,
    });
    
    // 更新订阅表中的本月使用次数
    await db()
      .update(subscriptions)
      .set({ 
        used_this_month: sql`${subscriptions.used_this_month} + 1`,
        updated_at: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));
    
    console.log(`记录用户 ${userUuid} 角色生成使用: ${generationId}, 消耗积分: ${creditsUsed}`);
    
  } catch (error) {
    console.error("记录角色生成使用失败:", error);
    // 记录失败不应该阻止生成流程，只记录错误日志
  }
}

/**
 * 记录订阅使用情况（向后兼容，保留原函数）
 * @deprecated 请使用 recordCharacterGenerationUsage
 */
export async function recordSubscriptionUsage(
  userUuid: string,
  usageType: "text_generation" | "image_generation" | "video_generation" | "character_generation",
  model?: string,
  prompt?: string
) {
  try {
    // 如果是角色生成，转发到新函数
    if (usageType === "character_generation") {
      await recordCharacterGenerationUsage(userUuid, "", 1, model, prompt);
      return;
    }
    
    const subscription = await getUserSubscription(userUuid);
    
    if (!subscription) return;
    
    // 记录使用（db是函数，需要调用）
    await db().insert(subscription_usage).values({
      user_uuid: userUuid,
      subscription_id: subscription.id,
      usage_type: usageType,
      model_used: model || "",
      prompt: prompt?.substring(0, 1000) || "",
      count: 1,
    });
    
    // 更新本月使用次数（db是函数，需要调用）
    await db()
      .update(subscriptions)
      .set({ 
        used_this_month: sql`${subscriptions.used_this_month} + 1`,
        updated_at: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));
    
  } catch (error) {
    console.error("记录订阅使用失败:", error);
  }
}

/**
 * 创建新订阅
 */
export async function createSubscription(
  userUuid: string,
  userEmail: string,
  planId: SubscriptionPlan,
  interval: BillingInterval,
  stripeSubscriptionId?: string,
  stripeCustomerId?: string
) {
  try {
    const plan = DEFAULT_PLANS[planId];
    const now = new Date();
    
    // 计算订阅周期
    const periodEnd = new Date(now);
    if (interval === BillingInterval.MONTHLY) {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }
    
    // 创建新订阅记录（db是函数，需要调用）
    const [subscription] = await db()
      .insert(subscriptions)
      .values({
        user_uuid: userUuid,
        user_email: userEmail,
        plan_id: planId,
        plan_name: plan.plan_name,
        status: SubscriptionStatus.ACTIVE,
        interval,
        price: interval === BillingInterval.MONTHLY ? plan.monthly_price : plan.yearly_price,
        currency: "USD",
        started_at: now,
        current_period_start: now,
        current_period_end: periodEnd,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        last_payment_at: now,
        next_payment_at: periodEnd,
        // features 字段不存在于 subscriptions 表中，移除
        monthly_limit: plan.monthly_generation_limit,
        used_this_month: 0,
      })
      .returning();
    
    return subscription;
  } catch (error) {
    console.error("创建订阅失败:", error);
    throw error;
  }
}

/**
 * 取消订阅
 */
export async function cancelSubscription(userUuid: string) {
  try {
    const subscription = await getUserSubscription(userUuid);
    
    if (!subscription) {
      throw new Error("没有找到活跃订阅");
    }
    
    // 更新订阅状态（db是函数，需要调用）
    await db()
      .update(subscriptions)
      .set({
        status: SubscriptionStatus.CANCELLED,
        cancelled_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));
    
    return true;
  } catch (error) {
    console.error("取消订阅失败:", error);
    throw error;
  }
}

/**
 * 重置月度使用量（由定时任务调用）
 */
export async function resetMonthlyUsage() {
  try {
    const now = new Date();
    
    // 重置所有活跃订阅的月度使用量（db是函数，需要调用）
    await db()
      .update(subscriptions)
      .set({
        used_this_month: 0,
        updated_at: now,
      })
      .where(
        and(
          eq(subscriptions.status, SubscriptionStatus.ACTIVE),
          lte(subscriptions.current_period_end, now)
        )
      );
    
    console.log("月度使用量重置完成");
  } catch (error) {
    console.error("重置月度使用量失败:", error);
  }
}