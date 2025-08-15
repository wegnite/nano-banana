#!/usr/bin/env node

/**
 * Integration tests for AI generation APIs
 * 
 * Usage:
 *   npm run test:integration
 *   or
 *   node test/integration/ai-generation.test.js
 * 
 * Environment Variables:
 *   TEST_BASE_URL - Base URL for testing (default: http://localhost:3004)
 *   TEST_TIMEOUT - Request timeout in ms (default: 30000)
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3004';
const TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '30000', 10);

const TEST_CONFIG = {
  textGeneration: {
    endpoint: '/api/demo/gen-text',
    providers: [
      {
        name: 'OpenAI',
        provider: 'openai',
        model: 'gpt-4o',
        prompt: 'Write a haiku about artificial intelligence'
      },
      {
        name: 'DeepSeek',
        provider: 'deepseek',
        model: 'deepseek-chat',
        prompt: 'Explain quantum computing in one sentence'
      }
    ]
  },
  imageGeneration: {
    endpoint: '/api/demo/gen-image',
    providers: [
      {
        name: 'DALL-E',
        provider: 'dalle',
        model: 'dall-e-3',
        prompt: 'A beautiful sunset over mountains, digital art'
      },
      {
        name: 'FLUX',
        provider: 'flux',
        model: 'schnell',
        prompt: 'Modern minimalist logo design'
      }
    ]
  },
  placeholderImage: {
    endpoint: '/api/placeholder',
    sizes: [
      { width: 256, height: 256 },
      { width: 512, height: 512 },
      { width: 1024, height: 768 }
    ]
  }
};

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${TIMEOUT}ms`);
      }
      throw error;
    }
  }

  async testTextGeneration() {
    console.log('\n📝 Testing Text Generation APIs');
    console.log('─'.repeat(50));

    for (const config of TEST_CONFIG.textGeneration.providers) {
      const testName = `Text Generation - ${config.name}`;
      console.log(`\n🧪 Testing: ${testName}`);
      
      try {
        const response = await this.fetchWithTimeout(
          `${BASE_URL}${TEST_CONFIG.textGeneration.endpoint}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: config.prompt,
              provider: config.provider,
              model: config.model
            })
          }
        );

        const data = await response.json();
        
        if (response.ok && data.data?.text) {
          const preview = data.data.text.substring(0, 100);
          console.log(`  ✅ Success: "${preview}..."`);
          this.results.push({ name: testName, success: true });
        } else {
          console.log(`  ❌ Failed: ${data.error || 'Unknown error'}`);
          this.results.push({ 
            name: testName, 
            success: false, 
            error: data.error 
          });
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        this.results.push({ 
          name: testName, 
          success: false, 
          error: error.message 
        });
      }
    }
  }

  async testImageGeneration() {
    console.log('\n🎨 Testing Image Generation APIs');
    console.log('─'.repeat(50));

    for (const config of TEST_CONFIG.imageGeneration.providers) {
      const testName = `Image Generation - ${config.name}`;
      console.log(`\n🧪 Testing: ${testName}`);
      
      try {
        const response = await this.fetchWithTimeout(
          `${BASE_URL}${TEST_CONFIG.imageGeneration.endpoint}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: config.prompt,
              provider: config.provider,
              model: config.model
            })
          }
        );

        const data = await response.json();
        
        if (response.ok && data.data) {
          console.log(`  ✅ Success: Image generated`);
          if (Array.isArray(data.data) && data.data[0]?.url) {
            console.log(`     URL: ${data.data[0].url.substring(0, 50)}...`);
          }
          this.results.push({ name: testName, success: true });
        } else {
          console.log(`  ❌ Failed: ${data.error || 'Unknown error'}`);
          this.results.push({ 
            name: testName, 
            success: false, 
            error: data.error 
          });
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        this.results.push({ 
          name: testName, 
          success: false, 
          error: error.message 
        });
      }
    }
  }

  async testPlaceholderImages() {
    console.log('\n🖼️  Testing Placeholder Image API');
    console.log('─'.repeat(50));

    for (const size of TEST_CONFIG.placeholderImage.sizes) {
      const testName = `Placeholder ${size.width}x${size.height}`;
      console.log(`\n🧪 Testing: ${testName}`);
      
      try {
        const response = await this.fetchWithTimeout(
          `${BASE_URL}${TEST_CONFIG.placeholderImage.endpoint}/${size.width}/${size.height}`
        );
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          console.log(`  ✅ Success: ${contentType}`);
          this.results.push({ name: testName, success: true });
        } else {
          console.log(`  ❌ Failed: HTTP ${response.status}`);
          this.results.push({ 
            name: testName, 
            success: false, 
            error: `HTTP ${response.status}` 
          });
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        this.results.push({ 
          name: testName, 
          success: false, 
          error: error.message 
        });
      }
    }
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    
    console.log(`\nEnvironment:`);
    console.log(`  Server: ${BASE_URL}`);
    console.log(`  Timeout: ${TIMEOUT}ms`);
    console.log(`  Duration: ${duration}s`);
    
    console.log(`\nResults:`);
    console.log(`  Total:  ${total}`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  • ${r.name}: ${r.error}`);
        });
    }
    
    console.log('\n' + '═'.repeat(60));
    
    if (failed === 0) {
      console.log('✨ All tests passed successfully!');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please review the errors above.`);
      process.exit(1);
    }
  }

  async run() {
    console.log('🚀 Starting AI Generation Integration Tests');
    console.log('═'.repeat(60));
    
    try {
      await this.testTextGeneration();
      await this.testImageGeneration();
      await this.testPlaceholderImages();
    } catch (error) {
      console.error('\n💥 Unexpected error during test execution:', error);
      process.exit(1);
    }
    
    this.printSummary();
  }
}

// Main execution
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;