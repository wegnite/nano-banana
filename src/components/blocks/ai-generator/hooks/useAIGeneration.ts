/**
 * AI 生成逻辑 Hook
 * 
 * 功能：处理AI内容生成的核心业务逻辑
 * 职责：API调用、错误处理、状态管理、结果处理
 */

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { 
  UseAIGenerationReturn, 
  GenerationRequest, 
  GenerationResult,
  APIResponse,
  TextGenerationResult,
  ImageGenerationResult,
  VideoGenerationResult
} from "../types";
import { getAPIEndpoint, parseAPIError, safeJSONParse, validatePrompt } from "../utils";
import { DEFAULT_CONFIG } from "../constants";

export function useAIGeneration(): UseAIGenerationReturn {
  const t = useTranslations("ai_generator");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 处理文本生成结果
   */
  const processTextResult = useCallback((data: any): TextGenerationResult => {
    return {
      text: data.text || "",
      reasoning: data.reasoning,
      provider: data.provider,
      model: data.model,
      credits_used: data.credits_used,
      credits_remaining: data.credits_remaining
    };
  }, []);

  /**
   * 处理图像生成结果
   */
  const processImageResult = useCallback((data: any, provider: string): ImageGenerationResult => {
    if (provider === "siliconflow" || provider === "openrouter") {
      // 新的响应格式：{images: [...], credits_used, credits_remaining}
      if (data.images && data.images.length > 0) {
        const firstImage = data.images[0];
        return {
          image_url: firstImage.url || DEFAULT_CONFIG.placeholderImages.medium,
          provider: firstImage.provider || provider,
          model: firstImage.model,
          filename: firstImage.filename,
          revised_prompt: firstImage.revised_prompt,
          credits_used: data.credits_used,
          credits_remaining: data.credits_remaining
        };
      }
    } else {
      // 传统格式：直接是图像数组
      if (Array.isArray(data) && data.length > 0) {
        const firstImage = data[0];
        return {
          image_url: firstImage.url || DEFAULT_CONFIG.placeholderImages.small,
          provider: firstImage.provider || provider,
          filename: firstImage.filename
        };
      }
    }

    // 降级返回占位符
    return {
      image_url: DEFAULT_CONFIG.placeholderImages.medium,
      provider,
      filename: "generated_image.png"
    };
  }, []);

  /**
   * 处理视频生成结果
   */
  const processVideoResult = useCallback((data: any): VideoGenerationResult => {
    return {
      status: data.status || "demo",
      video_url: data.video_url,
      preview_url: data.preview_url,
      message: data.message,
      frame_count: data.frame_count,
      fps: data.fps,
      frames: data.frames,
      demo: data.demo,
      credits_required: data.credits_required,
      estimated_time: data.estimated_time,
      credits_used: data.credits_used,
      credits_remaining: data.credits_remaining
    };
  }, []);

  /**
   * 执行API调用
   */
  const callAPI = useCallback(async (endpoint: string, body: any): Promise<APIResponse> => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    
    // 检查响应状态
    if (!response.ok && response.status === 404) {
      throw new Error("API endpoint not found. Please check the server is running correctly.");
    }

    // 解析响应
    const data = safeJSONParse<APIResponse>(responseText);

    // 检查API错误
    if (data.code !== 0) {
      throw new Error(data.error || data.message || "Generation failed");
    }

    if (!data.data) {
      throw new Error("No data returned from API");
    }

    return data;
  }, []);

  /**
   * 智能错误处理
   */
  const handleGenerationError = useCallback((error: any) => {
    console.error("Generation error:", error);
    
    const parsedError = parseAPIError(error);
    let errorMessage = parsedError.message;
    
    // 根据错误类型提供不同的处理方式
    switch (parsedError.type) {
      case "insufficient_credits":
        // 提取剩余积分信息
        const match = errorMessage.match(/You have (\d+) credits/);
        if (match) {
          // 这里可以触发积分更新回调
          console.log(`User has ${match[1]} credits remaining`);
        }
        errorMessage = "💳 " + errorMessage;
        toast.error(errorMessage, {
          action: {
            label: "Recharge",
            onClick: () => window.location.href = "/pricing"
          }
        });
        break;

      case "unauthorized":
        errorMessage = "🔐 Please login to use AI generation";
        toast.error(errorMessage, {
          action: {
            label: "Login", 
            onClick: () => window.location.href = "/login"
          }
        });
        break;

      case "quota_exceeded":
        errorMessage = "⚠️ API quota exceeded. Please switch to another provider or add credits.";
        toast.error(errorMessage);
        break;

      default:
        toast.error(errorMessage);
    }

    setError(errorMessage);
  }, []);

  /**
   * 主要的生成函数
   */
  const handleGenerate = useCallback(async (request: GenerationRequest) => {
    // 验证输入
    const validation = validatePrompt(request.prompt);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setError(null);

    try {
      // 获取API端点
      const endpoint = getAPIEndpoint(request.type, request.provider);
      
      // 构建请求体
      const body = {
        prompt: request.prompt.trim(),
        provider: request.provider,
        model: request.model,
      };

      console.log("API Request:", { endpoint, body });

      // 执行API调用
      const data = await callAPI(endpoint, body);

      console.log("API Response:", data);

      // 根据生成类型处理结果
      let processedResult: GenerationResult;
      
      switch (request.type) {
        case "text":
          processedResult = processTextResult(data.data);
          break;
        case "image":
          processedResult = processImageResult(data.data, request.provider);
          break;
        case "video":
          processedResult = processVideoResult(data.data);
          break;
        default:
          throw new Error("Invalid generation type");
      }

      setResult(processedResult);
      toast.success(t("success.generated"));

    } catch (error: any) {
      handleGenerationError(error);
    } finally {
      setIsGenerating(false);
    }
  }, [t, callAPI, processTextResult, processImageResult, processVideoResult, handleGenerationError]);

  /**
   * 清除结果
   */
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    result,
    error,
    handleGenerate,
    clearResult,
    clearError
  };
}