/**
 * AI 文本生成 API 路由
 * 
 * 功能：统一处理多个 AI 提供商的文本生成请求
 * 支持：OpenAI、DeepSeek、OpenRouter、SiliconFlow
 * 
 * 修改历史：
 * - 添加 CORS 支持解决跨域问题
 * - 添加 Demo 模式支持无 API key 情况
 * - 改进错误处理，返回正确的 HTTP 状态码
 */

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

// 积分系统相关导入
import { auth } from "@/auth";
import { getUserCredits, decreaseCredits, CreditsTransType, CreditsAmount } from "@/services/credit";
import { getUserUuid } from "@/services/user";

// 订阅系统相关导入
import { hasActiveSubscription, canUseFeature, recordSubscriptionUsage } from "@/services/subscription";

// Context7 上下文管理
import { context7Service, initializeContext7 } from "@/services/context7";

/**
 * 处理 CORS 预检请求
 * 
 * 问题：浏览器会发送 OPTIONS 请求检查跨域权限
 * 解决：返回允许跨域的响应头
 */
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { prompt, provider, model, useContext = true } = await req.json();
    if (!prompt || !provider || !model) {
      return respErr("invalid params");
    }

    // 获取当前用户会话
    const session = await auth();
    
    // 检查用户是否登录
    if (!session?.user?.email) {
      return respErr("Please login first to use AI generation");
    }

    // 获取用户 UUID
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("User not found");
    }

    // 初始化 Context7 服务（如果尚未初始化）
    try {
      await initializeContext7();
    } catch (error) {
      console.warn("Context7 initialization warning:", error);
      // Context7 初始化失败不应阻止 AI 生成，仅记录警告
    }

    // 检查用户是否有活跃订阅
    const hasSubscription = await hasActiveSubscription(userUuid);
    let shouldDeductCredits = true;
    let userCredits: any = null;
    const requiredCredits = CreditsAmount.PingCost; // 每次调用消耗 1 积分

    if (hasSubscription) {
      // 订阅用户：检查是否可以使用该功能
      const canUse = await canUseFeature(userUuid, "text", model);
      
      if (!canUse.allowed) {
        return respErr(canUse.reason || "Feature not available in your subscription plan");
      }
      
      // 订阅用户不消耗积分
      shouldDeductCredits = false;
      console.log(`Subscription user ${userUuid} using text generation`);
    } else {
      // 非订阅用户：检查积分
      userCredits = await getUserCredits(userUuid);
      
      if (userCredits.left_credits < requiredCredits) {
        return respErr(`Insufficient credits. You have ${userCredits.left_credits} credits, but need ${requiredCredits}. Please recharge or subscribe.`);
      }
    }

    // 调试日志：检查 API key 状态（用于排查配置问题）
    console.log("API Key Check:", {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length,
      hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
      includesDemo: process.env.OPENAI_API_KEY?.includes("demo"),
      firstChars: process.env.OPENAI_API_KEY?.substring(0, 10),
      provider,
      model
    });
    
    const isDemoMode = 
      process.env.OPENAI_API_KEY?.includes("demo") ||
      process.env.DEEPSEEK_API_KEY?.includes("demo") ||
      !process.env.OPENAI_API_KEY;

    console.log("Demo mode check:", {
      isDemoMode,
      openAIIncludes: process.env.OPENAI_API_KEY?.includes("demo"),
      deepseekIncludes: process.env.DEEPSEEK_API_KEY?.includes("demo"),
      noOpenAI: !process.env.OPENAI_API_KEY
    });

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

    // 使用 Context7 增强提示词（如果启用）
    let enhancedPrompt = prompt;
    if (useContext) {
      try {
        enhancedPrompt = await context7Service.enhancePrompt(userUuid, prompt);
        console.log(`Context7: Enhanced prompt for user ${userUuid}`);
      } catch (error) {
        console.warn("Context7: Failed to enhance prompt, using original", error);
        // 增强失败时使用原始提示词
      }
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
      prompt: enhancedPrompt, // 使用增强后的提示词
    });

    if (warnings && warnings.length > 0) {
      console.log("gen text warnings:", provider, warnings);
      return respErr("gen text failed");
    }

    // 存储会话历史到 Context7（如果启用）
    if (useContext) {
      try {
        await context7Service.storeSessionHistory(
          userUuid,
          prompt,
          text,
          {
            model: model,
            provider: provider,
            reasoning: reasoning,
            hasSubscription: hasSubscription,
          }
        );
        console.log(`Context7: Stored session history for user ${userUuid}`);
      } catch (error) {
        console.warn("Context7: Failed to store session history", error);
        // 存储失败不应影响响应
      }
    }

    // 根据用户类型处理计费
    if (hasSubscription) {
      // 订阅用户：记录使用情况
      try {
        await recordSubscriptionUsage(userUuid, "text_generation", model, prompt);
        console.log(`Recorded subscription usage for user ${userUuid}`);
      } catch (error) {
        console.error("Failed to record subscription usage:", error);
      }
      
      return respData({
        text: text,
        reasoning: reasoning,
        subscription_user: true,
        message: "Generated using subscription",
      });
    } else {
      // 积分用户：扣除积分
      try {
        await decreaseCredits({
          user_uuid: userUuid,
          trans_type: CreditsTransType.Ping,
          credits: requiredCredits,
        });
        console.log(`Successfully deducted ${requiredCredits} credits from user ${userUuid}`);
      } catch (creditError) {
        console.error("Failed to deduct credits:", creditError);
        // 即使积分扣除失败，仍返回生成的内容（但应该记录这个问题）
      }

      return respData({
        text: text,
        reasoning: reasoning,
        credits_used: requiredCredits,
        credits_remaining: Math.max(0, userCredits.left_credits - requiredCredits),
      });
    }
  } catch (err: any) {
    console.log("gen text failed:", err);
    
    /**
     * 错误处理改进
     * - 特别处理 OpenAI 配额错误，提供清晰的提示
     * - 返回实际错误信息便于调试
     */
    if (err.message?.includes("quota") || err.cause?.message?.includes("quota")) {
      return respErr("OpenAI API quota exceeded. Please use OpenRouter or another provider, or add credits to your OpenAI account.");
    }
    
    return respErr(err.message || "Text generation failed");
  }
}
