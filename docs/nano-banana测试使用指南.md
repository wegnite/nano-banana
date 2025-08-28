# Nano Banana API 测试使用指南

## 📖 快速开始

这个指南将帮助您快速上手 nano-banana API 的测试套件。

### 🚀 一键演示测试

如果您想快速验证测试框架是否正常工作：

```bash
npm run test:nano-banana-demo
```

这个命令运行一个独立的演示测试，不依赖任何外部服务，可以验证：
- 测试框架基本功能
- API 响应数据结构
- 积分计算逻辑
- 错误处理机制
- 异步操作处理

## 🧪 完整测试套件

### 1. API 功能测试

```bash
npm run test:nano-banana
```

测试内容：
- ✅ 环境配置检查
- ✅ 认证与授权机制
- ✅ 图像生成功能
- ✅ 图像编辑功能
- ✅ 参数验证
- ✅ 错误处理
- ✅ 并发请求处理

### 2. 积分系统测试

```bash
npm run test:nano-banana-credits
```

测试内容：
- ✅ 积分增加和减少
- ✅ FIFO 消费策略
- ✅ 积分不足处理
- ✅ 并发积分操作
- ✅ 交易记录准确性

### 3. 运行所有测试

```bash
npm run test:all-nano-banana
```

### 4. 自动化测试脚本

```bash
./test/run-nano-banana-tests.sh
```

这个脚本会：
- 🔧 检查环境配置
- 🚀 启动开发服务器
- 🧪 运行完整测试套件
- 📊 生成详细报告
- 🧹 自动清理资源

## 📋 环境配置

### 必需的环境变量

在 `.env.local` 文件中配置：

```bash
# Nano Banana API 配置
NANO_BANANA_API_KEY="your_api_key_here"
NANO_BANANA_API_URL="https://api.kie.ai/nano-banana"

# 基础配置
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
AUTH_SECRET="your_auth_secret"
AUTH_URL="http://localhost:3000/api/auth"

# 数据库配置（积分测试需要）
DATABASE_URL="your_database_url"
```

### 获取 API 密钥

1. 访问 [Nano Banana API 官网](https://kie.ai/nano-banana)
2. 注册账户并获取 API 密钥
3. 将密钥配置到环境变量中

## 📊 测试结果解读

### 成功示例

```
============================================================
测试结果摘要
============================================================
总测试用例: 22
通过: 22
失败: 0
通过率: 100.0%
执行时间: 202ms

🎉 所有测试通过！
```

### 部分跳过示例

```
============================================================
测试结果摘要
============================================================
总测试用例: 20
通过: 9
失败: 0
跳过: 11
通过率: 45%

⚠️ 部分测试被跳过，通常因为缺少认证或API配置
```

### 测试状态含义

- ✅ **通过**: 测试成功执行且结果符合预期
- ❌ **失败**: 测试执行但结果不符合预期
- ⚠️ **跳过**: 由于环境限制无法执行（如缺少认证）

## 🔧 常见问题解决

### 问题 1: 认证相关测试被跳过

**原因**: 没有有效的用户会话

**解决方案**:
```bash
# 启动开发服务器
npm run dev

# 在浏览器中访问 http://localhost:3000 并登录
# 然后运行测试
```

### 问题 2: 积分测试失败

**原因**: 数据库连接问题或积分不足

**解决方案**:
```bash
# 检查数据库连接
npm run db:studio

# 确保测试用户有足够积分
# 或在测试中添加积分充值逻辑
```

### 问题 3: API 调用超时

**原因**: 网络问题或 API 服务不可用

**解决方案**:
```bash
# 检查网络连接
curl -I https://api.kie.ai/nano-banana

# 或者调整测试超时时间
```

## 📁 测试文件结构

```
test/
├── nano-banana-api.test.js           # 主API测试套件
├── integration/
│   └── nano-banana-credits.test.js   # 积分系统专项测试
├── demo-test.js                      # 演示测试（无依赖）
└── run-nano-banana-tests.sh          # 自动化测试脚本
```

## 🚦 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Nano Banana Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:nano-banana-demo  # 基础测试
      - run: npm run test:nano-banana       # 完整测试（需要密钥）
        env:
          NANO_BANANA_API_KEY: ${{ secrets.NANO_BANANA_API_KEY }}
```

## 📈 性能基准

### 响应时间期望

| 操作类型 | 期望时间 | 超时设置 |
|----------|----------|----------|
| 演示测试 | < 300ms | 5秒 |
| API配置查询 | < 500ms | 5秒 |
| 单图生成 | < 5秒 | 30秒 |
| 图像编辑 | < 8秒 | 30秒 |
| 积分操作 | < 100ms | 3秒 |

### 并发性能

- 支持 5-10 个并发请求
- 成功率应 > 95%
- 平均响应时间 < 8秒

## 🎯 最佳实践

### 1. 测试前准备

```bash
# 确保依赖已安装
npm install

# 确保服务器运行正常
npm run dev

# 运行快速验证
npm run test:nano-banana-demo
```

### 2. 测试执行顺序

```bash
# 1. 先运行演示测试验证框架
npm run test:nano-banana-demo

# 2. 再运行API功能测试
npm run test:nano-banana

# 3. 最后运行积分系统测试
npm run test:nano-banana-credits
```

### 3. 调试测试问题

```bash
# 启用详细日志
DEBUG=1 npm run test:nano-banana

# 查看测试结果文件
ls -la test-results/

# 检查服务器日志
tail -f .next/trace
```

## 📚 相关文档

- [Nano Banana API 测试报告](./nano-banana测试报告.md)
- [积分系统设计文档](./会员权益体系设计.md)
- [项目代码规范](./项目代码规范.md)
- [Nano Banana API 官方文档](https://kie.ai/nano-banana)

## 🆘 获取帮助

如果测试过程中遇到问题：

1. **查看详细日志**: 测试失败时会生成详细的错误日志
2. **检查环境配置**: 确保所有必要的环境变量已配置
3. **验证API密钥**: 确保 nano-banana API 密钥有效且有足够额度
4. **查看测试报告**: 详细的测试报告包含问题排查指导

---

**最后更新**: 2025年8月28日  
**文档版本**: v1.0.0  
**下次更新**: 根据API更新和用户反馈进行迭代