/**
 * 数据库Schema定义文件
 * 
 * 功能：定义整个应用的数据库表结构
 * 技术栈：使用Drizzle ORM + PostgreSQL
 * 
 * 包含的核心表：
 * - users: 用户信息表（包含完整的归因追踪字段）
 * - orders: 订单表（支持多种支付方式）
 * - subscriptions: 订阅管理表
 * - visitor_logs: 访问日志表（用于用户行为分析）
 * - credits: 积分交易表
 * - apikeys: API密钥管理表
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * 用户表 - 存储用户基本信息和归因数据
 * 
 * 特性：
 * - 支持多种登录方式（OAuth、邮箱等）
 * - 完整的用户归因追踪（17个归因字段）
 * - 支持邀请码系统
 * - 记录首次访问的完整信息
 */
export const users = pgTable(
  "users",
  {
    // 基础字段
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),     // 用户唯一标识符
    email: varchar({ length: 255 }).notNull(),             // 邮箱地址
    created_at: timestamp({ withTimezone: true }),         // 创建时间
    nickname: varchar({ length: 255 }),                    // 昵称
    avatar_url: varchar({ length: 255 }),                  // 头像URL
    locale: varchar({ length: 50 }),                       // 语言偏好（zh, en等）
    
    // 登录信息
    signin_type: varchar({ length: 50 }),                  // 登录类型（oauth, email等）
    signin_ip: varchar({ length: 255 }),                   // 登录IP地址
    signin_provider: varchar({ length: 50 }),              // OAuth提供商（google, github等）
    signin_openid: varchar({ length: 255 }),               // OAuth用户ID
    
    // 邀请系统
    invite_code: varchar({ length: 255 }).notNull().default(""),  // 用户的邀请码
    invited_by: varchar({ length: 255 }).notNull().default(""),   // 邀请人的邀请码
    is_affiliate: boolean().notNull().default(false),              // 是否为推广用户
    
    updated_at: timestamp({ withTimezone: true }),         // 更新时间
    
    // ========== 用户归因字段 ==========
    // UTM参数追踪
    attribution_source: varchar({ length: 100 }),          // 来源渠道（google, baidu, direct等）
    attribution_medium: varchar({ length: 100 }),          // 媒介类型（cpc, organic, social, referral）
    attribution_campaign: varchar({ length: 255 }),        // 营销活动名称
    attribution_term: varchar({ length: 255 }),            // 搜索关键词
    attribution_content: varchar({ length: 255 }),         // 广告内容标识
    attribution_landing: varchar({ length: 500 }),         // 着陆页URL
    
    // 首次访问信息
    first_visit_at: timestamp({ withTimezone: true }),     // 首次访问时间
    first_referrer: varchar({ length: 500 }),              // 首次来源页面URL
    first_user_agent: text(),                              // 首次访问的User Agent
    first_ip_address: varchar({ length: 45 }),             // 首次访问IP（支持IPv6）
    
    // 地理位置信息
    first_country: varchar({ length: 100 }),               // 首次访问国家
    first_region: varchar({ length: 100 }),                // 首次访问省份/州
    first_city: varchar({ length: 100 }),                  // 首次访问城市
    
    // 设备信息
    first_device_type: varchar({ length: 50 }),            // 设备类型（desktop, mobile, tablet）
    first_os: varchar({ length: 50 }),                     // 操作系统（Windows, Mac, iOS, Android）
    first_browser: varchar({ length: 50 }),                // 浏览器（Chrome, Safari, Firefox）
    first_language: varchar({ length: 10 }),               // 浏览器语言（zh-CN, en-US等）
  },
  (table) => [
    // 复合唯一索引：同一邮箱可以用不同的OAuth提供商登录
    uniqueIndex("email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

/**
 * 订单表 - 记录所有支付订单
 * 
 * 特性：
 * - 支持一次性付款和订阅
 * - 支持Stripe和Creem两种支付方式
 * - 记录订单创建时的完整归因信息
 * - 支持积分充值订单
 */
export const orders = pgTable("orders", {
  // 基础字段
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  order_no: varchar({ length: 255 }).notNull().unique(),           // 订单号
  created_at: timestamp({ withTimezone: true }),                   // 创建时间
  
  // 用户信息
  user_uuid: varchar({ length: 255 }).notNull().default(""),      // 用户UUID
  user_email: varchar({ length: 255 }).notNull().default(""),     // 用户邮箱
  
  // 金额和状态
  amount: integer().notNull(),                                     // 金额（单位：分）
  status: varchar({ length: 50 }).notNull(),                       // 订单状态（pending, paid, failed, refunded）
  currency: varchar({ length: 50 }),                               // 货币类型（USD, CNY等）
  
  // 订阅相关
  interval: varchar({ length: 50 }),                               // 计费周期（monthly, yearly）
  expired_at: timestamp({ withTimezone: true }),                   // 过期时间
  sub_id: varchar({ length: 255 }),                                // 订阅ID
  sub_interval_count: integer(),                                   // 订阅周期数
  sub_cycle_anchor: integer(),                                     // 订阅锚定时间
  sub_period_end: integer(),                                       // 订阅周期结束
  sub_period_start: integer(),                                     // 订阅周期开始
  sub_times: integer(),                                            // 订阅次数
  
  // 支付信息
  stripe_session_id: varchar({ length: 255 }),                     // Stripe会话ID
  paid_at: timestamp({ withTimezone: true }),                      // 支付时间
  paid_email: varchar({ length: 255 }),                            // 支付邮箱
  paid_detail: text(),                                             // 支付详情JSON
  
  // 产品信息
  product_id: varchar({ length: 255 }),                            // 产品ID
  product_name: varchar({ length: 255 }),                          // 产品名称
  credits: integer().notNull(),                                    // 充值积分数
  valid_months: integer(),                                         // 有效月数
  order_detail: text(),                                            // 订单详情JSON
  
  // ========== 订单归因字段 ==========
  // 来源追踪
  order_source: varchar({ length: 100 }),                          // 订单来源渠道
  order_medium: varchar({ length: 100 }),                          // 订单媒介
  order_campaign: varchar({ length: 255 }),                        // 订单营销活动
  
  // 设备信息
  order_device_type: varchar({ length: 50 }),                      // 下单设备类型
  order_os: varchar({ length: 50 }),                               // 下单操作系统
  order_browser: varchar({ length: 50 }),                          // 下单浏览器
  order_user_agent: text(),                                        // 下单User Agent
  
  // 位置信息
  order_ip_address: varchar({ length: 45 }),                       // 下单IP地址
  order_country: varchar({ length: 100 }),                         // 下单国家
  order_region: varchar({ length: 100 }),                          // 下单地区
  order_city: varchar({ length: 100 }),                            // 下单城市
  
  // 页面信息
  order_page_url: varchar({ length: 500 }),                        // 下单页面URL
  order_session_id: varchar({ length: 100 }),                      // 会话ID
});

/**
 * API密钥表 - 管理用户的API访问密钥
 * 
 * 用途：
 * - 允许用户通过API调用服务
 * - 支持多个密钥管理
 * - 密钥状态控制
 */
export const apikeys = pgTable("apikeys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  api_key: varchar({ length: 255 }).notNull().unique(),            // API密钥
  title: varchar({ length: 100 }),                                 // 密钥名称/描述
  user_uuid: varchar({ length: 255 }).notNull(),                   // 所属用户
  created_at: timestamp({ withTimezone: true }),                   // 创建时间
  status: varchar({ length: 50 }),                                 // 状态（active, disabled, expired）
});

/**
 * 积分交易表 - 记录所有积分变动
 * 
 * 用途：
 * - 追踪积分充值、消费记录
 * - 支持积分过期机制
 * - 关联订单信息
 */
export const credits = pgTable("credits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),           // 交易号
  created_at: timestamp({ withTimezone: true }),                   // 交易时间
  user_uuid: varchar({ length: 255 }).notNull(),                   // 用户UUID
  trans_type: varchar({ length: 50 }).notNull(),                   // 交易类型（recharge, consume, expire, refund）
  credits: integer().notNull(),                                    // 积分数量（正数充值，负数消费）
  order_no: varchar({ length: 255 }),                              // 关联订单号
  expired_at: timestamp({ withTimezone: true }),                   // 过期时间
});

