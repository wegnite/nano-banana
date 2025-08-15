/**
 * 用户偏好设置 API 路由
 * 
 * 功能：管理用户的 AI 生成偏好设置
 * 支持：获取、更新和删除用户偏好
 * 
 * 使用 Context7 存储和检索用户偏好数据
 */

import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserUuid } from "@/services/user";
import { context7Service, initializeContext7, UserPreference } from "@/services/context7";

/**
 * 获取用户偏好设置
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return respErr("Please login first");
    }

    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("User not found");
    }

    // 初始化 Context7
    await initializeContext7();

    // 获取用户偏好
    const preferences = await context7Service.getUserPreferences(userUuid);
    
    // 如果没有偏好设置，返回默认值
    if (!preferences) {
      const defaultPreferences: UserPreference = {
        preferred_models: [],
        preferred_providers: [],
        language: "zh", // 默认中文
        theme: "system",
        generation_style: "professional",
        custom_settings: {}
      };
      return respData(defaultPreferences);
    }

    return respData(preferences);
  } catch (error: any) {
    console.error("Failed to get user preferences:", error);
    return respErr(error.message || "Failed to get preferences");
  }
}

/**
 * 更新用户偏好设置
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return respErr("Please login first");
    }

    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("User not found");
    }

    const preferences = await req.json();
    
    // 验证偏好设置格式
    if (!preferences || typeof preferences !== 'object') {
      return respErr("Invalid preferences format");
    }

    // 初始化 Context7
    await initializeContext7();

    // 存储用户偏好
    await context7Service.storeUserPreferences(userUuid, preferences);
    
    return respData({
      success: true,
      message: "Preferences updated successfully",
      preferences: preferences
    });
  } catch (error: any) {
    console.error("Failed to update user preferences:", error);
    return respErr(error.message || "Failed to update preferences");
  }
}

/**
 * 删除用户偏好设置
 */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return respErr("Please login first");
    }

    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("User not found");
    }

    // 初始化 Context7
    await initializeContext7();

    // 清除用户偏好
    await context7Service.clearUserContext(userUuid, 'preference');
    
    return respData({
      success: true,
      message: "Preferences cleared successfully"
    });
  } catch (error: any) {
    console.error("Failed to delete user preferences:", error);
    return respErr(error.message || "Failed to delete preferences");
  }
}