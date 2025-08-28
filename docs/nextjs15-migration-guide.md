# Next.js 15 迁移指南与常见问题

## 项目信息
- **框架版本**: Next.js 15.2.3
- **更新日期**: 2025-08-27
- **项目**: {{PROJECT_DISPLAY_NAME}}

## 重要的 Breaking Changes

### 1. headers() API 变为异步 ⚠️

#### 问题描述
在 Next.js 15 中，`headers()` 函数从同步函数变成了异步函数，必须使用 `await`。

#### 错误示例
```typescript
// ❌ 错误：Next.js 14 的写法
import { headers } from 'next/headers'

export default function Page() {
  const headersList = headers()
  const acceptLanguage = headersList.get('accept-language')
  // ...
}
```

#### 正确示例
```typescript
// ✅ 正确：Next.js 15 的写法
import { headers } from 'next/headers'

export default async function Page() {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')
  // ...
}
```

#### 影响范围
- 所有使用 `headers()` 的页面组件
- 重定向页面
- 中间件相关代码

### 2. TypeScript 类型错误处理

#### 问题描述
Next.js 15 的构建过程有更严格的类型检查，特别是对 `unknown` 类型的处理。

#### 错误示例
```typescript
// ❌ 错误：直接访问 unknown 类型的属性
try {
  // ...
} catch (error) {
  setResult({ error: error.message }) // error 是 unknown 类型
}
```

#### 正确示例
```typescript
// ✅ 正确：类型安全的错误处理
try {
  // ...
} catch (error) {
  setResult({ 
    error: error instanceof Error ? error.message : String(error) 
  })
}
```

## 404 错误和 Sitemap 配置问题

### 问题总结
Google Search Console 报告大量 404 错误，主要原因是 sitemap 配置和实际路由结构不匹配。

### 根本原因

1. **Sitemap 路径错误**
   - sitemap.ts 包含了不存在的路径（如 `/posts` 无语言前缀）
   - 实际路径应该是 `/[locale]/posts`

2. **静态与动态 Sitemap 冲突**
   - 同时存在 `/public/sitemap.xml` 和 `/app/sitemap.ts`
   - 导致 Next.js 报错："conflicting public file and page file"

3. **国际化路由配置问题**
   - 使用 "as-needed" 策略但缺少根级别重定向
   - middleware 配置排除了某些路径

### 解决方案

#### 1. 修复 Sitemap 配置
```typescript
// app/sitemap.ts - 修复后的配置
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '{{PRODUCTION_DOMAIN}}'
  const locales = ['en', 'zh']
  
  // 只包含实际存在的路径
  const sitemapEntries = []
  
  // 为每个语言生成正确的 URL
  locales.forEach(locale => {
    sitemapEntries.push({
      url: `${baseUrl}/${locale}/posts`,
      // ...
    })
  })
  
  return sitemapEntries
}
```

#### 2. 创建重定向页面
```typescript
// app/posts/page.tsx - 处理无语言前缀的访问
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function RedirectPage() {
  const headersList = await headers() // 注意：async/await
  const acceptLanguage = headersList.get('accept-language') || ''
  const locale = acceptLanguage.toLowerCase().includes('zh') ? 'zh' : 'en'
  
  redirect(`/${locale}/posts`)
}
```

#### 3. 删除冲突文件
```bash
# 删除静态 sitemap，使用动态生成
rm public/sitemap.xml
```

## 开发流程最佳实践

### 1. 测试流程 🧪

#### ❌ 错误的测试流程
```bash
# 只在开发模式测试
pnpm dev
# 测试功能...
# 直接提交
```

#### ✅ 正确的测试流程
```bash
# 1. 开发模式测试
pnpm dev
# 测试功能...

# 2. 生产构建测试（关键步骤！）
pnpm build

# 3. 修复所有构建错误后再提交
git add .
git commit -m "..."
git push
```

### 2. 构建前检查清单 ✅

- [ ] 运行 `pnpm build` 确保没有编译错误
- [ ] 检查所有 TypeScript 类型错误
- [ ] 验证 sitemap.xml 正确生成
- [ ] 测试关键路径的可访问性
- [ ] 确认国际化路由正常工作

### 3. 常用命令

```bash
# 开发服务器
pnpm dev

# 生产构建（必须在提交前运行）
pnpm build

# 类型检查
pnpm tsc --noEmit

# 检查 sitemap 生成
curl http://localhost:3000/sitemap.xml

# 验证路由
node docs/verify-routes.js
```

