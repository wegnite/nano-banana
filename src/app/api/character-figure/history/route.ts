/**
 * Character Figure History API Route
 * 
 * Problem: Need API endpoints for managing user's character generation history
 * Solution: Create endpoints for viewing, filtering, and managing generation history
 * 
 * Endpoints:
 * - GET /api/character-figure/history - Get user's generation history with filters
 * - DELETE /api/character-figure/history - Bulk delete history items (future)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { respData, respErr } from '@/lib/resp';
import { getUserHistory, getUserStats } from '@/services/character-figure';
import { 
  HistoryQuery, 
  CharacterFigureStyle, 
  CharacterPose 
} from '../types';

/**
 * GET /api/character-figure/history
 * Get user's character generation history with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to view your history', 401);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Build query from parameters
    const query: HistoryQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50), // Cap at 50
      sort_by: (searchParams.get('sort_by') as any) || 'latest',
      favorites_only: searchParams.get('favorites_only') === 'true'
    };

    // Parse style filters
    const styleParam = searchParams.get('styles');
    if (styleParam) {
      const styles = styleParam.split(',').filter(s => 
        Object.values(CharacterFigureStyle).includes(s as CharacterFigureStyle)
      ) as CharacterFigureStyle[];
      if (styles.length > 0) {
        query.style = styles;
      }
    }

    // Parse date range
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    if (dateFrom) {
      // Validate date format
      if (isNaN(Date.parse(dateFrom))) {
        return respErr('Invalid date_from format. Use ISO date string (YYYY-MM-DD)', 400);
      }
      query.date_from = dateFrom;
    }
    if (dateTo) {
      // Validate date format
      if (isNaN(Date.parse(dateTo))) {
        return respErr('Invalid date_to format. Use ISO date string (YYYY-MM-DD)', 400);
      }
      query.date_to = dateTo;
    }

    // Validate parameters
    const validSortOptions = ['latest', 'oldest', 'most_credits', 'favorites'];
    if (query.sort_by && !validSortOptions.includes(query.sort_by)) {
      return respErr('Invalid sort_by parameter. Must be one of: ' + validSortOptions.join(', '), 400);
    }

    if (query.page && (query.page < 1 || query.page > 1000)) {
      return respErr('page parameter must be between 1 and 1000', 400);
    }

    if (query.limit && (query.limit < 1 || query.limit > 50)) {
      return respErr('limit parameter must be between 1 and 50', 400);
    }

    console.log(`History request for user ${session.user.id}: page=${query.page}, limit=${query.limit}, sort=${query.sort_by}`);

    // Get user's generation history
    const history = await getUserHistory(session.user.id!, query);

    // Get user statistics (for summary info)
    const stats = await getUserStats(session.user.id!);

    // Calculate pagination info
    const totalPages = Math.ceil(history.length > 0 ? 1000 / query.limit! : 1); // Rough estimate
    const hasNextPage = history.length === query.limit;
    const hasPrevPage = query.page! > 1;

    return respData({
      history,
      pagination: {
        current_page: query.page,
        limit: query.limit,
        total_items: history.length, // This is just current page count
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage,
        next_page: hasNextPage ? query.page! + 1 : null,
        prev_page: hasPrevPage ? query.page! - 1 : null
      },
      filters: {
        applied: {
          styles: query.style || [],
          sort_by: query.sort_by,
          favorites_only: query.favorites_only,
          date_from: query.date_from,
          date_to: query.date_to
        },
        available: {
          styles: Object.values(CharacterFigureStyle),
          sort_options: validSortOptions
        }
      },
      user_stats: {
        total_generations: stats.total_generations,
        total_credits_used: stats.total_credits_used,
        favorite_style: stats.favorite_style,
        favorite_pose: stats.favorite_pose,
        total_favorites: history.filter(h => h.is_favorited).length
      },
      summary: {
        total_items_on_page: history.length,
        favorites_on_page: history.filter(h => h.is_favorited).length,
        credits_used_on_page: history.reduce((sum, h) => sum + h.credits_used, 0),
        styles_on_page: [...new Set(history.map(h => h.request.style))]
      }
    });

  } catch (error: any) {
    console.error('History API error:', error);
    return respErr('Failed to load generation history', 500);
  }
}

/**
 * DELETE /api/character-figure/history
 * Bulk delete history items (future feature)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to manage your history', 401);
    }

    // For now, return not implemented
    return respErr('Bulk history deletion is not yet implemented', 501);

    // TODO: Implement bulk deletion
    /*
    const body = await request.json();
    const { generation_ids } = body;
    
    if (!Array.isArray(generation_ids) || generation_ids.length === 0) {
      return respErr('generation_ids array is required', 400);
    }
    
    if (generation_ids.length > 100) {
      return respErr('Cannot delete more than 100 items at once', 400);
    }
    
    // Validate all IDs belong to the user and perform bulk soft delete
    const deletedCount = await bulkDeleteGenerations(session.user.id!, generation_ids);
    
    return respData({
      success: true,
      deleted_count: deletedCount,
      message: `Successfully deleted ${deletedCount} items`
    });
    */

  } catch (error: any) {
    console.error('History delete API error:', error);
    
    if (error.name === 'SyntaxError') {
      return respErr('Invalid JSON in request body', 400);
    }
    
    return respErr('Failed to delete history items', 500);
  }
}