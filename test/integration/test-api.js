#!/usr/bin/env node

// Test script for AI text generation API
async function testTextGeneration() {
  const testCases = [
    {
      provider: "openai",
      model: "gpt-4o-mini",
      prompt: "Write a haiku about coding"
    },
    {
      provider: "openrouter",
      model: "meta-llama/llama-3.3-70b-instruct",
      prompt: "Explain what is Next.js in 2 sentences"
    }
  ];

  console.log("🧪 Testing AI Text Generation API...\n");

  for (const testCase of testCases) {
    console.log(`Testing ${testCase.provider} - ${testCase.model}...`);
    console.log(`Prompt: "${testCase.prompt}"`);
    
    try {
      const response = await fetch("http://localhost:3001/api/demo/gen-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testCase),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Success!");
        console.log("Response:", data.data?.text || "No text in response");
        if (data.data?.reasoning) {
          console.log("Reasoning:", data.data.reasoning);
        }
      } else {
        console.log("❌ Error:", data.error || "Unknown error");
      }
    } catch (error) {
      console.log("❌ Network error:", error.message);
    }
    
    console.log("\n" + "=".repeat(60) + "\n");
  }
}

// Wait for server to be ready
setTimeout(() => {
  testTextGeneration().then(() => {
    console.log("Test completed!");
    process.exit(0);
  }).catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });
}, 3000);