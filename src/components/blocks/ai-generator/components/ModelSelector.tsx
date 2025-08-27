/**
 * 模型选择器组件
 * 
 * 功能：选择特定提供商的AI模型
 * 特性：动态加载、模型信息提示、性能优化
 */

import React, { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import type { ModelSelectorProps } from "../types";

const ModelSelector = memo<ModelSelectorProps>(({ 
  models, 
  selectedModel, 
  onModelChange 
}) => {
  const t = useTranslations("ai_generator");

  // 格式化模型名称显示
  const formatModelName = (model: string): string => {
    // 移除常见的前缀以简化显示
    return model
      .replace(/^(meta-llama\/|deepseek\/|google\/|anthropic\/|stabilityai\/|black-forest-labs\/)/, '')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // 获取模型类型标识
  const getModelBadge = (model: string): string => {
    if (model.includes('gpt')) return '🤖';
    if (model.includes('claude')) return '🧠';
    if (model.includes('llama')) return '🦙';
    if (model.includes('deepseek')) return '🔮';
    if (model.includes('gemini')) return '💎';
    if (model.includes('flux') || model.includes('stable-diffusion')) return '🎨';
    if (model.includes('video') || model.includes('cog')) return '🎬';
    return '⚡';
  };

  return (
    <div className="flex-1 min-w-[200px]">
      <label className="text-sm font-medium text-muted-foreground mb-2 block">
        {t("model_selection.model_label")}
      </label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="bg-background/50 border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50">
          <SelectValue placeholder="Select model..." />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {models.map((model) => (
            <SelectItem 
              key={model} 
              value={model}
              className="transition-all duration-200"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm">{getModelBadge(model)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {formatModelName(model)}
                  </div>
                  <div className="text-xs text-muted-foreground opacity-75 truncate">
                    {model}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* 模型数量提示 */}
      {models.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {models.length} model{models.length > 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
});

ModelSelector.displayName = "ModelSelector";

export default ModelSelector;