/**
 * OpenRouter 图像生成 API 路由
 * 
 * 功能：使用 OpenRouter 提供的图像生成模型
 * 支持：DALL-E 3, Stable Diffusion XL, Playground V2.5 等
 * 
 * 问题：需要统一的图像生成接口
 * 解决：通过 OpenRouter API 访问多种图像模型
 */

import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";
import { newStorage } from "@/lib/storage";

// 积分系统相关导入
import { auth } from "@/auth";
import { getUserCredits, decreaseCredits, CreditsTransType, CreditsAmount } from "@/services/credit";
import { getUserUuid } from "@/services/user";

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

/**
 * OpenRouter 图像生成模型配置
 * 注意：OpenRouter 主要通过文本模型间接支持图像生成
 */
const OPENROUTER_IMAGE_MODELS = {
  // 通过 OpenRouter 调用的图像生成模型
  "openai/gpt-4-vision-preview": {
    name: "GPT-4 Vision (for image understanding)",
    type: "vision",
    maxPromptLength: 4000,
  },
  // 使用 DALL-E 3 通过 OpenAI 直接调用
  "dall-e-3": {
    name: "DALL-E 3 via OpenRouter",
    type: "image-gen",
    maxPromptLength: 4000,
    supportedSizes: ["1024x1024", "1024x1792", "1792x1024"],
    defaultSize: "1024x1024",
  },
  // Stable Diffusion 通过特殊端点
  "stable-diffusion-xl": {
    name: "Stable Diffusion XL",
    type: "image-gen",
    maxPromptLength: 1000,
    supportedSizes: ["1024x1024", "1344x768", "768x1344"],
    defaultSize: "1024x1024",
  },
};

