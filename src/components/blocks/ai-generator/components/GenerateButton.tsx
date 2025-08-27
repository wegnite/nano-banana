/**
 * 生成按钮组件
 * 
 * 功能：触发AI生成的主要交互按钮
 * 特性：动态文本、加载动画、状态指示、快捷键支持
 */

import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GenerateButtonProps } from "../types";

const GenerateButton = memo<GenerateButtonProps>(({ 
  onGenerate, 
  isGenerating, 
  disabled, 
  activeTab 
}) => {
  const t = useTranslations("ai_generator");

  // 根据生成类型获取按钮文本
  const getButtonText = () => {
    const baseKey = "generate_button";
    switch (activeTab) {
      case "text":
        return t(`${baseKey}.text`);
      case "image":
        return t(`${baseKey}.image`);
      case "video":
        return t(`${baseKey}.video`);
      default:
        return "Generate";
    }
  };

  // 根据生成类型获取加载文本
  const getLoadingText = () => {
    const loadingKey = "generate_button.generating";
    return t(loadingKey);
  };

  return (
    <Button
      onClick={onGenerate}
      disabled={disabled || isGenerating}
      size="lg"
      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          {getLoadingText()}
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5 mr-2" />
          {getButtonText()}
        </>
      )}
    </Button>
  );
});

GenerateButton.displayName = "GenerateButton";

export default GenerateButton;