# 📋 Vercel 部署前检查清单

## 🗓️ 创建时间：2025-08-28
## 🎯 目标：确保项目能够成功部署到 Vercel

---

## ✅ 已完成的工作

### 1. nano-banana API 集成 ✅
- [x] API Key 已配置：`b72ae4bb461182b40a466a627784b310`
- [x] 类型定义完成：`/src/types/nano-banana.d.ts`
- [x] 服务层实现：`/src/services/nano-banana.ts`
- [x] API 路由创建：`/src/app/api/nano-banana/`
- [x] 环境变量配置：`.env.local` 和 `.env.example`

### 2. 项目构建测试 ✅
- [x] TypeScript 编译通过
- [x] ESLint 检查通过
- [x] 构建成功：52 个路由全部生成

### 3. 文档准备 ✅
- [x] 部署清单：`/docs/Vercel部署清单.md`
- [x] 性能优化建议：`/docs/性能优化建议.md`
- [x] nano-banana 集成文档：`/docs/nano-banana集成完成文档.md`

---

## ⚠️ 需要注意的问题

### 1. 前端显示问题
**问题描述**：首页仍显示 Reddit Checker 内容，而不是 AI Generator
**影响**：用户无法看到 AI 生成功能
**解决方案**：
- 需要更新 `AIGenerator` 组件以集成 nano-banana
- 或创建新的展示页面专门用于 AI 图像生成

### 2. AI Generator 组件未连接 nano-banana
**当前状态**：使用旧的 API 实现
**需要做的**：
- 更新组件调用 `/api/nano-banana/generate`
- 添加图像生成 UI
- 实现积分显示

---

## 📝 部署前必须完成的任务清单

### 环境变量配置（在 Vercel Dashboard）

```env
# 核心配置
NEXT_PUBLIC_WEB_URL=https://your-domain.com
NEXT_PUBLIC_PROJECT_NAME=AI Universal Generator

# 数据库（Supabase）
DATABASE_URL=你的数据库连接字符串

# 认证
AUTH_SECRET=生成的密钥
AUTH_URL=https://your-domain.com/api/auth
AUTH_TRUST_HOST=true

# Google 登录（如果启用）
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true

# GitHub 登录（如果启用）
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
NEXT_PUBLIC_AUTH_GITHUB_ENABLED=true

# Cloudflare R2 存储
STORAGE_ENDPOINT=
STORAGE_REGION=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_DOMAIN=

# nano-banana API ⭐ 重要
NANO_BANANA_API_KEY=b72ae4bb461182b40a466a627784b310

# 支付（选择一个）
## Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

## 或 Creem
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=

# AI 服务（根据需要配置）
## OpenRouter（推荐）
OPENROUTER_API_KEY=

## SiliconFlow
SILICONFLOW_API_KEY=

## DeepSeek
DEEPSEEK_API_KEY=

# 邮件服务（可选）
RESEND_API_KEY=

# 分析（可选）
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=
OPENPANEL_SECRET_KEY=
```

### Vercel 项目设置

1. **基础设置**
   - Framework Preset: `Next.js`
   - Node.js Version: `20.x`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

2. **环境变量**
   - 在 Settings → Environment Variables 中添加上述所有变量
   - 注意区分 Production/Preview/Development 环境

3. **域名配置**
   - 添加自定义域名
   - 配置 SSL 证书（自动）
   - 设置重定向规则（如需要）

4. **函数配置**
   ```json
   {
     "functions": {
       "src/app/api/nano-banana/generate/route.ts": {
         "maxDuration": 30
       },
       "src/app/api/nano-banana/edit/route.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

### Cloudflare R2 配置

1. **创建 R2 存储桶**
   - 登录 Cloudflare Dashboard
   - 创建新的 R2 bucket
   - 获取访问凭证

2. **配置 CORS**
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["https://your-domain.com"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3600
       }
     ]
   }
   ```

3. **设置公开访问（如需要）**
   - 创建 R2.dev 子域名
   - 或使用自定义域名

---

## 🚀 部署步骤

### 第一步：本地验证
```bash
# 1. 构建测试
npm run build

# 2. 生产模式测试
npm run start

# 3. 访问 http://localhost:3000 验证功能
```

### 第二步：Git 准备
```bash
# 1. 确保所有更改已提交
git status
git add .
git commit -m "chore: 准备部署到 Vercel"

# 2. 推送到 GitHub
git push origin main
```

### 第三步：Vercel 部署
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. Import Git Repository
3. 选择你的 GitHub 仓库
4. 配置环境变量
5. 点击 Deploy

### 第四步：部署后验证
- [ ] 网站可以访问
- [ ] 登录功能正常
- [ ] nano-banana API 调用成功
- [ ] 图像生成功能工作
- [ ] 积分系统正常
- [ ] 支付功能（如已配置）

---

## 🔍 测试检查项

### 功能测试
- [ ] 用户注册/登录
- [ ] AI 文本生成
- [ ] AI 图像生成（nano-banana）
- [ ] 积分扣除
- [ ] 错误处理

### 性能测试
- [ ] 首页加载时间 < 3秒
- [ ] API 响应时间 < 5秒
- [ ] 图像加载优化

### 安全测试
- [ ] 环境变量不暴露
- [ ] API 需要认证
- [ ] 输入验证工作

---

## 🛠️ 故障排查

### 常见问题

1. **构建失败**
   - 检查 TypeScript 错误
   - 确认所有依赖已安装
   - 查看 Vercel 构建日志

2. **API 调用失败**
   - 验证环境变量配置
   - 检查 API Key 是否正确
   - 查看函数日志

3. **数据库连接错误**
   - 确认 DATABASE_URL 正确
   - 检查 Supabase 服务状态
   - 验证连接池设置

4. **nano-banana API 错误**
   - 确认 API Key 有效
   - 检查积分余额
   - 查看请求限制

---

## 📞 支持资源

- **Vercel 文档**：https://vercel.com/docs
- **Next.js 文档**：https://nextjs.org/docs
- **nano-banana API**：https://kie.ai/nano-banana
- **Supabase 文档**：https://supabase.com/docs
- **Cloudflare R2**：https://developers.cloudflare.com/r2

---

## ✨ 部署成功标志

当以下所有条件满足时，表示部署成功：

1. ✅ 网站在自定义域名上可访问
2. ✅ 所有页面加载正常
3. ✅ 用户可以注册和登录
4. ✅ AI 生成功能工作
5. ✅ 没有控制台错误
6. ✅ Lighthouse 评分 > 80

---

*最后更新：2025-08-28*
*准备人：Claude Code Assistant*