# 🔧 MCP Context7 配置指南

## 一、安装状态

### ✅ 已安装的包
- `@modelcontextprotocol/sdk@1.17.3` - MCP SDK 核心库
- `@upstash/context7-mcp@1.0.14` - Context7 MCP 服务器

## 二、Context7 简介

Context7 是一个由 Upstash 提供的上下文管理服务，通过 MCP (Model Context Protocol) 集成，可以：
- 存储和检索对话上下文
- 管理长期记忆
- 在不同会话间共享信息
- 提供向量搜索功能

## 三、配置步骤

### 3.1 获取 Upstash 凭证

1. 访问 [Upstash Console](https://console.upstash.com)
2. 创建新的 Vector Database
3. 获取以下凭证：
   - `UPSTASH_VECTOR_URL`
   - `UPSTASH_VECTOR_TOKEN`

### 3.2 配置环境变量

在项目根目录创建或更新 `.env.local`:

```bash
# Context7 / Upstash Configuration
UPSTASH_VECTOR_URL=your_vector_url_here
UPSTASH_VECTOR_TOKEN=your_vector_token_here
CONTEXT7_NAMESPACE=ai-generator  # 可选，用于隔离不同项目的数据
```

### 3.3 创建 MCP 配置文件

创建 `mcp.config.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp"],
      "env": {
        "UPSTASH_VECTOR_URL": "${UPSTASH_VECTOR_URL}",
        "UPSTASH_VECTOR_TOKEN": "${UPSTASH_VECTOR_TOKEN}"
      }
    }
  }
}
```

### 3.4 Claude Desktop 集成

如果使用 Claude Desktop，更新配置文件：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp"],
      "env": {
        "UPSTASH_VECTOR_URL": "your_actual_url",
        "UPSTASH_VECTOR_TOKEN": "your_actual_token"
      }
    }
  }
}
```

## 四、使用 Context7 MCP

### 4.1 基础使用

Context7 MCP 提供以下工具：

1. **store_context** - 存储上下文
   ```typescript
   await mcp.store_context({
     content: "用户偏好：深色模式，中文界面",
     metadata: { user_id: "user123", type: "preference" }
   });
   ```

2. **retrieve_context** - 检索相关上下文
   ```typescript
   const contexts = await mcp.retrieve_context({
     query: "用户偏好设置",
     top_k: 5
   });
   ```

3. **delete_context** - 删除上下文
   ```typescript
   await mcp.delete_context({
     id: "context_id_123"
   });
   ```

### 4.2 在项目中集成

创建 Context7 服务：

```typescript
// src/services/context7.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class Context7Service {
  private client: Client;

  async init() {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['@upstash/context7-mcp'],
      env: {
        UPSTASH_VECTOR_URL: process.env.UPSTASH_VECTOR_URL,
        UPSTASH_VECTOR_TOKEN: process.env.UPSTASH_VECTOR_TOKEN,
      },
    });

    this.client = new Client({
      name: 'ai-generator-client',
      version: '1.0.0',
    }, {
      capabilities: {}
    });

    await this.client.connect(transport);
  }

  async storeUserContext(userId: string, context: any) {
    const result = await this.client.callTool({
      name: 'store_context',
      arguments: {
        content: JSON.stringify(context),
        metadata: { 
          user_id: userId,
          timestamp: new Date().toISOString()
        }
      }
    });
    return result;
  }

  async getUserContext(userId: string, query: string) {
    const result = await this.client.callTool({
      name: 'retrieve_context',
      arguments: {
        query: query,
        filter: { user_id: userId },
        top_k: 10
      }
    });
    return result;
  }

  async clearUserContext(userId: string) {
    // 实现清除用户上下文逻辑
  }
}

export const context7Service = new Context7Service();
```

### 4.3 在 AI 生成中使用

```typescript
// src/app/api/demo/gen-text/route.ts
import { context7Service } from '@/services/context7';

