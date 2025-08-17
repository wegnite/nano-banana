/**
 * 模拟用户旅程测试脚本
 * 测试从访问到注册的完整归因流程
 */

const fetch = require('node-fetch');

console.log('🚀 开始模拟用户旅程测试\n');

const BASE_URL = 'http://localhost:3000';

async function simulateUserJourney() {
  try {
    // 1. 模拟带UTM参数的首次访问
    console.log('1️⃣ 模拟Google广告访问...');
    const visitResponse = await fetch(`${BASE_URL}/api/attribution/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'Referer': 'https://www.google.com/search?q=ai+tools'
      },
      body: JSON.stringify({
        page_url: `${BASE_URL}/zh?utm_source=google&utm_medium=cpc&utm_campaign=black_friday&utm_term=ai_tools`,
        screen_width: 1920,
        screen_height: 1080,
        viewport_width: 1920,
        viewport_height: 937
      })
    });
    
    const visitData = await visitResponse.json();
    console.log('✅ 访问记录已创建');
    console.log(`   访客ID: ${visitData.data?.visitor_id}`);
    console.log(`   会话ID: ${visitData.data?.session_id}\n`);
    
    // 2. 模拟第二次访问（不同页面）
    console.log('2️⃣ 模拟浏览定价页面...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    
    const pricingResponse = await fetch(`${BASE_URL}/api/attribution/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'Cookie': visitResponse.headers.get('set-cookie') || ''
      },
      body: JSON.stringify({
        page_url: `${BASE_URL}/zh/pricing`,
        screen_width: 1920,
        screen_height: 1080,
        viewport_width: 1920,
        viewport_height: 937
      })
    });
    
    console.log('✅ 定价页访问已记录\n');
    
    // 3. 模拟移动设备访问
    console.log('3️⃣ 模拟移动设备访问...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileResponse = await fetch(`${BASE_URL}/api/attribution/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Mobile/15E148',
        'Referer': 'https://m.facebook.com/'
      },
      body: JSON.stringify({
        page_url: `${BASE_URL}/zh?utm_source=facebook&utm_medium=social&utm_campaign=mobile_ads`,
        screen_width: 375,
        screen_height: 812,
        viewport_width: 375,
        viewport_height: 635
      })
    });
    
    const mobileData = await mobileResponse.json();
    console.log('✅ 移动设备访问已记录');
    console.log(`   访客ID: ${mobileData.data?.visitor_id}\n`);
    
    // 4. 模拟直接访问
    console.log('4️⃣ 模拟直接访问（无来源）...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const directResponse = await fetch(`${BASE_URL}/api/attribution/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36'
      },
      body: JSON.stringify({
        page_url: `${BASE_URL}/zh`,
        screen_width: 1440,
        screen_height: 900,
        viewport_width: 1440,
        viewport_height: 789
      })
    });
    
    console.log('✅ 直接访问已记录\n');
    
    // 5. 获取归因统计
    console.log('5️⃣ 获取当前归因数据...');
    const statsResponse = await fetch(`${BASE_URL}/api/attribution/track`, {
      method: 'GET',
      headers: {
        'Cookie': visitResponse.headers.get('set-cookie') || ''
      }
    });
    
    const stats = await statsResponse.json();
    console.log('📊 归因数据:');
    console.log(JSON.stringify(stats.data, null, 2));
    
    console.log('\n✨ 用户旅程模拟完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('下一步操作:');
    console.log('1. 运行 node test/verify-attribution.js 查看数据库记录');
    console.log('2. 访问 https://local.drizzle.studio 查看详细数据');
    console.log('3. 打开 test/test-attribution.html 进行手动测试');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n请确保:');
    console.log('1. 开发服务器正在运行 (npm run dev)');
    console.log('2. API端点可访问');
    console.log('3. 数据库连接正常');
  }
}

// 运行测试
simulateUserJourney().catch(console.error);