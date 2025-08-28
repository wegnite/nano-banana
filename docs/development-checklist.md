# 开发检查清单 (Development Checklist)

## 📋 每次提交前必须检查

### 1. 代码质量检查
```bash
# ✅ 必须通过构建测试
pnpm build

# ✅ 类型检查
pnpm tsc --noEmit

# ✅ Lint 检查（如果配置了）
pnpm lint
```

### 2. 功能测试
- [ ] 在开发模式测试新功能
- [ ] 在生产构建模式验证
- [ ] 测试国际化（中英文切换）
- [ ] 测试响应式布局（移动端/桌面端）

### 3. 路由验证
- [ ] 所有新增页面可访问
- [ ] sitemap.ts 包含新页面
- [ ] 无语言前缀的路径有重定向处理
- [ ] 404 页面正确显示

## 🚨 常见问题快速解决

### Next.js 15 相关

| 错误信息 | 解决方案 |
|---------|---------|
| `Property 'get' does not exist on type 'Promise<ReadonlyHeaders>'` | 添加 `async/await`：`const headers = await headers()` |
| `'error' is of type 'unknown'` | 使用类型守卫：`error instanceof Error ? error.message : String(error)` |
| `A conflicting public file and page file` | 删除 `/public` 中的冲突文件 |

### TypeScript 相关

| 问题 | 解决方案 |
|-----|---------|
| 类型错误只在构建时出现 | 始终运行 `pnpm build` 测试 |
| `any` 类型警告 | 定义明确的类型或接口 |
| 异步函数类型错误 | 确保返回类型包含 `Promise<>` |

## 🔧 开发环境设置

### 必要的 VS Code 扩展
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense

### 环境变量检查
```bash
# 确保 .env.local 包含所有必要变量
cat .env.local | grep -E "NEXT_PUBLIC_|DATABASE_|STRIPE_"
```

## 📝 Git 提交规范

### 提交信息格式
```
<type>: <description>

[optional body]

[optional footer]
```

### 类型前缀
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

### 示例
```bash
git commit -m "fix: 修复 Next.js 15 headers() 异步API兼容性问题

- 更新所有 headers() 调用使用 async/await
- 修复 TypeScript 类型错误
- 通过生产构建测试"
```

## 🚀 部署前检查

### 本地验证
1. [ ] `pnpm build` 成功
2. [ ] `pnpm start` 本地生产模式测试
3. [ ] 所有环境变量已配置
4. [ ] 数据库迁移已执行（如果有）

### Sitemap 和 SEO
1. [ ] `/sitemap.xml` 可访问
2. [ ] 所有页面有正确的 meta 标签
3. [ ] Open Graph 图片配置正确
4. [ ] robots.txt 配置正确

### 性能检查
1. [ ] Lighthouse 分数 > 90
2. [ ] 首屏加载时间 < 3秒
3. [ ] 图片已优化（使用 next/image）
4. [ ] 无未使用的 JavaScript

## 🔍 调试技巧

### 查看构建输出大小
```bash
pnpm build
# 查看 "Route (app)" 表格，注意 First Load JS 大小
```

### 分析包大小
```bash
# 安装分析工具
pnpm add -D @next/bundle-analyzer

# 运行分析
ANALYZE=true pnpm build
```

### 检查 API 路由
```bash
# 测试 API 端点
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 📊 监控和日志

### 开发日志
```bash
# 查看详细日志
DEBUG=* pnpm dev

# 只看特定模块
DEBUG=next:* pnpm dev
```

### 生产错误追踪
- Sentry 集成（如果配置）
- Vercel Analytics（如果部署在 Vercel）
- Google Analytics 事件追踪

## 🛠️ 常用脚本

添加到 `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "verify": "pnpm type-check && pnpm build",
    "verify:routes": "node docs/verify-routes.js",
    "clean": "rm -rf .next node_modules",
    "reinstall": "pnpm clean && pnpm install"
  }
}
```

## 💡 Pro Tips

1. **使用 Turbopack**（实验性）
```bash
pnpm dev --turbo  # 更快的开发服务器
```

2. **调试 Server Components**
```typescript
console.log('Server:', typeof window === 'undefined')
```

3. **强制重新验证缓存**
```typescript
export const revalidate = 0  // 页面级别
// 或
fetch(url, { next: { revalidate: 0 } })  // 请求级别
```

4. **检查是否在开发模式**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Dev mode only')
}
```

## 📚 相关文档

- [Next.js 15 迁移指南](./nextjs15-migration-guide.md)
- [404 错误修复指南](./404-quick-fix-guide.md)
- [Sitemap 问题分析](./sitemap-404-analysis-report.md)
- [路由验证脚本](./verify-routes.js)

---

⚠️ **重要提醒**：永远不要跳过 `pnpm build` 测试！

*最后更新：2025-08-27*