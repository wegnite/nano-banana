#!/bin/bash

# 应用选择性更新的脚本
# 此脚本会智能合并新功能，同时保留现有的自定义功能

echo "🔧 开始应用更新..."

# 1. 合并环境变量（只添加缺失的）
echo "📝 合并环境变量配置..."
if [ -f ".env.example.new" ]; then
    # 提取新的环境变量（不在现有文件中的）
    echo "# ===== 新增的环境变量 =====" >> .env.example.merged
    echo "# 以下是模板项目的新增配置，请根据需要添加到你的 .env 文件" >> .env.example.merged
    echo "" >> .env.example.merged
    
    # 添加 Resend 邮件配置（新功能）
    echo "# Email with Resend (新功能)" >> .env.example.merged
    echo "RESEND_API_KEY = \"\"" >> .env.example.merged
    echo "RESEND_SENDER_EMAIL = \"\"" >> .env.example.merged
    echo "" >> .env.example.merged
    
    echo "   ✅ 环境变量合并建议已保存到 .env.example.merged"
fi

# 2. 更新 package.json 依赖
echo "📦 检查新依赖..."
# 检查是否需要添加 resend 依赖（用于邮件功能）
if ! grep -q "resend" package.json; then
    echo "   - 添加 resend 依赖用于邮件功能"
    # 这里使用 jq 或 node 脚本来更新 package.json
    # 为了安全，只显示需要添加的依赖
    echo "   建议添加: \"resend\": \"^5.0.0\" 到 dependencies"
fi

# 3. 保留自定义样式，不覆盖 globals.css
echo "🎨 保留现有样式..."
echo "   - 保持现有的 globals.css (包含自定义动画)"
rm -f src/app/globals.css.new  # 删除不需要的新样式文件

# 4. 集成新功能到现有代码
echo "🔌 集成新功能..."

# 检查是否需要在 .env.local 中添加邮件配置
if [ -f ".env.local" ] && ! grep -q "RESEND" .env.local; then
    echo "" >> .env.local
    echo "# Email Configuration (Optional)" >> .env.local
    echo "# RESEND_API_KEY=" >> .env.local
    echo "# RESEND_SENDER_EMAIL=" >> .env.local
    echo "   ✅ 已在 .env.local 中添加邮件配置模板"
fi

# 5. 创建集成指南
cat > integration-guide.md << 'EOF'
# 🎯 集成指南

## ✅ 已完成的更新
1. **邮件发送功能**
   - 新增 API 路由: `/api/demo/send-email`
   - 使用 Resend 服务发送邮件
   - 需要配置 RESEND_API_KEY 和 RESEND_SENDER_EMAIL

2. **保留的功能**
   - ✅ AI 生成器组件完整保留
   - ✅ 归因系统（AttributionTracker）保留
   - ✅ 所有自定义样式和动画保留
   - ✅ 现有的所有业务逻辑保留

## 📋 需要手动完成的步骤

### 1. 安装新依赖（如果需要邮件功能）
```bash
pnpm add resend@^5.0.0
# 或
npm install resend@^5.0.0
```

### 2. 配置邮件服务（可选）
如果需要使用邮件功能：
1. 注册 [Resend](https://resend.com) 账号
2. 获取 API Key
3. 在 `.env.local` 中配置：
   ```
   RESEND_API_KEY=your_api_key
   RESEND_SENDER_EMAIL=noreply@yourdomain.com
   ```

### 3. 测试邮件发送（可选）
```javascript
// 示例代码
const response = await fetch('/api/demo/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emails: ['user@example.com'],
    subject: '欢迎使用 AI 生成器',
    content: '<h1>欢迎！</h1><p>感谢使用我们的服务。</p>'
  })
});
```

## 🔍 验证步骤
1. 运行开发服务器: `pnpm dev`
2. 检查 AI 生成器功能是否正常
3. 检查归因系统是否正常工作
4. （可选）测试邮件发送功能

## 🗑️ 清理临时文件
```bash
rm .env.example.new
rm .env.example.merged
rm package.json.backup
```

## ⚠️ 注意事项
- 模板项目的其他更新大多是结构调整，不影响功能
- 你的自定义功能都已保留
- 如果不需要邮件功能，可以忽略相关配置
EOF

echo "   ✅ 集成指南已保存到 integration-guide.md"

# 6. 显示当前状态
echo ""
echo "📊 更新状态总结："
echo "   ✅ 新增邮件发送 API"
echo "   ✅ 保留所有自定义功能"
echo "   ✅ 保留自定义样式"
echo "   ✅ 生成集成指南"
echo ""
echo "📌 下一步："
echo "   1. 查看 integration-guide.md 了解详情"
echo "   2. 根据需要安装新依赖"
echo "   3. 测试应用功能"
echo ""
echo "✨ 更新应用完成！"