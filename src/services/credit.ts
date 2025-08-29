/**
 * 积分服务层
 * 
 * 功能说明：
 * 管理用户积分的核心业务逻辑，包括：
 * - 积分查询、增加、减少
 * - 积分交易记录
 * - 订单积分处理
 * - 积分有效期管理
 * 
 * 积分系统设计：
 * - 每笔积分都有独立的交易记录
 * - 支持积分过期机制
 * - 先进先出（FIFO）消费策略
 * - 支持多种积分来源类型
 * 
 * @module services/credit
 */

import {
  findCreditByOrderNo,
  getUserValidCredits,
  insertCredit,
} from "@/models/credit";
import { credits as creditsTable } from "@/db/schema";
import { getIsoTimestr } from "@/lib/time";
import { getSnowId } from "@/lib/hash";
import { Order } from "@/types/order";
import { UserCredits } from "@/types/user";
import { getFirstPaidOrderByUserUuid } from "@/models/order";

/**
 * 积分交易类型枚举
 * 
 * 定义所有可能的积分变动原因
 * 用于追踪积分来源和消费用途
 */
export enum CreditsTransType {
  NewUser = "new_user",     // 新用户注册赠送
  OrderPay = "order_pay",   // 用户付费购买
  SystemAdd = "system_add", // 系统奖励（如活动赠送）
  Ping = "ping",           // API 调用消耗
}

/**
 * 积分数量预设值
 * 
 * 定义系统中常用的积分数量
 * 便于统一管理和调整
 */
export enum CreditsAmount {
  NewUserGet = 10,  // 新用户注册赠送数量
  PingCost = 1,     // 单次 API 调用消耗数量
}

/**
 * 获取用户积分信息
 * 
 * @param {string} user_uuid - 用户唯一标识
 * @returns {Promise<UserCredits>} 用户积分详情
 * 
 * 返回信息包括：
 * - left_credits: 剩余积分数量
 * - is_recharged: 是否充值过（有付费记录）
 * - is_pro: 是否为专业用户（积分>0）
 * 
 * 业务逻辑：
 * 1. 检查用户是否有付费记录
 * 2. 汇总所有有效积分（未过期）
 * 3. 确保积分不为负数
 * 4. 根据积分判断用户等级
 * 
 * 注意事项：
 * - 只计算未过期的积分
 * - 错误时返回默认值，不抛出异常
 */
export async function getUserCredits(user_uuid: string): Promise<UserCredits> {
  let user_credits: UserCredits = {
    left_credits: 0,
  };

  try {
    // 检查是否有付费记录
    const first_paid_order = await getFirstPaidOrderByUserUuid(user_uuid);
    if (first_paid_order) {
      user_credits.is_recharged = true;
    }

    // 获取所有有效积分记录
    const credits = await getUserValidCredits(user_uuid);
    if (credits) {
      // 汇总积分总额
      credits.forEach((v) => {
        user_credits.left_credits += v.credits || 0;
      });
    }

    // 确保积分不为负数
    if (user_credits.left_credits < 0) {
      user_credits.left_credits = 0;
    }

    // 有积分则标记为专业用户
    if (user_credits.left_credits > 0) {
      user_credits.is_pro = true;
    }

    return user_credits;
  } catch (e) {
    console.log("get user credits failed: ", e);
    return user_credits;
  }
}

/**
 * 减少用户积分
 * 
 * @param {Object} params - 参数对象
 * @param {string} params.user_uuid - 用户唯一标识
 * @param {CreditsTransType} params.trans_type - 交易类型
 * @param {number} params.credits - 要扣除的积分数量
 * 
 * 消费策略：
 * - 采用先进先出（FIFO）原则
 * - 优先消耗即将过期的积分
 * - 记录负数积分作为消费记录
 * 
 * 实现逻辑：
 * 1. 获取用户所有有效积分
 * 2. 按时间顺序累加直到满足消费数量
 * 3. 记录最后使用的积分批次信息
 * 4. 创建负数积分记录表示消费
 * 
 * @throws {Error} 当数据库操作失败时抛出异常
 */
export async function decreaseCredits({
  user_uuid,
  trans_type,
  credits,
}: {
  user_uuid: string;
  trans_type: CreditsTransType;
  credits: number;
}) {
  try {
    let order_no = "";
    let expired_at = "";
    let left_credits = 0;

    // 获取用户所有有效积分（按时间排序）
    const userCredits = await getUserValidCredits(user_uuid);
    if (userCredits) {
      // FIFO 策略：按顺序消耗积分
      for (let i = 0, l = userCredits.length; i < l; i++) {
        const credit = userCredits[i];
        left_credits += credit.credits;

        // 累计积分足够支付
        if (left_credits >= credits) {
          // 记录最后使用的积分批次信息
          order_no = credit.order_no || "";
          expired_at = credit.expired_at?.toISOString() || "";
          break;
        }

        // 继续查找下一批积分
      }
    }

    // 创建消费记录（负数积分）
    const new_credit: typeof creditsTable.$inferInsert = {
      trans_no: getSnowId(),  // 生成唯一交易号
      created_at: new Date(getIsoTimestr()),
      expired_at: new Date(expired_at),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: 0 - credits,  // 负数表示消费
      order_no: order_no,
    };
    await insertCredit(new_credit);
  } catch (e) {
    console.log("decrease credits failed: ", e);
    throw e;
  }
}

