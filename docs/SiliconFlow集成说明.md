# SiliconFlow (硅基流动) 集成说明文档

## 📋 概述

本文档说明 AI Universal Generator 项目中 SiliconFlow API 的集成状态和使用方法。SiliconFlow 提供了真实的图像和视频生成能力，是 OpenRouter 实验性功能的生产级替代方案。

## 🚀 当前状态

### ✅ 文本生成（完全支持）

SiliconFlow 的文本生成功能已完全集成，支持以下模型：

- **DeepSeek-R1** - 强大的推理模型
- **Qwen2.5-72B-Instruct** - 千问大模型

### ✅ 图像生成（完全支持）

**已实现功能：**
- 真实的图像生成（非占位符）
- 多种高质量模型选择
- 自动积分扣除
- 支持多种图像尺寸

**支持的模型：**
- `black-forest-labs/FLUX.1-schnell` - 快速生成，适合原型设计
- `stabilityai/stable-diffusion-3-5-large` - 高质量图像生成
- `stabilityai/stable-diffusion-3-5-large-turbo` - 更快的生成速度
- `stabilityai/stable-diffusion-3-medium` - 平衡质量和速度

**测试结果：**
```
✅ Image generation successful!
Generated Image URL: https://sc-maas.oss-cn-shanghai.aliyuncs.com/outputs/...
```

### ✅ 视频生成（完全支持）

**已实现功能：**
- 异步视频生成
- 状态轮询机制
- 支持多种视频模型
- 请求 ID 跟踪

**支持的模型：**
- `Pro/CogVideoX-5B-OpenSource` - 6秒高质量视频，720x480分辨率
- `Lightricks/LTX-Video` - 5秒快速视频生成，768x512分辨率

**注意事项：**
- 视频生成需要用户登录
- 消耗 20 积分
- 生成时间约 30-60 秒

## 🔧 API 端点

### 文本生成
```
POST /api/demo/gen-text
{
  "prompt": "你的提示词",
  "provider": "siliconflow",
  "model": "deepseek-ai/DeepSeek-R1"
}
```

### 图像生成
```
POST /api/demo/gen-image-siliconflow
{
  "prompt": "图像描述",
  "provider": "siliconflow",
  "model": "black-forest-labs/FLUX.1-schnell",
  "size": "1024x1024",
  "n": 1,
  "image_format": "jpeg"
}
```

### 视频生成
```
POST /api/demo/gen-video-siliconflow
{
  "prompt": "视频描述",
  "provider": "siliconflow",
  "model": "Pro/CogVideoX-5B-OpenSource",
  "num_inference_steps": 50,
  "seed": 42
}
```

### 视频状态查询
```
GET /api/demo/gen-video-siliconflow?request_id={request_id}
```

## 💰 积分消耗

| 功能类型 | 积分消耗 | 说明 |
|---------|---------|------|
| 文本生成 | 1 积分 | 每次调用 |
| 图像生成 | 5 积分 | 每张图片 |
| 视频生成 | 20 积分 | 每个视频 |

## ⚙️ 环境配置

在 `.env.local` 文件中配置：

```env
# SiliconFlow API 配置
SILICONFLOW_API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 替换为您的实际API密钥
SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1"
```

## 🎯 使用指南

### 1. 在前端选择 SiliconFlow

访问首页，在 AI Generator 组件中：
- 图像生成：自动默认选择 SiliconFlow
- 视频生成：自动默认选择 SiliconFlow
- 文本生成：可选择 SiliconFlow 或 OpenRouter

### 2. Demo 模式 vs 生产模式

**Demo 模式（未登录）：**
- 图像生成：返回真实图像，不扣积分
- 视频生成：需要登录才能使用

**生产模式（已登录）：**
- 所有功能正常工作
- 自动扣除相应积分
- 返回剩余积分信息

### 3. 视频生成流程

1. 提交生成请求
2. 获得 request_id
3. 系统自动轮询状态（最多 30 次，每次 5 秒）
4. 返回视频 URL 或处理状态

## 🧪 测试

运行集成测试：
```bash
node test/siliconflow-test.js
```

预期输出：
- ✅ 图像生成成功，返回真实图像 URL
- ⚠️ 视频生成需要登录（这是正常的）

## 📊 模型对比

### 图像生成模型

| 模型 | 速度 | 质量 | 适用场景 |
|-----|------|------|---------|
| FLUX.1-schnell | 快 | 良好 | 快速原型、测试 |
| SD 3.5 Large | 中 | 优秀 | 高质量作品 |
| SD 3.5 Turbo | 快 | 良好 | 平衡速度和质量 |
| SD 3 Medium | 中 | 良好 | 通用场景 |

### 视频生成模型

| 模型 | 时长 | 分辨率 | FPS | 特点 |
|-----|------|--------|-----|------|
| CogVideoX-5B | 6秒 | 720x480 | 8 | 高质量，慢速 |
| LTX-Video | 5秒 | 768x512 | 25 | 快速生成 |

## ⚠️ 注意事项

1. **API Key 安全**
   - 不要将 API key 提交到公开仓库
   - 使用环境变量管理敏感信息

2. **速率限制**
   - 遵守 SiliconFlow 的速率限制
   - 视频生成可能需要排队

3. **错误处理**
   - 积分不足时会返回明确错误
   - 网络错误会自动重试

4. **成本控制**
   - 视频生成消耗较多积分
   - 建议先用图像生成测试提示词

## 🔄 未来改进

1. **短期计划**
   - 添加批量生成支持
   - 实现生成历史记录
   - 优化视频状态轮询

2. **长期计划**
   - 支持更多 SiliconFlow 模型
   - 实现生成参数微调界面
   - 添加生成结果缓存

## 🐛 已知问题

1. **视频生成时间较长**
   - 原因：模型计算复杂
   - 解决：已实现异步处理和状态查询

2. **部分模型可能不可用**
   - 原因：模型更新或维护
   - 解决：提供多个备选模型

## 📝 开发者说明

### 添加新模型

1. 编辑相应的 API 路由文件
2. 在模型配置对象中添加新模型
3. 更新前端组件的模型列表

### 调试技巧

- 查看浏览器 Network 面板监控 API 调用
- 检查服务器控制台的详细日志
- 使用提供的测试脚本验证功能

## 📞 支持

如有问题或建议，请：
1. 查看 [SiliconFlow 文档](https://docs.siliconflow.cn)
2. 提交 GitHub Issue
3. 联系技术支持

---

*最后更新：2025年1月*
*版本：1.0.0*
*API Key 状态：已配置并测试通过*