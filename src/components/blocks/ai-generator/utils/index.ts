/**
 * AI Generator 工具函数
 * 
 * 功能：提供重构后组件所需的各种辅助函数
 * 包含：API处理、错误分析、状态判断等工具
 */

import type { 
  GenerationType, 
  AIProvider, 
  ProviderStatus, 
  ProviderStatusInfo,
  GenerationError,
  GenerationResult
} from "../types";
import { API_ENDPOINTS, STATUS_MESSAGES, ERROR_MESSAGES } from "../constants";

/**
 * 获取提供商状态信息
 */
export function getProviderStatusInfo(status: ProviderStatus): ProviderStatusInfo {
  const config = STATUS_MESSAGES[status];
  
  const messages = {
    working: "Ready to use!",
    quota_exceeded: "API quota exceeded. Please switch to another provider.",
    needs_key: "Requires API key configuration.",
    experimental: "Experimental feature. May have limited functionality."
  };

  return {
    indicator: config.indicator,
    message: messages[status],
    color: config.color
  };
}

/**
 * 根据生成类型获取API端点
 */
export function getAPIEndpoint(type: GenerationType, provider: string): string {
  switch (type) {
    case "text":
      return API_ENDPOINTS.text;
    
    case "image":
      if (provider === "siliconflow") {
        return API_ENDPOINTS.image.siliconflow;
      } else if (provider === "openrouter") {
        return API_ENDPOINTS.image.openrouter;
      }
      return API_ENDPOINTS.image.default;
    
    case "video":
      if (provider === "siliconflow") {
        return API_ENDPOINTS.video.siliconflow;
      } else if (provider === "openrouter-video") {
        return API_ENDPOINTS.video["openrouter-video"];
      }
      throw new Error(ERROR_MESSAGES.video_coming_soon);
    
    default:
      throw new Error("Invalid generation type");
  }
}

/**
 * 解析API错误响应
 */
export function parseAPIError(error: any, response?: Response): GenerationError {
  let type: GenerationError['type'] = "api_error";
  let message = error.message || ERROR_MESSAGES.generation_failed;

  // 检测具体错误类型
  if (message.includes("Insufficient credits")) {
    type = "insufficient_credits";
  } else if (message.includes("Please login first")) {
    type = "unauthorized";
  } else if (message.includes("quota exceeded") || message.includes("insufficient_quota")) {
    type = "quota_exceeded";
  } else if (!response?.ok && response && (response.status === 0 || response.status >= 500)) {
    type = "network_error";
    message = ERROR_MESSAGES.network_error;
  }

  return {
    type,
    message,
    details: error
  };
}

/**
 * 检查响应是否为HTML错误页面
 */
export function isHTMLResponse(text: string): boolean {
  return text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
}

/**
 * 安全解析JSON响应
 */
export function safeJSONParse<T = any>(text: string): T {
  if (isHTMLResponse(text)) {
    throw new Error("Server returned HTML instead of JSON. Please check the endpoint.");
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    console.error("Response text:", text.substring(0, 500));
    throw new Error("Invalid JSON response from server");
  }
}

/**
 * 从生成结果中提取积分信息
 */
export function extractCreditsFromResult(result: GenerationResult): {
  used?: number;
  remaining?: number;
} {
  if ('credits_used' in result || 'credits_remaining' in result) {
    return {
      used: result.credits_used,
      remaining: result.credits_remaining
    };
  }
  return {};
}

/**
 * 获取推荐的提供商（基于状态和可用性）
 */
export function getRecommendedProvider(providers: AIProvider[]): AIProvider | null {
  // 优先选择工作中的提供商
  const workingProviders = providers.filter(p => p.status === "working");
  if (workingProviders.length > 0) {
    return workingProviders[0];
  }
  
  // 其次选择实验性提供商
  const experimentalProviders = providers.filter(p => p.status === "experimental");
  if (experimentalProviders.length > 0) {
    return experimentalProviders[0];
  }
  
  // 最后选择需要配置的提供商
  const configProviders = providers.filter(p => p.status === "needs_key");
  if (configProviders.length > 0) {
    return configProviders[0];
  }
  
  return providers[0] || null;
}

/**
 * 验证提示词
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  const trimmed = prompt.trim();
  
  if (!trimmed) {
    return { valid: false, error: ERROR_MESSAGES.empty_prompt };
  }
  
  if (trimmed.length > 4000) {
    return { valid: false, error: "Prompt is too long. Please keep it under 4000 characters." };
  }
  
  return { valid: true };
}

/**
 * 格式化积分显示
 */
export function formatCredits(credits: number): string {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  } else if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toString();
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 检查URL是否有效
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * 判断是否为图片文件
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
}

/**
 * 判断是否为视频文件
 */
export function isVideoFile(filename: string): boolean {
  const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  const ext = getFileExtension(filename);
  return videoExtensions.includes(ext);
}