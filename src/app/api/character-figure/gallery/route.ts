/**
 * Character Figure Gallery API Route
 * 
 * Problem: Need API endpoints for managing the public character figure gallery
 * Solution: Create endpoints for browsing, filtering, and interacting with gallery items
 * 
 * Endpoints: 
 * - GET /api/character-figure/gallery - Browse gallery with filters
 * - POST /api/character-figure/gallery - Share generation to gallery (future feature)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { respData, respErr } from '@/lib/resp';
import { getGalleryItemsList } from '@/services/character-figure';
import { 
  GalleryFilters, 
  CharacterFigureStyle, 
  CharacterPose 
} from '../types';

/**
 * GET /api/character-figure/gallery
 * Browse public gallery with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user (optional for gallery browsing)
    const session = await auth();
    const userUuid = session?.user?.id;

    // Parse query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Build filters from query parameters
    const filters: GalleryFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50), // Cap at 50
      sort_by: (searchParams.get('sort_by') as any) || 'latest',
      time_range: (searchParams.get('time_range') as any) || 'all',
      featured_only: searchParams.get('featured_only') === 'true',
      search_query: searchParams.get('search') || undefined
    };

    // Parse style filters
    const styleParam = searchParams.get('styles');
    if (styleParam) {
      const styles = styleParam.split(',').filter(s => 
        Object.values(CharacterFigureStyle).includes(s as CharacterFigureStyle)
      ) as CharacterFigureStyle[];
      if (styles.length > 0) {
        filters.style = styles;
      }
    }

    // Parse pose filters
    const poseParam = searchParams.get('poses');
    if (poseParam) {
      const poses = poseParam.split(',').filter(p => 
        Object.values(CharacterPose).includes(p as CharacterPose)
      ) as CharacterPose[];
      if (poses.length > 0) {
        filters.pose = poses;
      }
    }

    // Parse tags
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      filters.tags = tagsParam.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }

    // Validate sort_by parameter
    const validSortOptions = ['latest', 'popular', 'trending', 'most_liked'];
    if (filters.sort_by && !validSortOptions.includes(filters.sort_by)) {
      return respErr('Invalid sort_by parameter. Must be one of: ' + validSortOptions.join(', '), 400);
    }

    // Validate time_range parameter
    const validTimeRanges = ['today', 'week', 'month', 'all'];
    if (filters.time_range && !validTimeRanges.includes(filters.time_range)) {
      return respErr('Invalid time_range parameter. Must be one of: ' + validTimeRanges.join(', '), 400);
    }

    // Validate pagination parameters
    if (filters.page && (filters.page < 1 || filters.page > 1000)) {
      return respErr('page parameter must be between 1 and 1000', 400);
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 50)) {
      return respErr('limit parameter must be between 1 and 50', 400);
    }

    console.log(`Gallery request: page=${filters.page}, limit=${filters.limit}, sort=${filters.sort_by}`);

    // Get gallery items
    const items = await getGalleryItemsList(filters, userUuid);

    // Calculate pagination info
    const totalPages = Math.ceil(items.length > 0 ? 1000 / filters.limit! : 1); // Rough estimate
    const hasNextPage = items.length === filters.limit;
    const hasPrevPage = filters.page! > 1;

    return respData({
      items,
      pagination: {
        current_page: filters.page,
        limit: filters.limit,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage,
        next_page: hasNextPage ? filters.page! + 1 : null,
        prev_page: hasPrevPage ? filters.page! - 1 : null
      },
      filters: {
        applied: {
          styles: filters.style || [],
          poses: filters.pose || [],
          sort_by: filters.sort_by,
          time_range: filters.time_range,
          featured_only: filters.featured_only,
          search_query: filters.search_query,
          tags: filters.tags || []
        },
        available: {
          styles: Object.values(CharacterFigureStyle),
          poses: Object.values(CharacterPose),
          sort_options: validSortOptions,
          time_ranges: validTimeRanges
        }
      },
      user_authenticated: !!userUuid
    });

  } catch (error: any) {
    console.error('Gallery API error:', error);
    return respErr('Failed to load gallery items', 500);
  }
}

/**
 * POST /api/character-figure/gallery
 * Share a generation to the public gallery (future feature)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to share to gallery', 401);
    }

    // For now, return not implemented
    return respErr('Gallery sharing is not yet implemented. Use the save_to_gallery option in generation request instead.', 501);

    // TODO: Implement gallery sharing from existing generations
    /*
    const body = await request.json();
    const { generation_id, title, description, make_public = true } = body;
    
    if (!generation_id) {
      return respErr('generation_id is required', 400);
    }
    
    // Validate user owns the generation
    const generation = await getCharacterGenerationByUuid(generation_id);
    if (!generation || generation.user_uuid !== session.user.id) {
      return respErr('Generation not found or unauthorized', 404);
    }
    
    // Create gallery item
    const galleryItem = await shareGenerationToGallery(
      session.user.id!,
      generation_id,
      title,
      description,
      make_public
    );
    
    return respData({
      success: true,
      gallery_item_id: galleryItem.id,
      message: 'Successfully shared to gallery'
    });
    */

  } catch (error: any) {
    console.error('Gallery share API error:', error);
    
    if (error.name === 'SyntaxError') {
      return respErr('Invalid JSON in request body', 400);
    }
    
    return respErr('Failed to share to gallery', 500);
  }
}