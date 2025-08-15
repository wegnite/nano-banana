/**
 * 订阅定价卡片组件
 * 
 * 展示订阅计划的详细信息和购买按钮
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PricingCardProps {
  plan: {
    plan_id: string;
    plan_name: string;
    description: string;
    monthly_price: number;
    yearly_price: number;
    features: string[];
    monthly_generation_limit: number | null;
    is_featured?: boolean;
  };
  currentPlan?: string;
  billingInterval: "monthly" | "yearly";
}

export default function PricingCard({ plan, currentPlan, billingInterval }: PricingCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const isCurrentPlan = currentPlan === plan.plan_id;
  const isFree = plan.plan_id === "free";
  
  // 计算价格
  const price = billingInterval === "monthly" ? plan.monthly_price : plan.yearly_price;
  const displayPrice = price / 100; // 转换为美元
  
  // 计算年付节省
  const yearlySavings = billingInterval === "yearly" && !isFree
    ? (plan.monthly_price * 12 - plan.yearly_price) / 100
    : 0;

  const handleSubscribe = async () => {
    if (!session) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }

    if (isCurrentPlan) {
      toast.info("You are already on this plan");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: plan.plan_id,
          interval: billingInterval,
        }),
      });

      const data = await response.json();
      
      if (data.code === 0) {
        toast.success("Subscription created successfully!");
        // 刷新页面或重定向到支付页面
        window.location.reload();
      } else {
        toast.error(data.message || "Failed to create subscription");
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Failed to process subscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`relative ${plan.is_featured ? "border-primary shadow-lg scale-105" : ""}`}>
      {plan.is_featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Sparkles className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{plan.plan_name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              ${displayPrice}
            </span>
            <span className="text-muted-foreground">
              /{billingInterval === "monthly" ? "mo" : "yr"}
            </span>
          </div>
          {yearlySavings > 0 && (
            <p className="text-sm text-green-600">
              Save ${yearlySavings.toFixed(2)} with yearly billing
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            {plan.monthly_generation_limit 
              ? `${plan.monthly_generation_limit} generations/month`
              : "Unlimited generations"
            }
          </p>
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : plan.is_featured ? "default" : "secondary"}
          disabled={isLoading || isCurrentPlan || isFree}
          onClick={handleSubscribe}
        >
          {isCurrentPlan 
            ? "Current Plan" 
            : isFree 
            ? "Default Plan"
            : isLoading 
            ? "Processing..." 
            : "Subscribe"
          }
        </Button>
      </CardFooter>
    </Card>
  );
}