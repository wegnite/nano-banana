/**
 * 服务层常量定义
 * 
 * 功能说明：
 * 定义服务层使用的各种常量，包括：
 * - 缓存键名
 * - 推荐奖励状态
 * - 推荐奖励配置
 * 
 * @module services/constant
 */

/**
 * 本地缓存键名常量
 * 
 * 用于 localStorage 存储的键名统一管理
 * 避免硬编码和键名冲突
 */
export const CacheKey = {
  Theme: "THEME",           // 用户主题偏好（深色/浅色模式）
  InviteCode: "INVITE_CODE", // 邀请码（用于新用户注册时关联推荐人）
};

/**
 * 推荐奖励状态枚举
 * 
 * 用于跟踪推荐奖励的处理状态
 */
export const AffiliateStatus = {
  Pending: "pending",     // 待处理（用户已注册但未付费）
  Completed: "completed", // 已完成（用户已付费，奖励已发放）
};

/**
 * 推荐奖励比例配置
 * 
 * 定义不同阶段的奖励比例
 * 单位：百分比
 * 
 * 业务说明：
 * - Invited: 仅邀请注册时的奖励比例（当前为0）
 * - Paied: 被邀请用户付费后的奖励比例（20%）
 */
export const AffiliateRewardPercent = {
  Invited: 0,    // 邀请注册奖励：0%
  Paied: 20,     // 付费转化奖励：20%
};

/**
 * 推荐奖励金额配置
 * 
 * 定义固定的奖励金额
 * 单位：分（cents），需要除以100得到美元金额
 * 
 * 业务说明：
 * - Invited: 仅邀请注册的固定奖励（当前为$0）
 * - Paied: 被邀请用户付费后的固定奖励（$50）
 * 
 * 注意：
 * - 实际奖励可能同时使用比例和固定金额
 * - 具体规则在 affiliate 服务中实现
 */
export const AffiliateRewardAmount = {
  Invited: 0,     // 邀请注册奖励：$0
  Paied: 5000,    // 付费转化奖励：$50（5000分）
};
