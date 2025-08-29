#!/bin/bash

# Cloudflare Pages 构建脚本
# 解决 vercel.json 冲突和文件大小限制问题

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

# 5. 清理大文件和缓存（重要！避免超过 25MB 限制）
echo "🧹 清理缓存和大文件..."
# 删除 webpack 缓存（这是导致错误的主要原因）
rm -rf .next/cache
# 删除源码映射文件以减小体积
find .next -name "*.js.map" -type f -delete 2>/dev/null || true
# 删除构建追踪文件
rm -rf .next/trace
# 删除其他不必要的大文件
find .next -type f -size +20M -delete 2>/dev/null || true

# 显示清理后的目录大小
echo "📊 构建目录大小："
du -sh .next 2>/dev/null || true

# 6. 运行 Cloudflare adapter
echo "☁️ 运行 @cloudflare/next-on-pages..."
npx @cloudflare/next-on-pages@1

# 7. 恢复原始文件
echo "♻️ 恢复原始配置..."
if [ -f "vercel.json.backup" ]; then
    mv vercel.json.backup vercel.json
fi

echo "✅ Cloudflare Pages 构建完成！"