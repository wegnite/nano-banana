/**
 * 标签状态管理 Hook
 * 
 * 功能：管理生成类型标签页的状态和配置
 * 职责：标签切换、标签配置、国际化支持
 */

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { GenerationType, UseTabStateReturn } from "../types";
import { DEFAULT_CONFIG } from "../constants";

export function useTabState(): UseTabStateReturn {
  const t = useTranslations("ai_generator");
  const [activeTab, setActiveTab] = useState<GenerationType>(DEFAULT_CONFIG.activeTab);

  // 标签配置（包含国际化标签）
  const tabConfig = useMemo(() => ({
    text: {
      icon: "FileText",
      label: t("tabs.text")
    },
    image: {
      icon: "Image", 
      label: t("tabs.image")
    },
    video: {
      icon: "Video",
      label: t("tabs.video")
    }
  }), [t]);

  return {
    activeTab,
    setActiveTab,
    tabConfig
  };
}