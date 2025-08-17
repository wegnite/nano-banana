# Claude Code 自动化任务指南

## 📋 概述
本文档总结了 Claude Code 的自动化能力研究结果，以及如何最大化利用其功能进行半自动化开发。

## 🔍 研究发现

### 1. Claude Code 的当前限制
- **无真正后台任务**：Claude Code 设计为交互式助手，无法在无人值守情况下持续运行
- **需要用户参与**：关键决策和权限授予需要用户确认
- **会话限制**：每个会话都有上下文限制，无法无限期运行

### 2. 可用的自动化特性

#### 2.1 非交互式模式
```bash
# 使用 print 模式执行单次任务
claude -p "执行特定任务" 

# 通过管道传递内容
cat file.txt | claude -p "分析这个文件并生成报告"

# 限制执行轮次
claude -p "完成任务" --max-turns 10
```

#### 2.2 权限预设
```bash
# 跳过权限提示（危险，谨慎使用）
claude --dangerously-skip-permissions

# 预设权限模式
claude --permission-mode allow-all
```

#### 2.3 会话恢复
```bash
# 继续最近的对话
claude --continue

# 恢复特定会话
claude --resume <session-id>
```

## 🚀 半自动化解决方案

### 方案一：脚本化批处理任务
```bash
#!/bin/bash
# 创建自动化脚本 auto-dev.sh

# 任务1：代码审查
claude -p "审查 src/ 目录下的所有代码，生成安全报告" > security-review.md

# 任务2：测试修复
claude -p "运行测试并修复所有失败的测试" --max-turns 20

# 任务3：文档生成
claude -p "为所有 API 端点生成文档" > api-docs.md
```

### 方案二：定时任务结合会话恢复
```bash
# 使用 cron 定时触发
# crontab -e
0 */2 * * * /usr/local/bin/claude --continue --max-turns 10
```

### 方案三：任务分解策略
将大型任务分解为多个小任务，每个任务独立执行：

1. **规划阶段**
   ```bash
   claude -p "分析项目并创建开发计划" > development-plan.md
   ```

2. **执行阶段**
   ```bash
   # 基于计划逐步执行
   claude -p "根据 development-plan.md 执行第1步"
   claude -p "根据 development-plan.md 执行第2步"
   ```

3. **验证阶段**
   ```bash
   claude -p "运行所有测试并生成报告"
   ```

## 🎯 最佳实践建议

### 1. 任务规划模板
创建标准化的任务模板，让 Claude Code 可以自主执行：

```markdown
# 任务模板：feature-development.md

## 目标
实现用户认证功能

## 步骤
1. [ ] 创建数据库模型
2. [ ] 实现 API 端点
3. [ ] 编写单元测试
4. [ ] 创建前端界面
5. [ ] 集成测试
6. [ ] 文档更新

## 验收标准
- 所有测试通过
- 代码覆盖率 > 80%
- 文档完整
```

### 2. 使用 TodoWrite 工具
Claude Code 内置的 TodoWrite 工具可以帮助跟踪长期任务：
- 创建详细的任务列表
- 标记任务进度
- 自动跟踪完成状态

### 3. 扩展思考模式
对于复杂任务，使用扩展思考提示：
- "think deeply about..."
- "think harder about edge cases"
- "plan the implementation carefully"

## 💡 实用技巧

### 1. 夜间任务准备
虽然无法真正后台运行，但可以：
1. **准备详细的任务说明**
2. **设置合理的 max-turns 限制**
3. **使用脚本串联多个任务**
4. **第二天使用 --continue 恢复**

### 2. MCP 工具配置
- 已创建 `~/.mcp-tools/` 目录
- 配置文件位置：`~/.mcp-tools/.env`
- 可在此配置各种 MCP 服务器的环境变量

### 3. 项目自动化脚本示例
```bash
#!/bin/bash
# project-automation.sh

echo "🚀 开始自动化开发流程"

# 步骤1：更新依赖
echo "📦 更新依赖..."
claude -p "检查并更新 package.json 中的依赖" --max-turns 5

# 步骤2：代码质量检查
echo "🔍 代码质量检查..."
claude -p "运行 lint 和类型检查，修复所有问题" --max-turns 10

# 步骤3：测试
echo "🧪 运行测试..."
claude -p "运行所有测试，修复失败的测试" --max-turns 15

# 步骤4：构建
echo "🏗️ 构建项目..."
claude -p "执行生产构建，确保没有错误" --max-turns 5

# 步骤5：生成报告
echo "📊 生成报告..."
claude -p "生成今日工作总结报告" > daily-report.md

echo "✅ 自动化流程完成"
```

## 🔧 故障排除

### 问题：db.select is not a function
**解决方案**：已修复 - db 导出为函数，需要调用 `db()` 而不是直接使用 `db`

### 问题：MCP 工具目录不存在
**解决方案**：已创建 `~/.mcp-tools/` 目录和 `.env` 配置文件

### 问题：权限错误
**解决方案**：使用 `--permission-mode` 预设权限，或在交互模式下预先授权

## 📝 总结

虽然 Claude Code 不支持真正的无人值守后台任务，但通过：
1. **脚本化和批处理**
2. **会话恢复功能**
3. **任务分解策略**
4. **合理的自动化脚本**

可以实现相当程度的自动化，减少重复性工作，提高开发效率。

## 🔗 相关资源
- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [CLI 参考](https://docs.anthropic.com/en/docs/claude-code/cli-reference)
- [常见工作流](https://docs.anthropic.com/en/docs/claude-code/common-workflows)

---

*文档创建时间：2025-08-17*
*作者：Claude Code Assistant*