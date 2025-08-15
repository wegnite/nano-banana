#!/usr/bin/env node

/**
 * Test script for AI generation APIs
 */

const BASE_URL = 'http://localhost:3004';

async function testTextGeneration() {
  console.log('\n🧪 Testing Text Generation API...');
  
  const response = await fetch(`${BASE_URL}/api/demo/gen-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'Write a haiku about artificial intelligence',
      provider: 'openai',
      model: 'gpt-4o'
    })
  });

  const data = await response.json();
  
  if (response.ok && data.data) {
    console.log('✅ Text Generation Success!');
    console.log('Response:', data.data.text?.substring(0, 100) + '...');
  } else {
    console.log('❌ Text Generation Failed:', data.error);
  }
  
  return response.ok;
}

async function testImageGeneration() {
  console.log('\n🧪 Testing Image Generation API...');
  
  const response = await fetch(`${BASE_URL}/api/demo/gen-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'A beautiful sunset over mountains',
      provider: 'dalle',
      model: 'dall-e-3'
    })
  });

  const data = await response.json();
  
  if (response.ok && data.data) {
    console.log('✅ Image Generation Success!');
    console.log('Response:', data.data);
  } else {
    console.log('❌ Image Generation Failed:', data.error);
  }
  
  return response.ok;
}

async function testPlaceholderImage() {
  console.log('\n🧪 Testing Placeholder Image API...');
  
  const response = await fetch(`${BASE_URL}/api/placeholder/512/512`);
  
  if (response.ok) {
    const contentType = response.headers.get('content-type');
    console.log('✅ Placeholder Image Success!');
    console.log('Content-Type:', contentType);
  } else {
    console.log('❌ Placeholder Image Failed');
  }
  
  return response.ok;
}

async function runTests() {
  console.log('🚀 Starting AI Generation Tests...');
  console.log('Server:', BASE_URL);
  
  const results = [];
  
  results.push(await testTextGeneration());
  results.push(await testImageGeneration());
  results.push(await testPlaceholderImage());
  
  console.log('\n📊 Test Results:');
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r).length}`);
  console.log(`Failed: ${results.filter(r => !r).length}`);
  
  if (results.every(r => r)) {
    console.log('\n✨ All tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above.');
  }
}

// Run tests
runTests().catch(console.error);