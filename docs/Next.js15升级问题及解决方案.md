# Next.js 15 升级问题及解决方案

## 📋 问题总结

在开发 Character Figure 功能时，遇到了多个 Next.js 15 兼容性问题。这些问题主要源于：

1. **Next.js 15 的重大变化**
2. **pnpm 严格模式与依赖解析**
3. **类型系统的变化**

## 🔧 已解决的问题

### 1. **缺失的 UI 组件**

**问题**：
```
Module not found: Can't resolve '@/components/ui/slider'
Module not found: Can't resolve '@/components/ui/use-toast'
```

**原因**：
- shadcn/ui 组件未完整安装
- 项目模板缺少某些组件

**解决方案**：
```typescript
// 创建了 slider.tsx
import * as SliderPrimitive from "@radix-ui/react-slider"

// 创建了 use-toast.ts, toast.tsx, toaster.tsx
// 完整的 toast 通知系统
```

### 2. **Recharts 和 Lodash 依赖问题**

**问题**：
```
Module not found: Can't resolve 'lodash/isFunction'
Module not found: Can't resolve 'lodash/max'
```

**原因**：
- Next.js 15 引入了 barrel optimization 特性
- pnpm 严格模式不提升依赖
- recharts 使用了 CommonJS 风格的 lodash 导入

**解决方案**：
```javascript
// next.config.mjs
const nextConfig = {
  // 禁用对 recharts 的 barrel optimization
  transpilePackages: ['recharts', 'lodash'],
  
  experimental: {
    // 只优化特定包
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}
```

### 3. **动态路由参数类型变化**

**问题**：
```typescript
Type error: Route has an invalid "POST" export:
Type "{ params: { templateId: string; }; }" is not valid
```

**原因**：
Next.js 15 要求动态路由参数使用 Promise 包装

**解决方案**：
```typescript
// 旧写法 (Next.js 14)
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const templateId = params.templateId;
}

// 新写法 (Next.js 15)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
}
```

### 4. **实验性配置迁移**

**警告信息**：
```
⚠ `experimental.serverComponentsExternalPackages` has been moved to `serverExternalPackages`
⚠ `experimental.outputFileTracingIncludes` has been moved to `outputFileTracingIncludes`
```

**解决方案**：
```javascript
// next.config.mjs
const nextConfig = {
  // Next.js 15 新配置位置
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/@ai-sdk/**/*'],
  },
  
  experimental: {
    // 只保留真正的实验性功能
    optimizePackageImports: ['lucide-react'],
  },
}
```

## 💡 关键教训

### 1. **版本意识**
- 开发前应先检查 Next.js 版本
- 了解主版本之间的重大变化
- 查阅升级指南和迁移文档

### 2. **依赖管理**
- pnpm 严格模式可能导致依赖解析问题
- 使用 `shamefully-hoist=true` 可以临时解决
- 考虑使用 `transpilePackages` 处理问题包

### 3. **类型安全**
- TypeScript 类型定义要保持一致
- 避免在多个地方定义相同的接口
- 使用统一的类型导入源

### 4. **渐进式修复**
- 不要试图一次解决所有问题
- 逐个修复构建错误
- 保持耐心和系统性

## 🚀 最佳实践

### 开发新功能时：

1. **环境检查**
   ```bash
   # 检查 Next.js 版本
   npx next --version
   
   # 检查包管理器
   which pnpm
   ```

2. **依赖安装**
   ```bash
   # 使用正确的包管理器
   pnpm add package-name
   
   # 安装类型定义
   pnpm add -D @types/package-name
   ```

3. **构建测试**
   ```bash
   # 频繁测试构建
   pnpm run build
   
   # 只看错误信息
   pnpm run build 2>&1 | grep -A5 "error:"
   ```

4. **配置更新**
   - 保持 next.config.mjs 更新
   - 移除废弃的配置选项
   - 使用新的配置位置

## 📝 待优化事项

虽然构建问题基本解决，但仍有一些优化空间：

1. **类型定义统一**
   - 统一 VideoGenerationRequest 类型定义
   - 清理重复的接口定义

2. **依赖优化**
   - 考虑替换 recharts 为更现代的图表库
   - 减少 lodash 依赖

3. **性能优化**
   - 启用更多的 Next.js 15 优化特性
   - 实施更好的代码分割策略

4. **开发体验**
   - 创建组件模板
   - 自动化类型生成
   - 改进错误提示

## 🎯 总结

Next.js 15 带来了许多改进，但也需要注意兼容性问题。通过系统性地解决这些问题，我们：

- ✅ 成功修复了所有构建错误
- ✅ 理解了 Next.js 15 的变化
- ✅ 建立了更好的开发流程
- ✅ 为未来的升级做好了准备

**记住**：技术债务要及时偿还，版本升级要循序渐进！

---

*文档创建时间: 2025-08-28*  
*Next.js 版本: 15.2.3*  
*项目: nano-banana / Character Figure*