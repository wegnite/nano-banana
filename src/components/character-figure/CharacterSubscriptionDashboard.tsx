/**
 * Character Figure 用户订阅仪表板组件
 * 
 * 功能特性：
 * - 显示当前订阅状态和信贷余额
 * - 使用情况可视化图表
 * - 生成历史和统计分析
 * - 订阅管理操作（升级、取消等）
 * - 响应式设计，移动端友好
 * 
 * 设计理念：
 * - 清晰的信息层级，关键数据突出显示
 * - 直观的使用进度指示器
 * - 智能的升级建议和价值感知
 * - 友好的用户体验和操作引导
 * 
 * @author Claude Code
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Crown, 
  Star, 
  Zap, 
  Calendar, 
  TrendingUp, 
  Image, 
  CreditCard,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowUp
} from "lucide-react";
import { SubscriptionPlan } from "@/services/subscription";
import { CharacterCreditBalance } from "@/services/character-subscription";

/**
 * 订阅状态数据接口
 */
interface SubscriptionStatus {
  currentPlan: {
    planId: SubscriptionPlan;
    planName: string;
    isActive: boolean;
    status?: string;
    startDate?: string;
    endDate?: string;
    nextBillingDate?: string;
  };
  credits: CharacterCreditBalance;
  usage: {
    usedThisMonth: number;
    monthlyLimit: number | null;
    usagePercentage: number;
    resetDate?: string;
  };
  recommendedUpgrade?: {
    planId: SubscriptionPlan;
    planName: string;
    benefit: string;
  };
}

/**
 * 计划图标组件
 */
const PlanIcon = ({ planId }: { planId: SubscriptionPlan }) => {
  switch (planId) {
    case SubscriptionPlan.FREE:
      return <Star className="h-5 w-5 text-gray-500" />;
    case SubscriptionPlan.TRIAL:
      return <Star className="h-5 w-5 text-orange-500" />;
    case SubscriptionPlan.PRO:
      return <Zap className="h-5 w-5 text-blue-500" />;
    case SubscriptionPlan.ULTRA:
      return <Crown className="h-5 w-5 text-purple-500" />;
    default:
      return <Star className="h-5 w-5 text-gray-400" />;
  }
};

/**
 * 订阅状态卡片组件
 */