## 错误诊断技巧

### 1. 开发模式 vs 生产模式的差异

| 特性 | 开发模式 (dev) | 生产模式 (build) |
|-----|---------------|-----------------|
| 类型检查 | 宽松 | 严格 |
| 性能优化 | 无 | 完全优化 |
| 错误报告 | 部分 | 完整 |
| API 验证 | 基础 | 完整 |

### 2. 常见错误信息解读

#### "Property 'get' does not exist on type 'Promise<ReadonlyHeaders>'"
- **原因**: headers() 是异步函数，需要 await
- **解决**: 添加 async/await

#### "A conflicting public file and page file was found"
- **原因**: 静态文件和动态路由冲突
- **解决**: 删除 public 目录中的冲突文件

#### "'error' is of type 'unknown'"
- **原因**: TypeScript 严格模式下的类型检查
- **解决**: 使用类型守卫或类型断言

## 项目特定配置

### 国际化策略
```typescript
// i18n/locale.ts
export const locales = ["en", "zh"]
export const defaultLocale = "en"
export const localePrefix = "as-needed" // 关键配置
```

### Middleware 配置
```typescript
// middleware.ts
export const config = {
  matcher: [
    "/",
    "/(en|zh)/:path*",
    // 排除静态资源和 API 路由
    "/((?!api/|_next|sitemap.xml|robots.txt|favicon.ico).*)",
  ],
}
```

## 故障排除检查表

### 404 错误排查
1. ✅ 检查 sitemap.ts 中的所有路径
2. ✅ 验证每个路径都有对应的 page.tsx
3. ✅ 确认国际化路由配置正确
4. ✅ 测试重定向页面是否工作

### 构建错误排查
1. ✅ 运行 `pnpm build` 查看完整错误
2. ✅ 检查 TypeScript 配置
3. ✅ 验证所有异步函数正确使用 async/await
4. ✅ 确认类型错误都已处理

## 相关文件清单

### 核心配置文件
- `/app/sitemap.ts` - 动态 sitemap 生成
- `/middleware.ts` - 路由中间件
- `/i18n/routing.ts` - 国际化路由配置
- `/i18n/locale.ts` - 语言配置

### 重定向页面
- `/app/posts/page.tsx` - Posts 重定向
- `/app/showcase/page.tsx` - Showcase 重定向

### 文档和工具
- `/docs/sitemap-404-analysis-report.md` - 问题分析报告
- `/docs/404-quick-fix-guide.md` - 快速修复指南
- `/docs/verify-routes.js` - 路由验证脚本
- `/docs/redirect-page-template.tsx` - 重定向页面模板

## 经验教训总结

### 🔴 主要教训

1. **始终运行生产构建测试**
   - 开发模式不会捕获所有错误
   - `pnpm build` 是最终的验证标准

2. **注意 Next.js 版本更新**
   - 主要版本更新会有 Breaking Changes
   - 仔细阅读迁移指南

3. **TypeScript 严格模式的重要性**
   - 生产构建使用严格的类型检查
   - 提前处理类型问题避免构建失败

4. **Sitemap 配置要与实际路由匹配**
   - 定期验证 sitemap 的有效性
   - 使用自动化工具检查 404 错误

### 🟢 最佳实践

1. **使用 CI/CD 流程**
   - 在 PR 中自动运行构建测试
   - 防止有问题的代码进入主分支

2. **建立监控机制**
   - 使用 Google Search Console 监控 404
   - 设置构建失败告警

3. **保持文档更新**
   - 记录所有重要的配置变更
   - 维护故障排除指南

## 后续优化建议

1. **添加 pre-commit hooks**
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm build
```

2. **创建 GitHub Actions 工作流**
```yaml
# .github/workflows/build-check.yml
name: Build Check
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: pnpm install
      - run: pnpm build
```

3. **定期运行路由验证**
```bash
# 添加到 package.json scripts
"scripts": {
  "verify:routes": "node docs/verify-routes.js",
  "verify:sitemap": "pnpm build && pnpm verify:routes"
}
```

---

## 更新日志

### 2025-08-27
- 修复 Next.js 15 headers() 异步 API 兼容性问题
- 修复 sitemap 配置和 404 错误
- 创建重定向页面处理无语言前缀路径
- 删除冲突的静态 sitemap.xml
- 添加完整的文档和验证工具

---

*此文档应随项目更新持续维护*