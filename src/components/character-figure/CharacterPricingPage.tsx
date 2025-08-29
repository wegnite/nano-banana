/**
 * Character Figure 专用定价页面组件
 * 
 * 功能特性：
 * - 展示所有订阅计划的详细信息
 * - 突出Trial计划的超值感知
 * - 提供清晰的价格对比和升级路径
 * - 支持多语言显示
 * - 响应式设计，移动端友好
 * 
 * 设计理念：
 * - 价值感知驱动：强调每次生成的成本对比
 * - 清晰的升级路径：从Free到Ultra的自然过渡
 * - 突出Trial的限时感和超值感
 * - 专业感与信任感并重
 * 
 * @author Claude Code
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Star, Zap, Sparkles } from "lucide-react";
import { 
  CHARACTER_PRICING_PLANS,
  CharacterPricingPlan,
  calculateValuePerception 
} from "@/config/character-figure-pricing";
import { SubscriptionPlan } from "@/services/subscription";

interface CharacterPricingPageProps {
  locale?: string;
  userPlan?: SubscriptionPlan;
  onPlanSelect?: (plan: CharacterPricingPlan, interval: "monthly" | "yearly") => void;
}

/**
 * 计费周期切换器
 */
const BillingToggle = ({ 
  isYearly, 
  onToggle 
}: { 
  isYearly: boolean; 
  onToggle: (yearly: boolean) => void; 
}) => (
  <div className="flex items-center justify-center mb-8">
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
      <button
        onClick={() => onToggle(false)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          !isYearly 
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
            : "text-gray-600 dark:text-gray-400"
        }`}
      >
        月付
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
          isYearly 
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
            : "text-gray-600 dark:text-gray-400"
        }`}
      >
        年付
        <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 py-0.5">
          省20%
        </Badge>
      </button>
    </div>
  </div>
);

/**
 * 计划卡片组件
 */
const PlanCard = ({ 
  plan, 
  isYearly, 
  isCurrentPlan,
  onSelect
}: { 
  plan: CharacterPricingPlan;
  isYearly: boolean;
  isCurrentPlan?: boolean;
  onSelect: () => void;
}) => {
  const valuePerception = calculateValuePerception(plan);
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const displayPrice = isYearly ? plan.displayYearlyPrice : plan.displayMonthlyPrice;
  
  // 获取计划图标
  const getPlanIcon = () => {
    switch (plan.planId) {
      case SubscriptionPlan.FREE:
        return <Sparkles className="h-6 w-6 text-gray-500" />;
      case SubscriptionPlan.TRIAL:
        return <Star className="h-6 w-6 text-orange-500" />;
      case SubscriptionPlan.PRO:
        return <Zap className="h-6 w-6 text-blue-500" />;
      case SubscriptionPlan.ULTRA:
        return <Crown className="h-6 w-6 text-purple-500" />;
      default:
        return null;
    }
  };
  
  // 获取按钮文本和样式
  const getButtonConfig = () => {
    if (isCurrentPlan) {
      return {
        text: "当前计划",
        variant: "outline" as const,
        disabled: true
      };
    }
    
    if (plan.planId === SubscriptionPlan.FREE) {
      return {
        text: "开始体验",
        variant: "outline" as const,
        disabled: false
      };
    }
    
    return {
      text: plan.isOneTime ? "立即购买" : "立即升级",
      variant: "default" as const,
      disabled: false
    };
  };
  
  const buttonConfig = getButtonConfig();
  
  return (
    <Card className={`relative transition-all duration-300 hover:shadow-lg ${
      plan.isRecommended 
        ? "border-2 border-blue-500 shadow-lg" 
        : plan.isPopular
        ? "border-2 border-orange-500 shadow-md"
        : "border border-gray-200 dark:border-gray-700"
    }`}>
      {/* 推荐徽章 */}
      {(plan.isRecommended || plan.isPopular) && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge 
            className={`${
              plan.isRecommended 
                ? "bg-blue-500 text-white" 
                : "bg-orange-500 text-white"
            }`}
          >
            {plan.badge}
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        {/* 计划图标和名称 */}
        <div className="flex items-center justify-center mb-2">
          {getPlanIcon()}
          <CardTitle className="ml-2 text-xl font-bold">
            {plan.planName}
          </CardTitle>
        </div>
        
        {/* 价格显示 */}
        <div className="mb-4">
          {plan.planId !== SubscriptionPlan.FREE && (
            <>
              {/* 原价划线 */}
              {plan.originalPrice && (
                <div className="text-sm text-gray-500 line-through mb-1">
                  {plan.originalPrice}
                </div>
              )}
              
              {/* 主价格 */}
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {displayPrice}
              </div>
              
              {/* 计费周期说明 */}
              {!plan.isOneTime && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isYearly ? "每年" : "每月"}
                </div>
              )}
              
              {/* 年付节省提示 */}
              {isYearly && plan.annualSavings && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  年付节省 {plan.annualSavings}
                </div>
              )}
            </>
          )}
          
          {plan.planId === SubscriptionPlan.FREE && (
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              免费
            </div>
          )}
        </div>
        
        {/* 价值感知文案 */}
        {plan.valueHighlight && (
          <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-sm px-3 py-2 rounded-lg font-medium">
            {plan.valueHighlight}
          </div>
        )}
        
        {/* 单次成本显示 */}
        {plan.planId !== SubscriptionPlan.FREE && plan.monthlyLimit && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            仅 {valuePerception.formattedPricePerGeneration}/次生成
          </div>
        )}
        
        {/* 限时文案 */}
        {plan.urgencyText && (
          <div className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">
            {plan.urgencyText}
          </div>
        )}
        
        {/* 计划描述 */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
          {plan.description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* 功能列表 */}
        <ul className="space-y-2 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
        
        {/* 选择按钮 */}
        <Button
          onClick={onSelect}
          variant={buttonConfig.variant}
          disabled={buttonConfig.disabled}
          className="w-full"
        >
          {buttonConfig.text}
        </Button>
      </CardContent>
    </Card>
  );
};

