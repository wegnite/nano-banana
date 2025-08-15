/**
 * 获取用户信息 API 路由
 * 
 * 功能说明：
 * 获取当前登录用户的完整信息，包括基本资料和积分余额
 * 
 * 接口路径：POST /api/get-user-info
 * 
 * 认证要求：
 * - 需要用户已登录
 * - 通过 session 或 JWT 验证身份
 * 
 * @module app/api/get-user-info
 */

import { respData, respErr, respJson } from "@/lib/resp";

import { findUserByUuid } from "@/models/user";
import { getUserUuid } from "@/services/user";
import { getUserCredits } from "@/services/credit";
import { User } from "@/types/user";

/**
 * 处理获取用户信息请求
 * 
 * 业务流程：
 * 1. 验证用户身份（从 session/token 获取 UUID）
 * 2. 查询数据库获取用户基本信息
 * 3. 获取用户积分余额
 * 4. 组合数据返回给前端
 * 
 * @param {Request} req - HTTP 请求对象
 * @returns {Response} 包含用户信息的 JSON 响应
 * 
 * 响应格式：
 * 成功：
 * {
 *   code: 0,
 *   message: "ok",
 *   data: {
 *     uuid: string,
 *     email: string,
 *     name: string,
 *     avatar_url: string,
 *     credits: number,
 *     // ... 其他用户字段
 *   }
 * }
 * 
 * 失败：
 * - 未登录：{code: -2, message: "no auth"}
 * - 用户不存在：{code: -1, message: "user not exist"}
 * - 系统错误：{code: -1, message: "get user info failed"}
 */
export async function POST(req: Request) {
  try {
    // 获取当前用户 UUID（从认证信息中提取）
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      // 用户未登录或 session 过期
      return respJson(-2, "no auth");
    }

    // 从数据库查询用户信息
    const dbUser = await findUserByUuid(user_uuid);
    if (!dbUser) {
      // 用户在数据库中不存在（可能被删除）
      return respErr("user not exist");
    }

    // 获取用户积分余额
    const userCredits = await getUserCredits(user_uuid);

    // 组合用户信息和积分数据
    const user = {
      ...(dbUser as unknown as User),
      credits: userCredits,  // 添加积分字段
    };

    return respData(user);
  } catch (e) {
    // 记录错误日志，用于调试
    console.log("get user info failed: ", e);
    return respErr("get user info failed");
  }
}
