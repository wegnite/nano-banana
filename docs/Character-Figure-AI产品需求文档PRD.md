# Character Figure AI 产品需求文档 (PRD)

## 1. 产品概述

### 1.1 产品定位
**产品名称**: Character Figure AI Generator  
**一句话介绍**: 使用AI技术将照片转换为精美吉卜力风格艺术作品和角色手办的创作平台

### 1.2 核心价值主张
- **即时生成**: 10秒内将照片转换为艺术作品
- **多样风格**: 支持吉卜力、手办、动漫等多种风格
- **简单易用**: 无需专业知识，一键生成
- **高质量输出**: HD高清画质，可商用

### 1.3 目标用户
- 主要用户：创意工作者、社交媒体用户、动漫爱好者
- 次要用户：收藏品爱好者、设计师、内容创作者

## 2. 功能需求

### 2.1 核心功能模块

#### 2.1.1 图片上传模块
```
功能要求:
- 支持拖拽上传
- 支持点击选择文件
- 支持批量上传（Pro功能）
- 支持格式：JPG、PNG、WebP
- 文件大小限制：最大10MB
- 上传进度显示
- 图片预览功能
```

#### 2.1.2 风格选择模块
```
预设风格:
1. 吉卜力风格 (宫崎骏动画风)
2. 手办风格 (Character Figure)
3. 动漫风格 (经典动漫风)
4. 油画风格 (传统油画风)
5. 水彩风格 (水彩画风格)
6. 像素风格 (复古像素艺术)
7. 无 (不进行风格转换)
```

#### 2.1.3 参数调节模块
```
基础参数:
- 宽高比: 1:1 | 4:3 | 16:9 | 9:16 | 3:4
- 图片数量: 1-4张
- 画质: 标准 | 高清HD
- 种子值: 随机 | 自定义

高级参数(Pro):
- 风格强度: 0-100
- 细节程度: 低|中|高
- 色彩饱和度: 0-100
- 对比度调节: 0-100
```

#### 2.1.4 提示词输入模块
```
功能设计:
- 主提示词输入框（必填）
- 负面提示词（可选）
- 提示词模板库
- 历史提示词
- AI提示词优化建议
- 多语言支持（中/英/日）
```

#### 2.1.5 生成与输出模块
```
生成流程:
1. 参数验证
2. 积分检查
3. 队列排序
4. 实时进度显示
5. 生成完成通知

输出选项:
- 下载原图
- 分享到社交媒体
- 保存到画廊
- 生成链接
- NFT铸造（未来功能）
```

### 2.2 用户系统

#### 2.2.1 账户体系
```typescript
interface UserAccount {
  // 注册登录
  auth: {
    email: boolean;
    google: boolean;
    github: boolean;
    wechat?: boolean; // 中国市场
  };
  
  // 用户信息
  profile: {
    avatar: string;
    nickname: string;
    bio?: string;
    website?: string;
  };
  
  // 积分系统
  credits: {
    free: number;    // 免费积分
    paid: number;    // 付费积分
    total: number;   // 总计
    history: Transaction[];
  };
}
```

#### 2.2.2 会员体系
| 等级 | 价格 | 每日生成 | 特权 |
|-----|------|---------|------|
| 免费用户 | ¥0 | 3次 | 基础功能 |
| 基础会员 | ¥19/月 | 30次 | 高清下载 |
| 高级会员 | ¥49/月 | 100次 | 批量生成+API |
| 专业会员 | ¥99/月 | 无限 | 全部功能+优先队列 |

### 2.3 社区功能

#### 2.3.1 作品画廊
```
展示模块:
- 瀑布流布局
- 分类筛选（风格/时间/热度）
- 点赞/收藏/评论
- 作者主页
- 作品详情页
```

#### 2.3.2 提示词市场
```
功能设计:
- 精品提示词展示
- 付费提示词交易
- 提示词效果预览
- 用户评价系统
- 创作者收益分成
```

## 3. 界面设计规范

### 3.1 设计原则
- **简洁优先**: 降低用户学习成本
- **视觉层次**: 突出核心操作路径
- **响应式**: 完美适配移动端
- **暗色模式**: 支持明暗主题切换
- **国际化**: 支持多语言界面

### 3.2 页面结构

#### 3.2.1 首页布局
```html
<!-- 页面结构 -->
<Layout>
  <Header>
    - Logo
    - 导航菜单
    - 用户中心
    - 语言切换
  </Header>
  
  <Hero>
    - 标题文案
    - 副标题说明
    - CTA按钮
    - 示例展示
  </Hero>
  
  <MainGenerator>
    <LeftPanel>
      - 图片上传区
      - 参考图片（可选）
    </LeftPanel>
    
    <CenterPanel>
      - 风格选择
      - 参数调节
      - 提示词输入
      - 生成按钮
    </CenterPanel>
    
    <RightPanel>
      - 输出预览
      - 历史记录
      - 下载操作
    </RightPanel>
  </MainGenerator>
  
  <Gallery>
    - 热门作品
    - 最新生成
    - 用户案例
  </Gallery>
  
  <Footer>
    - 产品链接
    - 社交媒体
    - 法律条款
  </Footer>
</Layout>
```

