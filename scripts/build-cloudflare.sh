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

# 5. 立即清理大文件和缓存（在运行 adapter 之前！）
echo "🧹 清理缓存和大文件（重要步骤）..."

# 强制删除 webpack 缓存目录
echo "  - 删除 webpack 缓存..."
rm -rf .next/cache
rm -rf .next/server/cache
rm -rf .next/static/chunks/webpack*

# 删除源码映射文件
echo "  - 删除源码映射文件..."
find .next -name "*.js.map" -type f -delete 2>/dev/null || true
find .next -name "*.css.map" -type f -delete 2>/dev/null || true

# 删除构建追踪文件
echo "  - 删除构建追踪文件..."
rm -rf .next/trace
rm -f .next/build-manifest.json
rm -f .next/react-loadable-manifest.json

# 查找并删除所有超过 20MB 的文件
echo "  - 查找大文件..."
find .next -type f -size +20M -exec ls -lh {} \; 2>/dev/null || true
find .next -type f -size +20M -delete 2>/dev/null || true

# 显示清理后的目录大小
echo "📊 清理后的构建目录："
du -sh .next 2>/dev/null || true
echo "  最大的文件："
find .next -type f -exec ls -s {} \; 2>/dev/null | sort -n -r | head -5 | while read size file; do
    echo "    $(du -h "$file" 2>/dev/null)"
done

# 6. 运行 Cloudflare adapter
echo "☁️ 运行 @cloudflare/next-on-pages..."
npx @cloudflare/next-on-pages@1

# 7. 再次检查输出目录是否有大文件
echo "📊 最终输出目录检查："
if [ -d ".vercel/output/static" ]; then
    echo "  输出目录大小："
    du -sh .vercel/output/static 2>/dev/null || true
    echo "  检查大文件："
    find .vercel/output/static -type f -size +20M -exec ls -lh {} \; 2>/dev/null || true
fi

# 8. 恢复原始文件
echo "♻️ 恢复原始配置..."
if [ -f "vercel.json.backup" ]; then
    mv vercel.json.backup vercel.json
fi

echo "✅ Cloudflare Pages 构建完成！"