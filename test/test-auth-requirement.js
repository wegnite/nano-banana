#!/usr/bin/env node

/**
 * 测试认证要求 - 验证未登录用户不能生成图像
 * 
 * 根据用户要求：
 * "你应该跳出来 说先登录再使用"
 */

const API_URL = 'http://localhost:3005/api/demo/gen-image-siliconflow';

async function testWithoutAuth() {
  console.log('🔐 测试：未登录用户调用 API');
  console.log('=====================================');
  
  const testData = {
    prompt: '美丽的樱花树下的少女',
    provider: 'siliconflow',
    model: 'black-forest-labs/FLUX.1-schnell',
    size: '1024x1024',
    n: 1,
    image_format: 'jpeg'
  };
  
  try {
    console.log('📤 发送请求（无认证信息）...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.log('✅ 正确：API 拒绝了未认证请求');
      console.log(`📝 错误消息: ${result.message}`);
    } else {
      // 检查是否返回了 demo 模式响应
      if (result.data?.images?.[0]?.demo) {
        console.log('⚠️  API 返回了 Demo 模式响应');
        console.log('📝 消息:', result.data.message);
        console.log('🔍 这表示 API 允许未登录访问，但使用 demo 图像');
      } else {
        console.log('❌ 错误：API 允许未认证用户生成真实图像！');
        console.log('📝 返回数据:', JSON.stringify(result, null, 2));
      }
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }
}

async function testWithMockAuth() {
  console.log('\n🔑 测试：模拟已登录用户');
  console.log('=====================================');
  console.log('⚠️  注意：这需要真实的会话 cookie');
  console.log('📝 请先在浏览器中登录，然后复制 cookie');
  
  // 这里无法模拟真实的 NextAuth session
  // 需要在浏览器中手动测试
  console.log('🔍 请在浏览器中手动测试已登录状态');
}

async function checkFrontendBehavior() {
  console.log('\n🎭 前端行为检查清单');
  console.log('=====================================');
  console.log('请在浏览器中手动验证以下行为：');
  console.log('');
  console.log('1️⃣  未登录状态：');
  console.log('   ☐ 点击"無料でAI画像生成を開始"按钮');
  console.log('   ☐ 应该弹出登录对话框');
  console.log('   ☐ 显示错误提示"画像生成にはログインが必要です"');
  console.log('');
  console.log('2️⃣  登录对话框内容：');
  console.log('   ☐ 标题："ログインが必要です"');
  console.log('   ☐ 说明文字提到需要登录才能使用');
  console.log('   ☐ 显示初回特典（100积分）');
  console.log('   ☐ Google 登录按钮');
  console.log('   ☐ GitHub 登录按钮');
  console.log('   ☐ 邮箱登录链接');
  console.log('');
  console.log('3️⃣  已登录状态：');
  console.log('   ☐ 顶部 Badge 显示用户名');
  console.log('   ☐ 显示剩余积分');
  console.log('   ☐ 点击生成按钮正常工作');
  console.log('   ☐ 不再弹出登录对话框');
}

// 运行测试
async function runTests() {
  console.log('🚀 开始认证要求测试');
  console.log('=====================================\n');
  
  await testWithoutAuth();
  await testWithMockAuth();
  checkFrontendBehavior();
  
  console.log('\n=====================================');
  console.log('✅ 测试完成！');
  console.log('📝 请查看上述检查清单并在浏览器中验证');
}

runTests().catch(console.error);