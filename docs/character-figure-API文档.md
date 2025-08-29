# Character Figure AI Generator - API 文档

## 概述

Character Figure AI Generator 是基于 nano-banana 服务的角色图像生成系统，提供完整的后端 API 实现，包括：

- 角色图像生成与风格优化
- 公共画廊管理与用户互动
- 生成历史记录与统计
- 模板系统与快速生成
- 积分管理与权限控制
- 速率限制与安全防护

## API 基础信息

- **基础 URL**: `/api/character-figure`
- **认证方式**: NextAuth.js Session (Cookie-based)
- **数据格式**: JSON
- **响应格式**: 统一的 `{code, message, data}` 结构

## 核心 API 端点

### 1. 角色生成 API

#### POST `/api/character-figure/generate`
生成角色图像，支持多种风格和自定义参数。

**请求参数：**
```typescript
{
  prompt: string;                    // 角色描述（必填）
  style: CharacterFigureStyle;       // 风格（必填）
  pose: CharacterPose;              // 姿势（必填）
  gender: CharacterGender;          // 性别（必填）
  age: CharacterAge;                // 年龄组（必填）
  num_images?: '1' | '2' | '3' | '4'; // 生成数量
  quality?: 'standard' | 'hd';       // 质量设置
  aspect_ratio?: string;             // 宽高比
  seed?: number;                     // 随机种子
  clothing?: string;                 // 服装描述
  background?: string;               // 背景描述
  color_palette?: string;            // 色彩方案
  style_keywords?: string[];         // 风格关键词
  save_to_gallery?: boolean;         // 是否保存到画廊
  make_public?: boolean;             // 是否公开分享
}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "success": true,
    "data": {
      "generation_id": "gen_12345",
      "images": [
        {
          "url": "https://example.com/image.jpg",
          "width": 1024,
          "height": 1024,
          "enhanced_prompt": "anime style, warrior princess...",
          "style": "anime",
          "pose": "standing"
        }
      ],
      "enhanced_prompt": "anime style, warrior princess...",
      "style_applied": "anime"
    },
    "credits_used": 15,
    "credits_remaining": 85,
    "generation_time": 3500
  }
}
```

#### GET `/api/character-figure/generate`
获取生成配置信息。

**响应包含：**
- 可用风格列表及描述
- 可用姿势列表及描述
- 积分消耗配置
- 用户限制信息

### 2. 公共画廊 API

#### GET `/api/character-figure/gallery`
浏览公共画廊，支持筛选和分页。

