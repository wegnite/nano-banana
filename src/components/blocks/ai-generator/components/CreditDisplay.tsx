/**
 * 积分显示组件
 * 
 * 功能：显示用户当前积分状态
 * 特性：格式化显示、状态指示、动画效果
 */

import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CreditDisplayProps } from "../types";
import { formatCredits } from "../utils";

const CreditDisplay = memo<CreditDisplayProps>(({ credits }) => {
  const t = useTranslations("ai_generator");

  // 根据积分数量确定显示颜色
  const getVariant = (credits: number): "default" | "secondary" | "destructive" => {
    if (credits <= 0) return "destructive";
    if (credits < 10) return "secondary";
    return "default";
  };

  return (
    <div className="flex items-end">
      <Badge 
        variant={getVariant(credits)} 
        className="h-10 px-4 flex items-center gap-2 transition-all duration-200"
      >
        <Zap className="w-4 h-4" />
        <span className="font-medium">
          {formatCredits(credits)} {t("credits")}
        </span>
      </Badge>
    </div>
  );
});

CreditDisplay.displayName = "CreditDisplay";

export default CreditDisplay;