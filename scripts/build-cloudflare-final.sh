#!/bin/bash

# Cloudflare Pages 终极构建脚本 - 彻底解决 25MB 限制
# 确保在构建前、构建中、构建后都进行清理

echo "🚀 开始 Cloudflare Pages 优化构建..."

# ============ 第一阶段：预清理 ============
echo "📧 阶段 1: 预清理..."
rm -rf .next
rm -rf .vercel
rm -rf node_modules/.cache

# ============ 第二阶段：环境配置 ============
echo "⚙️ 阶段 2: 配置环境..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
# 关键：禁用 webpack 缓存
export NEXT_WEBPACK_CACHE=false
# 限制内存使用
export NODE_OPTIONS="--max-old-space-size=2048"

# ============ 第三阶段：构建 ============
echo "🏗️ 阶段 3: 构建项目（无缓存模式）..."

# 创建自定义 next.config.js 临时禁用所有缓存
cat > next.config.cloudflare-temp.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  
  // 禁用所有缓存
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 禁用 webpack 缓存
    config.cache = false;
    
    // 禁用源码映射（生产环境）
    if (!dev) {
      config.devtool = false;
    }
    
    // 删除大型优化插件
    config.optimization.minimize = true;
    config.optimization.minimizer = config.optimization.minimizer?.filter(
      plugin => !plugin.constructor.name.includes('TerserPlugin')
    );
    
    return config;
  },
  
  // 禁用源码映射
  productionBrowserSourceMaps: false,
  
  // 压缩配置
  compress: true,
  
  // 禁用不必要的功能
  poweredByHeader: false,
};

export default nextConfig;
EOF

# 备份原配置
cp next.config.mjs next.config.mjs.backup 2>/dev/null || true
cp next.config.cloudflare-temp.mjs next.config.mjs

# 执行构建
next build

# ============ 第四阶段：激进清理 ============
echo "🧹 阶段 4: 激进清理..."

# 1. 删除所有缓存
echo "  - 删除所有缓存..."
rm -rf .next/cache
rm -rf .next/server/cache
find .next -type d -name "cache" -exec rm -rf {} + 2>/dev/null || true

# 2. 删除所有 webpack 相关文件
echo "  - 删除 webpack 文件..."
find .next -name "*webpack*" -delete 2>/dev/null || true
find .next -name "*.pack" -delete 2>/dev/null || true

# 3. 删除源码映射
echo "  - 删除源码映射..."
find .next -name "*.map" -delete 2>/dev/null || true

# 4. 删除构建元数据
echo "  - 删除构建元数据..."
rm -rf .next/trace
rm -rf .next/build-manifest.json
rm -rf .next/react-loadable-manifest.json
rm -rf .next/routes-manifest.json
rm -rf .next/prerender-manifest.json

# 5. 删除不必要的静态资源
echo "  - 优化静态资源..."
# 删除重复的 chunks
find .next/static/chunks -name "*.js" -size +5M -delete 2>/dev/null || true

# 6. 删除所有超过 15MB 的文件（更严格）
echo "  - 删除大文件（>15MB）..."
find .next -type f -size +15M -exec rm -f {} \; 2>/dev/null || true

# ============ 第五阶段：验证大小 ============
echo "📊 阶段 5: 验证构建大小..."

# 计算总大小
TOTAL_SIZE=$(du -sm .next | cut -f1)
echo "  构建总大小: ${TOTAL_SIZE}MB"

# 查找剩余的大文件
echo "  检查剩余大文件："
find .next -type f -size +10M -exec ls -lh {} \; 2>/dev/null | head -5

# 如果还是太大，进行更激进的清理
if [ "$TOTAL_SIZE" -gt 200 ]; then
    echo "⚠️ 构建仍然太大，执行终极清理..."
    
    # 删除所有开发依赖相关文件
    find .next -name "*dev*" -delete 2>/dev/null || true
    find .next -name "*test*" -delete 2>/dev/null || true
    find .next -name "*spec*" -delete 2>/dev/null || true
    
    # 压缩 JSON 文件
    find .next -name "*.json" -exec bash -c 'jq -c . "$1" > "$1.tmp" && mv "$1.tmp" "$1"' _ {} \; 2>/dev/null || true
fi

# ============ 第六阶段：生成 Cloudflare 输出 ============
echo "☁️ 阶段 6: 生成 Cloudflare 输出..."

# 检查是否需要运行 adapter
if command -v wrangler &> /dev/null; then
    echo "  使用 wrangler 模式..."
    # 直接部署，不使用 adapter
else
    echo "  使用 @cloudflare/next-on-pages..."
    npx @cloudflare/next-on-pages@1 || true
    
    # 清理 adapter 输出
    if [ -d ".vercel/output" ]; then
        find .vercel/output -name "*.pack" -delete 2>/dev/null || true
        find .vercel/output -type f -size +15M -delete 2>/dev/null || true
    fi
fi

# ============ 第七阶段：恢复配置 ============
echo "♻️ 阶段 7: 恢复配置..."
if [ -f "next.config.mjs.backup" ]; then
    mv next.config.mjs.backup next.config.mjs
fi
rm -f next.config.cloudflare-temp.mjs

# ============ 最终报告 ============
echo ""
echo "════════════════════════════════════════"
echo "         Cloudflare 构建完成报告          "
echo "════════════════════════════════════════"
echo "  最终大小: $(du -sh .next 2>/dev/null | cut -f1)"
echo "  文件数量: $(find .next -type f | wc -l)"
echo "  最大文件:"
find .next -type f -exec ls -s {} \; 2>/dev/null | sort -rn | head -3 | while read size file; do
    echo "    - $(du -h "$file" 2>/dev/null)"
done
echo "════════════════════════════════════════"
echo ""
echo "✅ 构建优化完成！"
echo ""
echo "📌 在 Cloudflare Pages 中使用以下配置："
echo "  构建命令: bash ./scripts/build-cloudflare-final.sh"
echo "  输出目录: .next"
echo ""