const SubscriptionStatusCard = ({ 
  subscription, 
  onUpgrade, 
  onManage 
}: {
  subscription: SubscriptionStatus;
  onUpgrade: () => void;
  onManage: () => void;
}) => {
  const { currentPlan, credits } = subscription;
  
  const getStatusBadge = () => {
    if (!currentPlan.isActive) {
      return <Badge variant="destructive">已暂停</Badge>;
    }
    
    switch (currentPlan.planId) {
      case SubscriptionPlan.FREE:
        return <Badge variant="secondary">免费版</Badge>;
      case SubscriptionPlan.TRIAL:
        return <Badge className="bg-orange-500 text-white">试用包</Badge>;
      case SubscriptionPlan.PRO:
        return <Badge className="bg-blue-500 text-white">专业版</Badge>;
      case SubscriptionPlan.ULTRA:
        return <Badge className="bg-purple-500 text-white">旗舰版</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PlanIcon planId={currentPlan.planId} />
            <span>当前订阅</span>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 计划名称和状态 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentPlan.planName}
            </h3>
            {currentPlan.nextBillingDate && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                下次续费：{new Date(currentPlan.nextBillingDate).toLocaleDateString()}
              </p>
            )}
          </div>
          
          {/* 信贷余额显示 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {credits.subscriptionCredits}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                订阅信贷
              </div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {credits.permanentCredits}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                永久积分
              </div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {credits.totalUsable}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                可用总数
              </div>
            </div>
          </div>
          
          {/* 重置时间提示 */}
          {credits.nextResetDate && (
            <Alert>
              <RefreshCw className="h-4 w-4" />
              <AlertDescription>
                信贷将在 {new Date(credits.nextResetDate).toLocaleDateString()} 重置
              </AlertDescription>
            </Alert>
          )}
          
          {/* 操作按钮 */}
          <div className="flex space-x-2">
            {currentPlan.planId !== SubscriptionPlan.ULTRA && (
              <Button onClick={onUpgrade} className="flex-1">
                <ArrowUp className="h-4 w-4 mr-2" />
                升级订阅
              </Button>
            )}
            <Button variant="outline" onClick={onManage} className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              管理订阅
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 使用情况统计卡片
 */
const UsageStatsCard = ({ 
  subscription 
}: { 
  subscription: SubscriptionStatus 
}) => {
  const { usage, currentPlan } = subscription;
  
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-orange-600";
    return "text-green-600";
  };
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-orange-500";
    return "bg-green-500";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          使用统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 月度使用进度 */}
          {currentPlan.planId !== SubscriptionPlan.FREE ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">本月使用情况</span>
                <span className={`text-sm font-bold ${getUsageColor(usage.usagePercentage)}`}>
                  {usage.usedThisMonth} / {usage.monthlyLimit || "∞"} 次
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(usage.usagePercentage)}`}
                  style={{ width: `${Math.min(usage.usagePercentage, 100)}%` }}
                />
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                已使用 {usage.usagePercentage}%
              </p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">今日使用情况</span>
                <span className={`text-sm font-bold ${getUsageColor(usage.usagePercentage)}`}>
                  {usage.usedThisMonth} / 1 次
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(usage.usagePercentage)}`}
                  style={{ width: `${Math.min(usage.usagePercentage, 100)}%` }}
                />
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                免费用户每日1次生成机会
              </p>
            </div>
          )}
          
          {/* 使用建议 */}
          {usage.usagePercentage >= 80 && subscription.recommendedUpgrade && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                您的使用量接近限制，建议升级到 {subscription.recommendedUpgrade.planName} 
                以获得更多生成次数和高级功能。
              </AlertDescription>
            </Alert>
          )}
          
          {/* 重置时间 */}
          {usage.resetDate && (
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>下次重置</span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(usage.resetDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 快速操作卡片
 */
const QuickActionsCard = ({ 
  onCreateCharacter, 
  onViewGallery, 
  onDownloadHistory 
}: {
  onCreateCharacter: () => void;
  onViewGallery: () => void;
  onDownloadHistory: () => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>快速操作</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 gap-3">
        <Button onClick={onCreateCharacter} className="w-full justify-start">
          <Image className="h-4 w-4 mr-2" />
          创建新角色
        </Button>
        
        <Button variant="outline" onClick={onViewGallery} className="w-full justify-start">
          <Star className="h-4 w-4 mr-2" />
          浏览画廊
        </Button>
        
        <Button variant="outline" onClick={onDownloadHistory} className="w-full justify-start">
          <TrendingUp className="h-4 w-4 mr-2" />
          下载历史
        </Button>
      </div>
    </CardContent>
  </Card>
);

/**
 * 主仪表板组件
 */
export const CharacterSubscriptionDashboard = ({
  onUpgradeClick,
  onManageSubscription,
  onCreateCharacter,
  onViewGallery,
}: {
  onUpgradeClick?: () => void;
  onManageSubscription?: () => void;
  onCreateCharacter?: () => void;
  onViewGallery?: () => void;
}) => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取订阅状态数据
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch("/api/character-figure/subscription");
        
        if (!response.ok) {
          throw new Error("获取订阅数据失败");
        }
        
        const data = await response.json();
        
        if (data.success) {
          setSubscriptionData(data.data);
        } else {
          throw new Error(data.error || "获取数据失败");
        }
        
      } catch (err) {
        console.error("获取订阅数据失败:", err);
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscriptionData();
  }, []);
  
  // 处理升级操作
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // 默认跳转到定价页面
      window.location.href = "/pricing";
    }
  };
  
  // 处理订阅管理
  const handleManageSubscription = () => {
    if (onManageSubscription) {
      onManageSubscription();
    } else {
      // 默认行为
      console.log("管理订阅");
    }
  };
  
  // 处理创建角色
  const handleCreateCharacter = () => {
    if (onCreateCharacter) {
      onCreateCharacter();
    } else {
      window.location.href = "/character-figure";
    }
  };
  
  // 处理查看画廊
  const handleViewGallery = () => {
    if (onViewGallery) {
      onViewGallery();
    } else {
      window.location.href = "/character-figure/gallery";
    }
  };
  
  // 处理下载历史
  const handleDownloadHistory = () => {
    // 实现下载历史逻辑
    console.log("下载历史");
  };
  
  // 加载状态
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // 错误状态
  if (error || !subscriptionData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || "无法加载订阅数据，请刷新页面重试"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          订阅管理
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          管理您的Character Figure订阅和使用情况
        </p>
      </div>
      
      {/* 仪表板卡片网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：订阅状态 */}
        <div className="lg:col-span-2">
          <SubscriptionStatusCard
            subscription={subscriptionData}
            onUpgrade={handleUpgrade}
            onManage={handleManageSubscription}
          />
        </div>
        
        {/* 右侧：快速操作 */}
        <div>
          <QuickActionsCard
            onCreateCharacter={handleCreateCharacter}
            onViewGallery={handleViewGallery}
            onDownloadHistory={handleDownloadHistory}
          />
        </div>
      </div>
      
      {/* 第二行：使用统计 */}
      <div className="mt-6">
        <UsageStatsCard subscription={subscriptionData} />
      </div>
    </div>
  );
};

export default CharacterSubscriptionDashboard;