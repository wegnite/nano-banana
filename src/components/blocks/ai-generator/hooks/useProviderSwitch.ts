/**
 * 提供商切换管理 Hook
 * 
 * 功能：管理AI提供商和模型的选择逻辑
 * 职责：提供商切换、模型选择、自动切换、推荐提供商
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type { GenerationType, UseProviderSwitchReturn, AIProvider } from "../types";
import { AI_PROVIDERS, DEFAULT_CONFIG } from "../constants";
import { getRecommendedProvider } from "../utils";

export function useProviderSwitch(activeTab: GenerationType): UseProviderSwitchReturn {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  // 获取当前标签页的提供商列表
  const availableProviders = useMemo(() => {
    return AI_PROVIDERS[activeTab] || [];
  }, [activeTab]);

  // 获取当前选择的提供商信息
  const currentProvider = useMemo(() => {
    return availableProviders.find(p => p.id === selectedProvider);
  }, [availableProviders, selectedProvider]);

  /**
   * 自动选择推荐的提供商和模型
   */
  const autoSwitchProvider = useCallback((tab: GenerationType) => {
    const providers = AI_PROVIDERS[tab];
    if (!providers || providers.length === 0) return;

    let recommendedProvider: AIProvider | null = null;

    // 根据标签页选择默认提供商
    const defaultProviderId = DEFAULT_CONFIG.defaultProviders[tab];
    const defaultProvider = providers.find(p => p.id === defaultProviderId);
    
    if (defaultProvider && defaultProvider.status === "working") {
      recommendedProvider = defaultProvider;
    } else {
      // 如果默认提供商不可用，选择推荐的提供商
      recommendedProvider = getRecommendedProvider(providers);
    }

    if (recommendedProvider) {
      setSelectedProvider(recommendedProvider.id);
      setSelectedModel(recommendedProvider.models[0] || "");
      
      // 如果是从有问题的提供商自动切换，显示通知
      if (selectedProvider && selectedProvider !== recommendedProvider.id) {
        const currentProviderInfo = providers.find(p => p.id === selectedProvider);
        if (currentProviderInfo?.status === "quota_exceeded") {
          toast.info(`Switched to ${recommendedProvider.name} - try generating again!`);
        }
      }
    }
  }, [selectedProvider]);

  /**
   * 手动设置提供商
   */
  const handleSetProvider = useCallback((provider: string) => {
    setSelectedProvider(provider);
    
    // 自动选择该提供商的第一个模型
    const providerInfo = availableProviders.find(p => p.id === provider);
    if (providerInfo && providerInfo.models.length > 0) {
      setSelectedModel(providerInfo.models[0]);
    }
  }, [availableProviders]);

  /**
   * 手动设置模型
   */
  const handleSetModel = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  // 当标签页变化时自动切换提供商
  useEffect(() => {
    autoSwitchProvider(activeTab);
  }, [activeTab, autoSwitchProvider]);

  // 初始化时设置默认提供商
  useEffect(() => {
    if (!selectedProvider && availableProviders.length > 0) {
      autoSwitchProvider(activeTab);
    }
  }, [selectedProvider, availableProviders, activeTab, autoSwitchProvider]);

  return {
    selectedProvider,
    selectedModel,
    availableProviders,
    currentProvider,
    setSelectedProvider: handleSetProvider,
    setSelectedModel: handleSetModel,
    autoSwitchProvider
  };
}