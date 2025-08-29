#!/bin/bash

# Cloudflare Pages 简化构建脚本
# 不使用 @cloudflare/next-on-pages，直接部署静态文件

echo "🚀 开始 Cloudflare Pages 简化构建..."

# 1. 备份并移除 vercel.json
if [ -f "vercel.json" ]; then
    echo "📦 临时移除 vercel.json..."
    mv vercel.json vercel.json.bak
fi

# 2. 设置环境变量
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# 3. 清理之前的构建
echo "🧹 清理旧构建..."
rm -rf .next
rm -rf .vercel
rm -rf out

# 4. 构建项目
echo "🏗️ 构建 Next.js 项目..."
npm run build

# 5. 立即清理缓存（关键步骤！）
echo "🧹 清理缓存文件..."
rm -rf .next/cache
rm -rf .next/server/cache
find .next -name "*.map" -type f -delete 2>/dev/null || true
find .next -type f -size +24M -delete 2>/dev/null || true

# 6. 显示结果
echo "📊 构建完成，目录大小："
du -sh .next

# 7. 恢复 vercel.json
if [ -f "vercel.json.bak" ]; then
    echo "♻️ 恢复 vercel.json..."
    mv vercel.json.bak vercel.json
fi

echo "✅ 构建完成！"