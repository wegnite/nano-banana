# Vercel 部署检查清单

## 部署前准备 (Pre-Deployment)

### 代码质量检查
- [ ] **运行所有测试**
  ```bash
  npm run test
  npm run test:integration
  npm run test:nano-banana
  ```

- [ ] **TypeScript 类型检查**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **代码 Lint 检查**
  ```bash
  npm run lint
  ```

- [ ] **构建验证**
  ```bash
  npm run build
  ```

- [ ] **Bundle 分析**
  ```bash
  npm run analyze
  ```

### 环境配置检查

#### Vercel 项目设置
- [ ] **项目名称**: `nano-banana`
- [ ] **Framework**: Next.js
- [ ] **Node.js 版本**: 20.x
- [ ] **构建命令**: `next build`
- [ ] **输出目录**: `.next`
- [ ] **安装命令**: `npm ci`

#### 环境变量配置
- [ ] **基础配置**
  - [ ] `NEXT_PUBLIC_WEB_URL`
  - [ ] `NEXT_PUBLIC_PROJECT_NAME`  
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_TELEMETRY_DISABLED=1`

- [ ] **数据库配置**
  - [ ] `DATABASE_URL` (Supabase PostgreSQL)

- [ ] **认证配置**
  - [ ] `AUTH_SECRET` (使用 `openssl rand -base64 32` 生成)
  - [ ] `AUTH_URL`
  - [ ] `AUTH_TRUST_HOST=true`
  - [ ] `AUTH_GOOGLE_ID`
  - [ ] `AUTH_GOOGLE_SECRET`
  - [ ] `NEXT_PUBLIC_AUTH_GOOGLE_ID`
  - [ ] `AUTH_GITHUB_ID`
  - [ ] `AUTH_GITHUB_SECRET`

- [ ] **AI 服务配置**
  - [ ] `NANO_BANANA_API_KEY`
  - [ ] `NANO_BANANA_API_URL`
  - [ ] `OPENAI_API_KEY`
  - [ ] `DEEPSEEK_API_KEY`
  - [ ] `REPLICATE_API_TOKEN`
  - [ ] `OPENROUTER_API_KEY`
  - [ ] `SILICONFLOW_API_KEY`

- [ ] **存储配置**
  - [ ] `STORAGE_ENDPOINT` (Cloudflare R2)
  - [ ] `STORAGE_REGION=auto`
  - [ ] `STORAGE_ACCESS_KEY`
  - [ ] `STORAGE_SECRET_KEY`
  - [ ] `STORAGE_BUCKET`
  - [ ] `STORAGE_DOMAIN`

- [ ] **支付配置**
  - [ ] `PAY_PROVIDER=stripe`
  - [ ] `STRIPE_PUBLIC_KEY`
  - [ ] `STRIPE_PRIVATE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`

- [ ] **分析配置**
  - [ ] `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`
  - [ ] `NEXT_PUBLIC_OPENPANEL_CLIENT_ID`

### 配置文件检查

- [ ] **vercel.json 配置正确**
  - [ ] Functions 配置
  - [ ] Headers 配置
  - [ ] Redirects 配置
  - [ ] Rewrites 配置
  - [ ] Crons 配置

- [ ] **next.config.mjs 配置正确**
  - [ ] Image optimization
  - [ ] Security headers
  - [ ] Webpack optimizations
  - [ ] Edge runtime compatibility

- [ ] **middleware.ts 配置正确**
  - [ ] i18n 路由
  - [ ] Attribution tracking
  - [ ] Cookie 配置

## 部署过程 (Deployment Process)

### 1. 代码推送
- [ ] **推送到 main 分支**
  ```bash
  git add .
  git commit -m "feat: Production deployment configuration"
  git push origin main
  ```

### 2. Vercel 自动部署
- [ ] **监控构建过程**
- [ ] **检查构建日志**
- [ ] **验证函数部署**

### 3. 部署验证
- [ ] **访问生产 URL**
- [ ] **检查 SSL 证书**
- [ ] **验证域名解析**

## 功能测试 (Function Testing)

### 基础功能
- [ ] **首页加载**
- [ ] **国际化切换 (en/zh)**
- [ ] **响应式设计**
- [ ] **导航功能**

### 认证功能
- [ ] **Google OAuth 登录**
- [ ] **GitHub OAuth 登录**
- [ ] **登出功能**
- [ ] **会话管理**

### Character Figure 功能
- [ ] **Character Figure 页面加载**
- [ ] **生成表单提交**
- [ ] **AI 图片生成**
- [ ] **结果显示**
- [ ] **历史记录**
- [ ] **图片下载**

### API 端点测试
- [ ] **`/api/character-figure/generate` (POST)**
- [ ] **`/api/character-figure/history` (GET)**
- [ ] **`/api/character-figure/gallery` (GET)**
- [ ] **`/api/nano-banana/generate` (POST)**
- [ ] **`/api/get-user-credits` (GET)**

### 支付功能
- [ ] **Pricing 页面**
- [ ] **Stripe 支付流程**
- [ ] **支付成功页面**
- [ ] **Credit 充值**
- [ ] **订单历史**

## 性能验证 (Performance Validation)

### Core Web Vitals
- [ ] **Largest Contentful Paint (LCP) < 2.5s**
- [ ] **First Input Delay (FID) < 100ms**
- [ ] **Cumulative Layout Shift (CLS) < 0.1**
- [ ] **First Contentful Paint (FCP) < 1.5s**

### API 性能
- [ ] **标准 API 响应时间 < 2s**
- [ ] **AI 生成 API 响应时间 < 30s**
- [ ] **图片加载时间 < 3s**

### 工具验证
- [ ] **Google PageSpeed Insights 测试**
- [ ] **Vercel Analytics 检查**
- [ ] **Web Vitals 监控设置**

## 安全验证 (Security Validation)

### 安全头部检查
- [ ] **Content-Security-Policy 正确配置**
- [ ] **Strict-Transport-Security 启用**
- [ ] **X-Content-Type-Options: nosniff**
- [ ] **X-Frame-Options: DENY**
- [ ] **X-XSS-Protection 启用**

### API 安全
- [ ] **Rate limiting 工作正常**
- [ ] **认证保护的端点需要登录**
- [ ] **CORS 头部正确配置**
- [ ] **敏感信息不暴露在客户端**

### 数据安全
- [ ] **数据库连接加密**
- [ ] **环境变量保护**
- [ ] **API 密钥不泄露**

## 监控设置 (Monitoring Setup)

### Vercel 监控
- [ ] **Functions 监控启用**
- [ ] **Analytics 配置**
- [ ] **Error tracking 设置**
- [ ] **Performance 监控**

### 外部监控
- [ ] **Google Analytics 工作**
- [ ] **OpenPanel Analytics 配置**
- [ ] **Uptime 监控设置**

### Cron 任务
- [ ] **`/api/cleanup/sessions` 定时任务**
- [ ] **`/api/analytics/daily-report` 定时任务**

## 备份验证 (Backup Verification)

- [ ] **数据库备份策略确认**
- [ ] **环境变量备份**
- [ ] **代码库备份**
- [ ] **配置文件备份**

## 文档更新 (Documentation Update)

- [ ] **API 文档更新**
- [ ] **部署文档更新**
- [ ] **用户指南更新**
- [ ] **开发者文档更新**

## 后部署监控 (Post-Deployment Monitoring)

### 第一天
- [ ] **监控错误日志**
- [ ] **检查性能指标**
- [ ] **用户反馈收集**
- [ ] **Traffic 分析**

### 第一周
- [ ] **性能趋势分析**
- [ ] **用户行为分析**
- [ ] **错误率监控**
- [ ] **资源使用监控**

### 持续监控
- [ ] **每日性能报告**
- [ ] **每周用户数据分析**
- [ ] **每月安全检查**
- [ ] **季度性能优化**

## 问题排查 (Troubleshooting)

### 常见问题检查
- [ ] **API 超时问题**
- [ ] **图片加载失败**
- [ ] **认证失败**
- [ ] **数据库连接问题**
- [ ] **支付流程异常**

### 紧急联系人
- [ ] **技术负责人联系方式**
- [ ] **服务商技术支持**
- [ ] **备用联系方案**

## 回滚计划 (Rollback Plan)

### 回滚触发条件
- [ ] **Critical 错误**
- [ ] **性能严重下降**
- [ ] **安全漏洞发现**
- [ ] **用户体验严重影响**

### 回滚步骤
- [ ] **Vercel 控制台回滚**
- [ ] **数据库状态确认**
- [ ] **环境变量恢复**
- [ ] **监控系统重置**

---

## 签署确认

### 部署负责人确认
- **姓名**: ________________
- **日期**: ________________
- **签名**: ________________

### 技术审查确认
- **姓名**: ________________
- **日期**: ________________
- **签名**: ________________

### 产品负责人确认
- **姓名**: ________________
- **日期**: ________________
- **签名**: ________________

---

**注意事项**:
1. 所有检查项必须完成后才能进行生产部署
2. 任何失败的检查项必须修复后重新验证
3. 保留此检查清单作为部署记录
4. 定期更新检查清单以适应新功能

**部署日期**: ________________  
**部署版本**: ________________  
**部署环境**: Production  
**负责团队**: Claude Code Development Team