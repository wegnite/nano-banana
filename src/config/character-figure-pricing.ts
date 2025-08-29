/**
 * Character Figure 专用定价配置
 * 
 * 功能说明：
 * - 定义Character Figure平台的订阅定价结构
 * - 支持多语言显示和货币
 * - 包含价值感知和营销信息
 * - 与Stripe产品ID映射
 * 
 * 设计原则：
 * - Trial计划突出超值感，建立价值认知
 * - Pro计划作为主推，平衡价格和功能
 * - Ultra计划面向专业用户，提供商用授权
 * 
 * @module config/character-figure-pricing
 */

import { SubscriptionPlan, BillingInterval } from "@/services/subscription";

/**
 * 定价计划接口
 */
export interface CharacterPricingPlan {
  // 基础信息
  planId: SubscriptionPlan;
  planName: string;
  planNameEn: string;
  description: string;
  descriptionEn: string;
  
  // 价格信息
  monthlyPrice: number;    // 美分为单位
  yearlyPrice: number;     // 美分为单位
  currency: string;
  
  // 显示价格（用于UI展示）
  displayMonthlyPrice: string;  // "$3.99"
  displayYearlyPrice: string;   // "$39.90"
  
  // Stripe 产品配置
  stripeMonthlyPriceId?: string;  // Stripe月付价格ID
  stripeYearlyPriceId?: string;   // Stripe年付价格ID
  stripeProductId?: string;       // Stripe产品ID
  
  // 功能特性
  features: string[];
  featuresEn: string[];
  
  // 使用限制
  monthlyLimit: number | null;    // 月度生成限制
  dailyLimit: number | null;      // 日度生成限制（仅Free用）
  creditsPerGeneration: number;   // 每次生成消耗积分
  
  // 权限配置
  allowedStyles: string[];        // 允许的风格
  allowedQualities: string[];     // 允许的质量
  maxBatchSize: number;           // 最大批量生成数
  priorityQueue: boolean;         // 是否优先队列
  apiAccess: boolean;             // API访问权限
  
  // UI显示配置
  isPopular: boolean;             // 是否标记为热门
  isRecommended: boolean;         // 是否推荐
  badge?: string;                 // 徽章文字
  badgeColor?: string;            // 徽章颜色
  sortOrder: number;              // 排序权重
  
  // 营销信息
  valueHighlight?: string;        // 价值突出文案
  originalPrice?: string;         // 原价（用于划线显示）
  discountPercent?: number;       // 折扣百分比
  urgencyText?: string;           // 紧迫感文案
  
  // 年付优惠
  annualSavings?: string;         // 年付节省金额
  annualDiscountMonths?: number;  // 年付相当于免费月数
  
  // 特殊标记
  isOneTime?: boolean;            // 是否一次性购买
  isLimitedTime?: boolean;        // 是否限时优惠
  
  // 商用信息
  commercialLicense?: boolean;    // 是否包含商用许可
  supportLevel: string;           // 支持级别
}

/**
 * Character Figure 完整定价配置
 * 
 * 价值感知策略：
 * 1. Free: 建立使用习惯，每日1次体验
 * 2. Trial: 超值感知锚点，$3.99=10次，单次仅$0.399
 * 3. Pro: 主推计划，$10.99=50次，单次$0.22，突出性价比
 * 4. Ultra: 专业版，$34.99=200次，单次$0.17，商用授权
 */