/**
 * 主定价页面组件
 */
export const CharacterPricingPage = ({
  locale = "zh",
  userPlan,
  onPlanSelect
}: CharacterPricingPageProps) => {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CharacterPricingPlan | null>(null);
  
  // 处理计划选择
  const handlePlanSelect = (plan: CharacterPricingPlan) => {
    setSelectedPlan(plan);
    
    if (onPlanSelect) {
      const interval = plan.isOneTime ? "monthly" : (isYearly ? "yearly" : "monthly");
      onPlanSelect(plan, interval);
    }
  };
  
  // 获取用户当前计划对应的定价配置
  const currentPlanConfig = userPlan 
    ? CHARACTER_PRICING_PLANS.find(p => p.planId === userPlan)
    : null;
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          选择适合您的角色生成计划
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          从免费体验到专业创作，我们为每一位角色设计师提供完美的解决方案。
          透明定价，无隐藏费用，随时可以升级或取消。
        </p>
      </div>
      
      {/* 计费周期切换器 */}
      <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
      
      {/* 价值对比提示 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 rounded-lg px-4 py-2 text-sm">
          <Star className="h-4 w-4 text-orange-500 mr-2" />
          <span className="text-gray-700 dark:text-gray-300">
            <strong>限时优惠：</strong>Trial体验包仅$3.99，相当于每次生成仅需$0.399！
          </span>
        </div>
      </div>
      
      {/* 计划卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {CHARACTER_PRICING_PLANS.map((plan) => (
          <PlanCard
            key={plan.planId}
            plan={plan}
            isYearly={isYearly}
            isCurrentPlan={userPlan === plan.planId}
            onSelect={() => handlePlanSelect(plan)}
          />
        ))}
      </div>
      
      {/* 底部说明 */}
      <div className="text-center space-y-6">
        <Separator />
        
        {/* FAQ简要说明 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              💳 安全支付
            </h3>
            <p>支持信用卡、支付宝、微信支付，256位SSL加密保护</p>
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              🔄 灵活管理
            </h3>
            <p>随时升级、降级或取消订阅，无需承诺，完全自主</p>
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              📞 专业支持
            </h3>
            <p>7x24小时客服支持，Pro/Ultra用户享有优先技术支持</p>
          </div>
        </div>
        
        {/* 信任标识 */}
        <div className="flex justify-center items-center space-x-6 opacity-60">
          <span className="text-sm text-gray-500">🔒 SSL加密</span>
          <span className="text-sm text-gray-500">🛡️ 隐私保护</span>
          <span className="text-sm text-gray-500">💯 满意保证</span>
        </div>
      </div>
    </div>
  );
};

export default CharacterPricingPage;