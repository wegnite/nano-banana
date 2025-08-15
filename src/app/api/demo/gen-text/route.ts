import {
  LanguageModelV1,
  extractReasoningMiddleware,
  generateText,
  wrapLanguageModel,
} from "ai";
import { respData, respErr } from "@/lib/resp";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { deepseek } from "@ai-sdk/deepseek";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const { prompt, provider, model } = await req.json();
    if (!prompt || !provider || !model) {
      return respErr("invalid params");
    }

    // Demo mode: Check if we're using demo API keys
    const isDemoMode = 
      process.env.OPENAI_API_KEY?.includes("demo") ||
      process.env.DEEPSEEK_API_KEY?.includes("demo") ||
      !process.env.OPENAI_API_KEY;

    // In demo mode, return mock responses
    if (isDemoMode) {
      const demoResponses = {
        openai: {
          text: `This is a demo response from ${model}.\n\nIn a production environment with real API keys, this would generate actual AI content based on your prompt: "${prompt}"\n\nThe AI Universal Generator platform supports:\n• Text generation with GPT-4, Claude, and other models\n• Image creation with DALL-E, Midjourney, and FLUX\n• Video generation with cutting-edge AI models\n\nTo see real AI generation, please configure your API keys in the environment variables.`,
          reasoning: null
        },
        deepseek: {
          text: `[DeepSeek ${model} Demo Response]\n\nYour prompt: "${prompt}"\n\nThis is a demonstration of the DeepSeek integration. With actual API credentials, you would receive intelligent responses powered by DeepSeek's advanced language models, including reasoning capabilities for complex problem-solving.`,
          reasoning: "In production mode, DeepSeek R1 would provide detailed reasoning steps here, showing the thought process behind the generated response."
        },
        openrouter: {
          text: `[OpenRouter ${model} Demo]\n\nProcessing prompt: "${prompt}"\n\nOpenRouter provides access to multiple AI models through a unified API. This demo shows how the platform would integrate with various providers to generate high-quality content tailored to your needs.`,
          reasoning: model.includes("r1") ? "DeepSeek R1 via OpenRouter would display reasoning here." : null
        },
        siliconflow: {
          text: `[SiliconFlow ${model} Demo]\n\nInput: "${prompt}"\n\nSiliconFlow enables fast and efficient AI model inference. In production, this would generate sophisticated responses using state-of-the-art language models with optimized performance.`,
          reasoning: model.includes("R1") ? "Advanced reasoning capabilities would be shown here for R1 models." : null
        }
      };

      const response = demoResponses[provider as keyof typeof demoResponses] || demoResponses.openai;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return respData({
        text: response.text,
        reasoning: response.reasoning,
      });
    }

    let textModel: LanguageModelV1;

    switch (provider) {
      case "openai":
        textModel = openai(model);
        break;
      case "deepseek":
        textModel = deepseek(model);
        break;
      case "openrouter":
        const openrouter = createOpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY,
        });
        textModel = openrouter(model);

        if (model === "deepseek/deepseek-r1") {
          const enhancedModel = wrapLanguageModel({
            model: textModel,
            middleware: extractReasoningMiddleware({
              tagName: "think",
            }),
          });
          textModel = enhancedModel;
        }
        break;
      case "siliconflow":
        const siliconflow = createOpenAICompatible({
          name: "siliconflow",
          apiKey: process.env.SILICONFLOW_API_KEY,
          baseURL: process.env.SILICONFLOW_BASE_URL,
        });
        textModel = siliconflow(model);

        if (model === "deepseek-ai/DeepSeek-R1") {
          const enhancedModel = wrapLanguageModel({
            model: textModel,
            middleware: extractReasoningMiddleware({
              tagName: "reasoning_content",
            }),
          });
          textModel = enhancedModel;
        }

        break;
      default:
        return respErr("invalid provider");
    }

    const { reasoning, text, warnings } = await generateText({
      model: textModel,
      prompt: prompt,
    });

    if (warnings && warnings.length > 0) {
      console.log("gen text warnings:", provider, warnings);
      return respErr("gen text failed");
    }

    return respData({
      text: text,
      reasoning: reasoning,
    });
  } catch (err) {
    console.log("gen text failed:", err);
    return respErr("gen text failed");
  }
}
