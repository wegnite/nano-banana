/**
 * 用户模型层
 * 
 * 功能说明：
 * 处理所有与用户表相关的数据库操作
 * 使用 Drizzle ORM 进行类型安全的数据库查询
 * 
 * 主要操作：
 * - 用户创建、查询、更新
 * - 邀请码管理
 * - 批量用户操作
 * 
 * @module models/user
 */

import { users } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, gte, inArray } from "drizzle-orm";

/**
 * 插入新用户
 * 
 * @param {typeof users.$inferInsert} data - 用户数据对象
 * @returns {Promise} 创建成功的用户对象
 * 
 * 必填字段：
 * - uuid: 用户唯一标识
 * - email: 用户邮箱
 * - name: 用户名称
 * 
 * 选填字段：
 * - avatar_url: 头像链接
 * - invite_code: 用户的邀请码
 * - invited_by: 邀请人 UUID
 */
export async function insertUser(
  data: typeof users.$inferInsert
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db().insert(users).values(data).returning();

  return user;
}

/**
 * 通过邮箱查找用户
 * 
 * @param {string} email - 用户邮箱地址
 * @returns {Promise} 找到的用户对象，不存在返回 undefined
 * 
 * 使用场景：
 * - 用户登录时检查用户是否存在
 * - 创建新用户前检查邮箱重复
 * - OAuth 登录后关联账号
 */
export async function findUserByEmail(
  email: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}

/**
 * 通过 UUID 查找用户
 * 
 * @param {string} uuid - 用户唯一标识
 * @returns {Promise} 找到的用户对象，不存在返回 undefined
 * 
 * 使用场景：
 * - API 路由中获取用户信息
 * - 权限验证
 * - 用户数据更新
 * 
 * 性能优化：
 * - UUID 是主键，查询速度快
 * - 使用 limit(1) 优化查询
 */
export async function findUserByUuid(
  uuid: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.uuid, uuid))
    .limit(1);

  return user;
}

/**
 * 分页获取用户列表
 * 
 * @param {number} page - 页码，从 1 开始，默认 1
 * @param {number} limit - 每页数量，默认 50
 * @returns {Promise} 用户数组
 * 
 * 排序规则：
 * - 按创建时间倒序（最新的在前）
 * 
 * 使用场景：
 * - 管理后台用户列表
 * - 用户统计分析
 * - 批量用户操作
 * 
 * 性能建议：
 * - limit 不建议超过 100
 * - 大数据量时考虑使用游标分页
 */
export async function getUsers(
  page: number = 1,
  limit: number = 50
): Promise<(typeof users.$inferSelect)[] | undefined> {
  const offset = (page - 1) * limit;

  const data = await db()
    .select()
    .from(users)
    .orderBy(desc(users.created_at))
    .limit(limit)
    .offset(offset);

  return data;
}

/**
 * 更新用户邀请码
 * 
 * @param {string} user_uuid - 用户 UUID
 * @param {string} invite_code - 新的邀请码
 * @returns {Promise} 更新后的用户对象
 * 
 * 业务说明：
 * - 每个用户可以拥有自己的邀请码
 * - 邀请码用于跟踪推荐关系
 * - 自动更新 updated_at 时间戳
 * 
 * 使用场景：
 * - 用户首次生成邀请码
 * - 重置邀请码
 */
export async function updateUserInviteCode(
  user_uuid: string,
  invite_code: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({ invite_code, updated_at: new Date() })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

/**
 * 更新用户的邀请人
 * 
 * @param {string} user_uuid - 被邀请用户的 UUID
 * @param {string} invited_by - 邀请人的 UUID
 * @returns {Promise} 更新后的用户对象
 * 
 * 业务说明：
 * - 记录用户的邀请关系
 * - 一个用户只能有一个邀请人
 * - 用于计算推荐奖励
 * 
 * 限制条件：
 * - 只能在用户注册后 2 小时内设置
 * - 一旦设置不可更改（需要在服务层检查）
 */
export async function updateUserInvitedBy(
  user_uuid: string,
  invited_by: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({ invited_by, updated_at: new Date() })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function getUsersByUuids(
  user_uuids: string[]
): Promise<(typeof users.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(users)
    .where(inArray(users.uuid, user_uuids));

  return data;
}

export async function findUserByInviteCode(
  invite_code: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.invite_code, invite_code))
    .limit(1);

  return user;
}

export async function getUserUuidsByEmail(
  email: string
): Promise<string[] | undefined> {
  const data = await db()
    .select({ uuid: users.uuid })
    .from(users)
    .where(eq(users.email, email));

  return data.map((user) => user.uuid);
}

export async function getUsersTotal(): Promise<number> {
  const total = await db().$count(users);

  return total;
}

export async function getUserCountByDate(
  startTime: string
): Promise<Map<string, number> | undefined> {
  const data = await db()
    .select({ created_at: users.created_at })
    .from(users)
    .where(gte(users.created_at, new Date(startTime)));

  data.sort((a, b) => a.created_at!.getTime() - b.created_at!.getTime());

  const dateCountMap = new Map<string, number>();
  data.forEach((item) => {
    const date = item.created_at!.toISOString().split("T")[0];
    dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
  });

  return dateCountMap;
}
