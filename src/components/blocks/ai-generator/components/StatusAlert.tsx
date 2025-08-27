/**
 * 状态提示组件
 * 
 * 功能：显示当前提供商的状态信息和建议
 * 特性：动态消息、颜色主题、可操作建议
 */

import React, { memo, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, Key } from "lucide-react";
import type { StatusAlertProps } from "../types";
import { getProviderStatusInfo } from "../utils";
import { cn } from "@/lib/utils";

const StatusAlert = memo<StatusAlertProps>(({ 
  activeTab, 
  selectedProvider, 
  providerStatus 
}) => {
  // 获取状态信息和配置
  const statusConfig = useMemo(() => {
    const info = getProviderStatusInfo(providerStatus);
    
    // 状态特定的图标映射
    const iconMap = {
      working: CheckCircle,
      quota_exceeded: AlertCircle,
      experimental: Clock,
      needs_key: Key
    };

    // 状态特定的CSS类
    const alertClasses = {
      working: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
      quota_exceeded: "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20", 
      experimental: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20",
      needs_key: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
    };

    const textClasses = {
      working: "text-green-800 dark:text-green-200",
      quota_exceeded: "text-yellow-800 dark:text-yellow-200",
      experimental: "text-orange-800 dark:text-orange-200", 
      needs_key: "text-blue-800 dark:text-blue-200"
    };

    return {
      ...info,
      icon: iconMap[providerStatus],
      alertClass: alertClasses[providerStatus],
      textClass: textClasses[providerStatus]
    };
  }, [providerStatus]);

  // 获取状态特定的消息
  const getStatusMessage = (): { message: string; actionButton?: React.ReactNode } => {
    switch (providerStatus) {
      case "working":
        if (selectedProvider === "openrouter") {
          return { 
            message: `✅ OpenRouter is ready to use with your API key!` 
          };
        }
        if (selectedProvider === "siliconflow") {
          const capabilities = {
            text: "DeepSeek-R1 and Qwen models",
            image: "FLUX.1 and Stable Diffusion 3.5",
            video: "CogVideoX and LTX-Video (May take 30-60 seconds)"
          };
          return { 
            message: `✅ SiliconFlow (硅基流动) is ready with ${capabilities[activeTab]}!` 
          };
        }
        return { message: "✅ This provider is ready to use!" };

      case "quota_exceeded":
        if (selectedProvider === "openai") {
          return { 
            message: "⚠️ OpenAI API quota exceeded. Please switch to OpenRouter or SiliconFlow.",
            actionButton: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open("https://platform.openai.com/usage", "_blank")}
                className="ml-2 h-6 text-xs"
              >
                Check Usage
              </Button>
            )
          };
        }
        return { message: "⚠️ API quota exceeded. Please switch to another provider." };

      case "experimental":
        if (selectedProvider === "openrouter" && activeTab === "image") {
          return { 
            message: "🚧 OpenRouter image generation is experimental. Try SiliconFlow for real image generation!" 
          };
        }
        if (selectedProvider === "openrouter-video") {
          return { 
            message: "🎬 Video generation through OpenRouter is in development. Try SiliconFlow for real video generation!" 
          };
        }
        return { message: "🚧 This feature is experimental and may have limited functionality." };

      case "needs_key":
        return { 
          message: "🔑 This provider requires API key configuration.",
          actionButton: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = "/settings/api-keys"}
              className="ml-2 h-6 text-xs"
            >
              Configure
            </Button>
          )
        };

      default:
        return { message: "ℹ️ Provider status unknown." };
    }
  };

  const { message, actionButton } = getStatusMessage();
  const Icon = statusConfig.icon;

  // 不显示工作状态的提示（减少噪音）
  if (providerStatus === "working" && !message.includes("SiliconFlow")) {
    return null;
  }

  return (
    <Alert className={cn("border transition-all duration-200", statusConfig.alertClass)}>
      <Icon className="h-4 w-4" />
      <AlertDescription className={cn("text-sm", statusConfig.textClass)}>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          {actionButton}
        </div>
      </AlertDescription>
    </Alert>
  );
});

StatusAlert.displayName = "StatusAlert";

export default StatusAlert;