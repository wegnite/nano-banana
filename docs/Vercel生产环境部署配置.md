# Vercel 生产环境部署配置指南

## 概览

本文档详细说明了 Character Figure AI Generator 在 Vercel 平台上的生产环境部署配置。

## 部署架构

```
┌─────────────────────┐
│   Vercel Edge       │
│   - Global CDN      │
│   - Edge Functions  │
│   - Image Opt       │
└─────────────────────┘
            │
┌─────────────────────┐
│   Next.js App       │
│   - SSR/SSG         │
│   - API Routes      │
│   - Middleware      │
└─────────────────────┘
            │
┌─────────────────────┐
│   External APIs     │
│   - Nano Banana     │
│   - Supabase DB     │
│   - Cloudflare R2   │
└─────────────────────┘
```

## 1. Vercel 项目配置

### 基本配置
- **Framework**: Next.js
- **Node.js Version**: 20.x
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`

### 区域部署
配置了多区域部署以提供最佳性能：
- **iad1**: 美国东部（弗吉尼亚州）
- **hnd1**: 亚洲东部（东京）
- **fra1**: 欧洲（法兰克福）

## 2. 函数配置优化

### 标准 API 函数
```json
"src/app/api/**/*": {
  "runtime": "nodejs20.x",
  "maxDuration": 60,
  "memory": 1024
}
```

### AI 生成函数（高性能配置）
```json
"src/app/api/character-figure/**/*": {
  "runtime": "nodejs20.x",
  "maxDuration": 300,
  "memory": 2048
}
```

### Nano Banana API 函数
```json
"src/app/api/nano-banana/**/*": {
  "runtime": "nodejs20.x",
  "maxDuration": 300,
  "memory": 2048
}
```

## 3. 安全配置

### Content Security Policy
```
default-src 'self';
img-src 'self' data: https: blob:;
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https: wss:;
```

### 安全响应头
- **Strict-Transport-Security**: 强制 HTTPS
- **X-Content-Type-Options**: 防止 MIME 类型混淆
- **X-Frame-Options**: 防止点击劫持
- **X-XSS-Protection**: XSS 保护
- **Referrer-Policy**: 控制引用信息

## 4. 缓存策略

### 静态资源缓存
```json
"source": "/_next/static/(.*)",
"headers": [{
  "key": "Cache-Control",
  "value": "public, max-age=31536000, immutable"
}]
```

### 图片缓存
```json
"source": "/images/(.*)",
"headers": [{
  "key": "Cache-Control", 
  "value": "public, max-age=31536000, immutable"
}]
```

### API 响应缓存
```json
"source": "/api/(.*)",
"headers": [{
  "key": "Cache-Control",
  "value": "no-cache, no-store, must-revalidate"
}]
```

## 5. 环境变量配置

### 必需的生产环境变量

#### 基础配置
```bash
NEXT_PUBLIC_WEB_URL="https://nano-banana.vercel.app"
NEXT_PUBLIC_PROJECT_NAME="Nano Banana"
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
```

#### 数据库配置
```bash
DATABASE_URL="postgresql://user:pass@host:port/db"
```

#### 认证配置
```bash
AUTH_SECRET="your-secret-key"  # openssl rand -base64 32
AUTH_URL="https://nano-banana.vercel.app/api/auth"
AUTH_TRUST_HOST="true"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
```

#### AI 服务配置
```bash
NANO_BANANA_API_KEY="your-nano-banana-key"
NANO_BANANA_API_URL="https://api.kie.ai/nano-banana"
OPENAI_API_KEY="your-openai-key"
DEEPSEEK_API_KEY="your-deepseek-key"
REPLICATE_API_TOKEN="your-replicate-token"
```

#### 存储配置
```bash
STORAGE_ENDPOINT="your-r2-endpoint"
STORAGE_REGION="auto"
STORAGE_ACCESS_KEY="your-r2-access-key"
STORAGE_SECRET_KEY="your-r2-secret-key"
STORAGE_BUCKET="your-r2-bucket"
STORAGE_DOMAIN="your-r2-domain"
```

#### 支付配置
```bash
PAY_PROVIDER="stripe"
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_PRIVATE_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### 分析配置
```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_OPENPANEL_CLIENT_ID="your-openpanel-id"
```

