/**
 * Session Cleanup Cron Job API Route
 * 
 * Problem: Need automated cleanup of expired sessions and temporary data
 * Solution: Scheduled cron job to maintain database performance and security
 * 
 * Endpoint: GET /api/cleanup/sessions
 * Schedule: Daily at 2:00 AM UTC (configured in vercel.json)
 * Features:
 * - Remove expired sessions
 * - Clean up temporary data
 * - Rate limit cleanup
 * - Maintenance logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { respData, respErr } from '@/lib/resp';

/**
 * GET /api/cleanup/sessions
 * Automated cleanup of expired sessions and temporary data
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronHeader = request.headers.get('x-vercel-cron');
    
    // In production, verify the request comes from Vercel cron
    if (process.env.NODE_ENV === 'production' && !cronHeader) {
      return NextResponse.json({
        error: 'Unauthorized - This endpoint is reserved for cron jobs'
      }, { status: 401 });
    }

    console.log('Starting session cleanup job...');
    
    const cleanupResults = {
      expired_sessions: 0,
      temp_files: 0,
      rate_limits: 0,
      generation_history: 0,
      errors: [] as string[]
    };

    // Import database dynamically to avoid initialization issues
    const postgres = (await import('postgres')).default;
    const sql = postgres(process.env.DATABASE_URL!);

    // 1. Clean up expired NextAuth sessions (older than 30 days)
    try {
      const expiredSessionsResult = await sql`
        DELETE FROM sessions 
        WHERE expires < NOW() - INTERVAL '30 days'
      `;
      cleanupResults.expired_sessions = expiredSessionsResult.count || 0;
      console.log(`Cleaned up ${cleanupResults.expired_sessions} expired sessions`);
    } catch (error: any) {
      const errorMsg = `Session cleanup failed: ${error.message}`;
      cleanupResults.errors.push(errorMsg);
      console.error(errorMsg);
    }

    // 2. Clean up expired rate limit records (older than 24 hours)
    try {
      const expiredRateLimitsResult = await sql`
        DELETE FROM user_rate_limits 
        WHERE created_at < NOW() - INTERVAL '24 hours'
      `;
      cleanupResults.rate_limits = expiredRateLimitsResult.count || 0;
      console.log(`Cleaned up ${cleanupResults.rate_limits} rate limit records`);
    } catch (error: any) {
      const errorMsg = `Rate limit cleanup failed: ${error.message}`;
      cleanupResults.errors.push(errorMsg);
      console.error(errorMsg);
    }

    // 3. Clean up old generation history (keep only 90 days)
    try {
      const oldGenerationsResult = await sql`
        DELETE FROM character_generations 
        WHERE created_at < NOW() - INTERVAL '90 days'
        AND status = 'completed'
      `;
      cleanupResults.generation_history = oldGenerationsResult.count || 0;
      console.log(`Cleaned up ${cleanupResults.generation_history} old generations`);
    } catch (error: any) {
      const errorMsg = `Generation history cleanup failed: ${error.message}`;
      cleanupResults.errors.push(errorMsg);
      console.error(errorMsg);
    }

    // 4. Clean up failed/stuck generations (older than 1 hour)
    try {
      const stuckGenerationsResult = await sql`
        UPDATE character_generations 
        SET status = 'failed', 
            error_message = 'Cleanup: Generation timed out',
            updated_at = NOW()
        WHERE status = 'processing' 
        AND created_at < NOW() - INTERVAL '1 hour'
      `;
      console.log(`Marked ${stuckGenerationsResult.count || 0} stuck generations as failed`);
    } catch (error: any) {
      const errorMsg = `Stuck generation cleanup failed: ${error.message}`;
      cleanupResults.errors.push(errorMsg);
      console.error(errorMsg);
    }

    // 5. Clean up temporary attribution data (older than 90 days)
    try {
      const tempAttributionResult = await sql`
        DELETE FROM user_attributions 
        WHERE created_at < NOW() - INTERVAL '90 days'
        AND session_count = 1
      `;
      console.log(`Cleaned up ${tempAttributionResult.count || 0} temporary attribution records`);
    } catch (error: any) {
      const errorMsg = `Attribution cleanup failed: ${error.message}`;
      cleanupResults.errors.push(errorMsg);
      console.error(errorMsg);
    }

    // 6. Vacuum analyze to optimize database performance
    try {
      if (process.env.NODE_ENV === 'production') {
        await sql`VACUUM ANALYZE`;
        console.log('Database vacuum analyze completed');
      }
    } catch (error: any) {
      const errorMsg = `Database vacuum failed: ${error.message}`;
      cleanupResults.errors.push(errorMsg);
      console.error(errorMsg);
    }

    const totalTime = Date.now() - startTime;
    const totalCleaned = cleanupResults.expired_sessions + 
                        cleanupResults.temp_files + 
                        cleanupResults.rate_limits + 
                        cleanupResults.generation_history;

    console.log(`Session cleanup completed in ${totalTime}ms. Cleaned ${totalCleaned} records.`);

    // Log cleanup summary for monitoring
    const cleanupSummary = {
      timestamp: new Date().toISOString(),
      duration_ms: totalTime,
      total_cleaned: totalCleaned,
      results: cleanupResults,
      status: cleanupResults.errors.length > 0 ? 'completed_with_errors' : 'completed'
    };

    // Store cleanup log for monitoring (optional)
    try {
      await sql`
        INSERT INTO system_logs (
          type, 
          message, 
          metadata, 
          created_at
        ) VALUES (
          'cleanup_job',
          'Session cleanup completed',
          ${JSON.stringify(cleanupSummary)},
          NOW()
        )
      `;
    } catch (error: any) {
      console.warn('Failed to log cleanup summary:', error.message);
    } finally {
      // 关闭数据库连接
      await sql.end();
    }

    return NextResponse.json(cleanupSummary, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error: any) {
    console.error('Session cleanup job failed:', error);
    
    const errorResponse = {
      timestamp: new Date().toISOString(),
      error: 'Session cleanup job failed',
      details: error.message,
      duration_ms: Date.now() - startTime
    };

    // Try to log the error
    try {
      const postgres = (await import('postgres')).default;
      const sql = postgres(process.env.DATABASE_URL!);
      await sql`
        INSERT INTO system_logs (
          type, 
          message, 
          metadata, 
          created_at
        ) VALUES (
          'cleanup_error',
          'Session cleanup job failed',
          ${JSON.stringify(errorResponse)},
          NOW()
        )
      `;
      await sql.end(); // 关闭错误日志的数据库连接
    } catch (logError) {
      console.error('Failed to log cleanup error:', logError);
    }

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}

/**
 * POST /api/cleanup/sessions
 * Manual trigger for session cleanup (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { auth } = await import('@/auth');
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email || '')) {
      return NextResponse.json({
        error: 'Forbidden - Admin access required'
      }, { status: 403 });
    }

    // Trigger the cleanup
    return await GET(request);
    
  } catch (error: any) {
    console.error('Manual cleanup trigger failed:', error);
    return NextResponse.json({
      error: 'Manual cleanup trigger failed',
      details: error.message
    }, { status: 500 });
  }
}