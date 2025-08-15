#!/usr/bin/env node

/**
 * SiliconFlow API Integration Test
 * 
 * Tests the new SiliconFlow image and video generation endpoints
 */

const API_BASE = 'http://localhost:3005';

// Test image generation
async function testImageGeneration() {
  console.log('🎨 Testing SiliconFlow Image Generation...\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/demo/gen-image-siliconflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A beautiful sunset over mountains with vibrant colors',
        provider: 'siliconflow',
        model: 'black-forest-labs/FLUX.1-schnell',
        size: '1024x1024',
        n: 1,
      }),
    });

    const data = await response.json();
    
    if (data.code === 0 && data.data) {
      console.log('✅ Image generation successful!');
      console.log('Response:', JSON.stringify(data.data, null, 2));
      
      if (data.data.images && data.data.images[0]) {
        console.log('\n📸 Generated Image URL:', data.data.images[0].url);
        console.log('📁 Filename:', data.data.images[0].filename);
        console.log('🔧 Provider:', data.data.images[0].provider);
        console.log('🤖 Model:', data.data.images[0].model);
      }
      
      if (data.data.credits_used !== undefined) {
        console.log('\n💳 Credits Used:', data.data.credits_used);
        console.log('💰 Credits Remaining:', data.data.credits_remaining || 'N/A');
      }
    } else {
      console.error('❌ Image generation failed:', data.error || data.message);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Test video generation
async function testVideoGeneration() {
  console.log('\n\n🎬 Testing SiliconFlow Video Generation...\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/demo/gen-video-siliconflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A spaceship flying through colorful nebula in space',
        provider: 'siliconflow',
        model: 'Pro/CogVideoX-5B-OpenSource',
        num_inference_steps: 30,
      }),
    });

    const data = await response.json();
    
    if (data.code === 0 && data.data) {
      console.log('✅ Video generation request submitted!');
      console.log('Response:', JSON.stringify(data.data, null, 2));
      
      if (data.data.status === 'processing') {
        console.log('\n⏳ Video Status:', data.data.status);
        console.log('📝 Request ID:', data.data.request_id);
        console.log('⏱️  Estimated Time:', data.data.estimated_time, 'seconds');
        console.log('💬 Message:', data.data.message);
        
        if (data.data.request_id) {
          console.log('\n💡 To check status later, use:');
          console.log(`   GET ${API_BASE}/api/demo/gen-video-siliconflow?request_id=${data.data.request_id}`);
        }
      } else if (data.data.status === 'completed') {
        console.log('\n🎥 Video generation completed!');
        console.log('📹 Video URL:', data.data.video_url);
        console.log('🖼️  Cover Image:', data.data.cover_image_url);
      }
      
      if (data.data.credits_used !== undefined) {
        console.log('\n💳 Credits Used:', data.data.credits_used);
        console.log('💰 Credits Remaining:', data.data.credits_remaining || 'N/A');
      }
    } else {
      console.error('❌ Video generation failed:', data.error || data.message);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('===============================================');
  console.log('  SiliconFlow API Integration Test');
  console.log('===============================================\n');
  console.log('🔧 Testing against:', API_BASE);
  console.log('📅 Date:', new Date().toISOString());
  console.log('\n');
  
  // Test image generation
  await testImageGeneration();
  
  // Wait a bit before testing video
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test video generation
  await testVideoGeneration();
  
  console.log('\n===============================================');
  console.log('  Test Complete');
  console.log('===============================================\n');
}

// Run tests
runTests().catch(console.error);