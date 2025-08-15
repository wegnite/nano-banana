/**
 * OpenRouter 多模态功能测试
 * 
 * 测试 OpenRouter 的图像和视频生成 API
 * 使用环境变量中的 OPENROUTER_API_KEY
 */

const API_BASE = 'http://localhost:3005';

// 测试配置
const TEST_CONFIG = {
  text: {
    endpoint: '/api/demo/gen-text',
    provider: 'openrouter',
    models: [
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-thinking-exp-1219',
      'anthropic/claude-3.5-sonnet'
    ],
    prompt: 'Write a haiku about artificial intelligence'
  },
  image: {
    endpoint: '/api/demo/gen-image-openrouter',
    provider: 'openrouter',
    models: [
      'openai/dall-e-3',
      'stability-ai/stable-diffusion-xl-base-1.0',
      'playgroundai/playground-v2.5-1024px'
    ],
    prompt: 'A futuristic city at sunset with flying cars, cyberpunk style, highly detailed'
  },
  video: {
    endpoint: '/api/demo/gen-video-openrouter',
    provider: 'openrouter-video',
    models: [
      'animation/stable-diffusion-animation',
      'replicate/stable-video-diffusion'
    ],
    prompt: 'A ball bouncing on a table, smooth animation'
  }
};

// 颜色输出辅助函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

// 测试函数
async function testAPI(type, config) {
  console.log(`\n${colors.cyan('=')}${colors.cyan('='.repeat(50))}`);
  console.log(`${colors.cyan('Testing')} ${colors.yellow(type.toUpperCase())} ${colors.cyan('Generation')}`);
  console.log(`${colors.cyan('=')}${colors.cyan('='.repeat(50))}\n`);

  for (const model of config.models) {
    console.log(`${colors.blue('→')} Testing model: ${colors.magenta(model)}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}${config.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: config.prompt,
          provider: config.provider,
          model: model,
          size: '1024x1024', // for image generation
          duration: 2, // for video generation
          fps: 7 // for video generation
        }),
      });

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (!response.ok) {
        const error = await response.text();
        console.log(`  ${colors.red('✗')} Failed: ${error.substring(0, 100)}`);
        console.log(`  Time: ${elapsedTime}s\n`);
        continue;
      }

      const result = await response.json();
      
      if (result.code === 0) {
        console.log(`  ${colors.green('✓')} Success!`);
        console.log(`  Time: ${elapsedTime}s`);
        
        // Display result based on type
        if (type === 'text') {
          const text = result.data?.text || '';
          console.log(`  Response: ${colors.cyan(text.substring(0, 150))}...`);
          if (result.data?.reasoning) {
            console.log(`  Reasoning: ${colors.yellow('Available')}`);
          }
          if (result.data?.credits_remaining !== undefined) {
            console.log(`  Credits: ${colors.blue(result.data.credits_remaining)} remaining`);
          }
        } else if (type === 'image') {
          const imageData = result.data;
          if (imageData?.images?.length > 0) {
            const image = imageData.images[0];
            console.log(`  Image URL: ${colors.green(image.url ? 'Generated' : 'Placeholder')}`);
            console.log(`  Model: ${image.model}`);
            if (image.revised_prompt) {
              console.log(`  Enhanced: ${colors.cyan(image.revised_prompt.substring(0, 100))}...`);
            }
          }
          if (imageData?.credits_remaining !== undefined) {
            console.log(`  Credits: ${colors.blue(imageData.credits_remaining)} remaining`);
          }
        } else if (type === 'video') {
          const videoData = result.data;
          console.log(`  Status: ${colors.yellow(videoData.status || 'Unknown')}`);
          if (videoData.message) {
            console.log(`  Message: ${videoData.message}`);
          }
          if (videoData.frame_count) {
            console.log(`  Frames: ${videoData.frame_count} @ ${videoData.fps}fps`);
          }
          if (videoData.credits_remaining !== undefined) {
            console.log(`  Credits: ${colors.blue(videoData.credits_remaining)} remaining`);
          }
        }
      } else {
        console.log(`  ${colors.red('✗')} API Error: ${result.message || 'Unknown error'}`);
        console.log(`  Time: ${elapsedTime}s`);
      }
    } catch (error) {
      console.log(`  ${colors.red('✗')} Network Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// 主测试函数
async function runTests() {
  console.log(`\n${colors.cyan('╔')}${colors.cyan('═'.repeat(52))}${colors.cyan('╗')}`);
  console.log(`${colors.cyan('║')} ${colors.yellow('OpenRouter Multi-Modal API Test Suite').padEnd(50)} ${colors.cyan('║')}`);
  console.log(`${colors.cyan('╚')}${colors.cyan('═'.repeat(52))}${colors.cyan('╝')}\n`);

  console.log(`API Base: ${colors.blue(API_BASE)}`);
  console.log(`Timestamp: ${colors.green(new Date().toISOString())}\n`);

  // Check if server is running
  try {
    const pingResponse = await fetch(`${API_BASE}/api/ping`);
    if (!pingResponse.ok) {
      console.log(`${colors.red('Error:')} Server is not responding at ${API_BASE}`);
      console.log(`${colors.yellow('Hint:')} Make sure to run 'pnpm dev' first\n`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`${colors.red('Error:')} Cannot connect to server at ${API_BASE}`);
    console.log(`${colors.yellow('Hint:')} Make sure to run 'pnpm dev' first\n`);
    process.exit(1);
  }

  // Run tests
  await testAPI('text', TEST_CONFIG.text);
  await testAPI('image', TEST_CONFIG.image);
  await testAPI('video', TEST_CONFIG.video);

  console.log(`\n${colors.cyan('╔')}${colors.cyan('═'.repeat(52))}${colors.cyan('╗')}`);
  console.log(`${colors.cyan('║')} ${colors.green('All tests completed!').padEnd(50)} ${colors.cyan('║')}`);
  console.log(`${colors.cyan('╚')}${colors.cyan('═'.repeat(52))}${colors.cyan('╝')}\n`);

  console.log(`${colors.yellow('Note:')} If you see placeholder/demo responses, make sure:`);
  console.log(`  1. OPENROUTER_API_KEY is set in .env.local`);
  console.log(`  2. You are logged in (for non-demo mode)`);
  console.log(`  3. Your account has sufficient credits\n`);
}

// 运行测试
runTests().catch(console.error);