/**
 * 文章表 - 存储博客/帮助文档
 * 
 * 用途：
 * - 发布产品更新、使用教程
 * - 支持多语言
 * - SEO优化
 */
export const posts = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),               // 文章UUID
  slug: varchar({ length: 255 }),                                  // URL别名（用于SEO友好URL）
  title: varchar({ length: 255 }),                                 // 标题
  description: text(),                                             // 描述/摘要
  content: text(),                                                 // 正文内容（Markdown格式）
  created_at: timestamp({ withTimezone: true }),                   // 创建时间
  updated_at: timestamp({ withTimezone: true }),                   // 更新时间
  status: varchar({ length: 50 }),                                 // 状态（draft, published, archived）
  cover_url: varchar({ length: 255 }),                             // 封面图URL
  author_name: varchar({ length: 255 }),                           // 作者名称
  author_avatar_url: varchar({ length: 255 }),                     // 作者头像
  locale: varchar({ length: 50 }),                                 // 语言（zh, en）
});

/**
 * 推广用户表 - 记录推广佣金信息
 * 
 * 用途：
 * - 追踪推广关系
 * - 计算推广佣金
 * - 管理推广状态
 */
export const affiliates = pgTable("affiliates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull(),                   // 被推广用户UUID
  created_at: timestamp({ withTimezone: true }),                   // 创建时间
  status: varchar({ length: 50 }).notNull().default(""),          // 状态（pending, approved, paid）
  invited_by: varchar({ length: 255 }).notNull(),                 // 推广人UUID
  paid_order_no: varchar({ length: 255 }).notNull().default(""),  // 付费订单号
  paid_amount: integer().notNull().default(0),                    // 付费金额
  reward_percent: integer().notNull().default(0),                 // 佣金比例（%）
  reward_amount: integer().notNull().default(0),                  // 佣金金额
});

