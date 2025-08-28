#!/usr/bin/env node

/**
 * 测试本地 Nano Banana API 集成
 * 
 * 用途：测试通过 Next.js API 路由调用 nano-banana
 * 运行：需要先启动开发服务器 npm run dev
 */

require('dotenv').config({ path: '.env.local' });

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}`)
};

async function testLocalAPI() {
  log.section('🍌 测试本地 Nano Banana API 集成');
  
  const baseUrl = 'http://localhost:3000';
  
  // 1. 测试获取配置（不需要认证的 GET 请求）
  log.section('测试 API 配置端点');
  
  try {
    log.info('请求 GET /api/nano-banana/generate ...');
    
    const configResponse = await fetch(`${baseUrl}/api/nano-banana/generate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const configText = await configResponse.text();
    
    if (configResponse.ok) {
      const config = JSON.parse(configText);
      log.success('成功获取 API 配置');
      log.info(`积分/图像: ${config.data?.credits_per_image || '未知'}`);
      log.info(`最大图像数: ${config.data?.max_images_per_request || '未知'}`);
    } else {
      log.warn(`配置请求失败 (${configResponse.status}): ${configText}`);
      
      // 检查是否需要认证
      if (configText.includes('Unauthorized')) {
        log.warn('此端点需要用户登录');
      }
    }
    
  } catch (error) {
    log.error(`无法连接到本地服务器: ${error.message}`);
    log.warn('请确保开发服务器正在运行: npm run dev');
    process.exit(1);
  }
  
  // 2. 测试生成端点（需要认证）
  log.section('测试图像生成端点');
  
  try {
    log.info('发送 POST 请求到 /api/nano-banana/generate ...');
    log.warn('注意：此端点需要用户认证');
    
    const generateResponse = await fetch(`${baseUrl}/api/nano-banana/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'A cute banana character in space',
        num_images: '1'
      })
    });
    
    const generateText = await generateResponse.text();
    
    if (generateResponse.ok) {
      const result = JSON.parse(generateText);
      log.success('图像生成成功！');
      
      if (result.data?.images) {
        log.info(`生成了 ${result.data.images.length} 张图像`);
      }
    } else {
      log.warn(`生成请求失败 (${generateResponse.status})`);
      
      // 解析错误信息
      try {
        const error = JSON.parse(generateText);
        log.error(`错误: ${error.error || error.message || '未知错误'}`);
        
        if (generateText.includes('Unauthorized')) {
          log.info('需要登录才能使用此功能');
          log.info('请通过浏览器访问 http://localhost:3000 并登录');
        }
      } catch {
        log.error(`响应: ${generateText.substring(0, 200)}`);
      }
    }
    
  } catch (error) {
    log.error(`请求失败: ${error.message}`);
  }
  
  // 3. 直接测试服务层
  log.section('测试 Nano Banana 服务层');
  
  log.info('检查环境变量配置...');
  const hasApiKey = !!process.env.NANO_BANANA_API_KEY;
  
  if (hasApiKey) {
    log.success('NANO_BANANA_API_KEY 已配置');
    
    // 尝试直接调用服务
    try {
      log.info('尝试直接调用 nano-banana 服务...');
      
      // 动态导入服务
      const servicePath = '../src/services/nano-banana.js';
      log.warn('注意：TypeScript 服务需要编译后才能在 Node.js 中运行');
      log.info('建议通过 API 路由测试，或使用 tsx 运行 TypeScript');
      
    } catch (error) {
      log.warn('无法直接调用 TypeScript 服务');
    }
  } else {
    log.error('NANO_BANANA_API_KEY 未配置');
    log.info('请在 .env.local 中设置 API key');
  }
  
  // 4. 总结和建议
  log.section('测试总结');
  
  log.info('集成状态检查:');
  console.log(`  • 本地服务器: ${configResponse ? '✅ 运行中' : '❌ 未运行'}`);
  console.log(`  • API Key: ${hasApiKey ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`  • 配置端点: ${configResponse?.ok ? '✅ 正常' : '⚠️ 需要认证'}`);
  console.log(`  • 生成端点: ${generateResponse?.ok ? '✅ 正常' : '⚠️ 需要认证'}`);
  
  console.log('\n建议的测试步骤:');
  console.log('  1. 启动开发服务器: npm run dev');
  console.log('  2. 访问 http://localhost:3000 并登录');
  console.log('  3. 在浏览器控制台测试 API:');
  console.log('     fetch("/api/nano-banana/generate", {');
  console.log('       method: "POST",');
  console.log('       headers: {"Content-Type": "application/json"},');
  console.log('       body: JSON.stringify({');
  console.log('         prompt: "A banana",');
  console.log('         num_images: "1"');
  console.log('       })');
  console.log('     }).then(r => r.json()).then(console.log)');
  
  console.log('\n相关文件:');
  console.log('  • 服务层: src/services/nano-banana.ts');
  console.log('  • 生成 API: src/app/api/nano-banana/generate/route.ts');
  console.log('  • 编辑 API: src/app/api/nano-banana/edit/route.ts');
  console.log('  • 类型定义: src/types/nano-banana.d.ts');
}

// 运行测试
testLocalAPI().catch(error => {
  log.error('测试异常终止:');
  console.error(error);
  process.exit(1);
});