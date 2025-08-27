/**
 * AI Generator 常量定义
 * 
 * 功能：集中管理AI生成器的所有配置常量
 * 包含：提供商配置、API端点、默认值等
 */

import type { AIProviders, GenerationType } from "../types";

/**
 * AI 提供商配置
 * status 字段说明：
 * - working: 正常工作
 * - quota_exceeded: 配额超限
 * - needs_key: 需要配置 API key
 * - experimental: 实验性功能
 */
export const AI_PROVIDERS: AIProviders = {
  text: [
    { 
      id: "openrouter", 
      name: "OpenRouter ✅", 
      logo: "🌐", 
      models: [
        "meta-llama/llama-3.3-70b-instruct", 
        "deepseek/deepseek-r1", 
        "google/gemini-2.0-flash-thinking-exp-1219", 
        "anthropic/claude-3.5-sonnet"
      ], 
      status: "working" 
    },
    { 
      id: "openai", 
      name: "OpenAI ⚠️", 
      logo: "🤖", 
      models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"], 
      status: "quota_exceeded" 
    },
    { 
      id: "deepseek", 
      name: "DeepSeek", 
      logo: "🔮", 
      models: ["deepseek-chat", "deepseek-r1"], 
      status: "needs_key" 
    },
    { 
      id: "siliconflow", 
      name: "SiliconFlow ✅", 
      logo: "⚡", 
      models: ["deepseek-ai/DeepSeek-R1", "Qwen/Qwen2.5-72B-Instruct"], 
      status: "working" 
    },
  ],
  image: [
    { 
      id: "siliconflow", 
      name: "SiliconFlow ✅", 
      logo: "⚡", 
      models: [
        "black-forest-labs/FLUX.1-schnell", 
        "stabilityai/stable-diffusion-3-5-large", 
        "stabilityai/stable-diffusion-3-5-large-turbo"
      ], 
      status: "working" 
    },
    { 
      id: "openrouter", 
      name: "OpenRouter 🚧", 
      logo: "🌐", 
      models: ["stable-diffusion", "flux-experimental", "dalle-style"], 
      status: "experimental" 
    },
    { 
      id: "midjourney", 
      name: "Midjourney", 
      logo: "🎨", 
      models: ["v6", "v5.2"], 
      status: "needs_key" 
    },
    { 
      id: "flux", 
      name: "FLUX", 
      logo: "✨", 
      models: ["schnell", "pro"], 
      status: "needs_key" 
    },
    { 
      id: "ideogram", 
      name: "Ideogram", 
      logo: "💫", 
      models: ["v2", "v1"], 
      status: "needs_key" 
    },
    { 
      id: "dalle", 
      name: "DALL·E", 
      logo: "🖼️", 
      models: ["dall-e-3", "dall-e-2"], 
      status: "quota_exceeded" 
    },
    { 
      id: "replicate", 
      name: "Replicate", 
      logo: "🔄", 
      models: ["black-forest-labs/flux-schnell", "stability-ai/sdxl"], 
      status: "needs_key" 
    },
  ],
  video: [
    { 
      id: "siliconflow", 
      name: "SiliconFlow ✅", 
      logo: "⚡", 
      models: ["Wan-AI/Wan2.2-T2V-A14B", "Pro/CogVideoX-5B-OpenSource"], 
      status: "working" 
    },
    { 
      id: "openrouter-video", 
      name: "OpenRouter Video 🚧", 
      logo: "🌐", 
      models: ["animation/stable-diffusion-animation", "replicate/stable-video-diffusion"], 
      status: "experimental" 
    },
    { 
      id: "kling", 
      name: "KLING", 
      logo: "🎬", 
      models: ["kling-v1.5", "kling-v1"], 
      status: "needs_key" 
    },
    { 
      id: "runway", 
      name: "Runway", 
      logo: "🎥", 
      models: ["gen-3", "gen-2"], 
      status: "needs_key" 
    },
    { 
      id: "pika", 
      name: "Pika", 
      logo: "📹", 
      models: ["pika-1.0"], 
      status: "needs_key" 
    },
  ],
};

/**
 * API端点映射
 */
export const API_ENDPOINTS = {
  text: "/api/demo/gen-text",
  image: {
    siliconflow: "/api/demo/gen-image-siliconflow",
    openrouter: "/api/demo/gen-image-simple",
    default: "/api/demo/gen-image"
  },
  video: {
    siliconflow: "/api/demo/gen-video-siliconflow",
    "openrouter-video": "/api/demo/gen-video-openrouter"
  }
} as const;

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  // 默认选择的标签页
  activeTab: "text" as GenerationType,
  
  // 默认提供商（按优先级排序）
  defaultProviders: {
    text: "openrouter",
    image: "siliconflow", 
    video: "siliconflow"
  },
  
  // 默认模型
  defaultModels: {
    openrouter: "meta-llama/llama-3.3-70b-instruct",
    siliconflow: "deepseek-ai/DeepSeek-R1",
    openai: "gpt-4o"
  },
  
  // 默认积分
  defaultCredits: 1,
  
  // 占位符图片
  placeholderImages: {
    small: "/api/placeholder/512/512",
    medium: "/api/placeholder/1024/1024",
    large: "/api/placeholder/1920/1080"
  }
} as const;

/**
 * 提示词占位符文本
 */
export const PROMPT_PLACEHOLDERS = {
  text: "Enter your prompt here... (e.g., 'Explain quantum computing in simple terms')",
  image: "Describe the image you want to generate... (e.g., 'A serene mountain landscape at sunset')",
  video: "Describe the video you want to create... (e.g., 'A cat playing with a ball of yarn')"
} as const;

/**
 * 状态消息配置
 */
export const STATUS_MESSAGES = {
  working: {
    indicator: "✅" as const,
    color: "green" as const
  },
  quota_exceeded: {
    indicator: "⚠️" as const,
    color: "yellow" as const
  },
  needs_key: {
    indicator: "🔑" as const,
    color: "orange" as const
  },
  experimental: {
    indicator: "🚧" as const,
    color: "orange" as const
  }
} as const;

/**
 * 错误消息映射
 */
export const ERROR_MESSAGES = {
  empty_prompt: "Please enter a prompt",
  generation_failed: "Generation failed. Please try again.",
  insufficient_credits: "Insufficient credits. Please recharge your account.",
  quota_exceeded: "API quota exceeded. Please try another provider.",
  unauthorized: "Please login to use AI generation",
  network_error: "Network error. Please check your connection.",
  video_coming_soon: "Video generation is coming soon for this provider"
} as const;

/**
 * UI常量
 */
export const UI_CONFIG = {
  // 组件最大行数限制
  maxComponentLines: 200,
  
  // 文本区域最小高度
  textareaMinHeight: "120px",
  
  // 动画持续时间
  animationDuration: {
    short: 200,
    medium: 300,
    long: 500
  },
  
  // 防抖延迟
  debounceDelay: 300,
  
  // 自动保存间隔
  autoSaveInterval: 5000
} as const;

/**
 * 性能优化配置
 */
export const PERFORMANCE_CONFIG = {
  // 结果显示的最大图片数量
  maxImagesPerResult: 6,
  
  // Markdown渲染的最大字符数
  maxMarkdownLength: 10000,
  
  // 虚拟列表项目高度
  virtualListItemHeight: 40,
  
  // 懒加载阈值
  lazyLoadThreshold: 0.1
} as const;