/**
 * 反馈表 - 收集用户反馈
 * 
 * 用途：
 * - 收集产品改进建议
 * - 记录用户满意度
 * - 问题追踪
 */
export const feedbacks = pgTable("feedbacks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp({ withTimezone: true }),                   // 创建时间
  status: varchar({ length: 50 }),                                 // 状态（pending, processing, resolved）
  user_uuid: varchar({ length: 255 }),                             // 用户UUID（可为空，支持匿名反馈）
  content: text(),                                                 // 反馈内容
  rating: integer(),                                                // 评分（1-5星）
});

/**
 * 访问日志表 - 记录所有页面访问
 * 
 * 用途：
 * - 追踪用户行为路径
 * - 分析流量来源
 * - 优化转化漏斗
 * - 支持实时分析
 */
export const visitorLogs = pgTable("visitor_logs", {
  // 基础标识
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  visitor_id: varchar({ length: 100 }).notNull(),                  // 访客ID（未登录用户的唯一标识）
  user_uuid: varchar({ length: 255 }),                             // 用户UUID（已登录用户）
  session_id: varchar({ length: 100 }).notNull(),                  // 会话ID
  visited_at: timestamp({ withTimezone: true }).notNull(),         // 访问时间
  
  // 页面信息
  page_url: varchar({ length: 500 }),                              // 当前页面URL
  referrer: varchar({ length: 500 }),                              // 来源页面URL
  
  // UTM参数（用于营销追踪）
  utm_source: varchar({ length: 100 }),                            // 流量来源
  utm_medium: varchar({ length: 100 }),                            // 流量媒介
  utm_campaign: varchar({ length: 255 }),                          // 营销活动
  utm_term: varchar({ length: 255 }),                              // 搜索关键词
  utm_content: varchar({ length: 255 }),                           // 广告内容标识
  
  // 设备信息
  user_agent: text(),                                              // 完整的User Agent字符串
  device_type: varchar({ length: 50 }),                            // 设备类型
  os: varchar({ length: 50 }),                                     // 操作系统
  os_version: varchar({ length: 50 }),                             // 系统版本
  browser: varchar({ length: 50 }),                                // 浏览器
  browser_version: varchar({ length: 50 }),                        // 浏览器版本
  
  // 地理位置（通过IP解析）
  ip_address: varchar({ length: 45 }),                             // IP地址
  country: varchar({ length: 100 }),                               // 国家
  country_code: varchar({ length: 10 }),                           // 国家代码（CN, US等）
  region: varchar({ length: 100 }),                                // 省份/州
  city: varchar({ length: 100 }),                                  // 城市
  timezone: varchar({ length: 100 }),                              // 时区
  
  // 其他信息
  language: varchar({ length: 10 }),                               // 浏览器语言
  screen_resolution: varchar({ length: 20 }),                      // 屏幕分辨率（1920x1080）
  viewport_size: varchar({ length: 20 }),                          // 视口大小
  color_depth: integer(),                                          // 颜色深度（位）
});

