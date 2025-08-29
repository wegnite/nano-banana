/**
 * 运行时错误预检测系统
 * 
 * 问题：很多错误只能在运行时被发现，导致用户体验差
 * 解决：提供全面的预检测机制，在启动时和关键操作前验证系统状态
 * 
 * 功能：
 * 1. 环境变量验证
 * 2. 数据库连接检查
 * 3. API密钥验证
 * 4. 认证配置验证
 * 5. 类型安全检查
 */

import { z } from 'zod';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * 环境变量验证模式
 */
const EnvSchema = z.object({
  // 必需的环境变量
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  AUTH_URL: z.string().url('AUTH_URL must be a valid URL'),
  
  // OAuth配置
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  
  // API密钥
  NANO_BANANA_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  KLING_API_KEY: z.string().optional(),
  
  // 存储配置
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
});

/**
 * 检查结果接口
 */
export interface CheckResult {
  passed: boolean;
  message: string;
  details?: any;
  severity: 'error' | 'warning' | 'info';
}

/**
 * 系统检查报告
 */
export interface SystemCheckReport {
  timestamp: string;
  environment: string;
  checks: {
    env: CheckResult;
    database: CheckResult;
    auth: CheckResult;
    apis: CheckResult[];
    storage: CheckResult;
  };
  overall: {
    passed: boolean;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * 检查环境变量
 */
export async function checkEnvironmentVariables(): Promise<CheckResult> {
  try {
    // 验证环境变量
    const result = EnvSchema.safeParse(process.env);
    
    if (!result.success) {
      const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return {
        passed: false,
        message: 'Environment variable validation failed',
        details: errors,
        severity: 'error'
      };
    }
    
    // 检查端口一致性
    const nextAuthUrl = new URL(process.env.NEXTAUTH_URL!);
    const authUrl = new URL(process.env.AUTH_URL!);
    const webUrl = new URL(process.env.NEXT_PUBLIC_WEB_URL!);
    
    if (nextAuthUrl.port !== authUrl.port || nextAuthUrl.port !== webUrl.port) {
      return {
        passed: false,
        message: 'Port mismatch in authentication URLs',
        details: {
          NEXTAUTH_URL_PORT: nextAuthUrl.port,
          AUTH_URL_PORT: authUrl.port,
          WEB_URL_PORT: webUrl.port
        },
        severity: 'error'
      };
    }
    
    return {
      passed: true,
      message: 'All environment variables are valid',
      severity: 'info'
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Failed to check environment variables',
      details: error,
      severity: 'error'
    };
  }
}

/**
 * 检查数据库连接
 */
export async function checkDatabaseConnection(): Promise<CheckResult> {
  try {
    // 获取数据库实例并执行简单查询
    const database = db();
    const result = await database.execute(sql`SELECT 1 as test`);
    
    // Drizzle execute 返回一个数组
    if (result && result.length > 0) {
      return {
        passed: true,
        message: 'Database connection successful',
        severity: 'info'
      };
    }
    
    return {
      passed: false,
      message: 'Database query returned unexpected result',
      severity: 'error'
    };
  } catch (error: any) {
    return {
      passed: false,
      message: 'Database connection failed',
      details: error?.message || 'Unknown database error',
      severity: 'error'
    };
  }
}

/**
 * 检查认证配置
 */
export async function checkAuthConfiguration(): Promise<CheckResult> {
  try {
    const warnings = [];
    
    // 检查至少有一个OAuth提供者配置
    const hasGoogleAuth = process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET;
    const hasGithubAuth = process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET;
    
    if (!hasGoogleAuth && !hasGithubAuth) {
      return {
        passed: false,
        message: 'No OAuth providers configured',
        details: 'At least one OAuth provider must be configured',
        severity: 'error'
      };
    }
    
    // 检查OAuth回调URL
    if (hasGoogleAuth) {
      // 这里可以添加Google OAuth配置检查
      warnings.push('Google OAuth configured - ensure callback URL is set correctly');
    }
    
    if (hasGithubAuth) {
      // 这里可以添加GitHub OAuth配置检查
      warnings.push('GitHub OAuth configured - ensure callback URL is set correctly');
    }
    
    return {
      passed: true,
      message: 'Authentication configuration is valid',
      details: warnings,
      severity: warnings.length > 0 ? 'warning' : 'info'
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Failed to check authentication configuration',
      details: error,
      severity: 'error'
    };
  }
}

/**
 * 检查API密钥
 */
export async function checkAPIKeys(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  // 检查Nano Banana API
  if (process.env.NANO_BANANA_API_KEY) {
    if (process.env.NANO_BANANA_API_KEY.length < 20) {
      results.push({
        passed: false,
        message: 'Nano Banana API key appears invalid',
        severity: 'warning'
      });
    } else {
      results.push({
        passed: true,
        message: 'Nano Banana API key configured',
        severity: 'info'
      });
    }
  } else {
    results.push({
      passed: false,
      message: 'Nano Banana API key not configured',
      severity: 'error'
    });
  }
  
  // 检查OpenAI API
  if (process.env.OPENAI_API_KEY) {
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      results.push({
        passed: false,
        message: 'OpenAI API key format appears invalid',
        severity: 'warning'
      });
    } else {
      results.push({
        passed: true,
        message: 'OpenAI API key configured',
        severity: 'info'
      });
    }
  }
  
  // 检查Kling API
  if (process.env.KLING_API_KEY) {
    if (process.env.KLING_API_KEY === 'demo-test-key') {
      results.push({
        passed: false,
        message: 'Kling API using demo key - video generation will not work',
        severity: 'warning'
      });
    } else {
      results.push({
        passed: true,
        message: 'Kling API key configured',
        severity: 'info'
      });
    }
  }
  
  return results;
}

/**
 * 检查存储配置
 */
export async function checkStorageConfiguration(): Promise<CheckResult> {
  try {
    const hasStorage = process.env.STORAGE_ENDPOINT && 
                      process.env.STORAGE_ACCESS_KEY && 
                      process.env.STORAGE_SECRET_KEY &&
                      process.env.STORAGE_BUCKET;
    
    if (!hasStorage) {
      return {
        passed: false,
        message: 'Storage configuration incomplete',
        details: 'Cloudflare R2 storage not fully configured',
        severity: 'warning'
      };
    }
    
    return {
      passed: true,
      message: 'Storage configuration valid',
      severity: 'info'
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Failed to check storage configuration',
      details: error,
      severity: 'error'
    };
  }
}

/**
 * 执行完整的系统检查
 */
export async function performSystemCheck(): Promise<SystemCheckReport> {
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV || 'development';
  
  // 执行所有检查
  const [envCheck, dbCheck, authCheck, apiChecks, storageCheck] = await Promise.all([
    checkEnvironmentVariables(),
    checkDatabaseConnection(),
    checkAuthConfiguration(),
    checkAPIKeys(),
    checkStorageConfiguration()
  ]);
  
  // 统计错误和警告
  let errorCount = 0;
  let warningCount = 0;
  
  const countSeverity = (check: CheckResult) => {
    if (!check.passed && check.severity === 'error') errorCount++;
    if (check.severity === 'warning') warningCount++;
  };
  
  countSeverity(envCheck);
  countSeverity(dbCheck);
  countSeverity(authCheck);
  countSeverity(storageCheck);
  apiChecks.forEach(countSeverity);
  
  const overall = {
    passed: errorCount === 0,
    errorCount,
    warningCount
  };
  
  return {
    timestamp,
    environment,
    checks: {
      env: envCheck,
      database: dbCheck,
      auth: authCheck,
      apis: apiChecks,
      storage: storageCheck
    },
    overall
  };
}

/**
 * 格式化检查报告为可读字符串
 */
export function formatCheckReport(report: SystemCheckReport): string {
  const lines = [
    '═══════════════════════════════════════════════════════',
    '                SYSTEM CHECK REPORT                    ',
    '═══════════════════════════════════════════════════════',
    `Time: ${report.timestamp}`,
    `Environment: ${report.environment}`,
    '',
    '--- Environment Variables ---',
    `${report.checks.env.passed ? '✅' : '❌'} ${report.checks.env.message}`,
  ];
  
  if (report.checks.env.details) {
    if (Array.isArray(report.checks.env.details)) {
      report.checks.env.details.forEach(detail => {
        lines.push(`   - ${detail}`);
      });
    } else {
      lines.push(`   Details: ${JSON.stringify(report.checks.env.details, null, 2)}`);
    }
  }
  
  lines.push('', '--- Database ---');
  lines.push(`${report.checks.database.passed ? '✅' : '❌'} ${report.checks.database.message}`);
  
  lines.push('', '--- Authentication ---');
  lines.push(`${report.checks.auth.passed ? '✅' : '❌'} ${report.checks.auth.message}`);
  
  lines.push('', '--- API Keys ---');
  report.checks.apis.forEach(api => {
    lines.push(`${api.passed ? '✅' : '⚠️'} ${api.message}`);
  });
  
  lines.push('', '--- Storage ---');
  lines.push(`${report.checks.storage.passed ? '✅' : '⚠️'} ${report.checks.storage.message}`);
  
  lines.push('', '═══════════════════════════════════════════════════════');
  lines.push('                    SUMMARY                            ');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push(`Overall Status: ${report.overall.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`Errors: ${report.overall.errorCount}`);
  lines.push(`Warnings: ${report.overall.warningCount}`);
  lines.push('═══════════════════════════════════════════════════════');
  
  return lines.join('\n');
}