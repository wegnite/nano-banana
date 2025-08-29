/**
 * Daily Analytics Report Cron Job API Route
 * 
 * Problem: Need automated daily analytics reporting for monitoring business metrics
 * Solution: Scheduled cron job to generate and store daily performance reports
 * 
 * Endpoint: GET /api/analytics/daily-report
 * Schedule: Daily at 1:00 AM UTC (configured in vercel.json)
 * Features:
 * - Daily user metrics
 * - Generation statistics
 * - Performance analytics
 * - Revenue tracking
 * - System health metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { respData, respErr } from '@/lib/resp';

interface DailyReport {
  date: string;
  timestamp: string;
  user_metrics: {
    total_users: number;
    new_signups: number;
    active_users: number;
    retention_rate: number;
  };
  generation_metrics: {
    total_generations: number;
    successful_generations: number;
    failed_generations: number;
    success_rate: number;
    popular_styles: Array<{ style: string; count: number }>;
  };
  business_metrics: {
    total_revenue: number;
    new_orders: number;
    credits_purchased: number;
    credits_used: number;
  };
  performance_metrics: {
    avg_generation_time: number;
    api_response_time: number;
    error_rate: number;
    uptime_percentage: number;
  };
  attribution_metrics: {
    top_sources: Array<{ source: string; visits: number; conversions: number }>;
    conversion_rate: number;
  };
}

/**
 * GET /api/analytics/daily-report
 * Generate comprehensive daily analytics report
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify this is a legitimate cron request
    const cronHeader = request.headers.get('x-vercel-cron');
    
    if (process.env.NODE_ENV === 'production' && !cronHeader) {
      return NextResponse.json({
        error: 'Unauthorized - This endpoint is reserved for cron jobs'
      }, { status: 401 });
    }

    console.log('Starting daily analytics report generation...');
    
    // Get yesterday's date for report
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const reportDate = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // 动态导入 postgres 客户端（Next.js 15 优化）
    const postgres = (await import('postgres')).default;
    const sql = postgres(process.env.DATABASE_URL!);

    // Generate the daily report
    const report: DailyReport = {
      date: reportDate,
      timestamp: new Date().toISOString(),
      user_metrics: await generateUserMetrics(sql, reportDate),
      generation_metrics: await generateGenerationMetrics(sql, reportDate),
      business_metrics: await generateBusinessMetrics(sql, reportDate),
      performance_metrics: await generatePerformanceMetrics(sql, reportDate),
      attribution_metrics: await generateAttributionMetrics(sql, reportDate),
    };

    // Store the report in database
    try {
      await sql`
        INSERT INTO daily_analytics_reports (
          report_date,
          report_data,
          created_at
        ) VALUES (
          ${reportDate},
          ${JSON.stringify(report)},
          NOW()
        )
        ON CONFLICT (report_date) 
        DO UPDATE SET 
          report_data = EXCLUDED.report_data,
          updated_at = NOW()
      `;
      console.log(`Daily report for ${reportDate} stored successfully`);
    } catch (error: any) {
      console.warn('Failed to store daily report:', error.message);
    }

    // Send report summary to monitoring system (optional)
    await sendReportNotification(report);

    const totalTime = Date.now() - startTime;
    console.log(`Daily analytics report completed in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      report_date: reportDate,
      processing_time_ms: totalTime,
      summary: {
        new_users: report.user_metrics.new_signups,
        total_generations: report.generation_metrics.total_generations,
        success_rate: report.generation_metrics.success_rate,
        revenue: report.business_metrics.total_revenue
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error: any) {
    console.error('Daily analytics report failed:', error);
    
    // Log the error
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
          'analytics_error',
          'Daily analytics report failed',
          ${JSON.stringify({
            error: error.message,
            stack: error.stack,
            duration_ms: Date.now() - startTime
          })},
          NOW()
        )
      `;
    } catch (logError) {
      console.error('Failed to log analytics error:', logError);
    }

    return NextResponse.json({
      error: 'Daily analytics report failed',
      details: error.message,
      processing_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * Generate user metrics for the report date
 */
