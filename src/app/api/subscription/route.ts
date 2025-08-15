/**
 * 订阅管理 API 路由
 * 
 * 处理订阅相关的所有操作
 * 包括获取订阅状态、创建订阅、取消订阅等
 */

import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  getUserSubscription,
  getUserSubscriptionPlan,
  createSubscription,
  cancelSubscription,
  SubscriptionPlan,
  BillingInterval,
  DEFAULT_PLANS,
} from "@/services/subscription";

/**
 * 获取用户订阅信息
 */
export async function GET(req: Request) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user?.email) {
      return respErr("Please login first");
    }

    const userUuid = await getUserUuid(session.user.email);
    if (!userUuid) {
      return respErr("User not found");
    }

    // 获取订阅信息
    const subscription = await getUserSubscription(userUuid);
    const plan = await getUserSubscriptionPlan(userUuid);

    return respData({
      subscription: subscription || null,
      plan: plan,
      available_plans: Object.values(DEFAULT_PLANS),
    });
  } catch (error: any) {
    console.error("Get subscription failed:", error);
    return respErr(error.message || "Failed to get subscription info");
  }
}

/**
 * 创建或更新订阅
 */
export async function POST(req: Request) {
  try {
    const { plan_id, interval, payment_method_id } = await req.json();

    // 验证参数
    if (!plan_id || !interval) {
      return respErr("Missing required parameters");
    }

    // 验证用户身份
    const session = await auth();
    if (!session?.user?.email) {
      return respErr("Please login first");
    }

    const userUuid = await getUserUuid(session.user.email);
    if (!userUuid) {
      return respErr("User not found");
    }

    // 检查是否已有订阅
    const existingSubscription = await getUserSubscription(userUuid);
    if (existingSubscription) {
      return respErr("You already have an active subscription. Please cancel it first.");
    }

    // 验证计划是否存在
    if (!Object.values(SubscriptionPlan).includes(plan_id as SubscriptionPlan)) {
      return respErr("Invalid subscription plan");
    }

    // 免费计划不需要支付
    if (plan_id === SubscriptionPlan.FREE) {
      return respErr("Free plan doesn't require subscription");
    }

    // TODO: 这里需要集成 Stripe 或其他支付系统
    // 1. 创建 Stripe 客户
    // 2. 创建 Stripe 订阅
    // 3. 处理支付

    // 临时：直接创建订阅（实际应该在支付成功后创建）
    const subscription = await createSubscription(
      userUuid,
      session.user.email,
      plan_id as SubscriptionPlan,
      interval as BillingInterval,
      undefined, // stripe_subscription_id
      undefined  // stripe_customer_id
    );

    return respData({
      subscription,
      message: "Subscription created successfully",
    });
  } catch (error: any) {
    console.error("Create subscription failed:", error);
    return respErr(error.message || "Failed to create subscription");
  }
}

/**
 * 取消订阅
 */
export async function DELETE(req: Request) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user?.email) {
      return respErr("Please login first");
    }

    const userUuid = await getUserUuid(session.user.email);
    if (!userUuid) {
      return respErr("User not found");
    }

    // 取消订阅
    await cancelSubscription(userUuid);

    // TODO: 如果使用 Stripe，这里也需要取消 Stripe 订阅

    return respData({
      message: "Subscription cancelled successfully",
    });
  } catch (error: any) {
    console.error("Cancel subscription failed:", error);
    return respErr(error.message || "Failed to cancel subscription");
  }
}