**查询参数：**
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20，最大 50）
- `sort_by`: 排序方式（latest, popular, trending, most_liked）
- `time_range`: 时间范围（today, week, month, all）
- `styles`: 风格筛选（逗号分隔）
- `poses`: 姿势筛选（逗号分隔）
- `tags`: 标签筛选（逗号分隔）
- `featured_only`: 是否只显示推荐作品
- `search`: 搜索关键词

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": "gallery_123",
        "title": "Anime Character",
        "image_url": "https://example.com/image.jpg",
        "style": "anime",
        "pose": "standing",
        "creator_username": "user123",
        "likes_count": 42,
        "views_count": 156,
        "is_featured": false,
        "created_at": "2025-08-28T10:00:00Z",
        "user_liked": true,
        "user_bookmarked": false
      }
    ],
    "pagination": {
      "current_page": 1,
      "limit": 20,
      "has_next_page": true,
      "total_pages": 50
    }
  }
}
```

#### POST `/api/character-figure/gallery/[galleryId]/action`
对画廊作品进行互动操作。

**请求参数：**
```json
{
  "action": "like" | "unlike" | "bookmark" | "unbookmark" | "view" | "report"
}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "success": true,
    "action": "like",
    "new_likes_count": 43,
    "user_liked": true,
    "message": "Action completed successfully"
  }
}
```

### 3. 用户历史 API

#### GET `/api/character-figure/history`
获取用户的生成历史。

**查询参数：**
- `page`: 页码
- `limit`: 每页数量
- `sort_by`: 排序（latest, oldest, most_credits, favorites）
- `styles`: 风格筛选
- `date_from`: 开始日期
- `date_to`: 结束日期
- `favorites_only`: 是否只显示收藏

**响应包含：**
- 历史记录列表
- 分页信息
- 用户统计摘要

#### GET `/api/character-figure/history/[generationId]`
获取特定生成记录的详细信息。

#### PUT `/api/character-figure/history/[generationId]`
更新生成记录（主要是收藏状态）。

**请求参数：**
```json
{
  "action": "toggle_favorite"
}
```

### 4. 模板系统 API

#### GET `/api/character-figure/templates`
获取可用的角色生成模板。

**查询参数：**
- `featured`: 是否只获取推荐模板
- `category`: 模板分类筛选

#### POST `/api/character-figure/templates/[templateId]/generate`
使用模板生成角色，支持自定义修改。

**请求参数：**
```typescript
// 可以覆盖模板中的任意参数
{
  prompt?: string;
  num_images?: string;
  quality?: string;
  clothing?: string;
  // ... 其他自定义参数
}
```

### 5. 统计信息 API

#### GET `/api/character-figure/stats?type=user`
获取用户个人统计信息。

#### GET `/api/character-figure/stats?type=public`
获取公开的平台趋势统计。

## 数据模型

### 角色生成请求
```typescript
interface CharacterFigureRequest {
  prompt: string;
  style: CharacterFigureStyle;
  pose: CharacterPose;
  gender: CharacterGender;
  age: CharacterAge;
  // ... 其他可选参数
}
```

### 风格枚举
```typescript
enum CharacterFigureStyle {
  ANIME = 'anime',
  REALISTIC = 'realistic',
  CARTOON = 'cartoon',
  FANTASY = 'fantasy',
  CYBERPUNK = 'cyberpunk',
  STEAMPUNK = 'steampunk',
  MEDIEVAL = 'medieval',
  MODERN = 'modern',
  SCI_FI = 'sci_fi',
  CHIBI = 'chibi'
}
```

### 姿势枚举
```typescript
enum CharacterPose {
  STANDING = 'standing',
  SITTING = 'sitting',
  ACTION = 'action',
  PORTRAIT = 'portrait',
  FULL_BODY = 'full_body',
  DYNAMIC = 'dynamic',
  FIGHTING = 'fighting',
  DANCING = 'dancing',
  FLYING = 'flying',
  CUSTOM = 'custom'
}
```

## 业务规则

### 积分消耗
- 标准质量：15 积分/张
- 高清质量：25 积分/张
- 单次最多生成 4 张图片

### 速率限制
- 免费用户：5次/小时，20次/天
- Pro 用户：25次/小时，100次/天
- Premium 用户：50次/小时，200次/天

### 提示词增强
系统会根据选择的风格自动增强用户提示词：
- 添加风格特定的前缀和后缀
- 整合姿势、性别、年龄等参数
- 应用负面提示词以提高质量

## 错误处理

### 常见错误码
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 无权限
- `404`: 资源不存在
- `429`: 速率限制
- `500`: 服务器内部错误

### 错误响应格式
```json
{
  "code": -1,
  "message": "Error description",
  "error": "Detailed error message",
  "validation_errors": [
    {
      "field": "prompt",
      "message": "Prompt is required"
    }
  ],
  "rate_limit_info": {
    "remaining_requests": 0,
    "reset_at": "2025-08-28T11:00:00Z",
    "limit_per_hour": 5
  }
}
```

## 数据库架构

### 核心表结构
1. `character_generations` - 生成历史记录
2. `character_gallery` - 公共画廊项目
3. `gallery_interactions` - 用户互动记录
4. `character_templates` - 生成模板
5. `user_preferences` - 用户偏好设置
6. `system_configs` - 系统配置

### 数据关系
- 一个用户可以有多个生成记录
- 一个生成记录可以分享到画廊
- 用户可以对画廊项目进行多种互动
- 模板可以被多次使用生成

## 安全考虑

### 输入验证
- 所有用户输入都经过严格验证
- 提示词长度限制（2000字符）
- 参数范围检查

### 权限控制
- 基于 Session 的用户认证
- 资源访问权限验证
- 用户只能操作自己的记录

### 速率限制
- 基于滑动窗口的速率限制
- 不同用户等级不同限制
- IP 级别的备用限制

### 内容安全
- 画廊内容审核机制
- 举报处理流程
- 敏感内容过滤

## 性能优化

### 缓存策略
- 模板列表缓存
- 公共统计数据缓存
- 用户偏好缓存

### 数据库优化
- 合适的索引设计
- 分页查询优化
- 冗余数据减少查询

### API 优化
- 批量操作支持
- 响应数据精简
- 并发请求限制

## 部署说明

### 环境变量
```env
NANO_BANANA_API_KEY=your_api_key
NANO_BANANA_API_URL=https://api.kie.ai/nano-banana
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your_secret
```

### 数据库迁移
运行迁移脚本创建所需的数据库表结构。

### 监控指标
- API 响应时间
- 错误率统计
- 用户活跃度
- 积分消耗情况

## 未来扩展

### 计划功能
- 批量生成支持
- 画廊评论系统
- 高级筛选选项
- API 密钥管理
- 自定义模型支持

### 架构优化
- Redis 缓存集成
- 消息队列处理
- 微服务拆分
- CDN 图片存储

---

*文档版本: 1.0*  
*最后更新: 2025-08-28*  
*维护者: Claude Code*