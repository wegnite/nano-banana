/**
 * Character Figure Video Generation API
 * 
 * 工作流：
 * 1. 接收用户输入（文字或图片）
 * 2. 调用nano-banana生成首尾帧
 * 3. 调用可灵API进行视频补间
 * 4. 返回生成的视频URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { VideoGenerationService, type VideoGenerationRequest, type VideoStyle } from '@/services/video-generation';
import { checkUserCredits, deductUserCredits } from '@/services/credit';

// 视频生成消耗的积分
const VIDEO_GENERATION_COST = 5;

export async function POST(req: NextRequest) {
  try {
    // 认证检查
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 检查用户积分
    const hasCredits = await checkUserCredits(session.user.id, VIDEO_GENERATION_COST);
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: VIDEO_GENERATION_COST },
        { status: 402 }
      );
    }

    // 解析请求
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const image = formData.get('image') as File | null;
    const videoStyle = (formData.get('videoStyle') as VideoStyle) || 'smooth';
    const duration = parseInt(formData.get('duration') as string) || 5;
    const cameraMovement = formData.get('cameraMovement') as string || 'static';

    // 构建视频生成请求
    const videoRequest: VideoGenerationRequest = {
      prompt: prompt || '', // 确保 prompt 不为 undefined
      style: videoStyle,
      duration: duration.toString() as '3' | '5' | '10',
      aspectRatio: '16:9',
      quality: 'hd',
      cameraMovement: cameraMovement as any, // 暂时使用 any 类型以解决类型不匹配
      // 根据模式设置首尾帧提示词
      firstFramePrompt: prompt || undefined,
      lastFramePrompt: prompt || undefined,
    };

    // 如果有上传的图片，将其转换为 prompt
    // 注意：VideoGenerationRequest 类型不支持直接的 imageUrl
    // 可以将图片作为参考来增强 prompt
    if (image) {
      // 图片处理逻辑
      // 可以使用图片识别或其他方式处理
      // 暂时只使用 prompt
      console.log('Image upload received, using prompt-based generation');
    }

    // 初始化视频生成服务
    const videoService = new VideoGenerationService();
    
    // 生成视频
    const result = await videoService.generateVideo(videoRequest, session.user.id);

    // 扣除积分
    await deductUserCredits(session.user.id, VIDEO_GENERATION_COST, 'video_generation');

    // 返回成功响应
    return NextResponse.json({
      success: true,
      videoId: result.videoId, // 使用 videoId 而不是 taskId
      videoUrl: result.videoUrl,
      firstFrameUrl: result.firstFrameUrl,
      lastFrameUrl: result.lastFrameUrl,
      duration: result.duration,
      status: result.status,
      progress: result.progress,
      credits: {
        used: VIDEO_GENERATION_COST,
        remaining: await getUserRemainingCredits(session.user.id),
      },
    });

  } catch (error) {
    console.error('Video generation error:', error);
    
    // 错误处理
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate video. Please try again.' },
      { status: 500 }
    );
  }
}

// 获取用户剩余积分
async function getUserRemainingCredits(userId: string): Promise<number> {
  // 这里应该从数据库获取实际的积分
  // 暂时返回模拟值
  return 100;
}

// GET endpoint for checking video generation status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID required' },
        { status: 400 }
      );
    }

    // 这里应该查询实际的任务状态
    // 暂时返回模拟状态
    const mockStatus = {
      taskId,
      status: 'completed',
      progress: 100,
      videoUrl: 'https://example.com/video.mp4',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(mockStatus);

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}