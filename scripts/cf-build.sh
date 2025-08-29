#!/bin/bash

# Cloudflare Pages 简化构建脚本
# 专注于生成正确的输出目录并控制文件大小

echo "🚀 Cloudflare Pages 构建开始..."

# 1. 清理
echo "🧹 清理旧构建..."
rm -rf .next .vercel

# 2. 设置环境
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# 3. 构建（禁用缓存）
echo "🏗️ 构建项目..."
NEXT_WEBPACK_CACHE=false next build

# 4. 清理构建缓存
echo "🧹 清理缓存..."
rm -rf .next/cache
find .next -name "*.pack" -delete 2>/dev/null || true
find .next -type f -size +20M -delete 2>/dev/null || true

# 5. 运行 Cloudflare adapter（关键步骤）
echo "☁️ 生成 Cloudflare 输出..."
npx @cloudflare/next-on-pages@1

# 6. 验证输出
if [ -d ".vercel/output/static" ]; then
    echo "✅ 输出目录已生成: .vercel/output/static"
    
    # 清理输出中的大文件
    find .vercel/output -name "*.pack" -delete 2>/dev/null || true
    find .vercel/output -type f -size +20M -delete 2>/dev/null || true
    
    echo "📊 输出大小: $(du -sh .vercel/output/static | cut -f1)"
else
    echo "❌ 错误: 输出目录未生成"
    exit 1
fi

echo "✅ 构建完成！"
echo ""
echo "Cloudflare Pages 配置："
echo "  构建命令: bash ./scripts/cf-build.sh"
echo "  输出目录: .vercel/output/static"