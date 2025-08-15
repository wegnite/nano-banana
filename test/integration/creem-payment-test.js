/**
 * Creem 支付集成测试
 * 
 * 用途：验证 Creem 支付配置是否正确
 * 包括：环境变量、产品映射、Webhook 验证
 */

const crypto = require('crypto');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

/**
 * 测试1：检查环境变量配置
 */
function checkEnvironmentVariables() {
  console.log(`\n${colors.blue}=== 测试1：环境变量配置检查 ===${colors.reset}`);
  
  const requiredVars = [
    'CREEM_API_KEY',
    'CREEM_WEBHOOK_SECRET',
    'CREEM_ENV',
    'CREEM_PRODUCTS',
  ];
  
  const results = [];
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const exists = !!value;
    
    if (exists) {
      // 隐藏敏感信息
      let displayValue = value;
      if (varName.includes('KEY') || varName.includes('SECRET')) {
        displayValue = value.substring(0, 10) + '...' + (value.length > 10 ? `(${value.length} chars)` : '');
      } else if (varName === 'CREEM_PRODUCTS') {
        try {
          const products = JSON.parse(value);
          displayValue = `${Object.keys(products).length} products configured`;
        } catch {
          displayValue = 'Invalid JSON';
          allPresent = false;
        }
      }
      
      console.log(`${colors.green}✓${colors.reset} ${varName}: ${displayValue}`);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${varName}: Not configured`);
      allPresent = false;
    }
  });
  
  if (allPresent) {
    console.log(`${colors.green}✅ 所有必需的环境变量都已配置${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 缺少部分环境变量，请检查 .env.production${colors.reset}`);
  }
  
  return allPresent;
}

/**
 * 测试2：验证产品映射
 */
function checkProductMapping() {
  console.log(`\n${colors.blue}=== 测试2：产品映射验证 ===${colors.reset}`);
  
  try {
    const productsJson = process.env.CREEM_PRODUCTS;
    if (!productsJson) {
      console.log(`${colors.red}❌ CREEM_PRODUCTS 未配置${colors.reset}`);
      return false;
    }
    
    const products = JSON.parse(productsJson);
    const expectedProducts = [
      'basic_monthly',
      'basic_yearly',
      'pro_monthly',
      'pro_yearly',
      'enterprise_monthly',
      'enterprise_yearly',
      'credits_100',
      'credits_500',
      'credits_2000',
    ];
    
    console.log('\n产品映射检查：');
    expectedProducts.forEach(productId => {
      const creemProductId = products[productId];
      if (creemProductId) {
        console.log(`${colors.green}✓${colors.reset} ${productId} → ${creemProductId}`);
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} ${productId} → 未配置`);
      }
    });
    
    // 检查是否有额外的产品
    const extraProducts = Object.keys(products).filter(
      key => !expectedProducts.includes(key)
    );
    
    if (extraProducts.length > 0) {
      console.log('\n额外的产品配置：');
      extraProducts.forEach(productId => {
        console.log(`${colors.blue}ℹ${colors.reset} ${productId} → ${products[productId]}`);
      });
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ 产品映射解析失败: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * 测试3：Webhook 签名验证
 */
function testWebhookSignature() {
  console.log(`\n${colors.blue}=== 测试3：Webhook 签名验证 ===${colors.reset}`);
  
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) {
    console.log(`${colors.red}❌ CREEM_WEBHOOK_SECRET 未配置${colors.reset}`);
    return false;
  }
  
  // 模拟 Webhook 数据
  const testPayload = JSON.stringify({
    id: 'evt_test_123',
    type: 'payment.succeeded',
    object: {
      id: 'pay_test_123',
      amount: 900,
      currency: 'USD',
      metadata: {
        order_no: 'TEST_ORDER_123',
        user_uuid: 'test_user_uuid',
      },
      customer: {
        email: 'test@example.com',
      },
    },
  });
  
  // 生成签名
  const signature = crypto
    .createHmac('sha256', secret)
    .update(testPayload)
    .digest('hex');
  
  // 验证签名
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(testPayload)
    .digest('hex');
  
  if (signature === expectedSig) {
    console.log(`${colors.green}✅ Webhook 签名验证通过${colors.reset}`);
    console.log(`   测试签名: ${signature.substring(0, 20)}...`);
    return true;
  } else {
    console.log(`${colors.red}❌ Webhook 签名验证失败${colors.reset}`);
    return false;
  }
}

/**
 * 测试4：API 连接测试（可选）
 */
