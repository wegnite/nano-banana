#!/bin/bash

# Cloudflare Pages 构建脚本
# 解决 vercel.json 重定向配置冲突问题

echo "🚀 开始 Cloudflare Pages 构建..."

# 1. 备份原始 vercel.json
if [ -f "vercel.json" ]; then
    echo "📦 备份 vercel.json..."
    mv vercel.json vercel.json.backup
fi

# 2. 创建 Cloudflare 兼容的 vercel.json（移除 redirects 部分）
echo "📝 创建 Cloudflare 兼容配置..."
cat > vercel.json << 'EOF'
{
  "version": 2,
  "name": "nano-banana",
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "functions": {
    "src/app/api/**/*": {
      "runtime": "nodejs20.x",
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Requested-With"
        }
      ]
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "NEXT_TELEMETRY_DISABLED": "1"
  }
}
EOF

# 3. 使用 Cloudflare 配置文件
echo "🔧 切换到 Cloudflare 配置..."
if [ -f "next.config.cloudflare.mjs" ]; then
    cp next.config.cloudflare.mjs next.config.mjs
fi

# 4. 构建项目
echo "🏗️ 构建 Next.js 项目..."
next build

# 5. 运行 Cloudflare adapter
echo "☁️ 运行 @cloudflare/next-on-pages..."
npx @cloudflare/next-on-pages@1

# 6. 恢复原始文件
echo "♻️ 恢复原始配置..."
if [ -f "vercel.json.backup" ]; then
    mv vercel.json.backup vercel.json
fi

echo "✅ Cloudflare Pages 构建完成！"