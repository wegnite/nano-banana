/**
 * 用户上下文管理 API 路由
 * 
 * 功能：管理用户的 AI 对话历史和上下文
 * 支持：获取历史记录、清除历史、获取统计信息
 * 
 * 使用 Context7 管理用户上下文数据
 */

import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserUuid } from "@/services/user";
import { context7Service, initializeContext7 } from "@/services/context7";

/**
 * 获取用户会话历史和统计信息
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

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'history'; // history | stats
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // 初始化 Context7
    await initializeContext7();

    if (type === 'stats') {
      // 获取用户统计信息
      const stats = await context7Service.getUserStats(userUuid);
      return respData(stats);
    } else {
      // 获取会话历史
      const history = await context7Service.getSessionHistory(userUuid, limit);
      return respData({
        history: history,
        count: history.length,
        limit: limit
      });
    }
  } catch (error: any) {
    console.error("Failed to get user context:", error);
    return respErr(error.message || "Failed to get context");
  }
}

/**
 * 存储用户上下文（手动添加）
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

    const { content, type = 'memory', metadata = {} } = await req.json();
    
    if (!content) {
      return respErr("Content is required");
    }

    // 初始化 Context7
    await initializeContext7();

    // 存储上下文
    const contextId = await context7Service.storeContext(
      userUuid,
      content,
      {
        ...metadata,
        type: type,
        source: 'manual'
      }
    );
    
    return respData({
      success: true,
      contextId: contextId,
      message: "Context stored successfully"
    });
  } catch (error: any) {
    console.error("Failed to store user context:", error);
    return respErr(error.message || "Failed to store context");
  }
}

/**
 * 清除用户上下文
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

    const url = new URL(req.url);
    const type = url.searchParams.get('type') as any; // preference | history | session | memory | null (all)

    // 初始化 Context7
    await initializeContext7();

    // 清除指定类型的上下文
    await context7Service.clearUserContext(userUuid, type);
    
    return respData({
      success: true,
      message: type ? `Cleared ${type} context` : "Cleared all context",
      type: type || 'all'
    });
  } catch (error: any) {
    console.error("Failed to clear user context:", error);
    return respErr(error.message || "Failed to clear context");
  }
}

/**
 * 搜索用户上下文
 */
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return respErr("Please login first");
    }

    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("User not found");
    }

    const { query, topK = 5 } = await req.json();
    
    if (!query) {
      return respErr("Query is required");
    }

    // 初始化 Context7
    await initializeContext7();

    // 检索相关上下文
    const contexts = await context7Service.retrieveContext(userUuid, query, topK);
    
    return respData({
      results: contexts,
      count: contexts.length,
      query: query
    });
  } catch (error: any) {
    console.error("Failed to search user context:", error);
    return respErr(error.message || "Failed to search context");
  }
}