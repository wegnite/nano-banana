/**
 * SiliconFlow 图像生成 API 路由
 * 
 * 功能：使用硅基流动的图像生成服务
 * 支持：FLUX.1、Stable Diffusion 3 等模型
 * 文档：https://docs.siliconflow.cn/cn/api-reference/images/images-generations
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
 * SiliconFlow 支持的图像生成模型
 */
const SILICONFLOW_IMAGE_MODELS = {
  "black-forest-labs/FLUX.1-schnell": {
    name: "FLUX.1 Schnell",
    description: "快速生成，适合快速原型",
    maxPromptLength: 1000,
    supportedSizes: ["1024x1024", "512x1024", "768x512", "768x1024", "1024x576", "576x1024"],
    defaultSize: "1024x1024",
  },
  "stabilityai/stable-diffusion-3-5-large": {
    name: "Stable Diffusion 3.5 Large",
    description: "高质量图像生成",
    maxPromptLength: 1000,
    supportedSizes: ["1024x1024", "512x1024", "768x512", "768x1024", "1024x576", "576x1024"],
    defaultSize: "1024x1024",
  },
  "stabilityai/stable-diffusion-3-5-large-turbo": {
    name: "SD 3.5 Large Turbo",
    description: "更快的生成速度",
    maxPromptLength: 1000,
    supportedSizes: ["1024x1024", "512x1024", "768x512", "768x1024", "1024x576", "576x1024"],
    defaultSize: "1024x1024",
  },
  "stabilityai/stable-diffusion-3-medium": {
    name: "Stable Diffusion 3 Medium",
    description: "平衡质量和速度",
    maxPromptLength: 1000,
    supportedSizes: ["1024x1024", "512x1024", "768x512", "768x1024", "1024x576", "576x1024"],
    defaultSize: "1024x1024",
  },
};

export async function POST(req: Request) {
  try {
    const { prompt, provider, model, size, n = 1, image_format = "jpeg" } = await req.json();
    
    if (!prompt || provider !== "siliconflow" || !model) {
      return respErr("Invalid parameters");
    }

    // 获取当前用户会话
    const session = await auth();
    
    // Demo 模式检查
    const isDemoMode = !session?.user?.email || 
                      !process.env.SILICONFLOW_API_KEY || 
                      process.env.SILICONFLOW_API_KEY.includes("demo");

    if (isDemoMode && !process.env.SILICONFLOW_API_KEY?.startsWith("sk-")) {
      // Demo 模式：返回模拟响应
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return respData({
        images: [{
          url: `/api/placeholder/1024/1024`,
          provider: "siliconflow",
          model: model,
          filename: `demo_siliconflow_${Date.now()}.jpg`,
          prompt: prompt,
          demo: true,
        }],
        message: "Demo mode - API key configured but user not logged in",
      });
    }

    // 如果有有效的 API key，检查用户积分
    let userUuid = null;
    let userCredits = null;
    
    if (session?.user?.email) {
      userUuid = await getUserUuid();
      if (userUuid) {
        userCredits = await getUserCredits(userUuid);
        const requiredCredits = 5; // 图像生成消耗 5 积分
        
        if (userCredits.left_credits < requiredCredits * n) {
          return respErr(`Insufficient credits. You have ${userCredits.left_credits} credits, but need ${requiredCredits * n}. Please recharge.`);
        }
      }
    }

    // 获取模型配置
    const modelConfig = SILICONFLOW_IMAGE_MODELS[model as keyof typeof SILICONFLOW_IMAGE_MODELS];
    if (!modelConfig) {
      return respErr(`Unsupported model: ${model}`);
    }

    // 构建 SiliconFlow API 请求
    const apiUrl = "https://api.siliconflow.cn/v1/images/generations";
    
    const requestBody = {
      model: model,
      prompt: prompt,
      n: n,
      size: size || modelConfig.defaultSize,
      response_format: "url", // 返回 URL 而不是 base64
      image_format: image_format,
    };

    console.log("SiliconFlow Image Request:", {
      model,
      size: requestBody.size,
      n: requestBody.n,
    });

    // 调用 SiliconFlow API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SILICONFLOW_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("SiliconFlow API Error:", error);
      return respErr(error.message || "Image generation failed");
    }

    const data = await response.json();
    console.log("SiliconFlow Response:", data);

    // 处理返回的图像数据
    const images = [];
    
    if (data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        if (item.url) {
          images.push({
            url: item.url,
            revised_prompt: item.revised_prompt || prompt,
          });
        } else if (item.b64_json) {
          // 如果返回 base64，需要上传到存储
          const storage = newStorage();
          const batch = getUuid();
          const filename = `siliconflow_${model.replace(/\//g, "_")}_${batch}.jpg`;
          const key = `shipany/${filename}`;
          
          try {
            const body = Buffer.from(item.b64_json, "base64");
            const uploadResult = await storage.uploadFile({
              body,
              key,
              contentType: `image/${image_format}`,
              disposition: "inline",
            });
            
            images.push({
              url: uploadResult.url,
              revised_prompt: item.revised_prompt || prompt,
            });
          } catch (err) {
            console.error("Failed to upload image:", err);
            images.push({
              url: `/api/placeholder/1024/1024`,
              error: "Upload failed",
            });
          }
        }
      }
    }

    if (images.length === 0) {
      console.error("No images in response:", data);
      return respErr("No images generated");
    }

    // 处理生成的图像
    const processedImages = images.map((image, index) => ({
      url: image.url,
      provider: "siliconflow",
      model: model,
      filename: `siliconflow_${Date.now()}_${index}.${image_format}`,
      revised_prompt: image.revised_prompt,
    }));

    // 扣除用户积分（如果用户已登录）
    if (userUuid && userCredits) {
      try {
        await decreaseCredits({
          user_uuid: userUuid,
          trans_type: CreditsTransType.Ping,
          credits: 5 * images.length,
        });
        console.log(`Deducted ${5 * images.length} credits for image generation`);
      } catch (creditError) {
        console.error("Failed to deduct credits:", creditError);
      }
      
      // 获取更新后的积分
      const updatedCredits = await getUserCredits(userUuid);
      
      return respData({
        images: processedImages,
        credits_used: 5 * images.length,
        credits_remaining: updatedCredits.left_credits,
      });
    }

    // 未登录用户，只返回图像
    return respData({
      images: processedImages,
      message: "Generated without login - no credits deducted",
    });

  } catch (err: any) {
    console.error("SiliconFlow image generation failed:", err);
    return respErr(err.message || "Image generation failed");
  }
}