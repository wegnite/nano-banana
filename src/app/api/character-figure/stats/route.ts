/**
 * Character Figure Statistics API Route
 * 
 * Problem: Need API endpoints for user and system statistics
 * Solution: Create endpoints for user stats and public trends
 * 
 * Endpoints:
 * - GET /api/character-figure/stats - Get user statistics and public trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { respData, respErr } from '@/lib/resp';
import { getUserStats } from '@/services/character-figure';
import { getUserCredits } from '@/services/credit';

/**
 * GET /api/character-figure/stats
 * Get user statistics and public trends
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user (optional)
    const session = await auth();
    
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'user'; // 'user' or 'public'

    if (type === 'user') {
      // User-specific statistics
      if (!session || !session.user) {
        return respErr('Unauthorized - Please sign in to view your statistics', 401);
      }

      console.log(`Getting user stats for ${session.user.id}`);

      // Get user's generation statistics
      const userStats = await getUserStats(session.user.id!);
      
      // Get user's current credits
      const userCredits = await getUserCredits(session.user.id!);

      return respData({
        user_stats: {
          total_generations: userStats.total_generations,
          total_credits_used: userStats.total_credits_used,
          favorite_style: userStats.favorite_style,
          favorite_pose: userStats.favorite_pose,
          total_gallery_items: userStats.total_gallery_items,
          total_likes_received: userStats.total_likes_received,
          generation_streak: userStats.generation_streak,
          last_generation_at: userStats.last_generation_at,
          
          // Current account status
          current_credits: userCredits.left_credits,
          is_pro_user: userCredits.is_pro,
          is_recharged: userCredits.is_recharged
        },
        
        // Quick summary for dashboard
        summary: {
          generations_this_month: 0, // TODO: Implement monthly stats
          credits_spent_this_month: 0, // TODO: Implement monthly stats
          favorite_generation_time: 'afternoon', // TODO: Implement time analysis
          most_productive_day: 'Sunday' // TODO: Implement day analysis
        },
        
        // Achievement-like stats
        milestones: {
          first_generation_date: userStats.last_generation_at, // TODO: Get first generation date
          total_styles_tried: 0, // TODO: Count distinct styles used
          total_poses_tried: 0, // TODO: Count distinct poses used
          longest_streak: userStats.generation_streak, // TODO: Calculate longest streak
          most_generations_in_day: 0 // TODO: Calculate max generations per day
        }
      });

    } else if (type === 'public') {
      // Public statistics and trends
      
      // TODO: Implement public statistics from database
      return respData({
        public_trends: {
          popular_styles: [
            { style: 'anime', count: 1250, percentage: 35 },
            { style: 'realistic', count: 890, percentage: 25 },
            { style: 'fantasy', count: 534, percentage: 15 },
            { style: 'cyberpunk', count: 445, percentage: 12.5 },
            { style: 'cartoon', count: 356, percentage: 10 },
            { style: 'other', count: 89, percentage: 2.5 }
          ],
          
          popular_poses: [
            { pose: 'standing', count: 980, percentage: 30 },
            { pose: 'portrait', count: 850, percentage: 26 },
            { pose: 'action', count: 620, percentage: 19 },
            { pose: 'sitting', count: 450, percentage: 14 },
            { pose: 'full_body', count: 234, percentage: 7 },
            { pose: 'other', count: 130, percentage: 4 }
          ],
          
          trending_tags: [
            { tag: 'warrior', count: 445 },
            { tag: 'princess', count: 389 },
            { tag: 'robot', count: 234 },
            { tag: 'wizard', count: 198 },
            { tag: 'ninja', count: 156 }
          ],
          
          daily_stats: [
            { date: '2025-08-27', generations: 234, unique_users: 89 },
            { date: '2025-08-26', generations: 198, unique_users: 76 },
            { date: '2025-08-25', generations: 267, unique_users: 94 },
            { date: '2025-08-24', generations: 189, unique_users: 71 },
            { date: '2025-08-23', generations: 223, unique_users: 82 }
          ]
        },
        
        platform_stats: {
          total_generations_all_time: 15678,
          total_users: 1234,
          total_gallery_items: 3456,
          average_generations_per_user: 12.7,
          most_active_time: '14:00-16:00 UTC',
          top_countries: ['United States', 'Japan', 'United Kingdom', 'Germany', 'Canada']
        }
      });

    } else {
      return respErr('Invalid type parameter. Must be "user" or "public"', 400);
    }

  } catch (error: any) {
    console.error('Stats API error:', error);
    return respErr('Failed to load statistics', 500);
  }
}