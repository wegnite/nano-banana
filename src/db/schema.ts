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

// Users table
export const users = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }),
    nickname: varchar({ length: 255 }),
    avatar_url: varchar({ length: 255 }),
    locale: varchar({ length: 50 }),
    signin_type: varchar({ length: 50 }),
    signin_ip: varchar({ length: 255 }),
    signin_provider: varchar({ length: 50 }),
    signin_openid: varchar({ length: 255 }),
    invite_code: varchar({ length: 255 }).notNull().default(""),
    updated_at: timestamp({ withTimezone: true }),
    invited_by: varchar({ length: 255 }).notNull().default(""),
    is_affiliate: boolean().notNull().default(false),
  },
  (table) => [
    uniqueIndex("email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

// Orders table
export const orders = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  order_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull().default(""),
  user_email: varchar({ length: 255 }).notNull().default(""),
  amount: integer().notNull(),
  interval: varchar({ length: 50 }),
  expired_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull(),
  stripe_session_id: varchar({ length: 255 }),
  credits: integer().notNull(),
  currency: varchar({ length: 50 }),
  sub_id: varchar({ length: 255 }),
  sub_interval_count: integer(),
  sub_cycle_anchor: integer(),
  sub_period_end: integer(),
  sub_period_start: integer(),
  sub_times: integer(),
  product_id: varchar({ length: 255 }),
  product_name: varchar({ length: 255 }),
  valid_months: integer(),
  order_detail: text(),
  paid_at: timestamp({ withTimezone: true }),
  paid_email: varchar({ length: 255 }),
  paid_detail: text(),
});

// API Keys table
export const apikeys = pgTable("apikeys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  api_key: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 100 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
});

// Credits table
export const credits = pgTable("credits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull(),
  trans_type: varchar({ length: 50 }).notNull(),
  credits: integer().notNull(),
  order_no: varchar({ length: 255 }),
  expired_at: timestamp({ withTimezone: true }),
});

// Posts table
export const posts = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  slug: varchar({ length: 255 }),
  title: varchar({ length: 255 }),
  description: text(),
  content: text(),
  created_at: timestamp({ withTimezone: true }),
  updated_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  cover_url: varchar({ length: 255 }),
  author_name: varchar({ length: 255 }),
  author_avatar_url: varchar({ length: 255 }),
  locale: varchar({ length: 50 }),
});

// Affiliates table
export const affiliates = pgTable("affiliates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull().default(""),
  invited_by: varchar({ length: 255 }).notNull(),
  paid_order_no: varchar({ length: 255 }).notNull().default(""),
  paid_amount: integer().notNull().default(0),
  reward_percent: integer().notNull().default(0),
  reward_amount: integer().notNull().default(0),
});

// Feedbacks table
export const feedbacks = pgTable("feedbacks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  user_uuid: varchar({ length: 255 }),
  content: text(),
  rating: integer(),
});

// Subscriptions table - 用户订阅信息
export const subscriptions = pgTable("subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  
  // 用户标识
  user_uuid: varchar({ length: 255 }).notNull().unique(),
  user_email: varchar({ length: 255 }).notNull(),
  
  // 订阅计划
  plan_id: varchar({ length: 50 }).notNull(), // basic, pro, enterprise
  plan_name: varchar({ length: 100 }).notNull(),
  
  // 订阅状态
  status: varchar({ length: 50 }).notNull(), // active, cancelled, expired, paused
  
  // 计费信息
  interval: varchar({ length: 20 }).notNull(), // monthly, yearly
  price: integer().notNull(), // 价格（分）
  currency: varchar({ length: 10 }).notNull().default("USD"),
  
  // 时间相关
  started_at: timestamp({ withTimezone: true }).notNull(),
  current_period_start: timestamp({ withTimezone: true }).notNull(),
  current_period_end: timestamp({ withTimezone: true }).notNull(),
  cancelled_at: timestamp({ withTimezone: true }),
  
  // 支付相关
  stripe_subscription_id: varchar({ length: 255 }),
  stripe_customer_id: varchar({ length: 255 }),
  last_payment_at: timestamp({ withTimezone: true }),
  next_payment_at: timestamp({ withTimezone: true }),
  
  // 使用限制
  monthly_limit: integer(), // 每月使用限制，null 表示无限
  used_this_month: integer().notNull().default(0), // 本月已使用次数
  
  // 元数据
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});

// Subscription Plans table - 订阅计划定义
export const subscription_plans = pgTable("subscription_plans", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  
  plan_id: varchar({ length: 50 }).notNull().unique(),
  plan_name: varchar({ length: 100 }).notNull(),
  description: varchar({ length: 500 }),
  
  // 价格设置
  monthly_price: integer().notNull(), // 月付价格（分）
  yearly_price: integer().notNull(), // 年付价格（分）
  currency: varchar({ length: 10 }).notNull().default("USD"),
  
  // 使用限制
  monthly_generation_limit: integer(), // null = 无限
  daily_generation_limit: integer(), // null = 无限
  
  // 优先级和速度
  priority_queue: boolean().notNull().default(false), // 优先队列
  generation_speed: varchar({ length: 20 }).notNull().default("normal"), // slow, normal, fast
  
  // 其他特权
  support_level: varchar({ length: 20 }).notNull().default("basic"), // basic, priority, dedicated
  api_access: boolean().notNull().default(false),
  custom_models: boolean().notNull().default(false),
  
  // 状态
  is_active: boolean().notNull().default(true),
  is_featured: boolean().notNull().default(false),
  
  // 排序
  display_order: integer().notNull().default(0),
  
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});

// Subscription Usage table - 订阅使用记录
export const subscription_usage = pgTable("subscription_usage", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  
  user_uuid: varchar({ length: 255 }).notNull(),
  subscription_id: integer().notNull(),
  
  // 使用类型
  usage_type: varchar({ length: 50 }).notNull(), // text_generation, image_generation, video_generation
  model_used: varchar({ length: 100 }),
  
  // 使用详情
  prompt: varchar({ length: 1000 }),
  result_id: varchar({ length: 255 }),
  
  // 计数
  credits_consumed: integer().notNull().default(0), // 如果混合计费，记录消耗的积分
  count: integer().notNull().default(1), // 使用次数
  
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});