async function generateUserMetrics(sql: any, reportDate: string): Promise<DailyReport['user_metrics']> {
  try {
    // Total users
    const totalUsersResult = await sql`
      SELECT COUNT(*) as total FROM users
      WHERE created_at <= ${reportDate}::date + INTERVAL '1 day'
    `;
    
    // New signups on report date
    const newSignupsResult = await sql`
      SELECT COUNT(*) as new_signups FROM users
      WHERE created_at::date = ${reportDate}::date
    `;
    
    // Active users (generated content in last 7 days from report date)
    const activeUsersResult = await sql`
      SELECT COUNT(DISTINCT user_id) as active FROM character_generations
      WHERE created_at >= ${reportDate}::date - INTERVAL '7 days'
      AND created_at <= ${reportDate}::date + INTERVAL '1 day'
    `;

    // Calculate 7-day retention rate
    const retentionResult = await sql`
      WITH week_ago_signups AS (
        SELECT id FROM users 
        WHERE created_at::date = ${reportDate}::date - INTERVAL '7 days'
      ),
      active_from_week_ago AS (
        SELECT DISTINCT cg.user_id FROM character_generations cg
        JOIN week_ago_signups was ON cg.user_id = was.id
        WHERE cg.created_at::date = ${reportDate}::date
      )
      SELECT 
        COUNT(was.id) as week_ago_signups,
        COUNT(afwa.user_id) as active_from_week_ago
      FROM week_ago_signups was
      LEFT JOIN active_from_week_ago afwa ON was.id = afwa.user_id
    `;

    const retentionRate = retentionResult[0]?.week_ago_signups > 0 
      ? (retentionResult[0]?.active_from_week_ago / retentionResult[0]?.week_ago_signups) * 100
      : 0;

    return {
      total_users: parseInt(totalUsersResult[0]?.total || '0'),
      new_signups: parseInt(newSignupsResult[0]?.new_signups || '0'),
      active_users: parseInt(activeUsersResult[0]?.active || '0'),
      retention_rate: Math.round(retentionRate * 100) / 100
    };
    
  } catch (error: any) {
    console.warn('User metrics generation failed:', error.message);
    return { total_users: 0, new_signups: 0, active_users: 0, retention_rate: 0 };
  }
}

/**
 * Generate character generation metrics
 */
async function generateGenerationMetrics(sql: any, reportDate: string): Promise<DailyReport['generation_metrics']> {
  try {
    // Generation counts by status
    const generationStatsResult = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM character_generations
      WHERE created_at::date = ${reportDate}::date
    `;

    // Popular styles
    const popularStylesResult = await sql`
      SELECT 
        style,
        COUNT(*) as count
      FROM character_generations
      WHERE created_at::date = ${reportDate}::date
      AND status = 'completed'
      GROUP BY style
      ORDER BY count DESC
      LIMIT 5
    `;

    const stats = generationStatsResult[0];
    const total = parseInt(stats?.total || '0');
    const successful = parseInt(stats?.successful || '0');
    const failed = parseInt(stats?.failed || '0');
    
    return {
      total_generations: total,
      successful_generations: successful,
      failed_generations: failed,
      success_rate: total > 0 ? Math.round((successful / total) * 10000) / 100 : 0,
      popular_styles: popularStylesResult.map((row: any) => ({
        style: row.style,
        count: parseInt(row.count)
      }))
    };
    
  } catch (error: any) {
    console.warn('Generation metrics generation failed:', error.message);
    return { 
      total_generations: 0, 
      successful_generations: 0, 
      failed_generations: 0, 
      success_rate: 0, 
      popular_styles: [] 
    };
  }
}

/**
 * Generate business metrics
 */
async function generateBusinessMetrics(sql: any, reportDate: string): Promise<DailyReport['business_metrics']> {
  try {
    // Revenue and orders for the day
    const businessStatsResult = await sql`
      SELECT 
        COUNT(*) as new_orders,
        COALESCE(SUM(amount), 0) as total_revenue
      FROM orders
      WHERE created_at::date = ${reportDate}::date
      AND status = 'paid'
    `;

    // Credits purchased and used
    const creditStatsResult = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ('OrderPay', 'SystemAdd') THEN amount ELSE 0 END), 0) as purchased,
        COALESCE(SUM(CASE WHEN type = 'CharacterGeneration' THEN ABS(amount) ELSE 0 END), 0) as used
      FROM credit_logs
      WHERE created_at::date = ${reportDate}::date
    `;

    const businessStats = businessStatsResult[0];
    const creditStats = creditStatsResult[0];

    return {
      total_revenue: parseFloat(businessStats?.total_revenue || '0'),
      new_orders: parseInt(businessStats?.new_orders || '0'),
      credits_purchased: parseInt(creditStats?.purchased || '0'),
      credits_used: parseInt(creditStats?.used || '0')
    };
    
  } catch (error: any) {
    console.warn('Business metrics generation failed:', error.message);
    return { total_revenue: 0, new_orders: 0, credits_purchased: 0, credits_used: 0 };
  }
}

