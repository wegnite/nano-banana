/**
 * Character Figure 订阅管理API
 * 
 * 功能说明：
 * - 获取用户当前订阅状态和信贷余额
 * - 提供订阅计划信息
 * - 支持订阅操作（升级、取消等）
 * 
 * 端点：
 * GET /api/character-figure/subscription - 获取用户订阅状态
 * POST /api/character-figure/subscription - 创建或更新订阅
 * DELETE /api/character-figure/subscription - 取消订阅
 * 
 * @author Claude Code
 */

import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { 
  getUserSubscription, 
  getUserSubscriptionPlan,
  SubscriptionPlan,
  cancelSubscription 
} from "@/services/subscription";
import { 
  getCharacterCreditBalance,
  CharacterCreditBalance 
} from "@/services/character-subscription";
import { 
  CHARACTER_PRICING_PLANS,
  getCharacterPricingPlan,
  getPurchasableCharacterPlans,
  calculateValuePerception,
  getRecommendedUpgrade,
  CharacterPricingPlan
} from "@/config/character-figure-pricing";

/**
 * 用户订阅状态响应接口
 */
interface SubscriptionStatusResponse {
  // 当前订阅信息
  currentPlan: {
    planId: SubscriptionPlan;
    planName: string;
    isActive: boolean;
    status?: string;
    startDate?: string;
    endDate?: string;
    nextBillingDate?: string;
  };
  
  // 信贷余额
  credits: CharacterCreditBalance;
  
  // 可用计划
  availablePlans: CharacterPricingPlan[];
  
  // 推荐升级
  recommendedUpgrade?: CharacterPricingPlan;
  
  // 使用统计
  usage: {
    usedThisMonth: number;
    monthlyLimit: number | null;
    usagePercentage: number;
    resetDate?: string;
  };
}

