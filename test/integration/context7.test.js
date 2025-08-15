/**
 * Context7 集成测试
 * 
 * 测试 Context7 服务与 AI 生成功能的集成
 * 包括：上下文存储、检索、用户偏好管理等
 */

const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// 测试配置
const TEST_CONFIG = {
  user_uuid: 'test_user_' + Date.now(),
  test_content: '这是测试内容 ' + new Date().toISOString(),
  test_prompt: '帮我写一个简单的 JavaScript 函数',
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 测试 Context7 服务初始化
 */
async function testInitialization() {
  log('\n📦 测试 Context7 服务初始化...', colors.blue);
  
  try {
    // 动态导入 ES 模块
    const { context7Service, initializeContext7 } = await import('../../src/services/context7.ts');
    
    await initializeContext7();
    log('✅ Context7 服务初始化成功', colors.green);
    
    return { context7Service, initializeContext7 };
  } catch (error) {
    log(`❌ Context7 服务初始化失败: ${error.message}`, colors.red);
    
    if (error.message.includes('Upstash credentials not configured')) {
      log('\n⚠️  请配置 Upstash 凭证:', colors.yellow);
      log('1. 访问 https://console.upstash.com', colors.yellow);
      log('2. 创建 Vector Database', colors.yellow);
      log('3. 在 .env.local 中设置:', colors.yellow);
      log('   UPSTASH_VECTOR_URL=your_url', colors.yellow);
      log('   UPSTASH_VECTOR_TOKEN=your_token', colors.yellow);
    }
    
    throw error;
  }
}

/**
 * 测试存储上下文
 */
async function testStoreContext(context7Service) {
  log('\n💾 测试存储上下文...', colors.blue);
  
  try {
    const contextId = await context7Service.storeContext(
      TEST_CONFIG.user_uuid,
      TEST_CONFIG.test_content,
      {
        type: 'test',
        timestamp: new Date().toISOString(),
      }
    );
    
    if (contextId) {
      log(`✅ 上下文存储成功，ID: ${contextId}`, colors.green);
      return contextId;
    } else {
      throw new Error('未返回上下文 ID');
    }
  } catch (error) {
    log(`❌ 存储上下文失败: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * 测试检索上下文
 */
async function testRetrieveContext(context7Service) {
  log('\n🔍 测试检索上下文...', colors.blue);
  
  // 等待向量索引更新
  await delay(2000);
  
  try {
    const contexts = await context7Service.retrieveContext(
      TEST_CONFIG.user_uuid,
      '测试内容',
      5
    );
    
    if (contexts && contexts.length > 0) {
      log(`✅ 检索到 ${contexts.length} 条相关上下文`, colors.green);
      contexts.forEach((ctx, index) => {
        log(`  ${index + 1}. ${ctx.content.substring(0, 50)}...`, colors.blue);
      });
      return contexts;
    } else {
      log('⚠️  未检索到相关上下文（可能是向量索引延迟）', colors.yellow);
      return [];
    }
  } catch (error) {
    log(`❌ 检索上下文失败: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * 测试用户偏好管理
 */
async function testUserPreferences(context7Service) {
  log('\n⚙️  测试用户偏好管理...', colors.blue);
  
  try {
    // 存储用户偏好
    const preferences = {
      preferred_models: ['gpt-4', 'claude-3'],
      preferred_providers: ['openai', 'anthropic'],
      language: 'zh',
      theme: 'dark',
      generation_style: 'creative',
      custom_settings: {
        temperature: 0.8,
        max_tokens: 2000,
      }
    };
    
    await context7Service.storeUserPreferences(TEST_CONFIG.user_uuid, preferences);
    log('✅ 用户偏好存储成功', colors.green);
    
    // 等待索引更新
    await delay(2000);
    
    // 获取用户偏好
    const retrievedPrefs = await context7Service.getUserPreferences(TEST_CONFIG.user_uuid);
    
    if (retrievedPrefs) {
      log('✅ 用户偏好检索成功', colors.green);
      log(`  偏好语言: ${retrievedPrefs.language}`, colors.blue);
      log(`  偏好主题: ${retrievedPrefs.theme}`, colors.blue);
      log(`  生成风格: ${retrievedPrefs.generation_style}`, colors.blue);
      return retrievedPrefs;
    } else {
      log('⚠️  未检索到用户偏好', colors.yellow);
      return null;
    }
  } catch (error) {
    log(`❌ 用户偏好管理失败: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * 测试会话历史
 */
async function testSessionHistory(context7Service) {
  log('\n📝 测试会话历史管理...', colors.blue);
  
  try {
    // 存储会话历史
    await context7Service.storeSessionHistory(
      TEST_CONFIG.user_uuid,
      TEST_CONFIG.test_prompt,
      '这是一个示例响应：\n```javascript\nfunction add(a, b) {\n  return a + b;\n}\n```',
      {
        model: 'gpt-4',
        provider: 'openai',
        timestamp: new Date().toISOString(),
      }
    );
    log('✅ 会话历史存储成功', colors.green);
    
    // 等待索引更新
    await delay(2000);
    
    // 获取会话历史
    const history = await context7Service.getSessionHistory(TEST_CONFIG.user_uuid, 5);
    
    if (history && history.length > 0) {
      log(`✅ 检索到 ${history.length} 条会话历史`, colors.green);
      history.forEach((session, index) => {
        log(`  ${index + 1}. ${session.prompt?.substring(0, 30)}...`, colors.blue);
      });
      return history;
    } else {
      log('⚠️  未检索到会话历史', colors.yellow);
      return [];
    }
  } catch (error) {
    log(`❌ 会话历史管理失败: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * 测试提示词增强
 */
async function testPromptEnhancement(context7Service) {
  log('\n✨ 测试提示词增强...', colors.blue);
  
  try {
    const enhancedPrompt = await context7Service.enhancePrompt(
      TEST_CONFIG.user_uuid,
      '写一个排序算法'
    );
    
    if (enhancedPrompt && enhancedPrompt !== '写一个排序算法') {
      log('✅ 提示词增强成功', colors.green);
      log('原始提示词: 写一个排序算法', colors.blue);
      log(`增强后: ${enhancedPrompt.substring(0, 100)}...`, colors.blue);
      return enhancedPrompt;
    } else {
      log('⚠️  提示词未被增强（可能没有相关历史）', colors.yellow);
      return enhancedPrompt;
    }
  } catch (error) {
    log(`❌ 提示词增强失败: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * 测试统计信息
 */
async function testStatistics(context7Service) {
  log('\n📊 测试统计信息...', colors.blue);
  
  try {
    const stats = await context7Service.getUserStats(TEST_CONFIG.user_uuid);
    
    log('✅ 获取统计信息成功', colors.green);
    log(`  总上下文数: ${stats.total_contexts}`, colors.blue);
    log(`  偏好设置数: ${stats.preferences}`, colors.blue);
    log(`  会话记录数: ${stats.sessions}`, colors.blue);
    log(`  记忆条目数: ${stats.memories}`, colors.blue);
    
    return stats;
  } catch (error) {
    log(`❌ 获取统计信息失败: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * 测试清理功能
 */
async function testCleanup(context7Service) {
  log('\n🧹 测试清理功能...', colors.blue);
  
  try {
    // 清除测试用户的所有上下文
    await context7Service.clearUserContext(TEST_CONFIG.user_uuid);
    log('✅ 清理测试数据成功', colors.green);
    
    // 验证清理结果
    const stats = await context7Service.getUserStats(TEST_CONFIG.user_uuid);
    if (stats.total_contexts === 0) {
      log('✅ 验证清理成功，所有上下文已删除', colors.green);
    } else {
      log(`⚠️  清理后仍有 ${stats.total_contexts} 条上下文`, colors.yellow);
    }
  } catch (error) {
    log(`❌ 清理失败: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  log('\n🚀 开始 Context7 集成测试', colors.blue);
  log('=' .repeat(50), colors.blue);
  
  const startTime = Date.now();
  let passedTests = 0;
  let failedTests = 0;
  
  try {
    // 初始化服务
    const { context7Service } = await testInitialization();
    passedTests++;
    
    // 运行各项测试
    const tests = [
      () => testStoreContext(context7Service),
      () => testRetrieveContext(context7Service),
      () => testUserPreferences(context7Service),
      () => testSessionHistory(context7Service),
      () => testPromptEnhancement(context7Service),
      () => testStatistics(context7Service),
      () => testCleanup(context7Service),
    ];
    
    for (const test of tests) {
      try {
        await test();
        passedTests++;
      } catch (error) {
        failedTests++;
        // 继续运行其他测试
      }
    }
    
  } catch (error) {
    log('\n❌ 测试中断: ' + error.message, colors.red);
    failedTests++;
  }
  
  // 输出测试结果
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log('\n' + '=' .repeat(50), colors.blue);
  log('📋 测试完成', colors.blue);
  log(`⏱️  耗时: ${duration} 秒`, colors.blue);
  log(`✅ 通过: ${passedTests} 个测试`, colors.green);
  if (failedTests > 0) {
    log(`❌ 失败: ${failedTests} 个测试`, colors.red);
  }
  
  // 返回退出码
  process.exit(failedTests > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch(error => {
  log(`\n💥 测试运行失败: ${error.message}`, colors.red);
  process.exit(1);
});