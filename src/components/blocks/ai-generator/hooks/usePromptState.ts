/**
 * 提示词状态管理 Hook - 性能优化版
 * 
 * 功能：管理提示词输入状态和验证
 * 特性：防抖输入、输入验证、自动保存
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { debounce } from "../utils";
import { UI_CONFIG } from "../constants";

interface UsePromptStateOptions {
  debounceDelay?: number;
  autoSave?: boolean;
  maxLength?: number;
}

export function usePromptState(options: UsePromptStateOptions = {}) {
  const {
    debounceDelay = UI_CONFIG.debounceDelay,
    autoSave = false,
    maxLength = 4000
  } = options;

  const [prompt, setPrompt] = useState("");
  const [debouncedPrompt, setDebouncedPrompt] = useState("");

  // 防抖更新函数
  const debouncedSetPrompt = useMemo(
    () => debounce((value: string) => {
      setDebouncedPrompt(value);
      
      // 自动保存到 localStorage
      if (autoSave) {
        try {
          localStorage.setItem("ai-generator-prompt", value);
        } catch (error) {
          console.warn("Failed to save prompt to localStorage:", error);
        }
      }
    }, debounceDelay),
    [debounceDelay, autoSave]
  );

  // 处理提示词变更
  const handlePromptChange = useCallback((value: string) => {
    setPrompt(value);
    debouncedSetPrompt(value);
  }, [debouncedSetPrompt]);

  // 提示词验证
  const validation = useMemo(() => {
    const trimmed = prompt.trim();
    return {
      isEmpty: !trimmed,
      tooLong: trimmed.length > maxLength,
      valid: trimmed.length > 0 && trimmed.length <= maxLength,
      charCount: trimmed.length,
      maxLength
    };
  }, [prompt, maxLength]);

  // 清除提示词
  const clearPrompt = useCallback(() => {
    setPrompt("");
    setDebouncedPrompt("");
    if (autoSave) {
      localStorage.removeItem("ai-generator-prompt");
    }
  }, [autoSave]);

  // 从 localStorage 恢复提示词
  const restorePrompt = useCallback(() => {
    if (autoSave) {
      try {
        const saved = localStorage.getItem("ai-generator-prompt");
        if (saved) {
          setPrompt(saved);
          setDebouncedPrompt(saved);
          return true;
        }
      } catch (error) {
        console.warn("Failed to restore prompt from localStorage:", error);
      }
    }
    return false;
  }, [autoSave]);

  // 初始化时恢复提示词
  useEffect(() => {
    restorePrompt();
  }, [restorePrompt]);

  return {
    prompt,
    debouncedPrompt,
    validation,
    handlePromptChange,
    clearPrompt,
    restorePrompt
  };
}