export const CHARACTER_PRICING_PLANS: CharacterPricingPlan[] = [
  // ===== FREE 计划 =====
  {
    planId: SubscriptionPlan.FREE,
    planName: "免费体验",
    planNameEn: "Free",
    description: "每日一次免费体验，探索角色生成魅力",
    descriptionEn: "One free generation daily to explore character creation",
    
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
    displayMonthlyPrice: "免费",
    displayYearlyPrice: "免费",
    
    features: [
      "✨ 每日1次免费生成",
      "🎨 3种基础风格（动漫、写实、卡通）",
      "📱 标准画质输出 (1024x1024)",
      "🖼️ 社区画廊浏览",
      "💬 社区支持"
    ],
    featuresEn: [
      "✨ 1 free generation daily",
      "🎨 3 basic styles (Anime, Realistic, Cartoon)",
      "📱 Standard quality (1024x1024)",
      "🖼️ Community gallery access",
      "💬 Community support"
    ],
    
    monthlyLimit: null, // Free不按月计算
    dailyLimit: 1,
    creditsPerGeneration: 1,
    
    allowedStyles: ["anime", "realistic", "cartoon"],
    allowedQualities: ["standard"],
    maxBatchSize: 1,
    priorityQueue: false,
    apiAccess: false,
    
    isPopular: false,
    isRecommended: false,
    sortOrder: 1,
    supportLevel: "community",
  },
  
  // ===== TRIAL 计划 =====
  {
    planId: SubscriptionPlan.TRIAL,
    planName: "超值试用包",
    planNameEn: "Trial Pack",
    description: "一次性购买，10次精品生成，建立价值认知",
    descriptionEn: "One-time purchase, 10 premium generations to establish value",
    
    monthlyPrice: 399,   // $3.99
    yearlyPrice: 399,    // 一次性购买无年月之分
    currency: "USD", 
    displayMonthlyPrice: "$3.99",
    displayYearlyPrice: "$3.99",
    
    // Stripe 产品配置（需要在Stripe后台创建对应产品）
    stripeProductId: "prod_character_trial",
    stripeMonthlyPriceId: "price_character_trial",
    
    features: [
      "⚡ 10次精品角色生成",
      "🌟 解锁所有12种风格",
      "🔥 高清画质输出 (2048x2048)",
      "🚀 优先生成队列（快3倍）",
      "✨ 无水印导出",
      "📞 优先客服支持",
      "🎯 单次仅$0.399，超值体验",
      "💎 永久有效，不过期"
    ],
    featuresEn: [
      "⚡ 10 premium character generations",
      "🌟 All 12 styles unlocked",
      "🔥 HD quality output (2048x2048)",
      "🚀 Priority queue (3x faster)",
      "✨ Watermark-free export",
      "📞 Priority customer support",
      "🎯 Only $0.399 per generation",
      "💎 Never expires"
    ],
    
    monthlyLimit: 10,   // 总共10次
    dailyLimit: null,   // 无日限制
    creditsPerGeneration: 1,
    
    allowedStyles: ["*"], // 所有风格
    allowedQualities: ["standard", "hd"],
    maxBatchSize: 2,
    priorityQueue: true,
    apiAccess: false,
    
    isPopular: true,
    isRecommended: true,
    badge: "超值推荐",
    badgeColor: "bg-orange-500",
    sortOrder: 2,
    
    // 价值感知营销
    valueHighlight: "相比单次付费节省80%",
    originalPrice: "$19.90",  // 假设的原价
    discountPercent: 80,
    urgencyText: "限时体验价",
    
    isOneTime: true,
    isLimitedTime: true,
    supportLevel: "priority",
  },
  
  // ===== PRO 计划 =====
  {
    planId: SubscriptionPlan.PRO,
    planName: "专业创作版",
    planNameEn: "Pro",
    description: "创作者首选，每月50次专业生成，性价比之王",
    descriptionEn: "Creator's choice, 50 professional generations monthly, best value",
    
    monthlyPrice: 1099,  // $10.99
    yearlyPrice: 10990,  // $109.90 (相当于10个月价格，2个月免费)
    currency: "USD",
    displayMonthlyPrice: "$10.99",
    displayYearlyPrice: "$109.90",
    
    stripeProductId: "prod_character_pro",
    stripeMonthlyPriceId: "price_character_pro_monthly",
    stripeYearlyPriceId: "price_character_pro_yearly",
    
    features: [
      "🎨 每月50次专业生成",
      "🌈 完整风格库（20+种风格）",
      "🖥️ 超高清输出 (4096x4096)",
      "⚡ 优先处理队列",
      "📸 批量生成（最多4张）",
      "🛠️ 高级编辑工具",
      "☁️ 无限云端存储",
      "📧 邮件客服支持",
      "🔄 每月自动重置",
      "📱 移动端API访问"
    ],
    featuresEn: [
      "🎨 50 professional generations monthly",
      "🌈 Complete style library (20+ styles)",
      "🖥️ Ultra HD output (4096x4096)",
      "⚡ Priority processing queue",
      "📸 Batch generation (up to 4)",
      "🛠️ Advanced editing tools",
      "☁️ Unlimited cloud storage",
      "📧 Email customer support",
      "🔄 Monthly auto-reset",
      "📱 Mobile API access"
    ],
    
    monthlyLimit: 50,
    dailyLimit: null,
    creditsPerGeneration: 1,
    
    allowedStyles: ["*"],
    allowedQualities: ["standard", "hd", "uhd"],
    maxBatchSize: 4,
    priorityQueue: true,
    apiAccess: true,
    
    isPopular: false,
    isRecommended: true,
    badge: "最受欢迎",
    badgeColor: "bg-blue-500",
    sortOrder: 3,
    
    // 价值对比
    valueHighlight: "相比Trial单次成本降低45%",
    annualSavings: "$21.98",
    annualDiscountMonths: 2,
    
    supportLevel: "email",
  },
  
  // ===== ULTRA 计划 =====
  {
    planId: SubscriptionPlan.ULTRA,
    planName: "旗舰无限版",
    planNameEn: "Ultra",
    description: "专业团队版，每月200次大容量生成+商用授权",
    descriptionEn: "Professional team version, 200 generations monthly + commercial license",
    
    monthlyPrice: 3499,  // $34.99
    yearlyPrice: 34990,  // $349.90 (相当于10个月价格)
    currency: "USD",
    displayMonthlyPrice: "$34.99",
    displayYearlyPrice: "$349.90",
    
    stripeProductId: "prod_character_ultra",
    stripeMonthlyPriceId: "price_character_ultra_monthly", 
    stripeYearlyPriceId: "price_character_ultra_yearly",
    
    features: [
      "🚀 每月200次旗舰生成",
      "💎 独家风格库（30+种风格）",
      "🎯 8K超清输出 (8192x8192)",
      "👑 最高优先级队列",
      "📦 大批量生成（最多10张）",
      "🤖 AI风格定制训练",
      "📋 商用授权许可证",
      "🔒 私有画廊空间",
      "🎧 1对1专属客服",
      "🔌 完整API访问权限",
      "📊 详细使用分析",
      "⚡ 专用服务器资源"
    ],
    featuresEn: [
      "🚀 200 flagship generations monthly",
      "💎 Exclusive style library (30+ styles)",
      "🎯 8K ultra HD output (8192x8192)",
      "👑 Highest priority queue",
      "📦 Bulk generation (up to 10)",
      "🤖 AI style custom training",
      "📋 Commercial license included",
      "🔒 Private gallery space",
      "🎧 Dedicated 1-on-1 support",
      "🔌 Full API access",
      "📊 Detailed usage analytics",
      "⚡ Dedicated server resources"
    ],
    
    monthlyLimit: 200,
    dailyLimit: null,
    creditsPerGeneration: 1,
    
    allowedStyles: ["*"],
    allowedQualities: ["standard", "hd", "uhd", "8k"],
    maxBatchSize: 10,
    priorityQueue: true,
    apiAccess: true,
    
    isPopular: false,
    isRecommended: false,
    badge: "专业版",
    badgeColor: "bg-purple-500",
    sortOrder: 4,
    
    // 价值对比
    valueHighlight: "相比Pro单次成本降低68%",
    annualSavings: "$69.98",
    annualDiscountMonths: 2,
    
    commercialLicense: true,
    supportLevel: "dedicated",
  }
];

