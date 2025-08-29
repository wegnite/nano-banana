/**
 * Template-based Character Generation API Route
 * 
 * Problem: Need API endpoints for generating characters using predefined templates
 * Solution: Create endpoint that uses template parameters with optional customizations
 * 
 * Endpoint: POST /api/character-figure/templates/[templateId]/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { respData, respErr } from '@/lib/resp';
import { generateWithTemplate } from '@/services/character-figure';
// 使用正确的类型导入路径
import type { CharacterFigureRequest } from '@/types/character-figure';

/**
 * POST /api/character-figure/templates/[templateId]/generate
 * Generate character using template with optional customizations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    // 获取动态路由参数（Next.js 15 需要 await）
    const { templateId } = await params;
    
    // 检查认证状态
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to generate characters from templates', 401);
    }

    // 检查模板 ID 是否存在
    if (!templateId) {
      return respErr('Template ID is required', 400);
    }

    // Parse request body for customizations
    const body: Partial<CharacterFigureRequest> = await request.json();

    // Validate any provided customizations
    const validationError = validateCustomizations(body);
    if (validationError) {
      return respErr(validationError, 400);
    }

    console.log(`Generating character from template ${templateId} for user ${session.user.id}`);
    const startTime = Date.now();

    // Generate using template
    const response = await generateWithTemplate(
      session.user.id!,
      templateId,
      body
    );

    const totalTime = Date.now() - startTime;
    console.log(`Template-based generation completed in ${totalTime}ms`);

    // Handle generation result
    if (!response.success) {
      console.error('Template-based generation failed:', response.error);
      return respErr(response.error || 'Template-based generation failed. Please try again.', 400);
    }

    // Return successful response
    return respData({
      success: true,
      template_id: templateId,
      customizations_applied: Object.keys(body).length > 0,
      data: {
        generation_id: response.data?.generation_id,
        images: response.data?.images || [],
        enhanced_prompt: response.data?.enhanced_prompt,
        style_applied: response.data?.style_applied
      },
      credits_used: response.credits_used,
      credits_remaining: response.credits_remaining,
      generation_time: response.generation_time,
      request_id: response.request_id,
      metadata: {
        template_used: templateId,
        customizations: body,
        processing_time: totalTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Template generation API route error:', error);
    
    if (error.name === 'SyntaxError') {
      return respErr('Invalid JSON in request body', 400);
    }
    
    if (error.message?.includes('Template not found')) {
      return respErr('Template not found', 404);
    }
    
    if (error.message?.includes('timeout')) {
      return respErr('Request timeout - The template generation took too long. Please try again.', 408);
    }
    
    return respErr('An unexpected error occurred during template generation. Please try again later.', 500);
  }
}

/**
 * Validate template customizations
 * 
 * @param customizations Customization parameters
 * @returns Error message if validation fails, null if valid
 */
function validateCustomizations(customizations: Partial<CharacterFigureRequest>): string | null {
  // Validate prompt if provided
  if (customizations.prompt !== undefined) {
    if (typeof customizations.prompt !== 'string') {
      return 'Prompt must be a string';
    }
    if (customizations.prompt.length > 2000) {
      return 'Prompt is too long (maximum 2000 characters)';
    }
  }

  // Validate num_images if provided
  if (customizations.num_images !== undefined) {
    const numImages = parseInt(customizations.num_images);
    if (isNaN(numImages) || numImages < 1 || numImages > 4) {
      return 'num_images must be between 1 and 4';
    }
  }

  // Validate quality if provided
  if (customizations.quality !== undefined && !['standard', 'hd'].includes(customizations.quality)) {
    return 'quality must be either "standard" or "hd"';
  }

  // Validate aspect_ratio if provided
  if (customizations.aspect_ratio !== undefined && !['1:1', '16:9', '9:16', '4:3', '3:4'].includes(customizations.aspect_ratio)) {
    return 'aspect_ratio must be one of: 1:1, 16:9, 9:16, 4:3, 3:4';
  }

  // Validate seed if provided
  if (customizations.seed !== undefined && (typeof customizations.seed !== 'number' || customizations.seed < 0 || customizations.seed > 2147483647)) {
    return 'seed must be a positive integer between 0 and 2147483647';
  }

  // Validate optional text fields
  if (customizations.clothing && customizations.clothing.length > 200) {
    return 'clothing description is too long (maximum 200 characters)';
  }

  if (customizations.background && customizations.background.length > 200) {
    return 'background description is too long (maximum 200 characters)';
  }

  if (customizations.color_palette && customizations.color_palette.length > 100) {
    return 'color_palette description is too long (maximum 100 characters)';
  }

  // Validate style_keywords if provided
  if (customizations.style_keywords !== undefined) {
    if (!Array.isArray(customizations.style_keywords)) {
      return 'style_keywords must be an array';
    }
    if (customizations.style_keywords.length > 10) {
      return 'style_keywords array cannot have more than 10 items';
    }
  }

  return null;
}