/**
 * 订阅表 - 管理用户订阅状态
 * 
 * 用途：
 * - 管理订阅生命周期
 * - 追踪使用量限制
 * - 支持多种计费模式
 */
export const subscriptions = pgTable("subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  
  // 用户标识
  user_uuid: varchar({ length: 255 }).notNull().unique(),         // 用户UUID（唯一）
  user_email: varchar({ length: 255 }).notNull(),                 // 用户邮箱
  
  // 订阅计划
  plan_id: varchar({ length: 50 }).notNull(),                     // 计划ID（basic, pro, enterprise）
  plan_name: varchar({ length: 100 }).notNull(),                  // 计划名称
  
  // 订阅状态
  status: varchar({ length: 50 }).notNull(),                      // 状态（active, cancelled, expired, paused）
  
  // 计费信息
  interval: varchar({ length: 20 }).notNull(),                    // 计费周期（monthly, yearly）
  price: integer().notNull(),                                     // 价格（单位：分）
  currency: varchar({ length: 10 }).notNull().default("USD"),     // 货币类型
  
  // 时间管理
  started_at: timestamp({ withTimezone: true }).notNull(),        // 订阅开始时间
  current_period_start: timestamp({ withTimezone: true }).notNull(), // 当前计费周期开始
  current_period_end: timestamp({ withTimezone: true }).notNull(),   // 当前计费周期结束
  cancelled_at: timestamp({ withTimezone: true }),                   // 取消时间
  
  // 支付集成
  stripe_subscription_id: varchar({ length: 255 }),               // Stripe订阅ID
  stripe_customer_id: varchar({ length: 255 }),                   // Stripe客户ID
  last_payment_at: timestamp({ withTimezone: true }),             // 最后支付时间
  next_payment_at: timestamp({ withTimezone: true }),             // 下次支付时间
  
  // 使用限制
  monthly_limit: integer(),                                       // 每月使用限制（null = 无限）
  used_this_month: integer().notNull().default(0),               // 本月已使用次数
  
  // 元数据
  created_at: timestamp({ withTimezone: true }).defaultNow(),     // 创建时间
  updated_at: timestamp({ withTimezone: true }).defaultNow(),     // 更新时间
});

/**
 * 订阅计划表 - 定义可用的订阅计划
 * 
 * 用途：
 * - 配置不同等级的订阅计划
 * - 设置价格和限制
 * - 管理计划特权
 */
export const subscription_plans = pgTable("subscription_plans", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  
  // 计划标识
  plan_id: varchar({ length: 50 }).notNull().unique(),            // 计划ID
  plan_name: varchar({ length: 100 }).notNull(),                  // 计划名称
  description: varchar({ length: 500 }),                          // 计划描述
  
  // 价格设置
  monthly_price: integer().notNull(),                             // 月付价格（分）
  yearly_price: integer().notNull(),                              // 年付价格（分）
  currency: varchar({ length: 10 }).notNull().default("USD"),     // 货币
  
  // 使用限制
  monthly_generation_limit: integer(),                            // 每月生成限制（null = 无限）
  daily_generation_limit: integer(),                              // 每日生成限制（null = 无限）
  
  // 性能配置
  priority_queue: boolean().notNull().default(false),             // 是否享有优先队列
  generation_speed: varchar({ length: 20 }).notNull().default("normal"), // 生成速度（slow, normal, fast）
  
  // 其他特权
  support_level: varchar({ length: 20 }).notNull().default("basic"),    // 支持级别（basic, priority, dedicated）
  api_access: boolean().notNull().default(false),                      // 是否可访问API
  custom_models: boolean().notNull().default(false),                   // 是否可使用自定义模型
  
  // 状态管理
  is_active: boolean().notNull().default(true),                        // 是否激活
  is_featured: boolean().notNull().default(false),                     // 是否推荐

  // 时间戳
  created_at: timestamp({ withTimezone: true }).defaultNow(),           // 创建时间
  updated_at: timestamp({ withTimezone: true }).defaultNow(),           // 更新时间
});

/**
 * 角色图像生成历史表 - 存储所有角色图像生成记录
 * 
 * 用途：
 * - 追踪用户的角色生成历史
 * - 支持再次生成相同参数的图像
 * - 分析用户偏好和使用模式
 * - 提供生成数据用于优化算法
 */
export const character_generations = pgTable("character_generations", {
  // 基础字段
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),                   // 生成记录唯一标识
  user_uuid: varchar({ length: 255 }).notNull(),                       // 用户UUID
  created_at: timestamp({ withTimezone: true }).defaultNow(),           // 生成时间

  // 生成参数
  original_prompt: text().notNull(),                                    // 原始用户输入
  enhanced_prompt: text(),                                              // 优化后的提示词
  style: varchar({ length: 50 }).notNull(),                            // 角色风格
  pose: varchar({ length: 50 }).notNull(),                             // 角色姿势
  gender: varchar({ length: 20 }).notNull(),                           // 角色性别
  age: varchar({ length: 20 }).notNull(),                              // 角色年龄组

  // 可选参数
  style_keywords: text(),                                               // JSON数组格式的风格关键词
  clothing: text(),                                                     // 服装描述
  background: text(),                                                   // 背景描述
  color_palette: varchar({ length: 100 }),                             // 色彩方案
  aspect_ratio: varchar({ length: 10 }).notNull().default("1:1"),      // 宽高比
  quality: varchar({ length: 20 }).notNull().default("standard"),      // 质量设置
  num_images: integer().notNull().default(1),                          // 生成图片数量
  seed: integer(),                                                      // 随机种子

  // 生成结果
  generated_images: text(),                                             // JSON格式的图片信息
  generation_time: integer().notNull(),                                // 生成耗时（毫秒）
  credits_used: integer().notNull(),                                   // 消耗积分数
  
  // nano-banana API 响应信息
  nano_banana_request_id: varchar({ length: 255 }),                    // nano-banana请求ID
  nano_banana_response: text(),                                        // 完整API响应（JSON）

  // 用户操作
  is_favorited: boolean().notNull().default(false),                    // 是否收藏
  is_deleted: boolean().notNull().default(false),                      // 是否删除
  gallery_item_id: varchar({ length: 255 }),                           // 关联的画廊项目ID（如果分享）

  // 技术信息
  client_info: text(),                                                  // JSON格式的客户端信息
  generation_params: text(),                                            // JSON格式的完整生成参数
});

/**
 * 角色画廊表 - 公开展示的角色图像
 * 
 * 用途：
 * - 用户分享优秀作品到公共画廊
 * - 社区展示和交流
 * - 为其他用户提供灵感
 * - 支持点赞、评论、收藏功能
 */
