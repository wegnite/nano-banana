/**
 * 提供商选择器组件
 * 
 * 功能：选择AI服务提供商
 * 特性：状态指示、视觉反馈、可用性提示
 */

import React, { memo, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProviderSelectorProps } from "../types";
import { getProviderStatusInfo } from "../utils";

const ProviderSelector = memo<ProviderSelectorProps>(({ 
  providers, 
  selectedProvider, 
  onProviderChange 
}) => {
  const t = useTranslations("ai_generator");

  // 计算提供商选择项的样式和状态
  const providerItems = useMemo(() => {
    return providers.map(provider => {
      const statusInfo = getProviderStatusInfo(provider.status);
      return {
        ...provider,
        statusInfo
      };
    });
  }, [providers]);

  return (
    <div className="flex-1 min-w-[200px]">
      <label className="text-sm font-medium text-muted-foreground mb-2 block">
        {t("model_selection.provider_label")}
      </label>
      <Select value={selectedProvider} onValueChange={onProviderChange}>
        <SelectTrigger className="bg-background/50 border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50">
          <SelectValue placeholder="Select provider..." />
        </SelectTrigger>
        <SelectContent>
          {providerItems.map((provider) => (
            <SelectItem 
              key={provider.id} 
              value={provider.id}
              className={cn(
                "transition-all duration-200",
                provider.status === "working" && "bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20",
                provider.status === "quota_exceeded" && "bg-yellow-50/50 dark:bg-yellow-900/10 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20",
                provider.status === "experimental" && "bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-100/50 dark:hover:bg-orange-900/20",
                provider.status === "needs_key" && "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-base">{provider.logo}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{provider.name}</span>
                    <span className="text-xs opacity-75">
                      {provider.statusInfo.indicator}
                    </span>
                  </div>
                  {provider.status !== "working" && (
                    <p className="text-xs opacity-75 mt-0.5">
                      {provider.statusInfo.message}
                    </p>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

ProviderSelector.displayName = "ProviderSelector";

export default ProviderSelector;