/**
 * 增加用户积分
 * 
 * @param {Object} params - 参数对象
 * @param {string} params.user_uuid - 用户唯一标识
 * @param {string} params.trans_type - 交易类型
 * @param {number} params.credits - 要增加的积分数量
 * @param {string} [params.expired_at] - 积分过期时间（可选）
 * @param {string} [params.order_no] - 关联订单号（可选）
 * 
 * 使用场景：
 * - 新用户注册赠送
 * - 用户充值购买
 * - 系统活动奖励
 * - 补偿或退款
 * 
 * 注意事项：
 * - 积分数量必须为正数
 * - 过期时间为空则永不过期
 * - order_no 用于关联支付订单
 * 
 * @throws {Error} 当数据库操作失败时抛出异常
 */
export async function increaseCredits({
  user_uuid,
  trans_type,
  credits,
  expired_at,
  order_no,
}: {
  user_uuid: string;
  trans_type: string;
  credits: number;
  expired_at?: string;
  order_no?: string;
}) {
  try {
    // 创建积分增加记录
    const new_credit: typeof creditsTable.$inferInsert = {
      trans_no: getSnowId(),  // 生成唯一交易号
      created_at: new Date(getIsoTimestr()),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: credits,  // 正数表示增加
      order_no: order_no || "",
      expired_at: expired_at ? new Date(expired_at) : null,  // null 表示永不过期
    };
    await insertCredit(new_credit);
  } catch (e) {
    console.log("increase credits failed: ", e);
    throw e;
  }
}

/**
 * 扣除用户积分（用于消费场景）
 * 
 * @param {string} user_uuid - 用户唯一标识
 * @param {number} amount - 要扣除的积分数量
 * @param {string} type - 消费类型（如 'IMAGE_GENERATION'）
 * @param {string} [description] - 消费描述（可选）
 * @returns {Promise<boolean>} 扣除是否成功
 * 
 * 业务逻辑：
 * 1. 检查用户是否有足够的积分
 * 2. 如果积分充足，执行扣除操作
 * 3. 记录消费交易
 * 
 * 注意事项：
 * - 积分不足时返回 false，不会执行扣除
 * - 成功扣除后返回 true
 * - 使用现有的 decreaseCredits 函数
 */
export async function deductCredits(
  user_uuid: string,
  amount: number,
  type: string,
  description?: string
): Promise<boolean> {
  try {
    // 检查用户积分是否充足
    const userCredits = await getUserCredits(user_uuid);
    if (userCredits.left_credits < amount) {
      console.log(`User ${user_uuid} has insufficient credits: ${userCredits.left_credits} < ${amount}`);
      return false;
    }

    // 执行扣除操作
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping, // 使用 Ping 类型表示 API 消费
      credits: amount,
    });

    console.log(`Successfully deducted ${amount} credits from user ${user_uuid} for ${type}`);
    return true;
  } catch (e) {
    console.log("deduct credits failed: ", e);
    return false;
  }
}

/**
 * 为订单更新积分
 * 
 * @param {Order} order - 订单对象
 * 
 * 业务逻辑：
 * 1. 检查订单是否已经处理过（防止重复充值）
 * 2. 如果未处理，为用户增加对应积分
 * 3. 关联订单号便于追踪
 * 
 * 幂等性保证：
 * - 通过订单号查重确保不会重复充值
 * - 支付回调可能多次调用，必须保证幂等
 * 
 * 使用场景：
 * - 支付成功回调处理
 * - 订单状态变更为已支付
 * - 手动补单操作
 * 
 * @throws {Error} 当数据库操作失败时抛出异常
 */
export async function updateCreditForOrder(order: Order) {
  try {
    // 检查订单是否已处理（防止重复充值）
    const credit = await findCreditByOrderNo(order.order_no);
    if (credit) {
      // 订单已经增加过积分，直接返回
      return;
    }

    // 为用户增加积分
    await increaseCredits({
      user_uuid: order.user_uuid,
      trans_type: CreditsTransType.OrderPay,  // 标记为订单支付类型
      credits: order.credits,
      expired_at: order.expired_at,
      order_no: order.order_no,  // 关联订单号
    });
  } catch (e) {
    console.log("update credit for order failed: ", e);
    throw e;
  }
}

/**
 * 检查用户是否有足够的积分（用于视频生成等高消耗场景）
 * 
 * @param {string} userId - 用户ID
 * @param {number} requiredAmount - 需要的积分数量
 * @returns {Promise<boolean>} 是否有足够积分
 */
export async function checkUserCredits(userId: string, requiredAmount: number): Promise<boolean> {
  const userCredits = await getUserCredits(userId);
  return userCredits.left_credits >= requiredAmount;
}

/**
 * 扣除用户积分（视频生成专用）
 * 
 * @param {string} userId - 用户ID
 * @param {number} amount - 扣除数量
 * @param {string} reason - 扣除原因
 */
export async function deductUserCredits(
  userId: string,
  amount: number,
  reason: string = 'video_generation'
): Promise<void> {
  await decreaseCredits({
    user_uuid: userId,
    trans_type: CreditsTransType.Ping, // 使用API消费类型
    credits: amount,
  });
}

/**
 * 扣除用户积分（通用接口，兼容旧代码）
 * 
 * @param {string} userId - 用户ID
 * @param {number} amount - 扣除数量
 * @param {CreditType} creditType - 积分类型
 */
export async function deductUserCredit(
  userId: string,
  amount: number,
  creditType: CreditType
): Promise<void> {
  await decreaseCredits({
    user_uuid: userId,
    trans_type: CreditsTransType.Ping,
    credits: amount,
  });
}

// 定义CreditType以兼容其他模块
export type CreditType = 'video_generation' | 'image_generation' | 'api_call';
