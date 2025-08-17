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
 * 订阅计划类型
 */
export enum SubscriptionPlan {
  FREE = "free",
  BASIC = "basic",
  PRO = "pro",
  ENTERPRISE = "enterprise",
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
}

/**
 * 默认订阅计划配置
 */
export const DEFAULT_PLANS = {
  [SubscriptionPlan.FREE]: {
    plan_id: SubscriptionPlan.FREE,
    plan_name: "Free Plan",
    description: "Get started with basic AI generation",
    monthly_price: 0,
    yearly_price: 0,
    features: [
      "10 free credits per month",
      "Basic text generation",
      "Community support",
    ],
    monthly_generation_limit: 10,
    daily_generation_limit: 5,
    allowed_text_models: ["gpt-3.5-turbo"],
    allowed_image_models: [],
    allowed_video_models: [],
    priority_queue: false,
    generation_speed: "slow",
    support_level: "basic",
    api_access: false,
    custom_models: false,
  },
  [SubscriptionPlan.BASIC]: {
    plan_id: SubscriptionPlan.BASIC,
    plan_name: "Basic Plan",
    description: "Perfect for individuals and small projects",
    monthly_price: 999, // $9.99
    yearly_price: 9990, // $99.90 (2 months free)
    features: [
      "500 generations per month",
      "All text models",
      "Basic image generation",
      "Email support",
      "No watermarks",
    ],
    monthly_generation_limit: 500,
    daily_generation_limit: 50,
    allowed_text_models: ["gpt-4o", "gpt-4o-mini", "deepseek-chat", "llama-3.3-70b"],
    allowed_image_models: ["dall-e-3", "flux-schnell"],
    allowed_video_models: [],
    priority_queue: false,
    generation_speed: "normal",
    support_level: "email",
    api_access: false,
    custom_models: false,
  },
  [SubscriptionPlan.PRO]: {
    plan_id: SubscriptionPlan.PRO,
    plan_name: "Pro Plan",
    description: "For power users and growing businesses",
    monthly_price: 2999, // $29.99
    yearly_price: 29990, // $299.90 (2 months free)
    features: [
      "Unlimited text generation",
      "2000 image generations",
      "100 video generations",
      "All AI models",
      "Priority support",
      "API access",
      "Custom fine-tuning",
    ],
    monthly_generation_limit: null, // Unlimited text
    daily_generation_limit: null,
    allowed_text_models: ["*"], // All models
    allowed_image_models: ["*"],
    allowed_video_models: ["kling-v1", "runway-gen-3"],
    priority_queue: true,
    generation_speed: "fast",
    support_level: "priority",
    api_access: true,
    custom_models: true,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    plan_id: SubscriptionPlan.ENTERPRISE,
    plan_name: "Enterprise Plan",
    description: "Custom solutions for large organizations",
    monthly_price: 9999, // $99.99+
    yearly_price: 99990, // Custom pricing
    features: [
      "Unlimited everything",
      "Dedicated support",
      "Custom models",
      "SLA guarantee",
      "On-premise deployment",
      "Team management",
    ],
    monthly_generation_limit: null,
    daily_generation_limit: null,
    allowed_text_models: ["*"],
    allowed_image_models: ["*"],
    allowed_video_models: ["*"],
    priority_queue: true,
    generation_speed: "fastest",
    support_level: "dedicated",
    api_access: true,
    custom_models: true,
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
 * 检查用户是否可以使用特定功能
 */
export async function canUseFeature(
  userUuid: string,
  feature: "text" | "image" | "video",
  model?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await getUserSubscription(userUuid);
  const plan = await getUserSubscriptionPlan(userUuid);
  
  // 检查是否有活跃订阅
  if (!subscription && plan.plan_id !== SubscriptionPlan.FREE) {
    return { allowed: false, reason: "没有活跃订阅" };
  }
  
  // 检查月度限制
  if (plan.monthly_generation_limit !== null && plan.monthly_generation_limit !== undefined) {
    const usedThisMonth = subscription?.used_this_month || 0;
    if (usedThisMonth >= plan.monthly_generation_limit) {
      return { 
        allowed: false, 
        reason: `已达到月度限制 (${plan.monthly_generation_limit} 次)` 
      };
    }
  }
  
  // 检查模型权限
  if (model) {
    let allowedModels: string[] = [];
    
    // 确保 plan 是 DEFAULT_PLANS 中的对象
    const defaultPlan = plan as typeof DEFAULT_PLANS[SubscriptionPlan.FREE];
    
    switch (feature) {
      case "text":
        allowedModels = defaultPlan.allowed_text_models || [];
        break;
      case "image":
        allowedModels = defaultPlan.allowed_image_models || [];
        break;
      case "video":
        allowedModels = defaultPlan.allowed_video_models || [];
        break;
    }
    
    // 如果包含 "*" 则允许所有模型
    if (!allowedModels.includes("*") && !allowedModels.includes(model)) {
      return { 
        allowed: false, 
        reason: `模型 ${model} 在您的计划中不可用` 
      };
    }
  }
  
  return { allowed: true };
}

/**
 * 记录订阅使用情况
 */
export async function recordSubscriptionUsage(
  userUuid: string,
  usageType: "text_generation" | "image_generation" | "video_generation",
  model?: string,
  prompt?: string
) {
  try {
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