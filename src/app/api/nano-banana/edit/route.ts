/**
 * Nano Banana Image Editing API Route
 * 
 * Problem: Need an API endpoint for image editing using nano-banana
 * Solution: Create a Next.js API route for image editing operations
 * 
 * Endpoint: POST /api/nano-banana/edit
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getNanoBananaService } from '@/services/nano-banana';
import { respData, respErr } from '@/lib/resp';
import { getUserCredits, deductCredits } from '@/services/credit';
import type { ImageEditingRequest } from '@/types/nano-banana';

// Constants for credit calculation
const CREDITS_PER_EDIT = 15; // Editing typically costs more than generation
const MAX_INPUT_IMAGES = 5;
const MAX_OUTPUT_IMAGES = 4;

/**
 * POST /api/nano-banana/edit
 * Edit images using nano-banana API
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to edit images');
    }

    // 2. Parse and validate request body
    const body: ImageEditingRequest = await request.json();
    
    // Validate prompt
    if (!body.prompt || body.prompt.trim().length === 0) {
      return respErr('Prompt is required for image editing');
    }

    if (body.prompt.length > 1000) {
      return respErr('Prompt is too long (max 1000 characters)');
    }

    // Validate image URLs
    if (!body.image_urls || !Array.isArray(body.image_urls)) {
      return respErr('Image URLs are required for editing');
    }

    if (body.image_urls.length === 0) {
      return respErr('At least one image URL is required');
    }

    if (body.image_urls.length > MAX_INPUT_IMAGES) {
      return respErr(`Maximum ${MAX_INPUT_IMAGES} images can be edited at once`);
    }

    // Validate each URL
    for (const url of body.image_urls) {
      try {
        new URL(url);
      } catch {
        return respErr(`Invalid image URL: ${url}`);
      }

      // Check if URL is accessible (basic check)
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return respErr('All image URLs must use HTTP or HTTPS protocol');
      }
    }

    // Validate number of output images
    const numImages = parseInt(body.num_images || '1');
    if (numImages < 1 || numImages > MAX_OUTPUT_IMAGES) {
      return respErr(`Number of output images must be between 1 and ${MAX_OUTPUT_IMAGES}`);
    }

    // 3. Check user credits
    const requiredCredits = numImages * CREDITS_PER_EDIT;
    const userCreditsInfo = await getUserCredits(session.user.id!);
    
    if (userCreditsInfo.left_credits < requiredCredits) {
      return respErr(
        `Insufficient credits. You need ${requiredCredits} credits but only have ${userCreditsInfo.left_credits}. Please purchase more credits.`
      );
    }

    // 4. Initialize nano-banana service
    const nanoBananaService = getNanoBananaService();

    // 5. Edit images
    console.log(`Editing ${body.image_urls.length} images for user ${session.user.id}`);
    const startTime = Date.now();
    
    const response = await nanoBananaService.editImage({
      prompt: body.prompt,
      image_urls: body.image_urls,
      num_images: body.num_images,
      edit_type: body.edit_type,
      mask_url: body.mask_url,
    });

    // 6. Handle editing errors
    if (!response.success) {
      console.error('Nano-banana editing failed:', response.error);
      return respErr(
        response.error || 'Image editing failed. Please try again.'
      );
    }

    // 7. Deduct credits from user account
    const deducted = await deductCredits(
      session.user.id!,
      requiredCredits,
      'IMAGE_EDITING',
      `Edited ${body.image_urls.length} images with nano-banana`
    );

    if (!deducted) {
      console.error('Failed to deduct credits after successful editing');
      // Note: Images were edited but credits weren't deducted
      // You might want to handle this case differently
    }

    // 8. Log editing for analytics
    const processingTime = Date.now() - startTime;
    console.log(`Image editing completed in ${processingTime}ms`);

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
      return respErr('Request timeout - The image editing took too long. Please try again.');
    }
    
    if (error.status === 429) {
      return respErr('Rate limit exceeded - Please wait a moment before trying again.');
    }
    
    if (error.status === 402) {
      return respErr('Payment required - Your nano-banana credits may be exhausted.');
    }
    
    if (error.status === 413) {
      return respErr('Image too large - Please use smaller images (max 10MB each).');
    }
    
    return respErr('An unexpected error occurred. Please try again later.');
  }
}

/**
 * GET /api/nano-banana/edit
 * Get editing capabilities and configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized');
    }

    // Get user's remaining credits
    const userCreditsInfo = await getUserCredits(session.user.id!);

    return respData({
      user_credits: userCreditsInfo.left_credits,
      credits_per_edit: CREDITS_PER_EDIT,
      max_input_images: MAX_INPUT_IMAGES,
      max_output_images: MAX_OUTPUT_IMAGES,
      supported_edit_types: [
        {
          type: 'inpaint',
          description: 'Fill in or replace parts of an image',
          requires_mask: true,
        },
        {
          type: 'outpaint',
          description: 'Extend image beyond its original boundaries',
          requires_mask: false,
        },
        {
          type: 'variation',
          description: 'Create variations of the input image',
          requires_mask: false,
        },
        {
          type: 'style_transfer',
          description: 'Apply artistic styles to images',
          requires_mask: false,
        },
      ],
      supported_formats: ['jpg', 'jpeg', 'png', 'webp'],
      max_file_size_mb: 10,
      tips: [
        'Use clear, descriptive prompts for best results',
        'For inpainting, provide a mask image highlighting the area to edit',
        'Higher quality input images produce better results',
        'Experiment with different edit types for creative effects',
      ],
    });

  } catch (error) {
    console.error('GET request error:', error);
    return respErr('Failed to retrieve editing configuration');
  }
}