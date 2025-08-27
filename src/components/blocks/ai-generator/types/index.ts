/**
 * AI Generator 类型定义
 * 
 * 功能：为AI生成器组件提供完整的TypeScript类型支持
 * 包含：提供商配置、生成结果、状态管理等所有相关类型
 */

export type GenerationType = "text" | "image" | "video";

export type ProviderStatus = "working" | "quota_exceeded" | "needs_key" | "experimental";

/**
 * AI提供商配置接口
 */
export interface AIProvider {
  id: string;
  name: string;
  logo: string;
  models: string[];
  status: ProviderStatus;
}

/**
 * AI提供商集合接口
 */
export interface AIProviders {
  text: AIProvider[];
  image: AIProvider[];
  video: AIProvider[];
}

/**
 * 文本生成结果接口
 */
export interface TextGenerationResult {
  text: string;
  reasoning?: string;
  provider?: string;
  model?: string;
  credits_used?: number;
  credits_remaining?: number;
}

/**
 * 图像生成结果接口
 */
export interface ImageGenerationResult {
  image_url: string;
  provider?: string;
  model?: string;
  filename?: string;
  revised_prompt?: string;
  credits_used?: number;
  credits_remaining?: number;
}

/**
 * 视频生成结果接口
 */
export interface VideoGenerationResult {
  status: "processing" | "completed" | "demo";
  video_url?: string;
  preview_url?: string;
  message?: string;
  frame_count?: number;
  fps?: number;
  frames?: Array<{ url: string }>;
  demo?: boolean;
  credits_required?: number;
  estimated_time?: number;
  credits_used?: number;
  credits_remaining?: number;
}

/**
 * 生成结果联合类型
 */
export type GenerationResult = TextGenerationResult | ImageGenerationResult | VideoGenerationResult;

/**
 * API响应接口
 */
export interface APIResponse<T = any> {
  code: number;
  data: T;
  error?: string;
  message?: string;
}

/**
 * 生成请求参数接口
 */
export interface GenerationRequest {
  prompt: string;
  provider: string;
  model: string;
  type: GenerationType;
}

/**
 * Hook返回值接口 - AI生成逻辑
 */
export interface UseAIGenerationReturn {
  isGenerating: boolean;
  result: GenerationResult | null;
  error: string | null;
  handleGenerate: (request: GenerationRequest) => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
}

/**
 * Hook返回值接口 - 提供商切换
 */
export interface UseProviderSwitchReturn {
  selectedProvider: string;
  selectedModel: string;
  availableProviders: AIProvider[];
  currentProvider: AIProvider | undefined;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  autoSwitchProvider: (activeTab: GenerationType) => void;
}

/**
 * Hook返回值接口 - 标签状态
 */
export interface UseTabStateReturn {
  activeTab: GenerationType;
  setActiveTab: (tab: GenerationType) => void;
  tabConfig: {
    text: { icon: string; label: string };
    image: { icon: string; label: string };
    video: { icon: string; label: string };
  };
}

/**
 * Hook返回值接口 - 积分管理
 */
export interface UseCreditsReturn {
  credits: number;
  setCredits: (credits: number) => void;
  updateCreditsFromResult: (result: GenerationResult) => void;
}

/**
 * 组件Props接口 - 主组件
 */
export interface AIGeneratorProps {
  hero?: {
    title?: string;
    subtitle?: string;
    badge?: string;
  };
}

/**
 * 组件Props接口 - 标签选择器
 */
export interface TabSelectorProps {
  activeTab: GenerationType;
  onTabChange: (tab: GenerationType) => void;
}

/**
 * 组件Props接口 - 提供商选择器
 */
export interface ProviderSelectorProps {
  providers: AIProvider[];
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

/**
 * 组件Props接口 - 模型选择器
 */
export interface ModelSelectorProps {
  models: string[];
  selectedModel: string;
  onModelChange: (model: string) => void;
}

/**
 * 组件Props接口 - 提示词输入
 */
export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

/**
 * 组件Props接口 - 生成按钮
 */
export interface GenerateButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
  activeTab: GenerationType;
}

/**
 * 组件Props接口 - 积分显示
 */
export interface CreditDisplayProps {
  credits: number;
}

/**
 * 组件Props接口 - 状态提示
 */
export interface StatusAlertProps {
  activeTab: GenerationType;
  selectedProvider: string;
  providerStatus: ProviderStatus;
}

/**
 * 组件Props接口 - 结果显示
 */
export interface ResultDisplayProps {
  result: GenerationResult | null;
  resultType: GenerationType;
  onCopy?: (text: string) => void;
}

/**
 * 错误类型定义
 */
export interface GenerationError {
  type: "insufficient_credits" | "quota_exceeded" | "unauthorized" | "api_error" | "network_error";
  message: string;
  details?: any;
}

/**
 * 工具函数类型
 */
export type StatusIndicator = "✅" | "⚠️" | "🚧" | "❌" | "🔑";

export interface ProviderStatusInfo {
  indicator: StatusIndicator;
  message: string;
  color: "green" | "yellow" | "orange" | "red";
}