## 6. 图片优化配置

### 支持的图片格式
- AVIF (首选)
- WebP (备用)
- JPEG/PNG (兜底)

### 远程图片域名白名单
- `*.kie.ai` (Nano Banana API)
- `*.cloudflare.com` (CDN)
- `*.r2.cloudflarestorage.com` (存储)
- `replicate.delivery` (Replicate API)
- `*.openai.com` (OpenAI API)

### 图片尺寸配置
- **设备尺寸**: 640, 750, 828, 1080, 1200, 1920
- **图片尺寸**: 16, 32, 48, 64, 96, 128, 256, 384

## 7. 性能优化

### Bundle 分割
- 最大 chunk 大小: 244KB
- 自动代码分割
- 树摇优化

### Edge Runtime
- 字符生成 API 使用 Edge Runtime
- 减少冷启动时间
- 更好的全球分发

### 字体优化
```javascript
experimental: {
  optimizeFonts: true
}
```

## 8. 监控和日志

### Cron 任务
```json
{
  "path": "/api/cleanup/sessions",
  "schedule": "0 2 * * *"  // 每日凌晨2点清理会话
},
{
  "path": "/api/analytics/daily-report", 
  "schedule": "0 1 * * *"  // 每日凌晨1点生成报告
}
```

### 错误追踪
- 生产环境错误日志
- API 响应时间监控
- 用户行为分析

## 9. 部署流程

### 1. 预部署检查
```bash
# 运行测试
npm run test

# 检查类型
npx tsc --noEmit

# 代码检查
npm run lint

# 构建验证
npm run build
```

### 2. 环境变量设置
在 Vercel Dashboard 中设置所有必需的环境变量。

### 3. 域名配置
- 生产域名配置
- SSL 证书自动管理
- 自定义域名重定向

### 4. 部署触发
- `main` 分支自动部署到生产环境
- 预览部署用于功能分支
- 回滚机制

## 10. 故障排除

### 常见问题

#### 1. API 超时
- 检查函数超时配置
- 优化数据库查询
- 增加内存分配

#### 2. 图片加载失败
- 验证图片域名白名单
- 检查 CSP 配置
- 确认存储权限

#### 3. 认证问题
- 验证 OAuth 配置
- 检查回调 URL
- 确认环境变量

#### 4. 数据库连接
- 检查连接字符串
- 验证数据库权限
- 监控连接池

## 11. 安全检查清单

- [ ] 所有 API 密钥使用环境变量
- [ ] HTTPS 强制启用
- [ ] CSP 头部正确配置
- [ ] 敏感数据不在客户端暴露
- [ ] Rate limiting 已启用
- [ ] 错误信息不泄露敏感信息
- [ ] 数据库使用 SSL 连接
- [ ] OAuth 回调 URL 正确配置

## 12. 性能基准

### 目标指标
- **首次内容绘制 (FCP)**: < 1.5s
- **最大内容绘制 (LCP)**: < 2.5s
- **累积布局偏移 (CLS)**: < 0.1
- **首次输入延迟 (FID)**: < 100ms
- **API 响应时间**: < 2s (标准), < 10s (AI 生成)

### 监控工具
- Vercel Analytics
- Google PageSpeed Insights
- Web Vitals
- 自定义性能监控

## 13. 备份和恢复

### 数据备份
- 数据库自动备份
- 文件存储备份
- 环境变量备份

### 灾难恢复
- 多区域部署
- 数据库复制
- 快速回滚机制

---

**更新日期**: 2025-08-28  
**文档版本**: v1.0  
**负责人**: Claude Code

此配置确保了 Character Figure AI Generator 在生产环境中的高可用性、安全性和性能。