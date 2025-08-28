# 🍌 Nano Banana API 集成完成文档

## 📅 集成时间
- 完成日期：2025-08-28
- API Key：已配置（b72ae4bb...）

## ✅ 已完成的集成工作

### 1. 类型定义
- **文件路径**：`/src/types/nano-banana.d.ts`
- **功能说明**：定义了所有 nano-banana API 相关的 TypeScript 类型
- **包含内容**：
  - 图像生成请求/响应接口
  - 图像编辑请求/响应接口
  - 错误处理类型
  - 使用统计类型

### 2. 服务层实现
- **文件路径**：`/src/services/nano-banana.ts`
- **核心功能**：
  - `NanoBananaService` 类：封装所有 API 交互逻辑
  - `generateImage()` 方法：图像生成
  - `editImage()` 方法：图像编辑
  - 自动重试机制（最多3次）
  - 错误处理和日志记录
  - 使用统计跟踪

### 3. API 路由端点
#### 图像生成端点
- **路径**：`/api/nano-banana/generate`
- **文件**：`/src/app/api/nano-banana/generate/route.ts`
- **功能**：
  - POST：生成图像（需要认证）
  - GET：获取配置信息
  - 积分检查和扣除
  - 请求验证

#### 图像编辑端点
- **路径**：`/api/nano-banana/edit`
- **文件**：`/src/app/api/nano-banana/edit/route.ts`
- **功能**：
  - POST：编辑图像（需要认证）
  - GET：获取编辑能力信息
  - 支持多图编辑
  - URL 验证

### 4. 环境变量配置
- **配置文件**：`.env.local`
- **已添加的变量**：
  ```env
  NANO_BANANA_API_KEY = "b72ae4bb461182b40a466a627784b310"
  ```

### 5. 测试文件
- **主测试套件**：`/test/nano-banana-api.test.js`
- **积分测试**：`/test/integration/nano-banana-credits.test.js`
- **演示测试**：`/test/demo-test.js`
- **验证脚本**：`/test/verify-nano-banana.js`
- **本地测试**：`/test/test-local-nano-banana.js`

## 🚀 如何使用

### 前端调用示例

#### 1. 生成图像
```typescript
// 在前端组件中调用
const generateImage = async () => {
  try {
    const response = await fetch('/api/nano-banana/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: '一个可爱的香蕉角色在太空中',
        num_images: '2',
        aspect_ratio: '16:9',
        quality: 'hd'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '生成失败');
    }

    const result = await response.json();
    console.log('生成的图像:', result.data.images);
    
    // 处理返回的图像
    result.data.images.forEach(image => {
      console.log('图像 URL:', image.url);
      console.log('尺寸:', `${image.width}x${image.height}`);
    });
    
  } catch (error) {
    console.error('图像生成错误:', error);
  }
};
```

#### 2. 编辑图像
```typescript
const editImage = async (imageUrls) => {
  try {
    const response = await fetch('/api/nano-banana/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: '将背景改为夜晚星空',
        image_urls: imageUrls,
        num_images: '1',
        edit_type: 'variation'
      })
    });

    const result = await response.json();
    return result.data.images;
    
  } catch (error) {
    console.error('图像编辑错误:', error);
  }
};
```

### 后端直接调用服务

```typescript
// 在服务器端代码中
import { getNanoBananaService } from '@/services/nano-banana';

async function generateInBackend() {
  const service = getNanoBananaService();
  
  const result = await service.generateImage({
    prompt: 'A beautiful landscape',
    num_images: '1',
    quality: 'standard'
  });
  
  if (result.success) {
    console.log('生成成功:', result.data);
  }
}
```

## 💰 积分系统

### 消耗规则
- **图像生成**：每张图像消耗 10 积分
- **图像编辑**：每次编辑消耗 15 积分

### 积分检查流程
1. 用户发起请求
2. 检查用户认证状态
3. 计算所需积分
4. 验证积分余额
5. 执行 API 调用
6. 扣除积分
7. 返回结果

## 🔧 配置参数说明

### 图像生成参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | ✅ | 图像描述提示词 |
| num_images | '1'-'4' | ❌ | 生成数量，默认 '1' |
| aspect_ratio | string | ❌ | 宽高比：'1:1', '16:9', '9:16' 等 |
| quality | string | ❌ | 质量：'standard' 或 'hd' |
| style | string | ❌ | 风格参数 |
| seed | number | ❌ | 随机种子 |

### 图像编辑参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | ✅ | 编辑指令 |
| image_urls | string[] | ✅ | 输入图像URL（最多5个） |
| num_images | '1'-'4' | ❌ | 输出数量，默认 '1' |
| edit_type | string | ❌ | 编辑类型：'inpaint', 'outpaint', 'variation' |
| mask_url | string | ❌ | 遮罩图像URL（inpaint时使用） |

## 🔒 安全特性

1. **用户认证**：所有 API 调用都需要用户登录
2. **积分验证**：防止滥用，确保用户有足够积分
3. **输入验证**：所有参数都经过严格验证
4. **错误处理**：完整的错误捕获和友好提示
5. **重试机制**：网络错误自动重试
6. **速率限制**：防止恶意请求

## 📊 监控和日志

### 日志记录
- 所有请求都记录到控制台
- 包含用户ID、请求时间、处理时间
- 错误详情和堆栈跟踪

### 使用统计
```typescript
// 获取使用统计
const service = getNanoBananaService();
const stats = service.getUsageStats();
console.log('总生成数:', stats.total_images_generated);
console.log('使用积分:', stats.credits_used);
```

## 🐛 常见问题排查

### 1. API Key 未配置
**错误信息**：`Nano Banana API key not configured`
**解决方案**：在 `.env.local` 中设置 `NANO_BANANA_API_KEY`

### 2. 未登录错误
**错误信息**：`Unauthorized - Please sign in`
**解决方案**：确保用户已登录

### 3. 积分不足
**错误信息**：`Insufficient credits`
**解决方案**：充值或减少生成数量

### 4. 请求超时
**错误信息**：`Request timeout`
**解决方案**：
- 检查网络连接
- 减少生成数量
- 使用更简单的提示词

### 5. 404 错误
**可能原因**：
- 开发服务器未启动
- API 路由路径错误
- Next.js 构建问题

## 📝 测试命令

```bash
# 运行开发服务器
npm run dev

# 运行演示测试
npm run test:nano-banana-demo

# 运行完整测试（需要登录）
npm run test:nano-banana

# 验证 API 连接
node test/verify-nano-banana.js

# 测试本地集成
node test/test-local-nano-banana.js
```

## 🎯 下一步工作建议

### 前端开发
1. 创建图像生成组件
2. 添加图像编辑界面
3. 实现历史记录功能
4. 添加收藏功能

### 后端优化
1. 添加结果缓存
2. 实现批量处理
3. 添加队列系统
4. 集成 CDN

### 监控改进
1. 添加 APM 监控
2. 实现使用分析
3. 添加错误追踪
4. 性能优化

## 📚 相关资源

- **官方文档**：https://kie.ai/nano-banana
- **API 仪表板**：https://kie.ai/dashboard
- **定价信息**：$0.02 per image
- **技术支持**：support@kie.ai

## ✨ 集成亮点

1. **完整的 TypeScript 支持**：类型安全，开发体验好
2. **自动重试机制**：提高成功率
3. **积分系统集成**：防止滥用
4. **详细的错误处理**：用户友好的错误提示
5. **模块化设计**：易于维护和扩展
6. **完整的测试覆盖**：确保稳定性

---

*文档最后更新：2025-08-28*
*集成工程师：Claude Code Assistant*