export const character_gallery = pgTable("character_gallery", {
  // 基础字段
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),                   // 画廊项目唯一标识
  generation_id: varchar({ length: 255 }).notNull(),                   // 关联的生成记录ID
  user_uuid: varchar({ length: 255 }).notNull(),                       // 创作者UUID
  created_at: timestamp({ withTimezone: true }).defaultNow(),           // 发布时间

  // 展示信息
  title: varchar({ length: 255 }).notNull(),                           // 作品标题
  description: text(),                                                  // 作品描述
  tags: text(),                                                         // JSON数组格式的标签

  // 图像信息
  image_url: varchar({ length: 500 }).notNull(),                       // 主图片URL
  thumbnail_url: varchar({ length: 500 }),                             // 缩略图URL
  image_width: integer(),                                               // 图片宽度
  image_height: integer(),                                              // 图片高度

  // 角色信息（冗余存储便于查询）
  style: varchar({ length: 50 }).notNull(),                            // 角色风格
  pose: varchar({ length: 50 }).notNull(),                             // 角色姿势
  enhanced_prompt: text(),                                              // 优化后提示词

  // 社交统计
  likes_count: integer().notNull().default(0),                         // 点赞数
  views_count: integer().notNull().default(0),                         // 浏览数
  bookmarks_count: integer().notNull().default(0),                     // 收藏数
  comments_count: integer().notNull().default(0),                      // 评论数

  // 状态管理
  is_public: boolean().notNull().default(true),                        // 是否公开
  is_featured: boolean().notNull().default(false),                     // 是否推荐
  is_reported: boolean().notNull().default(false),                     // 是否被举报
  is_approved: boolean().notNull().default(true),                      // 是否审核通过

  // 创作者信息（冗余存储）
  creator_username: varchar({ length: 255 }),                          // 创作者用户名
  creator_avatar: varchar({ length: 255 }),                            // 创作者头像

  updated_at: timestamp({ withTimezone: true }).defaultNow(),           // 更新时间
});

/**
 * 画廊互动表 - 记录用户对画廊作品的互动
 * 
 * 用途：
 * - 记录点赞、收藏、举报等操作
 * - 防止重复操作
 * - 支持用户个人收藏列表
 * - 提供个性化推荐数据
 */
export const gallery_interactions = pgTable("gallery_interactions", {
  // 基础字段
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull(),                       // 操作用户UUID
  gallery_item_id: varchar({ length: 255 }).notNull(),                 // 画廊项目ID
  created_at: timestamp({ withTimezone: true }).defaultNow(),           // 操作时间

  // 互动类型
  interaction_type: varchar({ length: 20 }).notNull(),                  // 互动类型（like, bookmark, view, report）
  is_active: boolean().notNull().default(true),                        // 是否仍然有效（取消点赞时设为false）

  // 附加信息
  metadata: text(),                                                     // JSON格式的额外信息（如举报原因）

  updated_at: timestamp({ withTimezone: true }).defaultNow(),           // 更新时间
}, (table) => [
  // 复合唯一索引：同一用户对同一作品的同类型互动只能有一条活跃记录
  uniqueIndex("user_gallery_interaction_unique").on(
    table.user_uuid,
    table.gallery_item_id,
    table.interaction_type,
    table.is_active
  ),
]);

/**
 * 角色生成模板表 - 预设的角色生成模板
 * 
 * 用途：
 * - 提供快速生成选项
 * - 新手用户指导
 * - 展示平台能力
 * - 热门风格推广
 */
export const character_templates = pgTable("character_templates", {
  // 基础字段
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),                   // 模板唯一标识
  created_at: timestamp({ withTimezone: true }).defaultNow(),           // 创建时间

  // 模板信息
  name: varchar({ length: 255 }).notNull(),                            // 模板名称
  description: text(),                                                  // 模板描述
  category: varchar({ length: 100 }).notNull(),                        // 模板分类
  preview_image_url: varchar({ length: 500 }),                         // 预览图URL

  // 生成参数（JSON格式存储完整的CharacterFigureRequest）
  template_params: text().notNull(),                                    // 模板参数JSON

  // 使用统计
  usage_count: integer().notNull().default(0),                         // 使用次数
  success_rate: integer().notNull().default(100),                      // 成功率（百分比）

  // 状态管理
  is_active: boolean().notNull().default(true),                        // 是否启用
  is_featured: boolean().notNull().default(false),                     // 是否推荐
  is_free: boolean().notNull().default(true),                          // 是否免费（付费用户专享）

  // 排序权重
  sort_order: integer().notNull().default(0),                          // 排序权重

  updated_at: timestamp({ withTimezone: true }).defaultNow(),           // 更新时间
});

