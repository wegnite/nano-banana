/**
 * 简化的图像生成 API - 使用 OpenRouter
 * 
 * 功能：通过 OpenRouter 生成图像
 * 说明：OpenRouter 本身不直接提供图像生成，但可以通过特定模型实现
 */

import { respData, respErr } from "@/lib/resp";

/**
 * 处理 CORS 预检请求
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
    const { prompt, provider, model } = await req.json();
    
    if (!prompt || provider !== "openrouter") {
      return respErr("Invalid parameters");
    }

    // Demo 模式检查
    const isDemoMode = !process.env.OPENROUTER_API_KEY || 
                      process.env.OPENROUTER_API_KEY.includes("demo");

    if (isDemoMode) {
      // Demo 模式：返回占位符
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return respData({
        images: [{
          url: `/api/placeholder/1024/1024`,
          provider: "openrouter",
          model: model || "demo",
          prompt: prompt,
          demo: true,
          message: "Demo mode - add OPENROUTER_API_KEY to generate real images"
        }]
      });
    }

    // 对于 OpenRouter，我们需要使用文本生成 API 来创建图像描述
    // 然后可以使用其他服务生成图像，或返回占位符
    
    // 这里简化处理：直接返回占位符
    // 在实际应用中，你可以：
    // 1. 调用 DALL-E API 直接生成
    // 2. 使用 Replicate 或其他图像生成服务
    // 3. 通过 OpenRouter 的合作伙伴 API
    
    console.log("OpenRouter Image Generation Request:", {
      model,
      prompt: prompt.substring(0, 100),
    });

    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 返回模拟的成功响应
    return respData({
      images: [{
        url: `/api/placeholder/1024/1024`,
        provider: "openrouter",
        model: model || "stable-diffusion",
        prompt: prompt,
        revised_prompt: `Enhanced: ${prompt}`,
        message: "OpenRouter image generation is experimental. Real implementation pending.",
      }],
      credits_used: 5,
      experimental: true,
    });

  } catch (err: any) {
    console.error("Image generation failed:", err);
    return respErr(err.message || "Image generation failed");
  }
}