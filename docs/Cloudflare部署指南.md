# Cloudflare Pages 部署指南

## 📋 前置要求

1. Cloudflare 账户（免费）
2. GitHub 仓库已推送最新代码
3. 环境变量准备完毕

## 🚀 部署步骤

### 步骤 1：登录 Cloudflare Pages

1. 访问 https://pages.cloudflare.com/
2. 登录您的账户
3. 点击 "Create a project"

### 步骤 2：连接 GitHub 仓库

1. 选择 "Connect to Git"
2. 授权 GitHub 访问
3. 选择 `wegnite/nano-banana` 仓库

### 步骤 3：配置构建设置

在构建配置页面，填写以下信息：

```
项目名称: nano-banana
生产分支: main
Framework preset: Next.js
构建命令: npx @cloudflare/next-on-pages@1
构建输出目录: .vercel/output/static
根目录: /（留空）
```

### 步骤 4：配置环境变量

点击 "Environment variables" 展开，添加以下变量：

#### 必需的环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| NODE_VERSION | Node.js 版本 | 20 |
| DATABASE_URL | 数据库连接 | postgresql://... |
| AUTH_SECRET | 认证密钥 | 32位随机字符串 |
| NEXTAUTH_URL | NextAuth URL | https://nano-banana.pages.dev |
| AUTH_URL | 认证 API URL | https://nano-banana.pages.dev/api/auth |
| NANO_BANANA_API_KEY | Nano Banana API | 从 .env.local 复制 |

#### OAuth 配置（至少配置一个）

| 变量名 | 说明 |
|--------|------|
| AUTH_GOOGLE_ID | Google OAuth ID |
| AUTH_GOOGLE_SECRET | Google OAuth Secret |
| AUTH_GITHUB_ID | GitHub OAuth ID |
| AUTH_GITHUB_SECRET | GitHub OAuth Secret |

### 步骤 5：部署

1. 点击 "Save and Deploy"
2. 等待构建完成（约 3-5 分钟）
3. 部署成功后会获得 URL：`https://nano-banana.pages.dev`

## ⚠️ 重要提示

### 已知限制

1. **Edge Runtime 限制**
   - 某些 Node.js API 不可用
   - 数据库连接需要使用 HTTP API
   - 文件系统操作受限

2. **API Routes 限制**
   - 执行时间限制：CPU 时间 50ms（免费版）
   - 内存限制：128MB
   - 请求大小限制：100MB

3. **解决方案**
   - 使用 Cloudflare Workers 处理复杂逻辑
   - 使用 KV 存储替代内存缓存
   - 使用 R2 存储替代本地文件系统

### 性能优化

1. **启用缓存**
   ```javascript
   // 在 API 路由中添加缓存头
   return new Response(data, {
     headers: {
       'Cache-Control': 'public, max-age=3600',
     }
   });
   ```

2. **使用 KV 存储**
   ```javascript
   // 使用 KV 存储缓存数据
   await env.CACHE.put(key, value, { expirationTtl: 3600 });
   ```

3. **图片优化**
   - 使用 Cloudflare Images
   - 启用 WebP 自动转换

## 🔧 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本是否设置为 20
   - 确认所有依赖都已安装
   - 查看构建日志中的错误信息

2. **API 路由 404**
   - 确认路由文件位置正确
   - 检查是否添加了 export const runtime = 'edge'

3. **数据库连接失败**
   - 使用 HTTP 连接而非 TCP
   - 考虑使用 Supabase 的 REST API
   - 或使用 Cloudflare D1 数据库

4. **认证失败**
   - 确认 AUTH_URL 设置正确
   - 检查 OAuth 回调 URL 是否更新
   - 确认 cookies 设置正确

### 调试命令

```bash
# 本地测试 Cloudflare 构建
npm run build:cloudflare

# 使用 Wrangler 本地预览
npm run preview:cloudflare

# 查看构建输出
ls -la .vercel/output/static
```

## 📈 监控和分析

1. **Cloudflare Analytics**
   - 访问量统计
   - 性能指标
   - 错误日志

2. **Web Analytics**
   - 页面浏览量
   - 用户行为
   - 转化率

3. **Workers Analytics**
   - API 调用次数
   - 响应时间
   - 错误率

## 🎯 最佳实践

1. **使用环境变量管理敏感信息**
2. **启用 Cloudflare 缓存规则**
3. **使用 Cloudflare Images 优化图片**
4. **配置自定义域名和 SSL**
5. **设置页面规则和重定向**

## 📚 相关资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)

## 💰 成本分析

Cloudflare Pages 免费套餐包括：
- ✅ 无限带宽
- ✅ 无限请求
- ✅ 500 次构建/月
- ✅ 全球 CDN
- ✅ SSL 证书
- ✅ DDoS 保护

收费项目：
- Workers（超过 10 万请求/天）
- KV 存储（超过免费额度）
- R2 存储（超过 10GB）
- Cloudflare Images（按使用量）

---

*最后更新：2024-12-28*