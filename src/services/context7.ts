/**
 * Context7 服务模块
 * 
 * 功能说明：
 * 使用 Upstash Vector Database 和 MCP Context7 实现智能上下文管理
 * 支持用户偏好存储、会话历史记录和个性化内容推荐
 * 
 * 主要功能：
 * - 用户偏好管理
 * - 会话上下文存储
 * - 历史记录检索
 * - 智能提示增强
 * 
 * @module services/context7
 */

import { Index } from '@upstash/vector';

/**
 * Context7 数据类型定义
 */
export interface ContextData {
  id?: string;
  content: string;
  metadata: {
    user_uuid: string;
    type: 'preference' | 'history' | 'session' | 'memory';
    timestamp: string;
    model?: string;
    provider?: string;
    [key: string]: any;
  };
  vector?: number[];
}

/**
 * 用户偏好数据结构
 */
export interface UserPreference {
  preferred_models: string[];
  preferred_providers: string[];
  language: string;
  theme: 'light' | 'dark' | 'system';
  generation_style?: string;
  custom_settings?: Record<string, any>;
}

/**
 * 会话数据结构
 */
export interface SessionData {
  session_id: string;
  user_uuid: string;
  started_at: string;
  last_activity: string;
  context: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

/**
 * Context7 服务类
 * 
 * 提供上下文管理的核心功能
 * 使用 Upstash Vector Database 进行向量存储和检索
 */
class Context7Service {
  private index: Index | null = null;
  private initialized = false;

  /**
   * 初始化 Context7 服务
   * 
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const url = process.env.UPSTASH_VECTOR_URL;
    const token = process.env.UPSTASH_VECTOR_TOKEN;

    if (!url || !token) {
      console.warn('Context7: Upstash credentials not configured, running in limited mode');
      return;
    }

    try {
      this.index = new Index({
        url,
        token,
      });
      
      this.initialized = true;
      console.log('Context7: Service initialized successfully');
    } catch (error) {
      console.error('Context7: Failed to initialize service', error);
      throw error;
    }
  }

  /**
   * 生成简单向量（临时方案）
   * 
   * 注意：这是一个简化的向量生成方法，仅用于测试
   * 生产环境应使用真正的嵌入模型（如 OpenAI Embeddings）
   * 
   * @param {string} text - 输入文本
   * @returns {number[]} 向量数组
   */
  private generateSimpleVector(text: string): number[] {
    // 生成1536维向量（OpenAI embedding 的标准维度）
    const dimension = 1536;
    const vector: number[] = new Array(dimension).fill(0);
    
    // 简单的哈希函数生成伪向量
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (charCode * (i + 1)) % dimension;
      vector[index] = (vector[index] + charCode / 255) / 2;
    }
    
