#!/usr/bin/env node

/**
 * Nano Banana API 验证测试
 * 
 * 用途：快速验证 nano-banana API 是否配置正确并可以正常工作
 * 运行：node test/verify-nano-banana.js
 */

// 使用 Node.js 18+ 内置的 fetch
require('dotenv').config({ path: '.env.local' });

// 定义颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 输出格式化函数
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}`)
};

// 主测试函数
async function verifyNanoBanana() {
  log.section('🍌 Nano Banana API 验证测试');
  
  // 1. 检查环境变量
  log.info('检查环境配置...');
  const apiKey = process.env.NANO_BANANA_API_KEY;
  const apiUrl = process.env.NANO_BANANA_API_URL || 'https://api.kie.ai/nano-banana';
  
  if (!apiKey) {
    log.error('NANO_BANANA_API_KEY 未配置！');
    log.warn('请在 .env.local 文件中设置: NANO_BANANA_API_KEY="your-api-key"');
    process.exit(1);
  }
  
  log.success(`API Key 已配置: ${apiKey.substring(0, 8)}...`);
  log.info(`API URL: ${apiUrl}`);
  
  // 2. 测试简单的图像生成请求
  log.section('测试图像生成功能');
  
  let response, data;
  
  try {
    log.info('发送测试请求到 nano-banana API...');
    
    const requestBody = {
      prompt: 'A simple test image of a banana in space',
      num_images: '1'
    };
    
    const startTime = Date.now();
    
    const response = await fetch(`${apiUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'nano-banana-test/1.0'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000 // 30秒超时
    });
    
    const responseTime = Date.now() - startTime;
    
    // 检查响应状态
    log.info(`响应状态: ${response.status} ${response.statusText}`);
    log.info(`响应时间: ${responseTime}ms`);
    
    // 解析响应
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      log.error('响应不是有效的 JSON:');
      console.log(responseText.substring(0, 500));
      throw new Error('Invalid JSON response');
    }
    
    // 分析响应内容
    if (response.ok && data.success) {
      log.success('API 调用成功！');
      
      // 显示返回的图像信息
      if (data.images && data.images.length > 0) {
        log.success(`生成了 ${data.images.length} 张图像`);
        data.images.forEach((img, idx) => {
          log.info(`  图像 ${idx + 1}: ${img.url || 'URL未提供'}`);
          if (img.width && img.height) {
            log.info(`    尺寸: ${img.width}x${img.height}`);
          }
        });
      } else if (data.data?.images) {
        log.success(`生成了 ${data.data.images.length} 张图像`);
        data.data.images.forEach((img, idx) => {
          log.info(`  图像 ${idx + 1}: ${img.url || 'URL未提供'}`);
        });
      }
      
      // 显示积分信息
      if (data.credits_used !== undefined) {
        log.info(`使用积分: ${data.credits_used}`);
      }
      if (data.remaining_credits !== undefined) {
        log.info(`剩余积分: ${data.remaining_credits}`);
      }
      
    } else {
      log.error('API 调用失败！');
      log.error(`错误信息: ${data.error || data.message || '未知错误'}`);
      
      // 分析错误原因
      if (response.status === 401) {
        log.warn('认证失败 - 请检查 API Key 是否正确');
      } else if (response.status === 402) {
        log.warn('积分不足 - 请充值 nano-banana 账户');
      } else if (response.status === 429) {
        log.warn('请求频率过高 - 请稍后重试');
      } else if (response.status === 500) {
        log.warn('服务器错误 - nano-banana 服务可能暂时不可用');
      }
    }
    
  } catch (error) {
    log.error(`测试失败: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      log.warn('无法连接到 API 服务器 - 请检查网络连接');
    } else if (error.code === 'ETIMEDOUT') {
      log.warn('请求超时 - API 服务器响应太慢');
    } else {
      console.error(error);
    }
  }
  
  // 3. 总结
  log.section('测试总结');
  
  log.info('Nano Banana API 集成状态:');
  console.log('  • API Key: ' + (apiKey ? '✅ 已配置' : '❌ 未配置'));
  console.log('  • 服务连接: ' + (response && response.ok ? '✅ 正常' : '⚠️ 需要检查'));
  console.log('  • 图像生成: ' + (data && data.success ? '✅ 工作正常' : '⚠️ 需要调试'));
  
  log.info('\n下一步操作建议:');
  if (!apiKey) {
    console.log('  1. 在 .env.local 中配置 NANO_BANANA_API_KEY');
  } else if (!response || !response.ok) {
    console.log('  1. 检查 API Key 是否有效');
    console.log('  2. 确认 nano-banana 账户有足够积分');
    console.log('  3. 查看 https://kie.ai 的服务状态');
  } else {
    console.log('  1. 测试更多图像生成参数');
    console.log('  2. 测试图像编辑功能');
    console.log('  3. 集成到前端界面');
  }
  
  console.log('\n相关文档:');
  console.log('  • API 文档: https://kie.ai/nano-banana');
  console.log('  • 测试报告: docs/nano-banana测试报告.md');
  console.log('  • 服务代码: src/services/nano-banana.ts');
}

// 运行测试
verifyNanoBanana().catch(error => {
  log.error('测试程序异常退出:');
  console.error(error);
  process.exit(1);
});