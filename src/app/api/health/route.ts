/**
 * Health Check API Route
 * 
 * Problem: Need comprehensive health monitoring for production deployment
 * Solution: Create health check endpoint for system status monitoring
 * 
 * Endpoint: GET /api/health
 * Features:
 * - System status check
 * - Database connectivity
 * - External API status
 * - Performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { respData, respErr } from '@/lib/resp';
import { performSystemCheck, formatCheckReport } from '@/lib/runtime-check';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheck;
    storage: HealthCheck;
    ai_services: HealthCheck;
    payment: HealthCheck;
  };
  metrics: {
    memory_usage: number;
    response_time: number;
  };
}

interface HealthCheck {
  status: 'ok' | 'error' | 'warning';
  response_time?: number;
  error?: string;
  last_check?: string;
}

/**
 * GET /api/health
 * Comprehensive health check for all system components
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: await checkDatabase(),
        storage: await checkStorage(),
        ai_services: await checkAIServices(),
        payment: await checkPayment(),
      },
      metrics: {
        memory_usage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        response_time: Date.now() - startTime,
      }
    };

    // Determine overall system status
    const allChecks = Object.values(healthStatus.checks);
    if (allChecks.some(check => check.status === 'error')) {
      healthStatus.status = 'unhealthy';
    } else if (allChecks.some(check => check.status === 'warning')) {
      healthStatus.status = 'degraded';
    }

    // Return appropriate HTTP status code
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    });
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Import database connection dynamically to avoid issues
    const postgres = (await import('postgres')).default;
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Simple query to test connectivity
    const result = await sql`SELECT 1 as test`;
    await sql.end(); // 关闭数据库连接
    
    if (result.length === 1 && result[0].test === 1) {
      return {
        status: 'ok',
        response_time: Date.now() - startTime,
        last_check: new Date().toISOString()
      };
    } else {
      return {
        status: 'error',
        response_time: Date.now() - startTime,
        error: 'Unexpected database response',
        last_check: new Date().toISOString()
      };
    }
    
  } catch (error: any) {
    return {
      status: 'error',
      response_time: Date.now() - startTime,
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
}

/**
 * Check Cloudflare R2 storage connectivity
 */
async function checkStorage(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.STORAGE_ENDPOINT || !process.env.STORAGE_ACCESS_KEY) {
      return {
        status: 'warning',
        response_time: Date.now() - startTime,
        error: 'Storage configuration missing',
        last_check: new Date().toISOString()
      };
    }

    // For now, just check if environment variables are configured
    // In production, you might want to do an actual API call
    return {
      status: 'ok',
      response_time: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
    
  } catch (error: any) {
    return {
      status: 'error',
      response_time: Date.now() - startTime,
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
}

/**
 * Check AI services connectivity
 */
async function checkAIServices(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const requiredServices = {
      nano_banana: process.env.NANO_BANANA_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
    };

    const missingServices = Object.entries(requiredServices)
      .filter(([_, key]) => !key)
      .map(([service, _]) => service);

    if (missingServices.length > 0) {
      return {
        status: 'warning',
        response_time: Date.now() - startTime,
        error: `Missing API keys: ${missingServices.join(', ')}`,
        last_check: new Date().toISOString()
      };
    }

    // Check Nano Banana API connectivity
    if (process.env.NANO_BANANA_API_KEY && process.env.NANO_BANANA_API_URL) {
      try {
        const response = await fetch(`${process.env.NANO_BANANA_API_URL}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.NANO_BANANA_API_KEY}`,
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
          return {
            status: 'warning',
            response_time: Date.now() - startTime,
            error: `Nano Banana API responded with status ${response.status}`,
            last_check: new Date().toISOString()
          };
        }
      } catch (fetchError: any) {
        // Nano Banana API might not have a health endpoint, so treat as warning
        return {
          status: 'warning',
          response_time: Date.now() - startTime,
          error: `Nano Banana API check failed: ${fetchError.message}`,
          last_check: new Date().toISOString()
        };
      }
    }

    return {
      status: 'ok',
      response_time: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
    
  } catch (error: any) {
    return {
      status: 'error',
      response_time: Date.now() - startTime,
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
}

/**
 * Check payment service (Stripe) connectivity
 */
async function checkPayment(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.STRIPE_PRIVATE_KEY) {
      return {
        status: 'warning',
        response_time: Date.now() - startTime,
        error: 'Stripe configuration missing',
        last_check: new Date().toISOString()
      };
    }

    // For now, just check if environment variables are configured
    // In production, you might want to verify Stripe connectivity
    return {
      status: 'ok',
      response_time: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
    
  } catch (error: any) {
    return {
      status: 'error',
      response_time: Date.now() - startTime,
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
}

/**
 * GET /api/health/ping
 * Simple ping endpoint for basic uptime monitoring
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    }
  });
}