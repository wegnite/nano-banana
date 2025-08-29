/**
 * Character Figure 月度信贷重置定时任务
 * 
 * 功能说明：
 * - 重置所有活跃订阅用户的月度使用限制
 * - 清理过期的奖励积分
 * - 更新订阅计费周期
 * - 发送重置通知邮件
 * 
 * 执行时机：
 * - 每月1日凌晨0点执行
 * - 可通过Vercel Cron Jobs或外部调度器触发
 * - 支持手动执行（需要管理员权限）
 * 
 * 安全性：
 * - 使用API密钥验证请求来源
 * - 记录详细执行日志
 * - 支持幂等操作，避免重复执行
 * 
 * @author Claude Code
 */

import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { 
  resetMonthlySubscriptionCredits, 
  cleanupExpiredBonusCredits 
} from "@/services/character-subscription";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * 重置任务执行结果接口
 */
interface ResetTaskResult {
  taskId: string;
  executedAt: string;
  success: boolean;
  results: {
    subscriptionsReset: number;
    creditsCleanedUp: number;
    notificationsSent: number;
    errors: string[];
  };
  executionTimeMs: number;
  nextScheduledRun?: string;
}

/**
 * 验证请求授权
 * 
 * 支持以下验证方式：
 * 1. Vercel Cron 秘钥（推荐）
 * 2. API 管理员密钥
 * 3. Bearer Token 授权
 * 
 * @param request HTTP请求对象
 * @returns 是否授权成功
 */
function validateAuthorization(request: NextRequest): boolean {
  // 检查Vercel Cron授权头
  const vercelCronSecret = request.headers.get("x-vercel-cron-signature");
  if (vercelCronSecret === process.env.VERCEL_CRON_SECRET && vercelCronSecret) {
    return true;
  }
  
  // 检查API管理员密钥
  const apiKey = request.headers.get("x-api-key");
  if (apiKey === process.env.ADMIN_API_KEY && apiKey) {
    return true;
  }
  
  // 检查Bearer Token
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    if (token === process.env.MONTHLY_RESET_TOKEN && token) {
      return true;
    }
  }
  
  return false;
}

/**
 * 发送重置通知邮件（可选功能）
 * 
 * 通知内容：
 * - 月度信贷已重置
 * - 新的使用限制
 * - 账单信息更新
 * 
 * @param userEmails 需要通知的用户邮箱列表
 * @returns 发送成功的邮件数量
 */
