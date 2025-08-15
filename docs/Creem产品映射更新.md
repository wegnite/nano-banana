# 📝 Creem 产品映射更新指南

## 当前配置状态

### ✅ 已配置的产品
根据测试结果，您在 Creem 中已创建了以下产品：

| 内部产品 ID | Creem 产品 ID | 对应等级 |
|------------|---------------|----------|
| starter | prod_bXBNq7iZxZnDS1fENEgJ0 | 入门级 |
| Standard | prod_3ffhKr0g3Ku3mKQdZYKyTf | 标准版 |
| Premium | prod_49SH4NrbP27Ov3sQakGwcI | 高级版 |

## 建议的映射调整

### 方案 A：调整代码以匹配现有产品

更新 `.env.production` 中的 `CREEM_PRODUCTS`：

```json
{
  "starter": "prod_bXBNq7iZxZnDS1fENEgJ0",
  "standard": "prod_3ffhKr0g3Ku3mKQdZYKyTf",
  "premium": "prod_49SH4NrbP27Ov3sQakGwcI"
}
```

然后更新前端定价页面的产品 ID：

```typescript
// src/services/pricing.ts 或相关文件
const PRICING_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    credits: 100,
    // ... 其他配置
  },
  standard: {
    id: 'standard',  // 改为小写
    name: 'Standard',
    price: 29,
    credits: 500,
    // ... 其他配置
  },
  premium: {
    id: 'premium',  // 改为小写
    name: 'Premium',
    price: 99,
    credits: 2000,
    // ... 其他配置
  }
};
```

### 方案 B：在 Creem 创建新产品（推荐）

如果您想使用文档中的标准命名，请在 Creem Dashboard 创建以下产品：

#### 1. Basic Monthly (基础月付)
```yaml
产品名称: AI Universal Generator - Basic Monthly
产品 ID: 建议使用自动生成的 ID
价格: $9.00
计费周期: Monthly
元数据:
  plan_tier: basic
  credits: 100
  interval: monthly
```

#### 2. Basic Yearly (基础年付)
```yaml
产品名称: AI Universal Generator - Basic Yearly  
产品 ID: 建议使用自动生成的 ID
价格: $90.00
计费周期: Yearly
元数据:
  plan_tier: basic
  credits: 100
  interval: yearly
  discount: 17
```

#### 3. Pro Monthly (专业月付)
```yaml
产品名称: AI Universal Generator - Pro Monthly
产品 ID: 建议使用自动生成的 ID
价格: $29.00
计费周期: Monthly
元数据:
  plan_tier: pro
  credits: 500
  interval: monthly
```

#### 4. Pro Yearly (专业年付)
```yaml
产品名称: AI Universal Generator - Pro Yearly
产品 ID: 建议使用自动生成的 ID
价格: $290.00
计费周期: Yearly
元数据:
  plan_tier: pro
  credits: 500
  interval: yearly
  discount: 17
```

#### 5. Enterprise Monthly (企业月付)
```yaml
产品名称: AI Universal Generator - Enterprise Monthly
产品 ID: 建议使用自动生成的 ID
价格: $99.00
计费周期: Monthly
元数据:
  plan_tier: enterprise
  credits: 2000
  interval: monthly
```

#### 6. Enterprise Yearly (企业年付)
```yaml
产品名称: AI Universal Generator - Enterprise Yearly
产品 ID: 建议使用自动生成的 ID
价格: $990.00
计费周期: Yearly
元数据:
  plan_tier: enterprise
  credits: 2000
  interval: yearly
  discount: 17
```

## 代码适配

### 1. 更新 checkout 路由

```typescript
// src/app/api/checkout/route.ts

// 产品映射逻辑
const getCreemProductId = (internalProductId: string) => {
  // 支持两种映射方式
  const products = JSON.parse(process.env.CREEM_PRODUCTS || "{}");
  
  // 直接映射
  if (products[internalProductId]) {
    return products[internalProductId];
  }
  
  // 兼容旧名称
  const mapping: Record<string, string> = {
    'basic_monthly': 'starter',
    'pro_monthly': 'standard',
    'enterprise_monthly': 'premium',
  };
  
  const mappedId = mapping[internalProductId];
  return mappedId ? products[mappedId] : null;
};
```

### 2. 更新定价页面

```tsx
// src/app/[locale]/(default)/pricing/page.tsx

const pricingItems = [
  {
    product_id: 'starter',  // 或 'basic_monthly'
    product_name: 'Starter Plan',
    credits: 100,
    amount: 900, // $9.00
    // ...
  },
  {
    product_id: 'standard',  // 或 'pro_monthly'
    product_name: 'Standard Plan',
    credits: 500,
    amount: 2900, // $29.00
    // ...
  },
  {
    product_id: 'premium',  // 或 'enterprise_monthly'
    product_name: 'Premium Plan',
    credits: 2000,
    amount: 9900, // $99.00
    // ...
  },
];
```

## 测试检查清单

创建或更新产品后，请验证以下内容：

- [ ] 产品在 Creem Dashboard 中正确显示
- [ ] 产品价格和计费周期设置正确
- [ ] 产品元数据包含必要信息
- [ ] 环境变量 `CREEM_PRODUCTS` 更新完成
- [ ] 前端产品 ID 与后端映射一致
- [ ] Webhook URL 配置正确
- [ ] 测试支付流程正常

## Webhook 配置

确保在 Creem Dashboard 中配置以下 Webhook：

```
Webhook URL: https://your-domain.com/api/pay/notify/creem
事件类型:
- payment.succeeded
- subscription.created
- subscription.updated
- subscription.cancelled
```

## 支付流程验证

1. **测试卡号**
   - 成功: 4242 4242 4242 4242
   - 失败: 4000 0000 0000 0002
   - 需要认证: 4000 0025 0000 3155

2. **测试流程**
   ```bash
   # 1. 启动开发服务器
   npm run dev
   
   # 2. 访问定价页面
   http://localhost:3000/pricing
   
   # 3. 选择套餐并支付
   # 4. 检查控制台日志
   # 5. 验证订单和积分
   ```

## 常见问题

### Q: 产品 ID 不匹配怎么办？
A: 检查 `CREEM_PRODUCTS` 环境变量，确保内部 ID 与 Creem 产品 ID 正确映射。

### Q: Webhook 接收不到怎么办？
A: 
1. 检查 URL 是否可访问
2. 验证签名密钥是否正确
3. 查看 Creem Dashboard 的 Webhook 日志

### Q: 支付成功但积分没有增加？
A: 
1. 检查 Webhook 处理逻辑
2. 验证订单状态更新
3. 查看数据库事务日志

---

**更新日期**: 2025-08-15  
**当前状态**: 待调整产品映射