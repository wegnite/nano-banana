#!/usr/bin/env node

// Test OpenRouter API integration
async function testOpenRouter() {
  console.log("🚀 Testing OpenRouter API Integration...\n");
  
  const request = {
    prompt: "Explain what Next.js is in 2 short sentences",
    provider: "openrouter",
    model: "meta-llama/llama-3.3-70b-instruct"
  };
  
  console.log("Request:", JSON.stringify(request, null, 2));
  console.log("\nSending request to OpenRouter...\n");
  
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
      console.log("✅ Success! OpenRouter API Response:\n");
      console.log("=" .repeat(60));
      console.log(data.data?.text || "No text in response");
      console.log("=" .repeat(60));
      
      if (data.data?.reasoning) {
        console.log("\nReasoning:", data.data.reasoning);
      }
      
      // Check if it's a real response
      if (data.data?.text?.includes("demo response")) {
        console.log("\n⚠️ WARNING: Still getting demo response!");
      } else {
        console.log("\n🎉 OpenRouter API is working perfectly!");
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
  testOpenRouter();
}, 2000);