/**
 * 系统配置表 - 角色生成相关的系统配置
 * 
 * 用途：
 * - 动态调整生成参数
 * - A/B测试配置
 * - 限流和配额管理
 * - 特性开关
 */
export const system_configs = pgTable("system_configs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  config_key: varchar({ length: 100 }).notNull().unique(),             // 配置键
  config_value: text(),                                                 // 配置值（JSON格式）
  description: varchar({ length: 500 }),                               // 配置描述
  is_active: boolean().notNull().default(true),                        // 是否启用
  created_at: timestamp({ withTimezone: true }).defaultNow(),           // 创建时间
  updated_at: timestamp({ withTimezone: true }).defaultNow(),           // 更新时间
});

/**
 * 用户偏好表 - 记录用户的角色生成偏好
 * 
 * 用途：
 * - 个性化推荐
 * - 快捷设置
 * - 用户行为分析
 * - 默认参数设置
 */
export const user_preferences = pgTable("user_preferences", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull().unique(),              // 用户UUID
  
  // 默认生成偏好
  default_style: varchar({ length: 50 }),                              // 默认风格
  default_pose: varchar({ length: 50 }),                               // 默认姿势
  default_quality: varchar({ length: 20 }),                            // 默认质量
  default_aspect_ratio: varchar({ length: 10 }),                       // 默认宽高比
  
  // 偏好统计
  favorite_styles: text(),                                              // JSON数组：最常用风格
  favorite_poses: text(),                                               // JSON数组：最常用姿势
  
  // 个性化设置
  auto_save_to_gallery: boolean().notNull().default(false),            // 自动保存到画廊
  auto_make_public: boolean().notNull().default(false),                // 自动公开分享
  
  // 通知设置
  notify_on_generation_complete: boolean().notNull().default(true),    // 生成完成通知
  notify_on_gallery_interaction: boolean().notNull().default(true),    // 画廊互动通知
  
  created_at: timestamp({ withTimezone: true }).defaultNow(),           // 创建时间
  updated_at: timestamp({ withTimezone: true }).defaultNow(),           // 更新时间
  
  // 显示排序
  display_order: integer().notNull().default(0),                       // 显示顺序
  
  created_at: timestamp({ withTimezone: true }).defaultNow(),           // 创建时间
  updated_at: timestamp({ withTimezone: true }).defaultNow(),           // 更新时间
});

/**
 * 订阅使用记录表 - 追踪订阅用户的使用情况
 * 
 * 用途：
 * - 记录每次AI生成请求
 * - 统计使用量
 * - 支持混合计费（订阅+积分）
 */
export const subscription_usage = pgTable("subscription_usage", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  
  // 关联信息
  user_uuid: varchar({ length: 255 }).notNull(),                  // 用户UUID
  subscription_id: integer().notNull(),                           // 订阅ID
  
  // 使用类型
  usage_type: varchar({ length: 50 }).notNull(),                  // 使用类型（text_generation, image_generation, video_generation）
  model_used: varchar({ length: 100 }),                           // 使用的模型
  
  // 使用详情
  prompt: varchar({ length: 1000 }),                              // 使用的提示词
  result_id: varchar({ length: 255 }),                            // 结果ID（用于关联生成的内容）
  
  // 计数统计
  credits_consumed: integer().notNull().default(0),               // 消耗的积分（混合计费时使用）
  count: integer().notNull().default(1),                          // 使用次数
  
  created_at: timestamp({ withTimezone: true }).defaultNow(),     // 创建时间
});