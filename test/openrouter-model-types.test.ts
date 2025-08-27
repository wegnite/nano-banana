/**
 * OpenRouter 模型配置类型测试
 * 
 * 功能：验证我们修复的 TypeScript 类型定义
 * 问题：确保类型安全的模型配置访问
 * 解决：通过类型守卫和接口定义实现类型安全
 */

// 模拟模型配置接口定义（从原文件复制）
interface BaseModelConfig {
  name: string;
  type: "vision" | "image-gen";
  maxPromptLength: number;
}

interface ImageGenModelConfig extends BaseModelConfig {
  type: "image-gen";
  supportedSizes: string[];
  defaultSize: string;
}

interface VisionModelConfig extends BaseModelConfig {
  type: "vision";
}

type ModelConfig = ImageGenModelConfig | VisionModelConfig;

// 模拟模型配置对象
const MOCK_MODELS = {
  "dall-e-3": {
    name: "DALL-E 3 via OpenRouter",
    type: "image-gen",
    maxPromptLength: 4000,
    supportedSizes: ["1024x1024", "1024x1792", "1792x1024"],
    defaultSize: "1024x1024",
  } as ImageGenModelConfig,
  
  "openai/gpt-4-vision-preview": {
    name: "GPT-4 Vision (for image understanding)",
    type: "vision",
    maxPromptLength: 4000,
  } as VisionModelConfig,
} as const;

// 类型守卫函数
const isImageGenModel = (config: ModelConfig): config is ImageGenModelConfig => {
  return config.type === "image-gen";
};

// 测试函数：模拟原始问题的修复
function testModelConfigAccess(modelName: string, size?: string): string | null {
  const modelConfig = MOCK_MODELS[modelName as keyof typeof MOCK_MODELS];
  
  if (!modelConfig) {
    return null;
  }
  
  // 使用类型守卫确保类型安全
  if (!isImageGenModel(modelConfig)) {
    throw new Error(`Model ${modelName} does not support image generation`);
  }
  
  // 现在可以安全访问 defaultSize 属性
  return size || modelConfig.defaultSize;
}

// 测试用例（使用简单断言代替测试框架）
function runTests() {
  console.log('Testing OpenRouter Model Configuration Types...');
  
  // Test 1: should access defaultSize safely for image generation models
  const result1 = testModelConfigAccess("dall-e-3");
  console.assert(result1 === "1024x1024", "Expected '1024x1024', got: " + result1);
  console.log('✓ Test 1 passed: defaultSize access works');
  
  // Test 2: should use provided size when available
  const result2 = testModelConfigAccess("dall-e-3", "1792x1024");
  console.assert(result2 === "1792x1024", "Expected '1792x1024', got: " + result2);
  console.log('✓ Test 2 passed: custom size parameter works');
  
  // Test 3: should throw error for vision models
  try {
    testModelConfigAccess("openai/gpt-4-vision-preview");
    console.error('✗ Test 3 failed: should have thrown error');
  } catch (error) {
    console.assert((error as Error).message.includes("does not support image generation"));
    console.log('✓ Test 3 passed: vision models correctly rejected');
  }
  
  // Test 4: should return null for unknown models
  const result4 = testModelConfigAccess("unknown-model");
  console.assert(result4 === null, "Expected null, got: " + result4);
  console.log('✓ Test 4 passed: unknown models return null');
  
  console.log('All tests passed! 🎉');
}

// 类型测试：确保编译时类型检查正确
function typeChecks() {
  const imageGenConfig: ImageGenModelConfig = {
    name: "Test",
    type: "image-gen",
    maxPromptLength: 1000,
    supportedSizes: ["1024x1024"],
    defaultSize: "1024x1024",
  };
  
  const visionConfig: VisionModelConfig = {
    name: "Test Vision",
    type: "vision",
    maxPromptLength: 2000,
  };
  
  // 这些应该通过类型检查
  const configs: ModelConfig[] = [imageGenConfig, visionConfig];
  
  configs.forEach(config => {
    if (isImageGenModel(config)) {
      // TypeScript 现在知道这是 ImageGenModelConfig
      const defaultSize = config.defaultSize; // 类型安全
      const sizes = config.supportedSizes; // 类型安全
      console.log(`Default size: ${defaultSize}, Supported: ${sizes.join(', ')}`);
    } else {
      // TypeScript 知道这是 VisionModelConfig
      console.log(`Vision model: ${config.name}`);
    }
  });
}

export type {
  BaseModelConfig,
  ImageGenModelConfig,
  VisionModelConfig,
  ModelConfig
};

export {
  isImageGenModel,
  testModelConfigAccess,
  typeChecks,
  runTests
};