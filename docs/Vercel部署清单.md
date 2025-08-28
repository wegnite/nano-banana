# Vercel 部署清单

## 📋 部署前准备工作

### 1. 代码检查
- [ ] 运行 `npm run lint` 确保代码质量
- [ ] 运行 `npx tsc --noEmit` 检查 TypeScript 类型
- [ ] 运行 `npm run build` 确保构建成功
- [ ] 检查 `.env.local` 文件不要提交到 Git

### 2. 依赖检查
- [ ] 确保 `package.json` 中的依赖版本正确
- [ ] 检查是否有未使用的依赖包
- [ ] 验证生产环境依赖 (`dependencies`) 和开发依赖 (`devDependencies`) 分类正确

### 3. 数据库准备
- [ ] Supabase 数据库已创建并可访问
- [ ] 数据库迁移已完成：`npm run db:push`
- [ ] 测试数据库连接正常

## 🛠 环境变量配置

### 必需的环境变量

在 Vercel Dashboard 中配置以下环境变量：

#### 🌐 基础配置
```bash
NEXT_PUBLIC_WEB_URL=https://yourdomain.com
NEXT_PUBLIC_PROJECT_NAME=ShipAny
NEXT_PUBLIC_DEFAULT_THEME=system
NEXT_PUBLIC_LOCALE_DETECTION=false
```

#### 🗄️ 数据库
```bash
DATABASE_URL=postgresql://username:password@host:port/database
```
> ⚠️ **重要：** 使用 Supabase 提供的连接字符串，确保包含 `?pgbouncer=true`

#### 🔐 认证配置
```bash
AUTH_SECRET=your-secret-here  # 使用 openssl rand -base64 32 生成
AUTH_URL=https://yourdomain.com/api/auth
AUTH_TRUST_HOST=true

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-secret
NEXT_PUBLIC_AUTH_GOOGLE_ID=your-google-client-id
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true

# GitHub OAuth
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-secret
NEXT_PUBLIC_AUTH_GITHUB_ENABLED=true
```

#### 💳 支付配置
选择一种支付方式：

**Stripe:**
```bash
PAY_PROVIDER=stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_PRIVATE_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**或 Creem:**
```bash
PAY_PROVIDER=creem
CREEM_ENV=production
CREEM_API_KEY=your-creem-api-key
CREEM_WEBHOOK_SECRET=your-webhook-secret
```

#### ☁️ 云存储 (Cloudflare R2)
```bash
STORAGE_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com/bucket-name
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=your-bucket-name
STORAGE_DOMAIN=https://your-custom-domain.r2.dev
```

#### 🤖 AI 服务配置
```bash
# 根据使用的服务配置相应的 API 密钥
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...
SILICONFLOW_API_KEY=sk-...
NANO_BANANA_API_KEY=nb-...
NANO_BANANA_API_URL=https://api.kie.ai/nano-banana
```

#### 📧 邮件服务
```bash
RESEND_API_KEY=re_...
RESEND_SENDER_EMAIL=noreply@yourdomain.com
```

#### 📊 分析服务 (可选)
```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-...
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
```

#### 👨‍💼 管理员配置
```bash
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## ☁️ Cloudflare R2 配置步骤

### 1. 创建 R2 存储桶
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 "R2 Object Storage"
3. 创建新存储桶，记录存储桶名称

### 2. 生成 API 令牌
1. 在 R2 页面点击 "Manage R2 API Tokens"
2. 创建新的 API 令牌，选择 "Edit" 权限
3. 记录 Access Key ID 和 Secret Access Key

### 3. 配置自定义域名 (推荐)
1. 在存储桶设置中添加自定义域名
2. 配置 DNS 记录指向 R2
3. 启用 SSL/TLS

### 4. CORS 配置
在 R2 存储桶中配置 CORS 规则：
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 🌐 域名配置

### 1. 在 Vercel 中添加域名
1. 进入项目设置 → Domains
2. 添加自定义域名
3. 按照指示配置 DNS 记录

### 2. DNS 配置示例
```
Type: CNAME
Name: www (或 @)
Value: cname.vercel-dns.com
```

### 3. SSL 证书
- Vercel 自动提供 Let's Encrypt SSL 证书
- 通常在域名添加后几分钟内激活

## 🚀 部署步骤

### 1. 连接 GitHub 仓库
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 GitHub 仓库并授权

### 2. 配置项目设置
```
Build Command: npm run build
Output Directory: .next
Install Command: npm ci
```

### 3. 配置环境变量
1. 在项目设置中添加所有必需的环境变量
2. 区分 Preview 和 Production 环境的变量

### 4. 高级设置
- **Node.js Version:** 18.x (推荐)
- **Region:** 选择距离用户最近的区域
- **Function Regions:** 配置 API 函数的执行区域

## ✅ 部署后验证

### 1. 功能测试清单
- [ ] 首页加载正常
- [ ] 用户注册/登录功能
- [ ] AI 生成功能（如果已配置）
- [ ] 支付流程（在测试模式下）
- [ ] 邮件发送功能
- [ ] 图片上传和显示
- [ ] 多语言切换

### 2. 性能检查
- [ ] 使用 Lighthouse 检查性能评分
- [ ] 验证图片优化和 CDN 缓存
- [ ] 检查 API 响应时间

### 3. 安全检查
- [ ] 验证 HTTPS 证书
- [ ] 检查敏感数据是否泄露
- [ ] 确认 API 端点需要适当的认证

## ❗ 常见问题解决

### 1. 构建失败
**问题：** TypeScript 错误或依赖冲突
**解决：**
```bash
# 清理依赖并重新安装
rm -rf node_modules package-lock.json
npm install

# 检查类型错误
npx tsc --noEmit
```

### 2. 环境变量未生效
**问题：** 环境变量在生产环境中不可用
**解决：**
- 确保在 Vercel Dashboard 中正确配置环境变量
- 重新部署项目以应用新的环境变量
- 检查变量名拼写和大小写

### 3. 数据库连接失败
**问题：** 无法连接到 Supabase
**解决：**
- 验证 DATABASE_URL 格式正确
- 检查 Supabase 项目是否暂停
- 确认网络连接和防火墙设置

### 4. 静态资源 404
**问题：** 图片或其他静态资源无法加载
**解决：**
- 检查 Cloudflare R2 配置
- 验证自定义域名和 DNS 设置
- 确认 CORS 配置正确

### 5. API 路由超时
**问题：** AI API 调用超时
**解决：**
- 检查 `vercel.json` 中的 `maxDuration` 设置
- 优化 AI API 调用逻辑
- 添加重试机制

### 6. OAuth 认证失败
**问题：** Google/GitHub 登录不工作
**解决：**
- 验证 OAuth 应用的回调 URL 配置
- 检查 `AUTH_URL` 环境变量
- 确认 OAuth 密钥在生产环境中正确

## 📝 部署后维护

### 1. 监控和日志
- 使用 Vercel Analytics 监控性能
- 检查 Function Logs 中的错误
- 设置 Uptime 监控

### 2. 备份策略
- 定期备份数据库
- 导出重要配置和环境变量
- 保持代码的版本控制

### 3. 更新流程
1. 在 `development` 分支进行更改
2. 通过 Pull Request 审查代码
3. 合并到 `main` 分支自动部署
4. 验证生产环境功能正常

## 🔗 相关资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Supabase 集成指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)

---

**最后更新：** 2024年12月
**文档版本：** 1.0

> 💡 **提示：** 部署前请仔细检查每个步骤，确保所有配置正确。遇到问题时，查看 Vercel 的实时日志可以帮助快速定位问题。