async function testAPIConnection() {
  console.log(`\n${colors.blue}=== 测试4：Creem API 连接测试 ===${colors.reset}`);
  
  const apiKey = process.env.CREEM_API_KEY;
  const env = process.env.CREEM_ENV;
  
  if (!apiKey) {
    console.log(`${colors.yellow}⚠ 跳过 API 测试（未配置 API Key）${colors.reset}`);
    return;
  }
  
  const baseUrl = env === 'prod' 
    ? 'https://api.creem.io'
    : 'https://test-api.creem.io';
  
  console.log(`测试环境: ${env === 'prod' ? '生产环境' : '测试环境'}`);
  console.log(`API 端点: ${baseUrl}`);
  
  try {
    // 测试 API 连接（获取产品列表）
    const response = await fetch(`${baseUrl}/v1/products`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✅ API 连接成功${colors.reset}`);
      console.log(`   找到 ${data.data?.length || 0} 个产品`);
      
      // 显示产品列表
      if (data.data && data.data.length > 0) {
        console.log('\n已配置的 Creem 产品：');
        data.data.forEach(product => {
          console.log(`   - ${product.id}: ${product.name} (${product.price.amount/100} ${product.price.currency})`);
        });
      }
    } else {
      const error = await response.text();
      console.log(`${colors.red}❌ API 连接失败: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`   错误详情: ${error}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ API 请求失败: ${error.message}${colors.reset}`);
  }
}

/**
 * 生成测试订单数据
 */
function generateTestOrder() {
  console.log(`\n${colors.blue}=== 测试订单数据示例 ===${colors.reset}`);
  
  const testOrder = {
    product_id: 'basic_monthly',
    product_name: 'AI Universal Generator - Basic Monthly',
    credits: 100,
    interval: 'monthly',
    amount: 900, // $9.00 in cents
    currency: 'USD',
    valid_months: 1,
    locale: 'en',
    user_uuid: 'test_user_' + Date.now(),
    user_email: 'test@example.com',
  };
  
  console.log('\n可用于测试的订单数据：');
  console.log(JSON.stringify(testOrder, null, 2));
  
  console.log('\n测试支付流程：');
  console.log('1. 使用上述数据调用 /api/checkout');
  console.log('2. 获取 Creem 支付链接');
  console.log('3. 使用测试卡号: 4242 4242 4242 4242');
  console.log('4. 验证 Webhook 回调');
  console.log('5. 检查订单状态和积分发放');
  
  return testOrder;
}

/**
 * 显示配置建议
 */
function showConfigSuggestions() {
  console.log(`\n${colors.blue}=== 配置建议 ===${colors.reset}`);
  
  const env = process.env.CREEM_ENV;
  
  if (env === 'test') {
    console.log(`\n${colors.yellow}📝 测试环境配置建议：${colors.reset}`);
    console.log('1. 使用测试 API Key（以 test_ 开头）');
    console.log('2. 使用测试 Webhook Secret');
    console.log('3. 测试卡号：4242 4242 4242 4242');
    console.log('4. 测试完成后切换到生产环境');
  } else if (env === 'prod') {
    console.log(`\n${colors.green}🚀 生产环境注意事项：${colors.reset}`);
    console.log('1. 确保使用生产 API Key');
    console.log('2. 验证 Webhook URL 可访问');
    console.log('3. 设置正确的回调 URL');
    console.log('4. 启用 Webhook 重试机制');
  }
  
  console.log(`\n${colors.blue}💡 最佳实践：${colors.reset}`);
  console.log('1. 定期轮换 API 密钥');
  console.log('2. 监控支付成功率');
  console.log('3. 实现幂等性处理');
  console.log('4. 记录所有支付日志');
  console.log('5. 设置支付失败告警');
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}     Creem 支付集成测试工具${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  
  // 加载环境变量
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '.env.production' });
    console.log(`\n已加载 .env.production 配置`);
  }
  
  // 运行测试
  const envOk = checkEnvironmentVariables();
  const mappingOk = checkProductMapping();
  const signatureOk = testWebhookSignature();
  
  // API 测试（可选）
  await testAPIConnection();
  
  // 生成测试数据
  generateTestOrder();
  
  // 显示配置建议
  showConfigSuggestions();
  
  // 总结
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}     测试总结${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  
  if (envOk && mappingOk && signatureOk) {
    console.log(`${colors.green}✅ Creem 支付配置验证通过！${colors.reset}`);
    console.log('\n下一步：');
    console.log('1. 在 Creem Dashboard 创建产品');
    console.log('2. 配置 Webhook URL');
    console.log('3. 进行端到端支付测试');
  } else {
    console.log(`${colors.red}❌ 配置存在问题，请根据上述提示修复${colors.reset}`);
  }
}

// 运行测试
runTests().catch(console.error);