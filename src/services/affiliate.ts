/**
 * 推荐奖励服务层
 * 
 * 功能说明：
 * 处理用户推荐系统的奖励逻辑
 * 当被推荐用户完成支付时，给推荐人记录奖励
 * 
 * 推荐系统设计：
 * - 用户通过邀请码邀请新用户
 * - 新用户注册时关联推荐人
 * - 新用户首次付费时触发奖励
 * - 奖励金额和比例可配置
 * 
 * @module services/affiliate
 */

import { findAffiliateByOrderNo, insertAffiliate } from "@/models/affiliate";

import { AffiliateRewardAmount } from "./constant";
import { AffiliateRewardPercent } from "./constant";
import { AffiliateStatus } from "./constant";
import { Order } from "@/types/order";
import { findUserByUuid } from "@/models/user";
import { getIsoTimestr } from "@/lib/time";

/**
 * 为订单更新推荐奖励
 * 
 * @param {Order} order - 已支付的订单对象
 * 
 * 业务逻辑：
 * 1. 查找下单用户的推荐人
 * 2. 验证推荐关系有效性
 * 3. 检查是否已处理（防止重复奖励）
 * 4. 创建推荐奖励记录
 * 
 * 推荐关系验证：
 * - 用户必须有推荐人（invited_by 字段）
 * - 不能自己推荐自己
 * - 订单必须是首次处理
 * 
 * 奖励规则：
 * - 奖励比例：AffiliateRewardPercent.Paied
 * - 奖励金额：AffiliateRewardAmount.Paied
 * - 可在 constant.ts 中配置
 * 
 * 使用场景：
 * - 订单支付成功后自动调用
 * - 手动补发推荐奖励
 * 
 * @throws {Error} 当数据库操作失败时抛出异常
 */
export async function updateAffiliateForOrder(order: Order) {
  try {
    // 查找下单用户信息
    const user = await findUserByUuid(order.user_uuid);
    
    // 验证推荐关系
    if (user && user.uuid && user.invited_by && user.invited_by !== user.uuid) {
      // 检查该订单是否已处理过推荐奖励（防止重复）
      const affiliate = await findAffiliateByOrderNo(order.order_no);
      if (affiliate) {
        // 已处理过，直接返回
        return;
      }

      // 创建推荐奖励记录
      await insertAffiliate({
        user_uuid: user.uuid,           // 被推荐人（下单用户）
        invited_by: user.invited_by,    // 推荐人
        created_at: new Date(),
        status: AffiliateStatus.Completed,  // 奖励状态：已完成
        paid_order_no: order.order_no,      // 关联订单号
        paid_amount: order.amount,           // 订单金额
        reward_percent: AffiliateRewardPercent.Paied,  // 奖励比例
        reward_amount: AffiliateRewardAmount.Paied,    // 奖励金额
      });
    }
  } catch (e) {
    console.log("update affiliate for order failed: ", e);
    throw e;
  }
}
