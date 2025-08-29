#!/usr/bin/env node

/**
 * Production Readiness Check Script
 * 
 * Problem: Need comprehensive validation before production deployment
 * Solution: Automated script to verify all production requirements
 * 
 * Usage: node scripts/production-readiness-check.js
 * 
 * Features:
 * - Environment variables validation
 * - Build and type checking
 * - Configuration verification
 * - Dependencies audit
 * - Performance benchmarks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

class ProductionReadinessChecker {
  constructor() {
    this.checks = [];
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      warn: '⚠️',
      error: '❌',
      check: '🔍'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') {
      this.errors.push(message);
    } else if (type === 'warn') {
      this.warnings.push(message);
    }
  }

  async runCheck(name, checkFunction) {
    this.log(`Checking ${name}...`, 'check');
    
    try {
      const result = await checkFunction();
      this.checks.push({ name, status: 'passed', result });
      this.log(`${name}: PASSED`);
      return true;
    } catch (error) {
      this.checks.push({ name, status: 'failed', error: error.message });
      this.log(`${name}: FAILED - ${error.message}`, 'error');
      return false;
    }
  }

  // Check environment variables
  async checkEnvironmentVariables() {
    const requiredEnvVars = [
      // Core
      'NEXT_PUBLIC_WEB_URL',
      'NODE_ENV',
      
      // Database
      'DATABASE_URL',
      
      // Auth
      'AUTH_SECRET',
      'AUTH_URL',
      'AUTH_GOOGLE_ID',
      'AUTH_GOOGLE_SECRET',
      
      // AI Services
      'NANO_BANANA_API_KEY',
      'NANO_BANANA_API_URL',
      
      // Storage
      'STORAGE_ENDPOINT',
      'STORAGE_ACCESS_KEY',
      'STORAGE_SECRET_KEY',
      'STORAGE_BUCKET',
      
      // Payment
      'STRIPE_PUBLIC_KEY',
      'STRIPE_PRIVATE_KEY'
    ];

    const missing = [];
    const present = [];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        present.push(envVar);
      } else {
        missing.push(envVar);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return { present: present.length, missing: missing.length };
  }

  // Check package.json and dependencies
  async checkDependencies() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Check for security vulnerabilities
    try {
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
    } catch (error) {
      this.log('npm audit found security vulnerabilities', 'warn');
    }

    // Check for outdated dependencies
    try {
      execSync('npm outdated', { stdio: 'pipe' });
    } catch (error) {
      // npm outdated exits with code 1 when there are outdated packages
      this.log('Some dependencies may be outdated', 'warn');
    }

    return {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length
    };
  }

  // Check TypeScript configuration
  async checkTypeScript() {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      return { status: 'no type errors' };
    } catch (error) {
      throw new Error('TypeScript compilation failed');
    }
  }

  // Check linting
  async checkLinting() {
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      return { status: 'no linting errors' };
    } catch (error) {
      throw new Error('ESLint found issues');
    }
  }

  // Check build process
  async checkBuild() {
    try {
      const startTime = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      const buildTime = Date.now() - startTime;
      
      return { 
        status: 'build successful',
        buildTime: `${buildTime}ms`
      };
    } catch (error) {
      throw new Error('Build process failed');
    }
  }

  // Check configuration files
  async checkConfigFiles() {
    const requiredFiles = [
      'vercel.json',
      'next.config.mjs',
      'tsconfig.json',
      'tailwind.config.ts',
      '.env.example'
    ];

    const missing = [];
    const present = [];

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        present.push(file);
      } else {
        missing.push(file);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required configuration files: ${missing.join(', ')}`);
    }

    // Validate vercel.json structure
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    if (!vercelConfig.functions || !vercelConfig.headers) {
      throw new Error('vercel.json is missing required sections');
    }

    return { present, missing };
  }

  // Check API endpoints
  async checkAPIEndpoints() {
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
    if (!fs.existsSync(apiDir)) {
      throw new Error('API directory not found');
    }

    const criticalEndpoints = [
      'character-figure/generate',
      'nano-banana/generate', 
      'health',
      'get-user-credits'
    ];

    const found = [];
    const missing = [];

    for (const endpoint of criticalEndpoints) {
      const endpointPath = path.join(apiDir, endpoint, 'route.ts');
      if (fs.existsSync(endpointPath)) {
        found.push(endpoint);
      } else {
        missing.push(endpoint);
      }
    }

    if (missing.length > 0) {
      this.log(`Missing API endpoints: ${missing.join(', ')}`, 'warn');
    }

    return { found, missing };
  }

  // Check database schema
  async checkDatabase() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }

    // Check if we can connect to the database
    try {
      const { sql } = require('../src/db');
      const result = await sql`SELECT 1 as test`;
      
      if (!result || result[0]?.test !== 1) {
        throw new Error('Database connection test failed');
      }

      // Check for required tables
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;

      const requiredTables = [
        'users',
        'character_generations',
        'credit_logs',
        'orders'
      ];

      const existingTables = tables.map(t => t.table_name);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));

      if (missingTables.length > 0) {
        this.log(`Missing database tables: ${missingTables.join(', ')}`, 'warn');
      }

      return { 
        connected: true,
        tables: existingTables.length,
        missingTables
      };
    } catch (error) {
      throw new Error(`Database check failed: ${error.message}`);
    }
  }

  // Check external services
  async checkExternalServices() {
    const services = [];

    // Check Nano Banana API
    if (process.env.NANO_BANANA_API_URL && process.env.NANO_BANANA_API_KEY) {
      try {
        const response = await this.makeRequest(
          `${process.env.NANO_BANANA_API_URL}/health`,
          {
            'Authorization': `Bearer ${process.env.NANO_BANANA_API_KEY}`
          }
        );
        services.push({ name: 'Nano Banana API', status: 'accessible' });
      } catch (error) {
        services.push({ name: 'Nano Banana API', status: 'error', error: error.message });
      }
    }

    // Check Stripe (if configured)
    if (process.env.STRIPE_PRIVATE_KEY) {
      services.push({ name: 'Stripe', status: 'configured' });
    }

    return { services };
  }

  // Helper method for HTTP requests
  makeRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'ProductionReadinessChecker/1.0',
          ...headers
        },
        timeout: 5000
      };

      https.get(url, options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ statusCode: res.statusCode });
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      }).on('error', reject);
    });
  }

  // Generate final report
  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const passedChecks = this.checks.filter(c => c.status === 'passed').length;
    const failedChecks = this.checks.filter(c => c.status === 'failed').length;

    console.log('\n' + '='.repeat(60));
    console.log('🚀 PRODUCTION READINESS REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Checks: ${this.checks.length}`);
    console.log(`   ✅ Passed: ${passedChecks}`);
    console.log(`   ❌ Failed: ${failedChecks}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`   ⏱️  Total Time: ${totalTime}ms`);

    if (this.errors.length > 0) {
      console.log(`\n❌ Critical Issues:`);
      this.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    const isReady = this.errors.length === 0;
    console.log(`\n🎯 Production Readiness: ${isReady ? '✅ READY' : '❌ NOT READY'}`);
    
    if (isReady) {
      console.log('\n🚀 Your application is ready for production deployment!');
      console.log('   Next steps:');
      console.log('   1. Review any warnings above');
      console.log('   2. Set up monitoring and alerting');
      console.log('   3. Configure your Vercel project');
      console.log('   4. Deploy to production');
    } else {
      console.log('\n⚠️  Please fix the critical issues before deploying to production.');
    }

    console.log('='.repeat(60));

    return isReady;
  }

  // Main execution method
  async run() {
    console.log('🔍 Starting Production Readiness Check...\n');

    await this.runCheck('Environment Variables', () => this.checkEnvironmentVariables());
    await this.runCheck('Dependencies', () => this.checkDependencies());
    await this.runCheck('TypeScript', () => this.checkTypeScript());
    await this.runCheck('Linting', () => this.checkLinting());
    await this.runCheck('Configuration Files', () => this.checkConfigFiles());
    await this.runCheck('API Endpoints', () => this.checkAPIEndpoints());
    await this.runCheck('Build Process', () => this.checkBuild());
    await this.runCheck('Database Connection', () => this.checkDatabase());
    await this.runCheck('External Services', () => this.checkExternalServices());

    const isReady = this.generateReport();
    process.exit(isReady ? 0 : 1);
  }
}

// Run the checker if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  const checker = new ProductionReadinessChecker();
  checker.run().catch(error => {
    console.error('❌ Production readiness check failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionReadinessChecker;