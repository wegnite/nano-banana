/**
 * 用户服务层
 * 
 * 功能说明：
 * 处理与用户相关的业务逻辑，包括：
 * - 用户创建和保存
 * - 用户身份验证
 * - 用户信息获取
 * - API Key 认证
 * - 积分管理
 * 
 * @module services/user
 */

import { CreditsAmount, CreditsTransType } from "./credit";
import { findUserByEmail, findUserByUuid, insertUser } from "@/models/user";

import { User } from "@/types/user";
import { auth } from "@/auth";
import { getIsoTimestr, getOneYearLaterTimestr } from "@/lib/time";
import { getUserUuidByApiKey } from "@/models/apikey";
import { headers } from "next/headers";
import { increaseCredits } from "./credit";
import { users } from "@/db/schema";
import { getUuid } from "@/lib/hash";

/**
 * 保存用户到数据库
 * 
 * 业务逻辑：
 * 1. 检查用户是否已存在（通过邮箱）
 * 2. 不存在：创建新用户并赠送初始积分
 * 3. 已存在：返回现有用户信息
 * 
 * @param {User} user - 用户对象
 * @returns {Promise<User>} 保存后的用户信息
 * 
 * 新用户奖励：
 * - 赠送积分数量：CreditsAmount.NewUserGet
 * - 积分有效期：1年
 * 
 * @throws {Error} 当邮箱无效或保存失败时抛出异常
 */
export async function saveUser(user: User) {
  try {
    if (!user.email) {
      throw new Error("invalid user email");
    }

    const existUser = await findUserByEmail(user.email);

    if (!existUser) {
      // user not exist, create a new user
      if (!user.uuid) {
        user.uuid = getUuid();
      }

      console.log("user to be inserted:", user);

      const dbUser = await insertUser(user as typeof users.$inferInsert);

      // increase credits for new user, expire in one year
      await increaseCredits({
        user_uuid: user.uuid,
        trans_type: CreditsTransType.NewUser,
        credits: CreditsAmount.NewUserGet,
        expired_at: getOneYearLaterTimestr(),
      });

      user = {
        ...(dbUser as unknown as User),
      };
    } else {
      // user exist, return user info in db
      user = {
        ...(existUser as unknown as User),
      };
    }

    return user;
  } catch (e) {
    console.log("save user failed: ", e);
    throw e;
  }
}

/**
 * 获取当前用户的 UUID
 * 
 * 认证方式（按优先级）：
 * 1. API Key 认证：从 Authorization 头获取 Bearer token
 * 2. Session 认证：从 NextAuth session 获取用户信息
 * 
 * @returns {Promise<string>} 用户 UUID，未登录返回空字符串
 * 
 * API Key 格式：
 * - 以 "sk-" 开头
 * - 通过 Authorization: Bearer sk-xxx 传递
 * 
 * 使用场景：
 * - API 路由中验证用户身份
 * - 获取用户相关数据
 * - 权限检查
 */
export async function getUserUuid() {
  let user_uuid = "";

  // 尝试 API Key 认证
  const token = await getBearerToken();

  if (token) {
    // 检查是否为 API Key 格式
    if (token.startsWith("sk-")) {
      const user_uuid = await getUserUuidByApiKey(token);

      return user_uuid || "";
    }
  }

  // 尝试 Session 认证
  const session = await auth();
  if (session && session.user && session.user.uuid) {
    user_uuid = session.user.uuid;
  }

  return user_uuid;
}

/**
 * 从请求头获取 Bearer Token
 * 
 * @returns {Promise<string>} Token 值，不存在返回空字符串
 * 
 * 请求头格式：
 * Authorization: Bearer <token>
 * 
 * 使用示例：
 * ```
 * curl -H "Authorization: Bearer sk-xxxxx" /api/endpoint
 * ```
 */
export async function getBearerToken() {
  const h = await headers();
  const auth = h.get("Authorization");
  if (!auth) {
    return "";
  }

  // 移除 "Bearer " 前缀
  return auth.replace("Bearer ", "");
}

/**
 * 获取当前用户的邮箱地址
 * 
 * @returns {Promise<string>} 用户邮箱，未登录返回空字符串
 * 
 * 注意：
 * - 仅支持通过 Session 认证的用户
 * - API Key 认证不返回邮箱信息
 */
export async function getUserEmail() {
  let user_email = "";

  const session = await auth();
  if (session && session.user && session.user.email) {
    user_email = session.user.email;
  }

  return user_email;
}

export async function getUserInfo() {
  let user_uuid = await getUserUuid();

  if (!user_uuid) {
    return;
  }

  const user = await findUserByUuid(user_uuid);

  return user;
}