export async function POST(req: Request) {
  try {
    const { prompt, provider, model, size, quality, style, n = 1 } = await req.json();
    
    if (!prompt || provider !== "openrouter" || !model) {
      return respErr("Invalid parameters");
    }

    // 获取当前用户会话
    const session = await auth();
    
    // Demo 模式检查（如果未登录或使用 demo key）
    const isDemoMode = !session?.user?.email || 
                      !process.env.OPENROUTER_API_KEY || 
                      process.env.OPENROUTER_API_KEY.includes("demo");

    if (isDemoMode) {
      // Demo 模式：返回模拟响应
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return respData([{
        url: `/api/placeholder/1024/1024`,
        provider: "openrouter",
        model: model,
        filename: `demo_openrouter_${Date.now()}.png`,
        prompt: prompt,
        demo: true,
      }]);
    }

    // 检查用户积分
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("User not found");
    }

    const userCredits = await getUserCredits(userUuid);
    const requiredCredits = 5; // 图像生成消耗 5 积分
    
    if (userCredits.left_credits < requiredCredits * n) {
      return respErr(`Insufficient credits. You have ${userCredits.left_credits} credits, but need ${requiredCredits * n}. Please recharge.`);
    }

    // 获取模型配置
    const modelConfig = OPENROUTER_IMAGE_MODELS[model as keyof typeof OPENROUTER_IMAGE_MODELS];
    if (!modelConfig) {
      return respErr(`Unsupported model: ${model}`);
    }

    // 构建 OpenRouter API 请求
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    
    // 为图像生成构建特殊的提示词格式
    let messages = [];
    
    if (model === "openai/dall-e-3") {
      // DALL-E 3 通过 OpenRouter 的特殊格式
      messages = [{
        role: "user",
        content: `Generate an image: ${prompt}`
      }];
    } else {
      // 其他模型可能需要不同的格式
      messages = [{
        role: "user", 
        content: prompt
      }];
    }

    const requestBody = {
      model: model,
      messages: messages,
      // 图像生成特定参数
      n: n,
      size: size || modelConfig.defaultSize,
      quality: quality || "standard",
      style: style || "vivid",
      // OpenRouter 特定参数
      route: "fallback",
      transforms: ["image_generation"],
    };

    console.log("OpenRouter Image Request:", {
      model,
      size: requestBody.size,
      quality: requestBody.quality,
      style: requestBody.style,
    });

    // 调用 OpenRouter API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000",
        "X-Title": "AI Universal Generator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenRouter API Error:", error);
      return respErr(error.error?.message || "Image generation failed");
    }

    const data = await response.json();
    console.log("OpenRouter Response:", data);

    // 处理返回的图像数据
    const images = [];
    
    // OpenRouter 可能返回不同格式的响应
    if (data.choices && data.choices.length > 0) {
      for (const choice of data.choices) {
        // 检查是否有图像 URL
        if (choice.message?.image_url) {
          images.push({
            url: choice.message.image_url,
            revised_prompt: choice.message.content,
          });
        } else if (choice.message?.content?.includes("http")) {
          // 尝试从内容中提取 URL
          const urlMatch = choice.message.content.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            images.push({
              url: urlMatch[0],
              revised_prompt: prompt,
            });
          }
        }
      }
    }

    // 如果有 data URI 格式的图像，也处理它们
    if (data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        if (item.url) {
          images.push({
            url: item.url,
            revised_prompt: item.revised_prompt || prompt,
          });
        } else if (item.b64_json) {
          // Base64 编码的图像
          images.push({
            base64: item.b64_json,
            revised_prompt: item.revised_prompt || prompt,
          });
        }
      }
    }

    if (images.length === 0) {
      console.error("No images in response:", data);
      return respErr("No images generated");
    }

    // 处理和存储图像
    const storage = newStorage();
    const batch = getUuid();
    const processedImages = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = `openrouter_${model.replace(/\//g, "_")}_${batch}_${i}.png`;
      const key = `shipany/${filename}`;

      try {
        let imageUrl = image.url;
        
        // 如果是 base64 数据，上传到存储
        if (image.base64) {
          const body = Buffer.from(image.base64, "base64");
          const uploadResult = await storage.uploadFile({
            body,
            key,
            contentType: "image/png",
            disposition: "inline",
          });
          imageUrl = uploadResult.url;
        } else if (image.url && image.url.startsWith("data:")) {
          // 处理 data URI
          const base64Data = image.url.split(",")[1];
          const body = Buffer.from(base64Data, "base64");
          const uploadResult = await storage.uploadFile({
            body,
            key,
            contentType: "image/png",
            disposition: "inline",
          });
          imageUrl = uploadResult.url;
        }

        processedImages.push({
          url: imageUrl,
          provider: "openrouter",
          model: model,
          filename: filename,
          revised_prompt: image.revised_prompt,
        });
      } catch (err) {
        console.error("Failed to process image:", err);
        // 即使上传失败，仍返回原始 URL（如果有）
        processedImages.push({
          url: image.url || `/api/placeholder/1024/1024`,
          provider: "openrouter",
          model: model,
          filename: filename,
          revised_prompt: image.revised_prompt,
          error: "Upload failed",
        });
      }
    }

    // 扣除用户积分
    try {
      await decreaseCredits({
        user_uuid: userUuid,
        trans_type: CreditsTransType.Ping, // 使用 Ping 类型计费
        credits: requiredCredits * images.length,
      });
      console.log(`Deducted ${requiredCredits * images.length} credits for image generation`);
    } catch (creditError) {
      console.error("Failed to deduct credits:", creditError);
    }

    // 获取剩余积分
    const updatedCredits = await getUserCredits(userUuid);

    return respData({
      images: processedImages,
      credits_used: requiredCredits * images.length,
      credits_remaining: updatedCredits.left_credits,
    });

  } catch (err: any) {
    console.error("OpenRouter image generation failed:", err);
    
    if (err.message?.includes("quota")) {
      return respErr("API quota exceeded. Please try again later.");
    }
    
    return respErr(err.message || "Image generation failed");
  }
}