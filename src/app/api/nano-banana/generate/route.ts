/**
 * Nano Banana Image Generation API Route
 * 
 * Problem: Need an API endpoint for image generation using nano-banana
 * Solution: Create a Next.js API route that handles authentication and calls nano-banana service
 * 
 * Endpoint: POST /api/nano-banana/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getNanoBananaService } from '@/services/nano-banana';
import { respData, respErr } from '@/lib/resp';
import { getUserCredits, deductCredits } from '@/services/credit';
import type { ImageGenerationRequest } from '@/types/nano-banana';

// 配置 Edge Runtime (注释掉以保持 Node.js 兼容性)
// export const runtime = 'edge';

// Constants for credit calculation
const CREDITS_PER_IMAGE = 10; // Adjust based on your pricing model
const MAX_IMAGES_PER_REQUEST = 4;

/**
 * POST /api/nano-banana/generate
 * Generate images using nano-banana API
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to generate images');
    }

    // 2. Parse and validate request body
    const body: ImageGenerationRequest = await request.json();
    
    if (!body.prompt || body.prompt.trim().length === 0) {
      return respErr('Prompt is required');
    }

    if (body.prompt.length > 1000) {
      return respErr('Prompt is too long (max 1000 characters)');
    }

    const numImages = parseInt(body.num_images || '1');
    if (numImages < 1 || numImages > MAX_IMAGES_PER_REQUEST) {
      return respErr(`Number of images must be between 1 and ${MAX_IMAGES_PER_REQUEST}`);
    }

    // 3. Check user credits
    const requiredCredits = numImages * CREDITS_PER_IMAGE;
    // 从session中获取用户uuid（不是id）
    const userId = (session.user as any).uuid || session.user.id;
    if (!userId) {
      console.error('User ID not found in session:', session.user);
      return respErr('User identification failed - Please sign in again');
    }
    const userCreditsInfo = await getUserCredits(userId);
    
    if (userCreditsInfo.left_credits < requiredCredits) {
      return respErr(
        `Insufficient credits. You need ${requiredCredits} credits but only have ${userCreditsInfo.left_credits}. Please purchase more credits.`
      );
    }

    // 4. Initialize nano-banana service
    const nanoBananaService = getNanoBananaService();

    // 5. Generate images
    console.log(`Generating ${numImages} images for user ${session.user.id}`);
    const startTime = Date.now();
    
    const response = await nanoBananaService.generateImage({
      prompt: body.prompt,
      num_images: body.num_images,
      aspect_ratio: body.aspect_ratio,
      style: body.style,
      quality: body.quality,
      seed: body.seed,
    });

    // 6. Handle generation errors
    if (!response.success) {
      console.error('Nano-banana generation failed:', response.error);
      return respErr(
        response.error || 'Image generation failed. Please try again.'
      );
    }

    // 7. Deduct credits from user account
    const deducted = await deductCredits(
      userId, // 使用之前获取的userId
      requiredCredits,
      'IMAGE_GENERATION',
      `Generated ${numImages} images with nano-banana`
    );

    if (!deducted) {
      console.error('Failed to deduct credits after successful generation');
      // Note: Images were generated but credits weren't deducted
      // You might want to handle this case differently
    }

    // 8. Log generation for analytics
    const processingTime = Date.now() - startTime;
    console.log(`Image generation completed in ${processingTime}ms`);

    // 9. Return successful response
    return respData({
      success: true,
      images: response.data?.images || [],
      credits_used: requiredCredits,
      credits_remaining: userCreditsInfo.left_credits - requiredCredits,
      processing_time: processingTime,
      request_id: response.request_id,
    });

  } catch (error: any) {
    console.error('API route error:', error);
    
    // Handle specific error types
    if (error.code === 'TIMEOUT') {
      return respErr('Request timeout - The image generation took too long. Please try again.');
    }
    
    if (error.status === 429) {
      return respErr('Rate limit exceeded - Please wait a moment before trying again.');
    }
    
    if (error.status === 402) {
      return respErr('Payment required - Your nano-banana credits may be exhausted.');
    }
    
    return respErr('An unexpected error occurred. Please try again later.');
  }
}

/**
 * GET /api/nano-banana/generate
 * Get generation status or configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized');
    }

    // Get user's remaining credits
    const userId = (session.user as any).uuid || session.user.id;
    if (!userId) {
      return respErr('User identification failed');
    }
    const userCreditsInfo = await getUserCredits(userId);
    
    // Get nano-banana service stats
    const service = getNanoBananaService();
    const stats = service.getUsageStats();

    return respData({
      user_credits: userCreditsInfo.left_credits,
      credits_per_image: CREDITS_PER_IMAGE,
      max_images_per_request: MAX_IMAGES_PER_REQUEST,
      service_stats: stats,
      available_styles: [
        'realistic',
        'anime',
        'cartoon',
        'watercolor',
        'oil_painting',
        'sketch',
        'pixel_art',
      ],
      available_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    });

  } catch (error) {
    console.error('GET request error:', error);
    return respErr('Failed to retrieve generation configuration');
  }
}