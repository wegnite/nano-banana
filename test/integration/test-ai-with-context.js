#!/usr/bin/env node

/**
 * 测试 AI 生成与 Context7 集成
 * 
 * 这个脚本演示了如何使用 Context7 增强的 AI 生成功能
 */

// const fetch = require('node-fetch'); // 暂时注释，因为这是演示脚本
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// API 基础 URL
const BASE_URL = 'http://localhost:3000';

// 测试用户凭证（需要先在系统中注册）
const TEST_USER = {
  email: 'test@example.com',
  password: 'test123456'
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 模拟登录获取会话
 */
async function simulateLogin() {
  log('\n🔐 模拟用户登录...', colors.blue);
  // 这里应该调用实际的登录 API
  // 暂时返回模拟的 session
  return {
    user: {
      email: TEST_USER.email,
      id: 'test_user_123'
    },
    token: 'mock_session_token'
  };
}

/**
 * 测试 AI 生成（首次，无历史）
 */
async function testFirstGeneration() {
  log('\n📝 测试首次 AI 生成（无历史上下文）...', colors.blue);
  
  const prompt = '写一个 JavaScript 函数，计算斐波那契数列的第 n 项';
  
  log(`提示词: ${prompt}`, colors.cyan);
  
  // 模拟 API 调用
  const mockResponse = {
    text: `这是一个计算斐波那契数列的 JavaScript 函数：

\`\`\`javascript
function fibonacci(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  
  let prev = 0;
  let curr = 1;
  
  for (let i = 2; i <= n; i++) {
    let temp = curr;
    curr = prev + curr;
    prev = temp;
  }
  
  return curr;
}

// 使用示例
console.log(fibonacci(10)); // 输出: 55
\`\`\`

这个函数使用迭代方法计算斐波那契数列，时间复杂度为 O(n)，空间复杂度为 O(1)。`,
    credits_used: 1,
    useContext: true
  };
  
  log('✅ 生成成功！', colors.green);
  log('生成的内容:', colors.yellow);
  console.log(mockResponse.text);
  
  return mockResponse;
}

/**
 * 测试用户偏好设置
 */
async function testSetPreferences() {
  log('\n⚙️  设置用户偏好...', colors.blue);
  
  const preferences = {
    preferred_models: ['gpt-4', 'claude-3'],
    preferred_providers: ['openai', 'anthropic'],
    language: 'zh',
    theme: 'dark',
    generation_style: '专业且详细，包含代码示例和解释',
    custom_settings: {
      include_comments: true,
      prefer_typescript: true,
      code_style: 'functional'
    }
  };
  
  log('设置的偏好:', colors.cyan);
  console.log(JSON.stringify(preferences, null, 2));
  
  log('✅ 偏好设置成功！', colors.green);
  
  return preferences;
}

/**
 * 测试 AI 生成（有历史上下文）
 */
async function testGenerationWithContext() {
  log('\n📝 测试 AI 生成（使用历史上下文）...', colors.blue);
  
  const prompt = '优化刚才的斐波那契函数，添加缓存机制';
  
  log(`提示词: ${prompt}`, colors.cyan);
  log('💡 Context7 将自动检索相关历史并增强提示词', colors.yellow);
  
  // 模拟增强后的响应
  const mockResponse = {
    text: `基于之前的斐波那契函数，这里是添加了缓存机制的优化版本：

\`\`\`javascript
// 使用闭包实现带缓存的斐波那契函数
function createFibonacciWithCache() {
  const cache = new Map();
  
  return function fibonacci(n) {
    // 检查缓存
    if (cache.has(n)) {
      console.log(\`从缓存获取 fibonacci(\${n})\`);
      return cache.get(n);
    }
    
    let result;
    
    if (n <= 0) {
      result = 0;
    } else if (n === 1) {
      result = 1;
    } else {
      // 递归计算
      result = fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    // 存入缓存
    cache.set(n, result);
    return result;
  };
}

// 使用示例
const fibonacci = createFibonacciWithCache();

console.log(fibonacci(10)); // 首次计算
console.log(fibonacci(10)); // 从缓存获取
console.log(fibonacci(15)); // 部分使用缓存

// TypeScript 版本（根据您的偏好）
type FibonacciCache = Map<number, number>;

function createFibonacciWithCacheTS(): (n: number) => number {
  const cache: FibonacciCache = new Map();
  
  const fibonacci = (n: number): number => {
    if (cache.has(n)) {
      return cache.get(n)!;
    }
    
    const result = n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
    cache.set(n, result);
    return result;
  };
  
  return fibonacci;
}
\`\`\`

**改进说明：**
1. 添加了缓存机制，避免重复计算
2. 使用闭包保护缓存数据
3. 提供了 TypeScript 版本（根据您的偏好设置）
4. 时间复杂度优化到 O(n)，每个值只计算一次`,
    enhanced_prompt: `
历史上下文参考：
- 之前生成了一个迭代版本的斐波那契函数
- 用户偏好：TypeScript、函数式编程风格

用户偏好风格：专业且详细，包含代码示例和解释

当前请求：
优化刚才的斐波那契函数，添加缓存机制`,
    credits_used: 1,
    useContext: true
  };
  
  log('✅ 生成成功（使用了上下文增强）！', colors.green);
  log('\n增强后的提示词:', colors.cyan);
  console.log(mockResponse.enhanced_prompt);
  log('\n生成的内容:', colors.yellow);
  console.log(mockResponse.text);
  
  return mockResponse;
}

/**
 * 查看会话历史
 */
async function testViewHistory() {
  log('\n📊 查看会话历史...', colors.blue);
  
  const mockHistory = [
    {
      prompt: '写一个 JavaScript 函数，计算斐波那契数列的第 n 项',
      response: '[斐波那契函数实现...]',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      model: 'gpt-4',
      provider: 'openai'
    },
    {
      prompt: '优化刚才的斐波那契函数，添加缓存机制',
      response: '[优化后的斐波那契函数...]',
      timestamp: new Date().toISOString(),
      model: 'gpt-4',
      provider: 'openai'
    }
  ];
  
  log('会话历史记录:', colors.cyan);
  mockHistory.forEach((session, index) => {
    log(`\n${index + 1}. ${new Date(session.timestamp).toLocaleString()}`, colors.yellow);
    log(`   提示: ${session.prompt.substring(0, 50)}...`, colors.reset);
    log(`   模型: ${session.model} (${session.provider})`, colors.reset);
  });
  
  return mockHistory;
}

/**
 * 测试统计信息
 */
async function testStatistics() {
  log('\n📈 获取使用统计...', colors.blue);
  
  const mockStats = {
    total_contexts: 5,
    preferences: 1,
    sessions: 2,
    memories: 2,
    total_generations: 10,
    credits_used: 10,
    favorite_model: 'gpt-4',
    favorite_provider: 'openai'
  };
  
  log('使用统计:', colors.cyan);
  log(`  总上下文数: ${mockStats.total_contexts}`, colors.reset);
  log(`  会话数: ${mockStats.sessions}`, colors.reset);
  log(`  总生成次数: ${mockStats.total_generations}`, colors.reset);
  log(`  消耗积分: ${mockStats.credits_used}`, colors.reset);
  log(`  常用模型: ${mockStats.favorite_model}`, colors.reset);
  
  return mockStats;
}

/**
 * 运行所有测试
 */
async function runDemo() {
  log('🚀 Context7 AI 生成功能演示', colors.blue);
  log('=' .repeat(50), colors.blue);
  
  try {
    // 1. 模拟登录
    await simulateLogin();
    
    // 2. 首次生成（无历史）
    await testFirstGeneration();
    
    // 添加延迟，模拟真实使用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. 设置用户偏好
    await testSetPreferences();
    
    // 4. 再次生成（有历史上下文）
    await testGenerationWithContext();
    
    // 5. 查看历史
    await testViewHistory();
    
    // 6. 查看统计
    await testStatistics();
    
    log('\n' + '=' .repeat(50), colors.blue);
    log('✅ 演示完成！', colors.green);
    log('\n💡 Context7 功能总结:', colors.cyan);
    log('  1. 自动存储每次 AI 生成的历史', colors.reset);
    log('  2. 基于历史上下文增强新的提示词', colors.reset);
    log('  3. 记住用户偏好（语言、风格、模型等）', colors.reset);
    log('  4. 提供会话历史查看和统计功能', colors.reset);
    log('  5. 支持清除历史和重置偏好', colors.reset);
    
    log('\n📝 注意事项:', colors.yellow);
    log('  - 需要配置真实的 Upstash Vector 凭证', colors.reset);
    log('  - 需要用户登录才能使用个性化功能', colors.reset);
    log('  - 历史数据存储在云端，支持跨设备同步', colors.reset);
    
  } catch (error) {
    log(`\n❌ 演示失败: ${error.message}`, colors.red);
  }
}

// 运行演示
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = {
  runDemo,
  testFirstGeneration,
  testGenerationWithContext,
  testSetPreferences,
  testViewHistory,
  testStatistics
};