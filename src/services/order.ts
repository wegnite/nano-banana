/**
 * 订单服务层
 * 
 * 功能说明：
 * 处理订单支付相关的业务逻辑，包括：
 * - 订单支付成功处理
 * - Stripe 支付会话处理
 * - 积分充值
 * - 推荐奖励处理
 * 
 * 支付流程：
 * 1. 用户发起支付 -> 创建订单
 * 2. 跳转到支付网关（Stripe/Creem）
 * 3. 支付成功回调
 * 4. 更新订单状态
 * 5. 增加用户积分
 * 6. 处理推荐奖励
 * 
 * @module services/order
 */

import {
  CreditsTransType,
  increaseCredits,
  updateCreditForOrder,
} from "./credit";
import {
  findOrderByOrderNo,
  OrderStatus,
  updateOrderStatus,
} from "@/models/order";
import { getIsoTimestr } from "@/lib/time";

import Stripe from "stripe";
import { updateAffiliateForOrder } from "./affiliate";
import { Order } from "@/types/order";

/**
 * 处理订单支付成功
 * 
 * @param {string} order_no - 订单编号
 * @param {any} paid_detail - 支付详情（支付网关返回的原始数据）
 * @param {string} paid_email - 支付者邮箱（可选）
 * 
 * 业务逻辑：
 * 1. 验证订单状态（必须是已创建未支付）
 * 2. 更新订单状态为已支付
 * 3. 为用户增加积分
 * 4. 处理推荐奖励
 * 
 * 幂等性保证：
 * - 检查订单状态防止重复处理
 * - 积分增加有查重机制
 * 
 * @throws {Error} 当订单不存在或状态异常时
 */
export async function handleOrderPaid(
  order_no: string,
  paid_detail: any,
  paid_email: string = ""
) {
  // 查找订单并验证状态
  const order = await findOrderByOrderNo(order_no);
  if (!order || order.status !== OrderStatus.Created) {
    // 订单不存在或已被处理，防止重复支付
    throw new Error("invalid order");
  }

  // 更新订单状态为已支付
  const paid_at = getIsoTimestr();
  await updateOrderStatus(
    order_no,
    OrderStatus.Paid,
    paid_at,
    paid_email,
    JSON.stringify(paid_detail)  // 保存完整的支付信息供后续查询
  );

  // 处理用户相关业务
  if (order.user_uuid) {
    // 增加用户积分
    if (order.credits > 0) {
      await updateCreditForOrder(order as unknown as Order);
    }
    // 处理推荐奖励
    await updateAffiliateForOrder(order as unknown as Order);
  }

  console.log("handleOrderPaid succeeded:", order_no);
}

/**
 * 处理 Stripe 支付会话
 * 
 * @param {Stripe.Checkout.Session} session - Stripe Checkout 会话对象
 * 
 * Stripe 支付流程：
 * 1. 用户在 Stripe Checkout 页面完成支付
 * 2. Stripe 通过 Webhook 回调通知支付结果
 * 3. 从 session 中提取订单信息
 * 4. 更新订单状态和用户积分
 * 
 * 重要字段：
 * - session.metadata.order_no: 订单编号（在创建 session 时设置）
 * - session.payment_status: 支付状态，必须为 "paid"
 * - session.customer_details: 客户信息
 * 
 * 安全注意：
 * - 验证 session 的完整性
 * - 检查订单状态防止重复处理
 * - 记录完整的 session 信息供审计
 * 
 * @throws {Error} 当 session 无效或订单异常时
 */
export async function handleOrderSession(session: Stripe.Checkout.Session) {
  try {
    // 验证 Stripe session 有效性
    if (
      !session ||
      !session.metadata ||
      !session.metadata.order_no ||
      session.payment_status !== "paid"
    ) {
      throw new Error("invalid session");
    }

    // 提取订单信息
    const order_no = session.metadata.order_no;
    const paid_email =
      session.customer_details?.email || session.customer_email || "";
    const paid_detail = JSON.stringify(session);  // 保存完整 session 信息

    // 查找并验证订单
    const order = await findOrderByOrderNo(order_no);
    if (!order || order.status !== OrderStatus.Created) {
      // 订单不存在或已处理
      throw new Error("invalid order");
    }

    // 更新订单状态
    const paid_at = getIsoTimestr();
    await updateOrderStatus(
      order_no,
      OrderStatus.Paid,
      paid_at,
      paid_email,
      paid_detail
    );

    // 处理用户积分和推荐奖励
    if (order.user_uuid) {
      if (order.credits > 0) {
        // 为已支付订单增加积分
        await updateCreditForOrder(order as unknown as Order);
      }

      // 更新推荐关系和奖励
      await updateAffiliateForOrder(order as unknown as Order);
    }

    console.log(
      "handle order session successed: ",
      order_no,
      paid_at,
      paid_email,
      paid_detail
    );
  } catch (e) {
    console.log("handle order session failed: ", e);
    throw e;
  }
}