    // 归一化向量
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dimension; i++) {
        vector[i] = vector[i] / magnitude;
      }
    }
    
    return vector;
  }

  /**
   * 存储用户上下文
   * 
   * @param {string} userUuid - 用户唯一标识
   * @param {string} content - 上下文内容
   * @param {Record<string, any>} metadata - 额外元数据
   * @returns {Promise<string>} 上下文 ID
   */
  async storeContext(
    userUuid: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    if (!this.index) {
      console.warn('Context7: Service not initialized');
      return '';
    }

    try {
      const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const data: ContextData = {
        id: contextId,
        content,
        metadata: {
          user_uuid: userUuid,
          type: metadata.type || 'history',
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      };

      // 生成简单的向量（临时解决方案，实际应使用嵌入模型）
      const vector = this.generateSimpleVector(content);
      
      // 存储到向量数据库
      await this.index.upsert({
        id: contextId,
        vector: vector,
        metadata: {
          ...data.metadata,
          content: content, // 将原始内容存储在元数据中
        },
      });

      console.log(`Context7: Stored context ${contextId} for user ${userUuid}`);
      return contextId;
    } catch (error) {
      console.error('Context7: Failed to store context', error);
      throw error;
    }
  }

  /**
   * 检索相关上下文
   * 
   * @param {string} userUuid - 用户唯一标识
   * @param {string} query - 查询内容
   * @param {number} topK - 返回结果数量
   * @returns {Promise<ContextData[]>} 相关上下文列表
   */
  async retrieveContext(
    userUuid: string,
    query: string,
    topK: number = 5
  ): Promise<ContextData[]> {
    if (!this.index) {
      console.warn('Context7: Service not initialized');
      return [];
    }

    try {
      // 生成查询向量
      const queryVector = this.generateSimpleVector(query);
      
      const results = await this.index.query({
        vector: queryVector,
        topK,
        filter: `user_uuid = '${userUuid}'`, // 使用字符串格式的过滤器
        includeMetadata: true,
      });

      return results.map(result => ({
        id: result.id as string,
        content: result.metadata?.content as string || '', // 从元数据中获取内容
        metadata: result.metadata as any,
      }));
    } catch (error) {
      console.error('Context7: Failed to retrieve context', error);
      return [];
    }
  }

  /**
   * 存储用户偏好
   * 
   * @param {string} userUuid - 用户唯一标识
   * @param {UserPreference} preferences - 用户偏好设置
   * @returns {Promise<void>}
   */
  async storeUserPreferences(
    userUuid: string,
    preferences: UserPreference
  ): Promise<void> {
    await this.storeContext(
      userUuid,
      JSON.stringify(preferences),
      {
        type: 'preference',
        preference_version: '1.0',
      }
    );
  }

  /**
   * 获取用户偏好
   * 
   * @param {string} userUuid - 用户唯一标识
   * @returns {Promise<UserPreference | null>} 用户偏好设置
   */
  async getUserPreferences(
    userUuid: string
  ): Promise<UserPreference | null> {
    const contexts = await this.retrieveContext(
      userUuid,
      'user preferences settings',
      1
    );

    if (contexts.length > 0 && contexts[0].metadata.type === 'preference') {
      try {
        return JSON.parse(contexts[0].content);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * 存储会话历史
   * 
   * @param {string} userUuid - 用户唯一标识
   * @param {string} prompt - 用户输入
   * @param {string} response - AI 响应
   * @param {Record<string, any>} metadata - 额外信息
   * @returns {Promise<void>}
   */
  async storeSessionHistory(
    userUuid: string,
    prompt: string,
    response: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const sessionContent = {
      prompt,
      response,
      ...metadata,
    };

    await this.storeContext(
      userUuid,
      JSON.stringify(sessionContent),
      {
        type: 'session',
        model: metadata.model,
        provider: metadata.provider,
      }
    );
  }

  /**
   * 获取会话历史
   * 
   * @param {string} userUuid - 用户唯一标识
   * @param {number} limit - 历史记录数量限制
   * @returns {Promise<any[]>} 会话历史列表
   */
  async getSessionHistory(
    userUuid: string,
    limit: number = 10
  ): Promise<any[]> {
    const contexts = await this.retrieveContext(
      userUuid,
      'session history',
      limit
    );

    return contexts
      .filter(ctx => ctx.metadata.type === 'session')
      .map(ctx => {
        try {
          return JSON.parse(ctx.content);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * 增强提示词
   * 
   * @param {string} userUuid - 用户唯一标识
   * @param {string} prompt - 原始提示词
   * @returns {Promise<string>} 增强后的提示词
   */
  async enhancePrompt(
    userUuid: string,
    prompt: string
  ): Promise<string> {
    // 获取相关上下文
    const relevantContexts = await this.retrieveContext(userUuid, prompt, 3);
    
    // 获取用户偏好
    const preferences = await this.getUserPreferences(userUuid);
    
    // 构建增强提示词
    let enhancedPrompt = prompt;
    
    if (relevantContexts.length > 0) {
      const contextSummary = relevantContexts
        .map(ctx => ctx.content)
        .join('\n');
      
      enhancedPrompt = `
历史上下文参考：
${contextSummary}

当前请求：
${prompt}
      `.trim();
    }
    
    if (preferences?.generation_style) {
      enhancedPrompt += `\n\n用户偏好风格：${preferences.generation_style}`;
    }
    
    return enhancedPrompt;
  }

  /**
   * 清除用户上下文
   * 
   * @param {string} userUuid - 用户唯一标识
   * @param {string} type - 上下文类型（可选）
   * @returns {Promise<void>}
   */
  async clearUserContext(
    userUuid: string,
    type?: 'preference' | 'history' | 'session' | 'memory'
  ): Promise<void> {
    if (!this.index) {
      console.warn('Context7: Service not initialized');
      return;
    }

    try {
      // 获取要删除的上下文
      const contexts = await this.retrieveContext(userUuid, '', 100);
      
      const toDelete = type
        ? contexts.filter(ctx => ctx.metadata.type === type)
        : contexts;
      
      // 批量删除
      if (toDelete.length > 0) {
        const ids = toDelete.map(ctx => ctx.id!).filter(Boolean);
        await this.index.delete(ids);
        console.log(`Context7: Cleared ${ids.length} contexts for user ${userUuid}`);
      }
    } catch (error) {
      console.error('Context7: Failed to clear context', error);
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   * 
   * @param {string} userUuid - 用户唯一标识
   * @returns {Promise<Record<string, number>>} 统计信息
   */
  async getUserStats(userUuid: string): Promise<Record<string, number>> {
    const contexts = await this.retrieveContext(userUuid, '', 100);
    
    const stats = {
      total_contexts: contexts.length,
      preferences: contexts.filter(c => c.metadata.type === 'preference').length,
      sessions: contexts.filter(c => c.metadata.type === 'session').length,
      memories: contexts.filter(c => c.metadata.type === 'memory').length,
    };
    
    return stats;
  }
}

// 导出单例实例
export const context7Service = new Context7Service();

// 导出初始化函数
export async function initializeContext7(): Promise<void> {
  await context7Service.initialize();
}