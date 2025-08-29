# Cloudflare Pages 部署错误修复报告

> 生成时间：2025-08-29  
> 问题类型：配置冲突  
> 修复状态：✅ 已完成  

## 🔴 问题描述

### 错误信息
```
Error: Redirect at index 0 cannot define both `permanent` and `statusCode` properties.
```

### 错误原因
Cloudflare Pages 使用 `@cloudflare/next-on-pages` 工具构建 Next.js 项目时，内部会调用 Vercel CLI 来解析 `vercel.json` 配置文件。当重定向规则中同时存在 `permanent` 和 `statusCode` 属性时会产生冲突。

### 影响范围
- Cloudflare Pages 部署失败
- 无法通过自动化部署流程发布网站

## 🔍 问题分析

### 配置冲突点
1. **vercel.json 重定向配置**
   ```json
   // 原始配置（有冲突）
   {
     "source": "/character-figure/:path*",
     "destination": "/en/character-figure/:path*",
     "permanent": false  // 与 statusCode 互斥
   }
   ```

2. **属性冲突说明**
   - `permanent: true` 等同于 `statusCode: 301`（永久重定向）
   - `permanent: false` 等同于 `statusCode: 302`（临时重定向）
   - 两者不能同时存在

## ✅ 解决方案

### 方案一：修改 vercel.json（推荐）
将 `permanent` 属性替换为 `statusCode`：

```json
// 修复后的配置
"redirects": [
  {
    "source": "/character-figure/:path*",
    "destination": "/en/character-figure/:path*",
    "statusCode": 302  // 使用 statusCode 替代 permanent
  },
  {
    "source": "/docs",
    "destination": "/en/docs",
    "statusCode": 302
  }
]
```

### 方案二：使用专门的构建脚本
创建 `scripts/build-cloudflare.sh` 脚本，在构建时动态调整配置：

```bash
#!/bin/bash
# 备份原始 vercel.json
mv vercel.json vercel.json.backup

# 创建 Cloudflare 兼容版本
# （移除或修改冲突配置）

# 执行构建
npx @cloudflare/next-on-pages@1

# 恢复原始文件
mv vercel.json.backup vercel.json
```

### 方案三：使用 _redirects 文件
创建 Cloudflare Pages 原生的重定向配置：

```
# _redirects
/character-figure/* /en/character-figure/:splat 302
/docs /en/docs 302
```

## 📝 已执行的修复步骤

1. **✅ 修改 vercel.json**
   - 将所有 `permanent: false` 替换为 `statusCode: 302`
   - 保持重定向功能不变

2. **✅ 创建备用构建脚本**
   - 路径：`scripts/build-cloudflare.sh`
   - 功能：动态处理配置冲突

3. **✅ 更新 package.json**
   - 添加 `build:cloudflare` 命令
   - 保留原始构建命令作为备份

4. **✅ 创建 _redirects 文件**
   - Cloudflare Pages 原生重定向规则
   - 作为备用方案

## 🚀 部署指南

### 自动部署（推荐）
直接推送到 GitHub，Cloudflare Pages 会自动触发部署：
```bash
git add .
git commit -m "fix: 修复 Cloudflare Pages 部署配置冲突"
git push origin main
```

### 手动部署
```bash
# 使用新的构建脚本
npm run build:cloudflare

# 或直接使用 wrangler
wrangler pages deploy .vercel/output/static --project-name=nano-banana
```

### 环境变量配置
在 Cloudflare Dashboard 中设置以下环境变量：
```
NODE_VERSION=20
NEXT_PUBLIC_WEB_URL=https://nano-banana.pages.dev
# 其他必要的环境变量...
```

## 🔧 配置文件说明

### 修改的文件列表
1. `/vercel.json` - 修复重定向配置
2. `/scripts/build-cloudflare.sh` - 新增构建脚本
3. `/package.json` - 更新构建命令
4. `/_redirects` - 新增 Cloudflare 重定向规则
5. `/vercel.cloudflare.json` - 备用配置文件

### 配置优先级
1. Cloudflare Pages 会首先读取 `_redirects` 文件
2. 然后处理 `vercel.json` 中的配置
3. 最后应用 `next.config.js` 中的重定向规则

## ⚠️ 注意事项

1. **配置同步**
   - 确保 `vercel.json` 和 `next.config.js` 的重定向规则一致
   - 避免在多个地方定义相同的重定向

2. **Edge Runtime 兼容性**
   - Cloudflare Workers 有特定的运行时限制
   - 某些 Node.js API 可能不可用

3. **图片优化**
   - 使用自定义的 Cloudflare 图片加载器
   - 配置在 `src/lib/cloudflare-image-loader.js`

4. **函数超时**
   - Cloudflare Workers 免费版限制 10ms CPU 时间
   - 付费版可达 30 秒

## 📊 验证清单

- [x] vercel.json 配置已修复
- [x] 构建脚本已创建
- [x] package.json 已更新
- [x] _redirects 文件已添加
- [ ] Cloudflare Dashboard 环境变量已配置
- [ ] 部署测试通过
- [ ] 重定向功能正常

## 🎯 后续优化建议

1. **统一配置管理**
   - 考虑使用单一配置源
   - 通过构建脚本生成平台特定配置

2. **性能优化**
   - 启用 Cloudflare 缓存
   - 配置 Page Rules
   - 使用 Cloudflare Images

3. **监控告警**
   - 设置 Cloudflare Analytics
   - 配置错误告警
   - 监控构建状态

## 📚 参考资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/)
- [Vercel 配置规范](https://vercel.com/docs/configuration)

---

*报告生成时间：2025-08-29*  
*修复工程师：Claude Code*  
*项目：nano-banana*