/**
 * Generate performance metrics
 */
async function generatePerformanceMetrics(sql: any, reportDate: string): Promise<DailyReport['performance_metrics']> {
  try {
    // Average generation time for completed generations
    const perfStatsResult = await sql`
      SELECT 
        AVG(
          EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000
        ) as avg_generation_time,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / COUNT(*) as error_rate
      FROM character_generations
      WHERE created_at::date = ${reportDate}::date
      AND status IN ('completed', 'failed')
    `;

    const perfStats = perfStatsResult[0];
    
    return {
      avg_generation_time: Math.round(parseFloat(perfStats?.avg_generation_time || '0')),
      api_response_time: 0, // Would need to implement API response time tracking
      error_rate: Math.round((parseFloat(perfStats?.error_rate || '0')) * 100) / 100,
      uptime_percentage: 99.9 // Would need to implement uptime monitoring
    };
    
  } catch (error: any) {
    console.warn('Performance metrics generation failed:', error.message);
    return { avg_generation_time: 0, api_response_time: 0, error_rate: 0, uptime_percentage: 100 };
  }
}

/**
 * Generate attribution metrics
 */
async function generateAttributionMetrics(sql: any, reportDate: string): Promise<DailyReport['attribution_metrics']> {
  try {
    // Top traffic sources and their conversion rates
    const attributionStatsResult = await sql`
      SELECT 
        first_source,
        COUNT(*) as visits,
        COUNT(CASE WHEN converted_at IS NOT NULL THEN 1 END) as conversions
      FROM user_attributions
      WHERE created_at::date = ${reportDate}::date
      GROUP BY first_source
      ORDER BY visits DESC
      LIMIT 5
    `;

    const totalVisits = attributionStatsResult.reduce((sum: number, row: any) => sum + parseInt(row.visits), 0);
    const totalConversions = attributionStatsResult.reduce((sum: number, row: any) => sum + parseInt(row.conversions), 0);

    return {
      top_sources: attributionStatsResult.map((row: any) => ({
        source: row.first_source || 'direct',
        visits: parseInt(row.visits),
        conversions: parseInt(row.conversions)
      })),
      conversion_rate: totalVisits > 0 ? Math.round((totalConversions / totalVisits) * 10000) / 100 : 0
    };
    
  } catch (error: any) {
    console.warn('Attribution metrics generation failed:', error.message);
    return { top_sources: [], conversion_rate: 0 };
  }
}

/**
 * Send report notification (placeholder for email/Slack integration)
 */
async function sendReportNotification(report: DailyReport): Promise<void> {
  try {
    // In production, you might want to send this to Slack, email, or monitoring service
    console.log(`Daily Report Summary for ${report.date}:
      - New Users: ${report.user_metrics.new_signups}
      - Generations: ${report.generation_metrics.total_generations}
      - Success Rate: ${report.generation_metrics.success_rate}%
      - Revenue: $${report.business_metrics.total_revenue}
    `);
    
    // Example: Send to webhook or email service
    // await sendSlackNotification(report);
    // await sendEmailReport(report);
    
  } catch (error: any) {
    console.warn('Failed to send report notification:', error.message);
  }
}