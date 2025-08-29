#!/bin/bash
# Cloudflare Pages 部署脚本

echo "🚀 开始部署到 Cloudflare Pages..."

# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 部署说明
echo "
📋 Cloudflare Pages 部署步骤：

1. 访问 https://pages.cloudflare.com/
2. 点击 'Create a project'
3. 连接 GitHub 账户并选择 'wegnite/nano-banana'
4. 配置构建设置：
   - Framework preset: Next.js
   - Build command: npm run build
   - Build output directory: .next
   - Root directory: /

5. 添加环境变量（在 Settings > Environment variables）：
   - DATABASE_URL
   - AUTH_SECRET
   - NEXTAUTH_URL (设置为您的 Cloudflare Pages URL)
   - AUTH_URL (设置为您的 Cloudflare Pages URL/api/auth)
   - NANO_BANANA_API_KEY
   - 其他必要的 API 密钥

6. 点击 'Deploy'

✅ 部署完成后，您将获得一个免费的 .pages.dev 域名
"