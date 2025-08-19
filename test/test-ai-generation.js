#!/usr/bin/env node

/**
 * AI 图像生成功能测试脚本
 * 测试 SiliconFlow API 的完整流程
 */

const API_URL = 'http://localhost:3005/api/demo/gen-image-siliconflow';

// 测试用例
const testCases = [
  {
    name: '动漫风格测试',
    data: {
      prompt: '美丽的樱花树下的少女',
      provider: 'siliconflow',
      model: 'black-forest-labs/FLUX.1-schnell',
      size: '1024x1024',
      n: 1,
      image_format: 'jpeg'
    }
  },
  {
    name: '写实风格测试',
    data: {
      prompt: 'A beautiful sunset over Mount Fuji',
      provider: 'siliconflow',
      model: 'stabilityai/stable-diffusion-3-5-large',
      size: '1024x1024',
      n: 1,
      image_format: 'jpeg'
    }
  }
];

async function testImageGeneration(testCase) {
  console.log(`\n🧪 运行测试: ${testCase.name}`);
  console.log(`📝 提示词: ${testCase.data.prompt}`);
  console.log(`🎨 模型: ${testCase.data.model}`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error(`❌ 测试失败: ${result.message || 'Unknown error'}`);
      return false;
    }
    
    if (result.data?.images?.[0]?.url) {
      console.log(`✅ 测试成功!`);
      console.log(`🖼️  图像URL: ${result.data.images[0].url}`);
      console.log(`📊 模型: ${result.data.images[0].model}`);
      console.log(`💬 消息: ${result.data.message || 'Success'}`);
      return true;
    } else {
      console.error(`❌ 测试失败: 没有返回图像URL`);
      console.log('返回数据:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`❌ 测试错误: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 开始 AI 图像生成测试');
  console.log('================================');
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    const success = await testImageGeneration(testCase);
    if (success) successCount++;
    
    // 等待一下避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n================================');
  console.log(`📊 测试结果: ${successCount}/${testCases.length} 成功`);
  
  if (successCount === testCases.length) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查配置');
  }
}

// 运行测试
runAllTests().catch(console.error);