### 3.3 设计规范

#### 3.3.1 色彩系统
```scss
// 主色调
$primary: #FFB800;      // 主品牌色（金黄色）
$secondary: #4A90E2;    // 次要色（天蓝色）
$accent: #FF6B6B;       // 强调色（珊瑚红）

// 中性色
$gray-900: #1A1A1A;     // 深灰（文字）
$gray-700: #4A4A4A;     // 中灰（次要文字）
$gray-500: #9B9B9B;     // 浅灰（辅助文字）
$gray-300: #D8D8D8;     // 边框
$gray-100: #F5F5F5;     // 背景

// 功能色
$success: #4CAF50;      // 成功
$warning: #FFC107;      // 警告
$error: #F44336;        // 错误
$info: #2196F3;         // 信息
```

#### 3.3.2 字体规范
```css
/* 字体族 */
--font-primary: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
--font-mono: 'JetBrains Mono', 'Consolas', monospace;

/* 字体大小 */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;
```

## 4. 技术架构

### 4.1 技术栈
```yaml
前端:
  - 框架: Next.js 15.2.3
  - UI库: shadcn/ui + Tailwind CSS
  - 状态管理: Zustand
  - 动画: Framer Motion
  - 图标: Lucide Icons

后端:
  - 运行时: Node.js + Edge Runtime
  - API: RESTful + GraphQL (可选)
  - 认证: NextAuth.js
  - 数据库: PostgreSQL (Supabase)
  - 缓存: Redis (Upstash)

AI服务:
  - 主引擎: nano-banana API
  - 备用: Replicate / Stable Diffusion API
  - 图片存储: Cloudflare R2
  - CDN: Cloudflare

部署:
  - 平台: Vercel
  - 监控: Vercel Analytics
  - 错误追踪: Sentry
```

### 4.2 数据库设计

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  credits_free INTEGER DEFAULT 3,
  credits_paid INTEGER DEFAULT 0,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 生成记录表
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  style VARCHAR(50),
  aspect_ratio VARCHAR(10),
  quality VARCHAR(20),
  seed INTEGER,
  input_image_url TEXT,
  output_image_url TEXT,
  status VARCHAR(20), -- pending, processing, completed, failed
  credits_used INTEGER DEFAULT 1,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 作品画廊表
CREATE TABLE gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(200),
  description TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 提示词模板表
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  style VARCHAR(50),
  category VARCHAR(50),
  price INTEGER DEFAULT 0, -- 0表示免费
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. API设计

### 5.1 核心API端点

```typescript
// API路由设计
const apiRoutes = {
  // 认证相关
  'POST /api/auth/register': '用户注册',
  'POST /api/auth/login': '用户登录',
  'POST /api/auth/logout': '用户登出',
  'GET /api/auth/session': '获取会话',
  
  // 图片生成
  'POST /api/generate': '生成图片',
  'GET /api/generate/:id': '获取生成状态',
  'POST /api/generate/cancel/:id': '取消生成',
  
  // 用户相关
  'GET /api/user/profile': '获取用户信息',
  'PUT /api/user/profile': '更新用户信息',
  'GET /api/user/credits': '获取积分余额',
  'GET /api/user/history': '获取生成历史',
  
  // 画廊相关
  'GET /api/gallery': '获取画廊列表',
  'POST /api/gallery': '发布到画廊',
  'DELETE /api/gallery/:id': '删除作品',
  'POST /api/gallery/:id/like': '点赞作品',
  
  // 提示词相关
  'GET /api/prompts': '获取提示词列表',
  'POST /api/prompts': '创建提示词',
  'GET /api/prompts/:id': '获取提示词详情',
  'POST /api/prompts/:id/purchase': '购买提示词',
  
  // 支付相关
  'POST /api/payment/checkout': '创建支付会话',
  'POST /api/payment/webhook': 'Stripe webhook',
  'GET /api/payment/history': '支付历史'
};
```

### 5.2 生成API详细设计

```typescript
// POST /api/generate
interface GenerateRequest {
  // 必填参数
  prompt: string;           // 主提示词
  
  // 可选参数
  negative_prompt?: string; // 负面提示词
  style?: StyleType;        // 风格类型
  input_image?: string;     // base64图片或URL
  aspect_ratio?: '1:1' | '4:3' | '16:9' | '9:16' | '3:4';
  num_images?: 1 | 2 | 3 | 4;
  quality?: 'standard' | 'hd';
  seed?: number;
  
  // 高级参数
  style_strength?: number;  // 0-100
  detail_level?: 'low' | 'medium' | 'high';
}

interface GenerateResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;         // 0-100
  images?: string[];        // 生成的图片URL数组
  error?: string;
  credits_used: number;
  estimated_time: number;   // 预计完成时间（秒）
  created_at: string;
}
```