export async function POST(req: Request) {
  const { prompt, provider, model } = await req.json();
  
  // 获取用户历史上下文
  const userContext = await context7Service.getUserContext(
    userUuid,
    prompt
  );
  
  // 增强提示词
  const enhancedPrompt = `
    历史上下文：${userContext}
    当前请求：${prompt}
  `;
  
  // 生成响应
  const response = await generateText({
    model: textModel,
    prompt: enhancedPrompt,
  });
  
  // 存储新的上下文
  await context7Service.storeUserContext(userUuid, {
    prompt: prompt,
    response: response.text,
    model: model,
    timestamp: new Date()
  });
  
  return response;
}
```

## 五、高级功能

### 5.1 会话管理

```typescript
// 创建会话管理器
class SessionManager {
  async createSession(userId: string) {
    return await context7Service.storeUserContext(userId, {
      type: 'session_start',
      session_id: generateSessionId(),
      started_at: new Date()
    });
  }

  async updateSession(sessionId: string, data: any) {
    // 更新会话信息
  }

  async endSession(sessionId: string) {
    // 结束会话
  }
}
```

### 5.2 智能记忆系统

```typescript
// 实现长期记忆
class MemorySystem {
  async rememberUserPreference(userId: string, preference: any) {
    await context7Service.storeUserContext(userId, {
      type: 'preference',
      data: preference,
      importance: 'high'
    });
  }

  async recallRelevantMemories(userId: string, topic: string) {
    return await context7Service.getUserContext(userId, topic);
  }
}
```

## 六、测试脚本

创建测试脚本 `test/context7-test.js`:

```javascript
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testContext7() {
  console.log('测试 Context7 MCP 连接...');
  
  try {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['@upstash/context7-mcp'],
      env: {
        UPSTASH_VECTOR_URL: process.env.UPSTASH_VECTOR_URL,
        UPSTASH_VECTOR_TOKEN: process.env.UPSTASH_VECTOR_TOKEN,
      },
    });

    const client = new Client({
      name: 'test-client',
      version: '1.0.0',
    }, {
      capabilities: {}
    });

    await client.connect(transport);
    console.log('✅ 连接成功');

    // 测试存储
    const storeResult = await client.callTool({
      name: 'store_context',
      arguments: {
        content: 'Test context from AI Generator',
        metadata: { test: true }
      }
    });
    console.log('✅ 存储测试通过', storeResult);

    // 测试检索
    const retrieveResult = await client.callTool({
      name: 'retrieve_context',
      arguments: {
        query: 'Test context',
        top_k: 1
      }
    });
    console.log('✅ 检索测试通过', retrieveResult);

    await client.close();
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testContext7();
```

## 七、故障排除

### 常见问题

1. **连接失败**
   - 检查环境变量是否正确设置
   - 验证 Upstash 凭证是否有效
   - 确保网络连接正常

2. **权限错误**
   - 确保 npm 全局包安装成功
   - 检查执行权限

3. **上下文检索不准确**
   - 调整 top_k 参数
   - 优化查询关键词
   - 使用更具体的元数据过滤

### 调试命令

```bash
# 检查安装
npm list -g @upstash/context7-mcp

# 测试连接
npx @upstash/context7-mcp --test

# 查看日志
export DEBUG=mcp:*
npx @upstash/context7-mcp
```

## 八、最佳实践

1. **上下文分类**：使用清晰的类型标记（preference、history、session）
2. **数据清理**：定期清理过期的上下文数据
3. **隐私保护**：不存储敏感信息
4. **性能优化**：合理设置 top_k 值，避免检索过多数据
5. **错误处理**：实现重试机制和降级策略

---

**文档版本**: 1.0  
**更新日期**: 2025-08-15  
**相关链接**:
- [MCP 官方文档](https://modelcontextprotocol.io)
- [Upstash Vector Database](https://upstash.com/docs/vector)
- [Context7 GitHub](https://github.com/upstash/context7)