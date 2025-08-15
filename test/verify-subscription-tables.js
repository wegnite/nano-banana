/**
 * 验证订阅表是否成功创建到 Supabase
 * 
 * 运行方式：node test/verify-subscription-tables.js
 */

import { db } from "../src/db/db.js";
import { subscriptions, subscription_plans, subscription_usage } from "../src/db/schema.js";

async function verifyTables() {
  console.log("🔍 验证订阅系统数据库表...\n");
  
  try {
    // 1. 检查 subscriptions 表
    console.log("1️⃣ 检查 subscriptions 表...");
    const subscriptionsCount = await db()
      .select({ count: sql`count(*)` })
      .from(subscriptions);
    console.log("   ✅ subscriptions 表存在，记录数：", subscriptionsCount[0]?.count || 0);
    
    // 2. 检查 subscription_plans 表
    console.log("\n2️⃣ 检查 subscription_plans 表...");
    const plansCount = await db()
      .select({ count: sql`count(*)` })
      .from(subscription_plans);
    console.log("   ✅ subscription_plans 表存在，记录数：", plansCount[0]?.count || 0);
    
    // 3. 检查 subscription_usage 表
    console.log("\n3️⃣ 检查 subscription_usage 表...");
    const usageCount = await db()
      .select({ count: sql`count(*)` })
      .from(subscription_usage);
    console.log("   ✅ subscription_usage 表存在，记录数：", usageCount[0]?.count || 0);
    
    // 4. 插入测试数据到 subscription_plans
    console.log("\n4️⃣ 插入默认订阅计划...");
    
    const defaultPlans = [
      {
        plan_id: "free",
        plan_name: "Free Plan",
        description: "Get started with basic AI generation",
        monthly_price: 0,
        yearly_price: 0,
        monthly_generation_limit: 10,
        is_active: true,
        display_order: 1,
      },
      {
        plan_id: "basic",
        plan_name: "Basic Plan",
        description: "Perfect for individuals and small projects",
        monthly_price: 999,
        yearly_price: 9990,
        monthly_generation_limit: 500,
        is_active: true,
        display_order: 2,
      },
      {
        plan_id: "pro",
        plan_name: "Pro Plan",
        description: "For power users and growing businesses",
        monthly_price: 2999,
        yearly_price: 29990,
        monthly_generation_limit: null, // 无限
        priority_queue: true,
        generation_speed: "fast",
        support_level: "priority",
        api_access: true,
        is_active: true,
        is_featured: true,
        display_order: 3,
      },
    ];
    
    for (const plan of defaultPlans) {
      try {
        await db().insert(subscription_plans).values(plan);
        console.log(`   ✅ 已插入计划: ${plan.plan_name}`);
      } catch (error) {
        if (error.message?.includes("unique")) {
          console.log(`   ⚠️  计划已存在: ${plan.plan_name}`);
        } else {
          console.error(`   ❌ 插入失败: ${error.message}`);
        }
      }
    }
    
    // 5. 验证插入的数据
    console.log("\n5️⃣ 验证订阅计划数据...");
    const plans = await db()
      .select()
      .from(subscription_plans)
      .orderBy(subscription_plans.display_order);
    
    console.log("   📋 已配置的订阅计划：");
    plans.forEach(plan => {
      console.log(`      - ${plan.plan_name}: $${plan.monthly_price/100}/月 (${plan.monthly_generation_limit || '无限'}次生成)`);
    });
    
    console.log("\n✨ 所有订阅表验证成功！");
    console.log("📝 你可以在 Supabase 控制台查看这些表：");
    console.log("   - subscriptions (用户订阅)");
    console.log("   - subscription_plans (订阅计划)");
    console.log("   - subscription_usage (使用记录)");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ 验证失败：", error.message);
    console.error("   请确保：");
    console.error("   1. DATABASE_URL 已正确配置");
    console.error("   2. 已运行 npm run db:migrate");
    console.error("   3. Supabase 数据库可以访问");
    process.exit(1);
  }
}

// 导入 sql 函数
import { sql } from "drizzle-orm";

verifyTables();