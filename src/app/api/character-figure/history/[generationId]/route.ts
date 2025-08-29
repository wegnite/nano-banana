/**
 * Individual History Item API Route
 * 
 * Problem: Need API endpoints for managing individual generation history items
 * Solution: Create endpoints for viewing, favoriting, and deleting specific items
 * 
 * Endpoints:
 * - GET /api/character-figure/history/[generationId] - Get single generation details
 * - PUT /api/character-figure/history/[generationId] - Update generation (favorite status, etc.)
 * - DELETE /api/character-figure/history/[generationId] - Delete single generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { respData, respErr } from '@/lib/resp';
import { toggleGenerationFavorite } from '@/services/character-figure';
import { getCharacterGenerationByUuid } from '@/models/character-figure';

/**
 * GET /api/character-figure/history/[generationId]
 * Get detailed information about a specific generation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to view generation details', 401);
    }

    const { generationId } = await params;
    if (!generationId) {
      return respErr('Generation ID is required', 400);
    }

    // Get generation record
    const generation = await getCharacterGenerationByUuid(generationId);
    if (!generation) {
      return respErr('Generation not found', 404);
    }

    // Verify user owns this generation
    if (generation.user_uuid !== session.user.id) {
      return respErr('Unauthorized - You can only view your own generations', 403);
    }

    // Check if generation is deleted
    if (generation.is_deleted) {
      return respErr('Generation has been deleted', 410);
    }

    // Parse stored JSON data
    let generatedImages = [];
    let generationParams = {};
    let nanoBananaResponse = {};

    try {
      generatedImages = generation.generated_images ? JSON.parse(generation.generated_images) : [];
      generationParams = generation.generation_params ? JSON.parse(generation.generation_params) : {};
      nanoBananaResponse = generation.nano_banana_response ? JSON.parse(generation.nano_banana_response) : {};
    } catch (parseError) {
      console.error('Error parsing generation JSON data:', parseError);
    }

    // Build response
    const response = {
      id: generation.uuid,
      user_uuid: generation.user_uuid,
      created_at: generation.created_at!.toISOString(),
      
      // Generation parameters
      original_prompt: generation.original_prompt,
      enhanced_prompt: generation.enhanced_prompt,
      style: generation.style,
      pose: generation.pose,
      gender: generation.gender,
      age: generation.age,
      
      // Optional parameters
      style_keywords: generation.style_keywords ? JSON.parse(generation.style_keywords) : null,
      clothing: generation.clothing,
      background: generation.background,
      color_palette: generation.color_palette,
      aspect_ratio: generation.aspect_ratio,
      quality: generation.quality,
      num_images: generation.num_images,
      seed: generation.seed,
      
      // Results
      generated_images: generatedImages,
      generation_time: generation.generation_time,
      credits_used: generation.credits_used,
      
      // User actions
      is_favorited: generation.is_favorited,
      gallery_item_id: generation.gallery_item_id,
      
      // Technical details
      nano_banana_request_id: generation.nano_banana_request_id,
      generation_params: generationParams,
      
      // Metadata
      can_regenerate: true, // User can use same params to regenerate
      can_share_to_gallery: !generation.gallery_item_id, // Only if not already shared
    };

    return respData(response);

  } catch (error: any) {
    console.error('Generation detail API error:', error);
    return respErr('Failed to load generation details', 500);
  }
}

/**
 * PUT /api/character-figure/history/[generationId]
 * Update generation properties (mainly favorite status)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to update generations', 401);
    }

    const { generationId } = await params;
    if (!generationId) {
      return respErr('Generation ID is required', 400);
    }

    // Parse request body
    const body = await request.json();
    const { action, value } = body;

    if (!action) {
      return respErr('Action is required', 400);
    }

    // Handle different actions
    switch (action) {
      case 'toggle_favorite':
        const result = await toggleGenerationFavorite(session.user.id!, generationId);
        
        if (!result.success) {
          return respErr(result.message || 'Failed to update favorite status', 400);
        }
        
        return respData({
          success: true,
          action: 'toggle_favorite',
          is_favorited: result.is_favorited,
          message: result.message
        });

      case 'set_favorite':
        if (typeof value !== 'boolean') {
          return respErr('Value must be a boolean for set_favorite action', 400);
        }
        
        // TODO: Implement direct favorite setting
        return respErr('Direct favorite setting not yet implemented. Use toggle_favorite instead.', 501);

      default:
        return respErr(`Unknown action: ${action}. Supported actions: toggle_favorite`, 400);
    }

  } catch (error: any) {
    console.error('Generation update API error:', error);
    
    if (error.name === 'SyntaxError') {
      return respErr('Invalid JSON in request body', 400);
    }
    
    return respErr('Failed to update generation', 500);
  }
}

/**
 * DELETE /api/character-figure/history/[generationId]
 * Soft delete a specific generation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to delete generations', 401);
    }

    const { generationId } = await params;
    if (!generationId) {
      return respErr('Generation ID is required', 400);
    }

    // Get generation record to verify ownership
    const generation = await getCharacterGenerationByUuid(generationId);
    if (!generation) {
      return respErr('Generation not found', 404);
    }

    // Verify user owns this generation
    if (generation.user_uuid !== session.user.id) {
      return respErr('Unauthorized - You can only delete your own generations', 403);
    }

    // Check if already deleted
    if (generation.is_deleted) {
      return respErr('Generation is already deleted', 410);
    }

    // TODO: Implement soft delete
    // const deleted = await softDeleteGeneration(generationId);
    
    // For now, return not implemented
    return respErr('Generation deletion is not yet implemented', 501);

    /*
    if (!deleted) {
      return respErr('Failed to delete generation', 500);
    }

    return respData({
      success: true,
      message: 'Generation deleted successfully',
      generation_id: generationId,
      deleted_at: new Date().toISOString()
    });
    */

  } catch (error: any) {
    console.error('Generation delete API error:', error);
    return respErr('Failed to delete generation', 500);
  }
}