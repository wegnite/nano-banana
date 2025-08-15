/**
 * SiliconFlow 视频生成 API 路由
 * 
 * 功能：使用硅基流动的视频生成服务
 * 支持：CogVideoX-5B、LTX-Video 等模型
 * 文档：https://docs.siliconflow.cn/cn/api-reference/videos/videos_submit
 */

import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";

// 积分系统相关导入
import { auth } from "@/auth";
import { getUserCredits, decreaseCredits, CreditsTransType } from "@/services/credit";
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
 * SiliconFlow 支持的视频生成模型
 */
const SILICONFLOW_VIDEO_MODELS = {
  "Wan-AI/Wan2.2-T2V-A14B": {
    name: "Wan2.2-T2V",
    description: "文本到视频生成",
    maxPromptLength: 500,
    duration: 5,
    fps: 25,
    resolution: "1280x720",
  },
  // 备用模型，如果主模型不可用
  "Pro/CogVideoX-5B-OpenSource": {
    name: "CogVideoX-5B",
    description: "高质量视频生成",
    maxPromptLength: 500,
    duration: 6,
    fps: 8,
    resolution: "720x480",
  },
};

/**
 * 轮询检查视频生成状态
 */
async function checkVideoStatus(requestId: string, apiKey: string, maxAttempts = 60): Promise<any> {
  const statusUrl = `https://api.siliconflow.cn/v1/video/results/${requestId}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        console.error("Status check failed:", await response.text());
        return null;
      }

      const data = await response.json();
      console.log(`Video status (attempt ${i + 1}):`, data.status);

      // 检查状态
      if (data.status === "succeeded") {
        return data; // 返回成功的结果
      } else if (data.status === "failed" || data.status === "cancelled") {
        console.error("Video generation failed:", data);
        return null;
      }

      // 等待后继续轮询
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒间隔
    } catch (err) {
      console.error("Status check error:", err);
    }
  }
  
  return null; // 超时
}

export async function POST(req: Request) {
  try {
    const { prompt, provider, model, seed, num_inference_steps = 50 } = await req.json();
    
    if (!prompt || provider !== "siliconflow" || !model) {
      return respErr("Invalid parameters");
    }

    // 获取当前用户会话
    const session = await auth();
    
    // Demo 模式检查 - 允许未登录用户看到演示效果
    const isDemoMode = !session?.user?.email;

    if (isDemoMode) {
      // Demo 模式：返回模拟响应，让用户了解功能
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return respData({
        status: "demo",
        video_url: null,
        preview_url: `/api/placeholder/720/480`,
        provider: "siliconflow",
        model: model,
        filename: `demo_video_${Date.now()}.mp4`,
        prompt: prompt,
        demo: true,
        message: "Video generation demo - Please login to generate real videos",
        estimated_time: 30,
        credits_required: 20,
      });
    }

    // 检查用户积分
    let userUuid = null;
    let userCredits = null;
    
    if (session?.user?.email) {
      userUuid = await getUserUuid();
      if (!userUuid) {
        return respErr("User not found");
      }
      
      userCredits = await getUserCredits(userUuid);
      const requiredCredits = 20; // 视频生成消耗 20 积分
      
      if (userCredits.left_credits < requiredCredits) {
        return respErr(`Insufficient credits. You have ${userCredits.left_credits} credits, but need ${requiredCredits}. Please recharge.`);
      }
    } else {
      return respErr("Please login to generate videos");
    }

    // 获取模型配置
    const modelConfig = SILICONFLOW_VIDEO_MODELS[model as keyof typeof SILICONFLOW_VIDEO_MODELS];
    if (!modelConfig) {
      return respErr(`Unsupported model: ${model}`);
    }

    // 构建 SiliconFlow 视频生成请求
    const apiUrl = "https://api.siliconflow.cn/v1/video/submit";
    
    const requestBody: any = {
      model: model,
      prompt: prompt,
      image_size: modelConfig.resolution || "1280x720", // 添加图像尺寸参数
    };

    // 添加可选参数
    if (num_inference_steps !== undefined) {
      requestBody.num_inference_steps = num_inference_steps;
    }
    if (seed !== undefined) {
      requestBody.seed = seed;
    }

    console.log("SiliconFlow Video Request:", {
      model,
      prompt: prompt.substring(0, 100),
      image_size: requestBody.image_size,
      num_inference_steps: requestBody.num_inference_steps,
    });

    // 提交视频生成任务
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SILICONFLOW_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SiliconFlow API Error:", errorText);
      
      // Try to parse as JSON, but handle if it's not JSON
      try {
        const error = JSON.parse(errorText);
        return respErr(error.message || error.error || "Video generation failed");
      } catch (e) {
        return respErr(`API Error: ${errorText.substring(0, 100)}`);
      }
    }

    const responseText = await response.text();
    let submitData;
    try {
      submitData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse SiliconFlow response:", responseText);
      return respErr("Invalid response from SiliconFlow API");
    }
    console.log("SiliconFlow Submit Response:", submitData);

    // 获取请求 ID
    const requestId = submitData.request_id;
    if (!requestId) {
      return respErr("No request ID returned");
    }

    // 立即返回处理中状态，让前端知道任务已提交
    // 实际应用中，可以将 requestId 存储到数据库，通过另一个端点查询状态
    
    // 这里为了演示，我们等待一段时间后检查状态
    // 注意：在生产环境中，应该使用异步任务队列
    
    // 等待 10 秒后开始检查状态
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 检查视频生成状态
    const result = await checkVideoStatus(requestId, process.env.SILICONFLOW_API_KEY!, 30);
    
    if (result && result.video_url) {
      // 扣除用户积分
      if (userUuid) {
        try {
          await decreaseCredits({
            user_uuid: userUuid,
            trans_type: CreditsTransType.Ping,
            credits: 20,
          });
          console.log(`Deducted 20 credits for video generation`);
        } catch (creditError) {
          console.error("Failed to deduct credits:", creditError);
        }
      }

      // 获取更新后的积分
      const updatedCredits = userUuid ? await getUserCredits(userUuid) : null;

      return respData({
        status: "completed",
        video_url: result.video_url,
        cover_image_url: result.cover_image_url,
        provider: "siliconflow",
        model: model,
        request_id: requestId,
        duration: modelConfig.duration,
        fps: modelConfig.fps,
        resolution: modelConfig.resolution,
        credits_used: 20,
        credits_remaining: updatedCredits?.left_credits,
      });
    } else {
      // 如果还在处理中或失败
      return respData({
        status: "processing",
        request_id: requestId,
        provider: "siliconflow",
        model: model,
        message: "Video is still being generated. Please check back later.",
        estimated_time: 60, // 估计需要 60 秒
        prompt: prompt,
      });
    }

  } catch (err: any) {
    console.error("SiliconFlow video generation failed:", err);
    return respErr(err.message || "Video generation failed");
  }
}

/**
 * GET 端点：查询视频生成状态
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("request_id");
    
    if (!requestId) {
      return respErr("Missing request_id parameter");
    }

    if (!process.env.SILICONFLOW_API_KEY) {
      return respErr("SiliconFlow API key not configured");
    }

    // 查询视频状态
    const statusUrl = `https://api.siliconflow.cn/v1/video/results/${requestId}`;
    
    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.SILICONFLOW_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return respErr(error.message || "Failed to check status");
    }

    const data = await response.json();
    
    return respData({
      status: data.status,
      video_url: data.video_url,
      cover_image_url: data.cover_image_url,
      request_id: requestId,
    });

  } catch (err: any) {
    console.error("Status check failed:", err);
    return respErr(err.message || "Status check failed");
  }
}