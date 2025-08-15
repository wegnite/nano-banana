#!/usr/bin/env node

// Test real OpenAI API integration
async function testRealAPI() {
  console.log("🎯 Testing Real OpenAI API Integration...\n");
  
  const request = {
    prompt: "Write a haiku about JavaScript programming",
    provider: "openai",
    model: "gpt-4o-mini"
  };
  
  console.log("Request:", JSON.stringify(request, null, 2));
  
  try {
    const response = await fetch("http://localhost:3001/api/demo/gen-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("\n✅ Success! Real API Response:\n");
      console.log("=" .repeat(60));
      console.log(data.data?.text || "No text in response");
      console.log("=" .repeat(60));
      
      // Check if it's a real response (should be different each time)
      if (data.data?.text?.includes("demo response")) {
        console.log("\n⚠️ WARNING: Still getting demo response!");
      } else {
        console.log("\n🎉 Real OpenAI API is working!");
      }
    } else {
      console.log("\n❌ Error:", data.error || data.message || "Unknown error");
    }
  } catch (error) {
    console.log("\n❌ Request failed:", error.message);
  }
}

// Wait for server to be ready
setTimeout(() => {
  testRealAPI();
}, 3000);