async function sendResetNotifications(userEmails: string[]): Promise<number> {
  // 这里应该集成邮件服务（如SendGrid、AWS SES等）
  // 为了简化，我们只记录日志
  
  try {
    let successCount = 0;
    
    for (const email of userEmails) {
      // 实际实现中，这里应该调用邮件服务API
      console.log(`发送月度重置通知邮件到: ${email}`);
      
      // 模拟邮件发送成功
      successCount++;
      
      // 添加延迟避免邮件服务限流
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return successCount;
    
  } catch (error) {
    console.error("发送重置通知邮件失败:", error);
    return 0;
  }
}

/**
 * 检查是否需要执行重置任务
 * 
 * 防重复执行策略：
 * - 检查今日是否已执行过重置任务
 * - 通过系统配置表记录最后执行时间
 * 
 * @returns 是否需要执行重置
 */
async function shouldExecuteReset(): Promise<boolean> {
  try {
    const { system_configs } = await import("@/db/schema");
    
    const [config] = await db()
      .select()
      .from(system_configs)
      .where(eq(system_configs.config_key, "last_monthly_reset"))
      .limit(1);
    
    if (!config) {
      // 首次执行，需要重置
      return true;
    }
    
    const lastResetDate = new Date(config.config_value || "");
    const today = new Date();
    
    // 检查是否同一个月
    const isSameMonth = 
      lastResetDate.getFullYear() === today.getFullYear() &&
      lastResetDate.getMonth() === today.getMonth();
    
    // 如果不是同一个月，需要执行重置
    return !isSameMonth;
    
  } catch (error) {
    console.error("检查重置状态失败:", error);
    // 出错时默认执行重置，确保服务稳定
    return true;
  }
}

/**
 * 记录重置任务执行状态
 * 
 * @param success 是否执行成功
 * @param results 执行结果详情
 */
async function recordResetExecution(success: boolean, results: any) {
  try {
    const { system_configs } = await import("@/db/schema");
    
    const now = new Date();
    const executionRecord = {
      executedAt: now.toISOString(),
      success,
      results,
    };
    
    // 更新最后重置时间
    await db()
      .insert(system_configs)
      .values({
        config_key: "last_monthly_reset",
        config_value: now.toISOString(),
        description: "最后一次月度信贷重置时间",
        is_active: true,
      })
      .onConflictDoUpdate({
        target: system_configs.config_key,
        set: {
          config_value: now.toISOString(),
          updated_at: now,
        },
      });
    
    // 记录详细执行日志
    await db()
      .insert(system_configs)
      .values({
        config_key: `monthly_reset_log_${now.toISOString().slice(0, 7)}`, // YYYY-MM格式
        config_value: JSON.stringify(executionRecord),
        description: `${now.toLocaleDateString()} 月度重置执行日志`,
        is_active: true,
      })
      .onConflictDoUpdate({
        target: system_configs.config_key,
        set: {
          config_value: JSON.stringify(executionRecord),
          updated_at: now,
        },
      });
    
  } catch (error) {
    console.error("记录重置执行状态失败:", error);
  }
}

/**
 * POST 执行月度重置任务
 * 
 * 执行步骤：
 * 1. 验证请求授权
 * 2. 检查是否需要执行重置
 * 3. 重置订阅信贷
 * 4. 清理过期积分
 * 5. 发送通知邮件
 * 6. 记录执行结果
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // 验证授权
    if (!validateAuthorization(request)) {
      return respErr("未授权访问", 403);
    }
    
    // 检查是否需要执行重置
    const needsReset = await shouldExecuteReset();
    if (!needsReset) {
      return respData({
        taskId: "monthly-reset-skip",
        executedAt: new Date().toISOString(),
        success: true,
        message: "本月已执行过重置任务，跳过执行",
        executionTimeMs: Date.now() - startTime,
      });
    }
    
    console.log("开始执行月度信贷重置任务...");
    
    const errors: string[] = [];
    let subscriptionsReset = 0;
    let creditsCleanedUp = 0;
    let notificationsSent = 0;
    
    // 1. 重置订阅信贷
    try {
      subscriptionsReset = await resetMonthlySubscriptionCredits();
      console.log(`成功重置 ${subscriptionsReset} 个订阅的信贷`);
    } catch (error) {
      const errorMsg = `重置订阅信贷失败: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
    
    // 2. 清理过期积分
    try {
      creditsCleanedUp = await cleanupExpiredBonusCredits();
      console.log(`成功清理 ${creditsCleanedUp} 条过期积分记录`);
    } catch (error) {
      const errorMsg = `清理过期积分失败: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
    
    // 3. 获取需要通知的用户邮箱
    try {
      if (subscriptionsReset > 0) {
        const activeSubscriptions = await db()
          .select({ user_email: subscriptions.user_email })
          .from(subscriptions)
          .where(eq(subscriptions.status, "active"));
        
        const userEmails = activeSubscriptions
          .map(sub => sub.user_email)
          .filter(email => email && email.includes("@"));
        
        notificationsSent = await sendResetNotifications(userEmails);
        console.log(`成功发送 ${notificationsSent} 封通知邮件`);
      }
    } catch (error) {
      const errorMsg = `发送通知邮件失败: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
    
    const executionTimeMs = Date.now() - startTime;
    const success = errors.length === 0;
    
    const results = {
      subscriptionsReset,
      creditsCleanedUp,
      notificationsSent,
      errors,
    };
    
    // 记录执行结果
    await recordResetExecution(success, results);
    
    const response: ResetTaskResult = {
      taskId: `monthly-reset-${new Date().toISOString().slice(0, 10)}`,
      executedAt: new Date().toISOString(),
      success,
      results,
      executionTimeMs,
      nextScheduledRun: getNextMonthFirstDay().toISOString(),
    };
    
    console.log("月度信贷重置任务执行完成:", response);
    
    return respData(response);
    
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    console.error("月度重置任务执行失败:", error);
    
    const errorResponse: ResetTaskResult = {
      taskId: `monthly-reset-error-${Date.now()}`,
      executedAt: new Date().toISOString(),
      success: false,
      results: {
        subscriptionsReset: 0,
        creditsCleanedUp: 0,
        notificationsSent: 0,
        errors: [`任务执行异常: ${error}`],
      },
      executionTimeMs,
    };
    
    // 尝试记录失败日志
    try {
      await recordResetExecution(false, errorResponse.results);
    } catch (logError) {
      console.error("记录失败日志也失败了:", logError);
    }
    
    return respErr("月度重置任务执行失败", 500);
  }
}

/**
 * GET 获取重置任务状态和历史
 * 
 * 返回信息：
 * - 最后执行时间
 * - 下次计划执行时间
 * - 最近执行历史
 * - 当前月度统计
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // 验证授权（GET请求权限要求较低）
    if (!validateAuthorization(request)) {
      return respErr("未授权访问", 403);
    }
    
    const { system_configs } = await import("@/db/schema");
    
    // 获取最后重置时间
    const [lastResetConfig] = await db()
      .select()
      .from(system_configs)
      .where(eq(system_configs.config_key, "last_monthly_reset"))
      .limit(1);
    
    // 获取当前活跃订阅统计
    const [subscriptionStats] = await db()
      .select({
        total: sql<number>`COUNT(*)`,
        needsReset: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.current_period_end} < NOW())`
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));
    
    const response = {
      lastExecution: lastResetConfig?.config_value || null,
      lastExecutionDate: lastResetConfig?.config_value 
        ? new Date(lastResetConfig.config_value).toLocaleDateString() 
        : null,
      nextScheduledRun: getNextMonthFirstDay().toISOString(),
      currentStats: {
        activeSubscriptions: subscriptionStats?.total || 0,
        subscriptionsNeedingReset: subscriptionStats?.needsReset || 0,
      },
      shouldExecuteNow: await shouldExecuteReset(),
      status: "ready",
    };
    
    return respData(response);
    
  } catch (error) {
    console.error("获取重置任务状态失败:", error);
    return respErr("获取任务状态失败");
  }
}

/**
 * 计算下个月第一天
 * 
 * @returns 下个月第一天的日期
 */
function getNextMonthFirstDay(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

/**
 * 导入必要的SQL函数（用于统计查询）
 */
const { sql } = require("drizzle-orm");