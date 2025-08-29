#!/usr/bin/env node

/**
 * 启动时系统自检脚本
 * 
 * 问题：运行时错误只能在用户操作时发现
 * 解决：在服务启动时执行全面的系统检查
 * 
 * 使用方法：
 * - 开发环境：npm run dev 之前自动执行
 * - 生产环境：容器启动时执行
 */

import { performSystemCheck, formatCheckReport } from '../src/lib/runtime-check.js';
const chalk = require('chalk');
import { config } from 'dotenv';
import path from 'path';

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  console.log(chalk.blue.bold('\n🚀 Starting System Pre-flight Check...\n'));
  
  try {
    // 执行系统检查
    const report = await performSystemCheck();
    
    // 打印报告
    console.log(formatCheckReport(report));
    
    // 根据结果决定是否继续
    if (!report.overall.passed) {
      console.log(chalk.red.bold('\n❌ System check failed! Please fix the errors above.\n'));
      
      // 提供修复建议
      console.log(chalk.yellow('📝 Quick fixes:\n'));
      
      if (report.checks.env.details) {
        console.log(chalk.yellow('1. Check your .env.local file for missing variables'));
      }
      
      if (!report.checks.database.passed) {
        console.log(chalk.yellow('2. Ensure DATABASE_URL is correct and database is running'));
      }
      
      if (!report.checks.auth.passed) {
        console.log(chalk.yellow('3. Configure at least one OAuth provider (Google or GitHub)'));
      }
      
      report.checks.apis.forEach(api => {
        if (!api.passed && api.severity === 'error') {
          console.log(chalk.yellow(`4. ${api.message}`));
        }
      });
      
      // 在开发环境下，询问是否继续
      if (process.env.NODE_ENV === 'development') {
        console.log(chalk.yellow('\n⚠️  Development mode: The server will start despite errors.'));
        console.log(chalk.yellow('   Some features may not work correctly.\n'));
      } else {
        // 生产环境下，阻止启动
        process.exit(1);
      }
    } else if (report.overall.warningCount > 0) {
      console.log(chalk.yellow.bold(`\n⚠️  System check passed with ${report.overall.warningCount} warning(s)\n`));
    } else {
      console.log(chalk.green.bold('\n✅ All system checks passed! Ready to start.\n'));
    }
    
    // 特殊检查：认证端口一致性
    checkPortConsistency();
    
    // 检查关键功能
    await checkCriticalFeatures();
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Failed to perform system check:\n'));
    console.error(error);
    
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  }
}

/**
 * 检查端口一致性
 */
function checkPortConsistency() {
  const urls = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_URL: process.env.AUTH_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL
  };
  
  const ports = new Set();
  let hasError = false;
  
  Object.entries(urls).forEach(([key, value]) => {
    if (value) {
      try {
        const url = new URL(value);
        ports.add(url.port || (url.protocol === 'https:' ? '443' : '80'));
      } catch {
        console.log(chalk.red(`❌ Invalid URL in ${key}: ${value}`));
        hasError = true;
      }
    }
  });
  
  if (ports.size > 1 && !hasError) {
    console.log(chalk.red('❌ Port mismatch detected!'));
    console.log(chalk.yellow('   All auth URLs should use the same port.'));
    console.log(chalk.yellow(`   Found ports: ${Array.from(ports).join(', ')}`));
    console.log(chalk.yellow('\n   Fix: Update .env.local to use consistent ports'));
  }
}

/**
 * 检查关键功能
 */
async function checkCriticalFeatures() {
  console.log(chalk.blue('\n🔍 Checking critical features...\n'));
  
  const features = [
    {
      name: 'Character Figure Generation',
      check: () => !!process.env.NANO_BANANA_API_KEY && process.env.NANO_BANANA_API_KEY !== 'demo-test-key',
      error: 'Nano Banana API key not configured'
    },
    {
      name: 'Authentication',
      check: () => (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) || 
                   (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
      error: 'No OAuth providers configured'
    },
    {
      name: 'Database',
      check: () => !!process.env.DATABASE_URL,
      error: 'Database URL not configured'
    },
    {
      name: 'Video Generation',
      check: () => process.env.KLING_API_KEY && process.env.KLING_API_KEY !== 'demo-test-key',
      error: 'Kling API key not configured (video generation will not work)'
    }
  ];
  
  features.forEach(feature => {
    if (feature.check()) {
      console.log(chalk.green(`✅ ${feature.name}`));
    } else {
      console.log(chalk.yellow(`⚠️  ${feature.name}: ${feature.error}`));
    }
  });
  
  console.log('');
}

// 执行主函数
main().catch(error => {
  console.error(chalk.red.bold('Fatal error during startup check:'));
  console.error(error);
  process.exit(1);
});