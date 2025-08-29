/**
 * Gallery Actions API Route
 * 
 * Problem: Need API endpoints for user interactions with gallery items (like, bookmark, view, report)
 * Solution: Create dynamic route for handling gallery item actions
 * 
 * Endpoint: POST /api/character-figure/gallery/[galleryId]/action
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { respData, respErr } from '@/lib/resp';
import { handleGalleryAction } from '@/services/character-figure';
import { GalleryAction, GalleryActionRequest } from '../../../types';

/**
 * POST /api/character-figure/gallery/[galleryId]/action
 * Handle user actions on gallery items
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to interact with gallery items', 401);
    }

    // Get gallery item ID from URL
    const { galleryId } = await params;
    if (!galleryId) {
      return respErr('Gallery item ID is required', 400);
    }

    // Parse request body
    const body: { action: string } = await request.json();
    const { action } = body;

    if (!action) {
      return respErr('Action is required', 400);
    }

    // Validate action type
    const validActions = Object.values(GalleryAction);
    if (!validActions.includes(action as GalleryAction)) {
      return respErr(
        `Invalid action. Must be one of: ${validActions.join(', ')}`, 
        400
      );
    }

    const galleryAction = action as GalleryAction;

    // Special handling for view action (no need for additional validation)
    if (galleryAction === GalleryAction.VIEW) {
      console.log(`Recording view for gallery item ${galleryId} by user ${session.user.id}`);
    } else {
      console.log(`Processing ${galleryAction} action for gallery item ${galleryId} by user ${session.user.id}`);
    }

    // Handle the gallery action
    const result = await handleGalleryAction(
      session.user.id!,
      galleryId,
      galleryAction
    );

    if (!result.success) {
      // Handle specific error cases
      if (result.message?.includes('not found')) {
        return respErr('Gallery item not found', 404);
      }
      if (result.message?.includes('already performed')) {
        return respErr('Action already performed', 409);
      }
      if (result.message?.includes('Invalid action')) {
        return respErr('Invalid action type', 400);
      }
      
      return respErr(result.message || 'Failed to perform action', 400);
    }

    // Build success response
    const response: any = {
      success: true,
      action: galleryAction,
      gallery_item_id: galleryId,
      message: result.message
    };

    // Include updated counts for relevant actions
    if (result.new_count !== undefined) {
      switch (galleryAction) {
        case GalleryAction.LIKE:
        case GalleryAction.UNLIKE:
          response.new_likes_count = result.new_count;
          break;
        case GalleryAction.BOOKMARK:
        case GalleryAction.UNBOOKMARK:
          response.new_bookmarks_count = result.new_count;
          break;
        case GalleryAction.VIEW:
          response.new_views_count = result.new_count;
          break;
      }
    }

    // Include user action state for toggle actions
    if (result.user_action_state !== undefined) {
      switch (galleryAction) {
        case GalleryAction.LIKE:
        case GalleryAction.UNLIKE:
          response.user_liked = result.user_action_state;
          break;
        case GalleryAction.BOOKMARK:
        case GalleryAction.UNBOOKMARK:
          response.user_bookmarked = result.user_action_state;
          break;
      }
    }

    return respData(response);

  } catch (error: any) {
    console.error('Gallery action API error:', error);
    
    if (error.name === 'SyntaxError') {
      return respErr('Invalid JSON in request body', 400);
    }
    
    if (error.message?.includes('duplicate key') || error.code === '23505') {
      return respErr('Action already performed', 409);
    }
    
    return respErr('Failed to perform gallery action', 500);
  }
}

/**
 * GET /api/character-figure/gallery/[galleryId]/action
 * Get current user's interaction state with gallery item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respData({
        user_liked: false,
        user_bookmarked: false,
        authenticated: false
      });
    }

    const { galleryId } = await params;
    if (!galleryId) {
      return respErr('Gallery item ID is required', 400);
    }

    // TODO: Implement getting user interaction state
    // For now, return basic structure
    return respData({
      gallery_item_id: galleryId,
      user_liked: false,
      user_bookmarked: false,
      authenticated: true,
      message: 'User interaction state retrieval not yet implemented'
    });

  } catch (error: any) {
    console.error('Gallery action state API error:', error);
    return respErr('Failed to get interaction state', 500);
  }
}