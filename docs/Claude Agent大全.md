# Claude Code 代理 (Agents) 安装指南

## 🎉 安装成功

已成功安装 **72 个专业代理** 到您的 Claude Code CLI！

## 📍 安装位置

所有代理文件已安装在：`~/.claude/agents/`

## 🚀 使用方法

### 1. 自动调用
Claude Code 会根据上下文自动选择合适的代理。例如：
- 编写 Python 代码时自动使用 `python-pro`
- 设计 API 时自动使用 `backend-architect`
- 审查代码时自动使用 `code-reviewer`

### 2. 显式调用
您可以在对话中明确提及代理名称来调用特定代理：
```
"使用 python-pro 代理帮我优化这段代码"
"请用 security-auditor 检查安全漏洞"
```

## 📊 已安装代理分类

### 开发与架构 (15个)
- **backend-architect** - 设计 RESTful API 和微服务架构
- **frontend-developer** - 构建响应式 Web 界面
- **api-documenter** - 创建 OpenAPI/Swagger 文档
- **architect-review** - 审查架构一致性
- **graphql-architect** - 设计 GraphQL 模式
- **database-admin** - 数据库管理和优化
- **database-optimizer** - SQL 查询性能优化

### 编程语言专家 (15个)
- **python-pro** - Python 高级特性和最佳实践
- **javascript-pro** - JavaScript/Node.js 专家
- **typescript-pro** - TypeScript 类型系统专家
- **rust-pro** - Rust 系统编程
- **golang-pro** - Go 并发和性能
- **java-pro** - Java 企业级应用
- **cpp-pro** - C++ 高性能编程
- **csharp-pro** - C# 和 .NET 开发
- **ruby-pro** - Ruby on Rails 开发
- **php-pro** - PHP Web 开发
- **scala-pro** - Scala 函数式编程
- **elixir-pro** - Elixir/Phoenix 开发
- **c-pro** - C 系统编程
- **sql-pro** - SQL 查询专家

### 移动和游戏开发 (4个)
- **mobile-developer** - React Native/Flutter 开发
- **ios-developer** - iOS/Swift 开发
- **flutter-expert** - Flutter 跨平台开发
- **unity-developer** - Unity 游戏开发
- **minecraft-bukkit-pro** - Minecraft 插件开发

### DevOps 和基础设施 (8个)
- **cloud-architect** - AWS/GCP/Azure 架构
- **devops-troubleshooter** - CI/CD 和容器化
- **deployment-engineer** - 部署和发布管理
- **terraform-specialist** - 基础设施即代码
- **network-engineer** - 网络配置和安全
- **incident-responder** - 故障响应和修复
- **performance-engineer** - 性能分析和优化

### AI 和数据科学 (6个)
- **ai-engineer** - 构建 LLM 应用和 RAG 系统
- **ml-engineer** - 机器学习模型开发
- **mlops-engineer** - ML 运维和部署
- **data-scientist** - 数据分析和可视化
- **data-engineer** - 数据管道和 ETL
- **prompt-engineer** - 提示工程优化

### 质量和安全 (5个)
- **code-reviewer** - 代码审查和重构
- **security-auditor** - 安全漏洞检测
- **test-automator** - 自动化测试策略
- **debugger** - 高级调试技术
- **error-detective** - 错误分析和修复

### SEO 优化 (10个)
- **seo-content-writer** - SEO 内容创作
- **seo-keyword-strategist** - 关键词策略
- **seo-meta-optimizer** - 元标签优化
- **seo-structure-architect** - 网站结构优化
- **seo-content-auditor** - 内容审核
- **seo-authority-builder** - 权威度建设
- **seo-snippet-hunter** - 精选摘要优化
- **seo-content-planner** - 内容规划
- **seo-content-refresher** - 内容更新策略
- **seo-cannibalization-detector** - 关键词蚕食检测

### 业务和营销 (6个)
- **business-analyst** - 业务需求分析
- **content-marketer** - 内容营销策略
- **sales-automator** - 销售自动化
- **customer-support** - 客户支持优化
- **legal-advisor** - 法律合规建议
- **risk-manager** - 风险评估和管理

### 文档和教程 (4个)
- **docs-architect** - 文档架构设计
- **tutorial-engineer** - 教程和指南编写
- **reference-builder** - API 参考文档
- **mermaid-expert** - Mermaid 图表专家

### 其他专业领域 (7个)
- **ui-ux-designer** - UI/UX 设计建议
- **payment-integration** - 支付系统集成
- **legacy-modernizer** - 遗留系统现代化
- **context-manager** - 上下文管理优化
- **dx-optimizer** - 开发者体验优化
- **search-specialist** - 搜索功能实现
- **quant-analyst** - 量化分析

## 🎯 模型选择

每个代理都配置了最适合其任务复杂度的模型：
- **Haiku** - 简单任务，快速响应
- **Sonnet** - 平衡的性能和质量（默认）
- **Opus** - 复杂任务，最高质量

## 💡 最佳实践

1. **让 Claude 自动选择** - 大多数情况下，Claude 会自动选择最合适的代理
2. **明确需求** - 描述清楚您的任务，帮助 Claude 选择正确的代理
3. **多代理协作** - 复杂任务可能会自动使用多个代理协同工作
4. **查看代理详情** - 使用 `cat ~/.claude/agents/[agent-name].md` 查看代理详细信息

## 📝 示例使用场景

```bash
# 自动选择代理
"帮我优化这个 Python 函数的性能"
# Claude 会自动使用 python-pro 和 performance-engineer

# 显式指定代理
"使用 security-auditor 检查这段代码的安全性"

# 多代理协作
"设计一个支付系统的微服务架构"
# Claude 可能会使用 backend-architect、payment-integration 和 security-auditor
```

## ✅ 验证安装

运行以下命令验证安装：
```bash
ls ~/.claude/agents/ | wc -l
# 应该显示 72 或更多
```

## 🔄 更新代理

如需更新代理到最新版本：
```bash
cd /tmp && rm -rf claude-agents-temp
git clone https://github.com/wshobson/agents.git claude-agents-temp
cp /tmp/claude-agents-temp/*.md ~/.claude/agents/
```

---

安装完成！现在您可以充分利用这 72 个专业代理来提升您的开发效率。