# OpenRouter 集成说明文档

## 📋 概述

本文档说明 AI Universal Generator 项目中 OpenRouter 的集成状态和使用方法。

## 🚀 当前状态

### ✅ 文本生成（完全支持）

OpenRouter 的文本生成功能已完全集成，支持以下模型：

- **Meta Llama 3.3** - 70B 参数的强大开源模型
- **Google Gemini 2.0 Flash** - 支持思考模式的最新模型
- **Anthropic Claude 3.5 Sonnet** - 高质量对话模型
- **DeepSeek R1** - 支持推理过程展示

**使用方法：**
1. 在 `.env.local` 中设置 `OPENROUTER_API_KEY`
2. 选择 OpenRouter 提供商
3. 选择模型并输入提示词
4. 点击生成

### 🚧 图像生成（实验性）

**当前限制：**
- OpenRouter 不直接提供图像生成 API
- 目前返回演示占位符图像
- 未来计划集成真实的图像生成服务

**可选方案：**
1. 通过 OpenAI API 直接调用 DALL-E 3
2. 使用 Replicate 集成 Stable Diffusion
3. 集成专门的图像生成服务

**模拟的模型列表：**
- `stable-diffusion` - Stable Diffusion 风格
- `flux-experimental` - FLUX 实验模型
- `dalle-style` - DALL-E 风格生成

### 🎬 视频生成（开发中）

**当前状态：**
- 框架已搭建完成
- UI 支持视频展示
- 返回处理状态和预览图

**技术方案：**
1. 生成图像序列
2. 使用 FFmpeg 合成视频
3. 集成专门的视频 API（Runway, Pika 等）

## 🔧 API 端点

### 文本生成
```
POST /api/demo/gen-text
{
  "prompt": "你的提示词",
  "provider": "openrouter",
  "model": "meta-llama/llama-3.3-70b-instruct"
}
```

### 图像生成（实验性）
```
POST /api/demo/gen-image-simple
{
  "prompt": "图像描述",
  "provider": "openrouter",
  "model": "stable-diffusion"
}
```

### 视频生成（演示）
```
POST /api/demo/gen-video-openrouter
{
  "prompt": "视频描述",
  "provider": "openrouter-video",
  "model": "animation/stable-diffusion-animation",
  "duration": 2,
  "fps": 7
}
```

## 💰 积分消耗

| 功能类型 | 积分消耗 | 说明 |
|---------|---------|------|
| 文本生成 | 1 积分 | 每次调用 |
| 图像生成 | 5 积分 | 实验性功能 |
| 视频生成 | 20 积分 | 演示功能 |

## ⚠️ 注意事项

1. **API Key 配置**
   - 必须在环境变量中设置有效的 `OPENROUTER_API_KEY`
   - 可从 [OpenRouter](https://openrouter.ai) 获取

2. **模型限制**
   - 并非所有 OpenRouter 模型都支持所有功能
   - 图像和视频生成目前是实验性的

3. **错误处理**
   - 模型不可用时会返回明确的错误信息
   - Demo 模式下返回占位符响应

## 🔄 未来计划

### 短期目标
1. 集成真实的图像生成 API
2. 优化视频生成流程
3. 添加更多 OpenRouter 支持的模型

### 长期目标
1. 完整的多模态支持
2. 图像输入功能（GPT-4V 等）
3. 音频生成集成
4. 实时流式生成

## 🐛 已知问题

1. **图像生成返回占位符**
   - 原因：OpenRouter 不直接提供图像生成
   - 解决：正在评估集成其他服务

2. **视频生成响应慢**
   - 原因：模拟处理过程
   - 解决：已优化到 1 秒响应时间

3. **模型 ID 格式**
   - 某些模型 ID 可能与 OpenRouter 实际格式不匹配
   - 建议查阅 OpenRouter 官方文档

## 📝 开发者说明

### 添加新模型
1. 编辑 `/src/components/blocks/ai-generator/index.tsx`
2. 在 `AI_PROVIDERS` 对象中添加模型
3. 确保模型 ID 与 OpenRouter 一致

### 测试
```bash
# 运行集成测试
node test/integration/test-openrouter-multimodal.js
```

### 调试
- 查看浏览器控制台的 API 响应
- 检查服务器日志的错误信息
- 使用 Demo 模式进行功能验证

## 📞 支持

如有问题或建议，请：
1. 查看 [OpenRouter 文档](https://openrouter.ai/docs)
2. 提交 GitHub Issue
3. 联系技术支持

---

*最后更新：2025年1月*
*版本：1.0.0*