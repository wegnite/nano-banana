/**
 * 积分管理 Hook
 * 
 * 功能：管理用户积分状态和更新逻辑
 * 职责：积分显示、积分更新、积分通知
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { UseCreditsReturn, GenerationResult } from "../types";
import { DEFAULT_CONFIG } from "../constants";
import { extractCreditsFromResult } from "../utils";

export function useCredits(): UseCreditsReturn {
  const [credits, setCredits] = useState<number>(DEFAULT_CONFIG.defaultCredits);

  /**
   * 从生成结果中更新积分信息
   */
  const updateCreditsFromResult = useCallback((result: GenerationResult) => {
    const creditsInfo = extractCreditsFromResult(result);
    
    if (creditsInfo.remaining !== undefined) {
      setCredits(creditsInfo.remaining);
      
      // 显示积分使用通知
      if (creditsInfo.used) {
        toast.info(
          `Used ${creditsInfo.used} credit(s). ${creditsInfo.remaining} remaining.`
        );
      }
    }
  }, []);

  return {
    credits,
    setCredits,
    updateCreditsFromResult
  };
}