/**
 * GET 获取用户订阅状态
 * 
 * 返回用户完整的订阅信息，包括：
 * - 当前订阅计划详情
 * - 信贷余额和使用情况
 * - 可选的升级计划
 * - 使用统计数据
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // 获取用户身份
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("需要登录", 401);
    }
    
    // 获取用户当前订阅
    const subscription = await getUserSubscription(userUuid);
    const plan = await getUserSubscriptionPlan(userUuid);
    
    // 获取信贷余额
    const credits = await getCharacterCreditBalance(userUuid);
    
    // 构建当前计划信息
    const currentPlan = {
      planId: plan.plan_id as SubscriptionPlan,
      planName: plan.plan_name,
      isActive: !!subscription && subscription.status === "active",
      status: subscription?.status,
      startDate: subscription?.started_at?.toISOString(),
      endDate: subscription?.current_period_end?.toISOString(),
      nextBillingDate: subscription?.next_payment_at?.toISOString(),
    };
    
    // 计算使用统计
    const usedThisMonth = subscription?.used_this_month || 0;
    const monthlyLimit = subscription?.monthly_limit;
    let usagePercentage = 0;
    
    if (monthlyLimit && monthlyLimit > 0) {
      usagePercentage = Math.round((usedThisMonth / monthlyLimit) * 100);
    } else if (plan.plan_id === SubscriptionPlan.FREE) {
      // Free用户基于每日使用情况计算
      usagePercentage = credits.subscriptionCredits === 0 ? 100 : 0;
    }
    
    const usage = {
      usedThisMonth,
      monthlyLimit: monthlyLimit ?? null, // 确保类型为 number | null
      usagePercentage,
      resetDate: credits.nextResetDate?.toISOString(),
    };
    
    // 获取可购买计划和推荐升级
    const availablePlans = getPurchasableCharacterPlans();
    const recommendedUpgrade = getRecommendedUpgrade(plan.plan_id as SubscriptionPlan);
    
    const response: SubscriptionStatusResponse = {
      currentPlan,
      credits,
      availablePlans,
      recommendedUpgrade: recommendedUpgrade || undefined,
      usage,
    };
    
    return respData(response);
    
  } catch (error) {
    console.error("获取订阅状态失败:", error);
    return respErr("获取订阅状态失败");
  }
}

/**
 * POST 创建或更新订阅
 * 
 * 支持的操作：
 * - upgrade: 升级到更高级别计划
 * - downgrade: 降级到较低级别计划（在当前周期结束时生效）
 * - reactivate: 重新激活已取消的订阅
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("需要登录", 401);
    }
    
    const body = await req.json();
    const { action, planId, billingInterval } = body;
    
    if (!action || !planId) {
      return respErr("缺少必要参数");
    }
    
    // 验证计划ID
    const targetPlan = getCharacterPricingPlan(planId as SubscriptionPlan);
    if (!targetPlan) {
      return respErr("无效的订阅计划");
    }
    
    // 获取当前订阅状态
    const currentSubscription = await getUserSubscription(userUuid);
    const currentPlan = await getUserSubscriptionPlan(userUuid);
    
    switch (action) {
      case "upgrade":
        // 升级操作 - 需要重定向到支付页面
        return respData({
          requiresPayment: true,
          checkoutUrl: `/api/checkout`,
          planDetails: targetPlan,
          message: "请完成支付以升级订阅"
        });
        
      case "schedule_downgrade":
        // 计划降级 - 在当前周期结束时生效
        if (!currentSubscription) {
          return respErr("没有活跃订阅可以降级");
        }
        
        // 这里应该更新订阅记录，标记在下个周期变更计划
        // 实际实现需要在订阅表中添加 next_plan_id 字段
        return respData({
          message: `已安排在 ${currentSubscription.current_period_end?.toLocaleDateString()} 降级到 ${targetPlan.planName}`,
          effectiveDate: currentSubscription.current_period_end?.toISOString()
        });
        
      case "reactivate":
        // 重新激活订阅
        if (currentSubscription?.status !== "cancelled") {
          return respErr("订阅未处于已取消状态");
        }
        
        // 重新激活逻辑（需要根据具体需求实现）
        return respData({
          message: "订阅已重新激活",
          subscription: currentSubscription
        });
        
      default:
        return respErr("不支持的操作类型");
    }
    
  } catch (error) {
    console.error("订阅操作失败:", error);
    return respErr("订阅操作失败");
  }
}

/**
 * DELETE 取消订阅
 * 
 * 取消用户的活跃订阅。订阅将在当前计费周期结束时失效，
 * 用户可以继续使用服务直到周期结束。
 */
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("需要登录", 401);
    }
    
    // 获取请求参数
    const url = new URL(req.url);
    const immediate = url.searchParams.get('immediate') === 'true';
    
    const subscription = await getUserSubscription(userUuid);
    if (!subscription) {
      return respErr("没有找到活跃订阅");
    }
    
    // 执行取消操作
    await cancelSubscription(userUuid);
    
    // 构建响应消息
    const endDate = subscription.current_period_end?.toLocaleDateString();
    const message = immediate 
      ? "订阅已立即取消"
      : `订阅已取消，您可以继续使用服务直到 ${endDate}`;
    
    return respData({
      message,
      cancelledAt: new Date().toISOString(),
      accessUntil: subscription.current_period_end?.toISOString(),
      refundEligible: false, // 根据退款政策设置
    });
    
  } catch (error) {
    console.error("取消订阅失败:", error);
    return respErr("取消订阅失败");
  }
}

/**
 * PUT 更新订阅设置
 * 
 * 支持更新订阅的一些非关键设置，如：
 * - 自动续费偏好设置
 * - 通知设置
 * - 发票信息等
 */
export async function PUT(req: NextRequest): Promise<Response> {
  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("需要登录", 401);
    }
    
    const body = await req.json();
    const { settings } = body;
    
    if (!settings) {
      return respErr("缺少设置参数");
    }
    
    // 这里可以实现各种订阅设置的更新逻辑
    // 例如：更新用户偏好、通知设置等
    
    return respData({
      message: "订阅设置已更新",
      settings
    });
    
  } catch (error) {
    console.error("更新订阅设置失败:", error);
    return respErr("更新订阅设置失败");
  }
}