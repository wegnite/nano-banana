# AI Universal Generator - Product Requirements Document (PRD)

## 项目概述

### 项目名称
AI Universal Generator - 全能AI生成器模板

### 项目定位
基于 ShipAny 框架开发的新一代 AI SaaS 模板，专为大模型应用设计，提供统一的 AI 生成平台，支持文本、图像、视频等多模态内容生成。

### 目标用户
- AI 应用开发者
- SaaS 创业者
- 企业数字化转型团队
- AI 工具集成商

## 核心价值主张

1. **全模型覆盖** - 集成所有主流 AI 大模型，一站式解决方案
2. **统一接口** - 标准化的 API 调用方式，降低集成成本
3. **快速部署** - 基于成熟的 ShipAny 框架，小时级上线
4. **商业化就绪** - 内置支付、订阅、积分等完整商业系统

## 功能规格

### 1. AI 生成能力

#### 1.1 文本生成
**支持的提供商和模型：**
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-3.5-turbo
- **DeepSeek**: DeepSeek-chat, DeepSeek-R1
- **OpenRouter**: Meta Llama 3.3, DeepSeek R1
- **SiliconFlow**: Qwen 2.5, DeepSeek R1

**功能特性：**
- 流式输出支持
- 推理过程展示（R1 模型）
- 上下文管理
- Token 计费

#### 1.2 图像生成
**支持的提供商和模型：**
- **Midjourney**: V6, V5.2
- **FLUX**: Schnell, Pro
- **Ideogram**: V2, V1
- **DALL·E**: DALL·E 3, DALL·E 2
- **Replicate**: FLUX, SDXL

**功能特性：**
- 多种风格选择
- 分辨率自定义
- 批量生成
- 图像编辑

#### 1.3 视频生成（规划中）
**支持的提供商和模型：**
- **KLING**: V1.5, V1
- **Runway**: Gen-3, Gen-2
- **Pika**: Pika 1.0

### 2. 用户界面设计

#### 2.1 设计理念
- **深色主题优先** - 采用深色背景，紫色渐变强调色
- **沉浸式体验** - 大面积留白，聚焦生成区域
- **响应式设计** - 完美适配桌面和移动设备

#### 2.2 核心组件
- **智能输入框** - 自适应高度，实时字数统计
- **模型选择器** - 可视化模型卡片，显示能力标签
- **结果展示区** - 支持多格式内容展示
- **积分显示** - 实时更新用户额度

### 3. 技术架构

#### 3.1 技术栈
```
前端框架: Next.js 15 + React 19
样式系统: TailwindCSS 4 + Shadcn/UI
状态管理: React Context + Hooks
认证系统: NextAuth Beta
数据库: PostgreSQL + Drizzle ORM
支付集成: Stripe + Creem
国际化: next-intl
AI SDK: 自研统一接口层
```

#### 3.2 API 设计
```typescript
// 统一的生成接口
POST /api/generate/{type}
{
  "prompt": string,
  "provider": string,
  "model": string,
  "parameters": object
}

// 返回格式
{
  "success": boolean,
  "data": {
    "content": any,
    "usage": object,
    "metadata": object
  }
}
```

### 4. 商业化功能

#### 4.1 计费模式
- **订阅制** - 月度/年度会员
- **积分制** - 按使用量扣费
- **混合制** - 基础会员 + 额外积分

#### 4.2 价格体系
- **免费层** - 每日限量体验
- **基础版** - $9.9/月，1000积分
- **专业版** - $29.9/月，5000积分
- **企业版** - 定制价格，无限积分

### 5. 数据模型设计

#### 5.1 核心数据表
- `users` - 用户信息管理
- `orders` - 订单交易记录
- `credits` - 积分流水账
- `generations` - 生成历史记录
- `api_usage` - API 调用统计

## 开发进度

### 已完成功能 ✅
1. 深色主题设计系统
2. AI Generator 核心组件
3. 文本生成 API 集成
4. 图像生成 API 集成
5. 模型选择器界面
6. 响应式布局适配
7. 导航栏样式更新
8. 全局样式优化

### 待开发功能 📝
1. 视频生成接口
2. 生成历史记录
3. 用户收藏功能
4. 批量生成任务
5. API Key 管理
6. 使用量统计图表
7. 团队协作功能
8. 模型性能对比

## 部署指南

### 环境变量配置
```env
# AI Provider Keys
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
OPENROUTER_API_KEY=
SILICONFLOW_API_KEY=
KLING_ACCESS_KEY=
KLING_SECRET_KEY=

# Database
DATABASE_URL=

# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Payment
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### 部署步骤
1. 克隆代码仓库
2. 安装依赖: `pnpm install`
3. 配置环境变量
4. 运行数据库迁移: `pnpm db:migrate`
5. 启动开发服务器: `pnpm dev`
6. 构建生产版本: `pnpm build`
7. 部署到 Vercel/Cloudflare

## 项目优势

### 对比传统 SaaS 模板
| 特性 | AI Universal Generator | 传统 SaaS 模板 |
|------|----------------------|---------------|
| AI 集成 | 原生支持20+模型 | 需要自行集成 |
| 界面风格 | AI 生成器专属设计 | 通用商业风格 |
| 用户体验 | 沉浸式创作体验 | 功能导向设计 |
| 开发效率 | 开箱即用 | 需要大量定制 |
| 商业模式 | AI 计费系统 | 传统订阅模式 |

### 核心竞争力
1. **最全的 AI 模型覆盖** - 支持市面上所有主流大模型
2. **最优的用户体验** - 专为 AI 生成场景设计的交互
3. **最快的上线速度** - 基于成熟框架，快速部署
4. **最灵活的扩展性** - 模块化设计，易于定制

## 成功案例预期

### 应用场景
- AI 写作助手平台
- AI 绘画创作社区
- 企业 AI 工具箱
- 教育 AI 辅助系统
- 营销内容生成器

### 商业价值
- 降低 90% 的开发成本
- 缩短 80% 的上线时间
- 提升 200% 的用户转化率
- 支持 10x 的业务扩展

## 技术支持

### 文档资源
- 官方文档: https://docs.shipany.ai
- API 文档: /api/docs
- 组件库: /components
- 示例代码: /examples

### 社区支持
- GitHub: https://github.com/shipanyai
- Discord: 开发者社区
- 技术博客: 最佳实践分享

## 版本规划

### V1.0 (当前版本)
- ✅ 核心生成功能
- ✅ 基础商业系统
- ✅ 深色主题界面

### V2.0 (规划中)
- 🔄 视频生成能力
- 🔄 协作工作空间
- 🔄 插件市场

### V3.0 (未来展望)
- 📋 自定义模型训练
- 📋 企业级管理后台
- 📋 多租户架构

---

**最后更新**: 2025年1月
**版本**: 1.0.0
**作者**: ShipAny Team & AI Universal Generator Contributors