## 6. 开发计划

### 6.1 项目里程碑

#### Phase 1: MVP版本 (2周)
**目标**: 实现核心生成功能，快速上线验证

Week 1:
- [ ] Day 1-2: 项目初始化，环境搭建
- [ ] Day 3-4: 用户认证系统
- [ ] Day 5-7: 核心生成功能

Week 2:
- [ ] Day 8-9: UI界面开发
- [ ] Day 10-11: API集成测试
- [ ] Day 12-13: 部署上线
- [ ] Day 14: Bug修复，优化

#### Phase 2: 功能完善 (2周)
**目标**: 增加用户体验功能

Week 3:
- [ ] 画廊功能
- [ ] 历史记录
- [ ] 批量生成

Week 4:
- [ ] 提示词模板
- [ ] 社交分享
- [ ] 移动端优化

#### Phase 3: 商业化 (2周)
**目标**: 实现盈利模式

Week 5:
- [ ] 支付集成
- [ ] 会员系统
- [ ] 积分体系

Week 6:
- [ ] 提示词市场
- [ ] API开放
- [ ] 数据分析

### 6.2 团队分工

```yaml
前端开发 (1-2人):
  负责内容:
    - UI组件开发
    - 页面布局实现
    - 动画效果
    - 响应式适配
  技能要求:
    - 精通React/Next.js
    - 熟悉Tailwind CSS
    - 了解Framer Motion

后端开发 (1人):
  负责内容:
    - API开发
    - 数据库设计
    - 认证系统
    - 支付集成
  技能要求:
    - 精通Node.js
    - 熟悉PostgreSQL
    - 了解Stripe API

AI工程师 (1人):
  负责内容:
    - AI模型集成
    - Prompt优化
    - 图片处理
    - 性能优化
  技能要求:
    - 熟悉AI API
    - 了解图像处理
    - Python/Node.js

UI/UX设计师 (1人):
  负责内容:
    - 界面设计
    - 交互设计
    - 品牌视觉
    - 营销素材
  技能要求:
    - Figma/Sketch
    - 设计规范
    - 用户体验

产品经理 (1人):
  负责内容:
    - 需求管理
    - 项目协调
    - 用户反馈
    - 数据分析
  技能要求:
    - 产品思维
    - 数据分析
    - 项目管理
```

## 7. 运营策略

### 7.1 获客渠道
1. **SEO优化**: Character Figure相关关键词
2. **社交媒体**: Twitter/TikTok病毒式传播
3. **KOL合作**: 动漫博主、设计师
4. **内容营销**: 教程、案例分享
5. **社区运营**: Discord/Reddit

### 7.2 留存策略
1. **每日免费额度**: 吸引日活
2. **签到奖励**: 增加积分
3. **创作挑战**: 主题活动
4. **社区互动**: 作品展示
5. **会员特权**: 付费转化

### 7.3 盈利模式
1. **订阅制**: 月度/年度会员
2. **积分充值**: 按需付费
3. **提示词市场**: 交易抽成
4. **API服务**: B2B收入
5. **广告位**: 展示广告

## 8. 成功指标

### 8.1 北极星指标
- **月活跃生成用户数(MAU)**: 目标10万

### 8.2 关键指标
```yaml
用户指标:
  - 日活跃用户(DAU): 1万+
  - 新用户留存率: D1>40%, D7>20%, D30>10%
  - 付费转化率: >5%

产品指标:
  - 平均生成时间: <10秒
  - 生成成功率: >95%
  - 用户满意度: >4.5/5

商业指标:
  - 月收入(MRR): 10万+
  - 用户获取成本(CAC): <50元
  - 生命周期价值(LTV): >500元
```

## 9. 风险控制

### 9.1 技术风险
- API限流: 多供应商备份
- 服务器成本: 动态扩容
- 内容审核: AI+人工审核

### 9.2 法律风险
- 版权问题: 明确使用条款
- 隐私保护: GDPR合规
- 内容审查: 敏感内容过滤

### 9.3 市场风险
- 竞争加剧: 差异化定位
- 用户流失: 提升粘性
- 成本上升: 优化效率

## 10. 附录

### 10.1 竞品分析总结
| 平台 | 优势 | 劣势 | 我们的机会 |
|-----|-----|-----|-----------|
| Midjourney | 质量高 | 价格贵、慢 | 快速+便宜 |
| Ghibli AI | 垂直定位 | 功能单一 | 多样化 |
| nano-banana | 速度快 | 知名度低 | 本地化运营 |

### 10.2 用户调研摘要
- 核心诉求: 快速、简单、效果好
- 价格敏感度: 中等，愿为好效果付费
- 使用场景: 社交分享、个人收藏、商业设计

### 10.3 技术选型理由
- Next.js: SEO友好、性能优秀
- Supabase: 开源、成本低
- nano-banana: 速度快、效果好
- Vercel: 部署简单、全球CDN

---

*文档版本: v1.0.0*  
*更新日期: 2025-08-28*  
*负责人: Product Team*