/**
 * 根据计划ID获取定价配置
 * 
 * @param planId 订阅计划ID
 * @returns 定价配置对象
 */
export function getCharacterPricingPlan(planId: SubscriptionPlan): CharacterPricingPlan | null {
  return CHARACTER_PRICING_PLANS.find(plan => plan.planId === planId) || null;
}

/**
 * 获取所有可购买的计划（排除Free）
 * 
 * @returns 可购买的定价计划数组
 */
export function getPurchasableCharacterPlans(): CharacterPricingPlan[] {
  return CHARACTER_PRICING_PLANS.filter(plan => plan.planId !== SubscriptionPlan.FREE);
}

/**
 * 根据Stripe价格ID反查计划信息
 * 
 * @param stripePriceId Stripe价格ID
 * @returns 匹配的计划和计费周期
 */
export function findPlanByStripePriceId(stripePriceId: string): {
  plan: CharacterPricingPlan;
  interval: BillingInterval;
} | null {
  for (const plan of CHARACTER_PRICING_PLANS) {
    if (plan.stripeMonthlyPriceId === stripePriceId) {
      return { plan, interval: BillingInterval.MONTHLY };
    }
    if (plan.stripeYearlyPriceId === stripePriceId) {
      return { plan, interval: BillingInterval.YEARLY };
    }
  }
  return null;
}

/**
 * 价值感知计算工具
 * 
 * @param plan 定价计划
 * @returns 价值感知数据
 */
export function calculateValuePerception(plan: CharacterPricingPlan): {
  pricePerGeneration: number;      // 单次生成成本（美分）
  formattedPricePerGeneration: string;  // 格式化显示
  savingsVsTrial?: string;         // 相比Trial的节省
  totalAnnualValue?: number;       // 年度总价值
} {
  const monthlyLimit = plan.monthlyLimit || 1;
  const pricePerGeneration = plan.monthlyPrice / monthlyLimit;
  const formattedPrice = `$${(pricePerGeneration / 100).toFixed(3)}`;
  
  // 与Trial计划对比（Trial为39.9美分每次）
  const trialPricePerGeneration = 39.9; // 美分
  const savingsPercent = ((trialPricePerGeneration - pricePerGeneration) / trialPricePerGeneration * 100).toFixed(0);
  
  let savingsVsTrial: string | undefined;
  if (plan.planId !== SubscriptionPlan.TRIAL && plan.planId !== SubscriptionPlan.FREE) {
    savingsVsTrial = `相比Trial节省${savingsPercent}%`;
  }
  
  // 年度价值计算
  const totalAnnualValue = plan.monthlyPrice * 12;
  
  return {
    pricePerGeneration,
    formattedPricePerGeneration: formattedPrice,
    savingsVsTrial,
    totalAnnualValue,
  };
}

/**
 * 获取推荐升级路径
 * 
 * @param currentPlan 当前计划
 * @returns 推荐的下一个计划
 */
export function getRecommendedUpgrade(currentPlan: SubscriptionPlan): CharacterPricingPlan | null {
  const upgradeMap: Record<SubscriptionPlan, SubscriptionPlan | null> = {
    [SubscriptionPlan.FREE]: SubscriptionPlan.TRIAL,
    [SubscriptionPlan.TRIAL]: SubscriptionPlan.PRO,
    [SubscriptionPlan.PRO]: SubscriptionPlan.ULTRA,
    [SubscriptionPlan.ULTRA]: null, // 已是最高级
  };
  
  const nextPlanId = upgradeMap[currentPlan];
  return nextPlanId ? getCharacterPricingPlan(nextPlanId) : null;
}