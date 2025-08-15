/**
 * OpenRouter 视频生成 API 路由
 * 
 * 功能：使用 OpenRouter 提供的视频生成模型
 * 支持：目前主要通过图像序列或动画生成
 * 
 * 注意：OpenRouter 目前主要支持文本和图像，视频生成功能有限
 * 可以通过生成图像序列来创建简单动画
 */

import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";

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
 * 视频生成配置
 * 注意：这些是模拟配置，实际 OpenRouter 可能不直接支持视频生成
 */
const VIDEO_GENERATION_CONFIG = {
  "animation/stable-diffusion-animation": {
    name: "SD Animation (Simulated)",
    maxFrames: 30,
    fps: 10,
    maxDuration: 3, // seconds
    description: "Generate animated sequences using Stable Diffusion",
  },
  "replicate/stable-video-diffusion": {
    name: "Stable Video Diffusion",
    maxFrames: 25,
    fps: 7,
    maxDuration: 3.5,
    description: "Text to video generation",
  },
};

export async function POST(req: Request) {
  try {
    const { prompt, provider, model, duration = 2, fps = 7 } = await req.json();
    
    if (!prompt || provider !== "openrouter-video") {
      return respErr("Invalid parameters for video generation");
    }

    // 获取当前用户会话
    const session = await auth();
    
    // Demo 模式检查
    const isDemoMode = !session?.user?.email || 
                      !process.env.OPENROUTER_API_KEY || 
                      process.env.OPENROUTER_API_KEY.includes("demo");

    if (isDemoMode) {
      // Demo 模式：返回模拟响应（优化响应时间）
      await new Promise(resolve => setTimeout(resolve, 1000)); // 减少到 1 秒
      
      return respData({
        status: "processing", // 改为 processing 状态
        video_url: null,
        preview_url: `/api/placeholder/512/512`,
        provider: "openrouter-video",
        model: model || "animation/stable-diffusion-animation",
        filename: `demo_video_${Date.now()}.mp4`,
        prompt: prompt,
        duration: duration,
        fps: fps,
        demo: true,
        message: "Video generation demo - Real implementation coming soon!",
        estimated_time: 10, // 预计时间
      });
    }

    // 检查用户积分
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return respErr("User not found");
    }

    const userCredits = await getUserCredits(userUuid);
    const requiredCredits = 20; // 视频生成消耗 20 积分
    
    if (userCredits.left_credits < requiredCredits) {
      return respErr(`Insufficient credits. You have ${userCredits.left_credits} credits, but need ${requiredCredits}. Please recharge.`);
    }

    /**
     * 实际实现说明：
     * OpenRouter 目前不直接支持视频生成
     * 可以考虑以下替代方案：
     * 1. 生成多张图像帧，然后用 ffmpeg 合成视频
     * 2. 集成专门的视频生成 API（如 Runway, Pika）
     * 3. 使用 Replicate 的视频生成模型
     */

    // 方案1：生成图像序列（简化示例）
    const frameCount = Math.min(fps * duration, 30); // 最多30帧
    const frames = [];

    // 这里应该循环调用图像生成 API 来创建帧
    // 为了演示，我们返回一个模拟响应
    for (let i = 0; i < frameCount; i++) {
      const framePrompt = `${prompt}, frame ${i + 1} of ${frameCount}, smooth animation`;
      frames.push({
        frame: i,
        prompt: framePrompt,
        url: `/api/placeholder/512/512`, // 实际应该生成真实图像
      });
    }

    // 扣除用户积分
    try {
      await decreaseCredits({
        user_uuid: userUuid,
        trans_type: CreditsTransType.Ping, // 使用 Ping 类型计费
        credits: requiredCredits,
      });
      console.log(`Deducted ${requiredCredits} credits for video generation`);
    } catch (creditError) {
      console.error("Failed to deduct credits:", creditError);
    }

    // 获取剩余积分
    const updatedCredits = await getUserCredits(userUuid);

    return respData({
      status: "processing",
      message: "Video generation through frame synthesis is in development",
      frames: frames,
      frame_count: frameCount,
      fps: fps,
      duration: duration,
      provider: "openrouter-video",
      model: model || "animation/stable-diffusion-animation",
      credits_used: requiredCredits,
      credits_remaining: updatedCredits.left_credits,
      next_steps: "Frames would be combined into video using server-side processing",
    });

  } catch (err: any) {
    console.error("Video generation failed:", err);
    return respErr(err.message || "Video generation failed");
  }
}