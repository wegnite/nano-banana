#!/usr/bin/env node

/**
 * 文档验证脚本
 * 
 * 功能：检查文档中的硬编码内容和格式问题
 * 用法：node validate-docs.js [--fix]
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');

// 定义需要检查的硬编码模式
const HARDCODED_PATTERNS = [
  // 具体项目名称
  { pattern: /Mahavatar\s+Narsimha/gi, type: 'project_name', severity: 'error' },
  { pattern: /MovieIndia/gi, type: 'project_name', severity: 'error' },
  { pattern: /Wegnite/gi, type: 'company_name', severity: 'error' },
  { pattern: /mahavatar-narsimha\.com/gi, type: 'domain', severity: 'error' },
  
  // 具体团队名称（但允许占位符格式）
  { pattern: /AI\s+ShipAny\s+Team(?!}})/gi, type: 'team_name', severity: 'warning' },
  { pattern: /AI\s+Universal\s+Generator\s+Team(?!}})/gi, type: 'team_name', severity: 'warning' },
  
  // 硬编码的URL（排除localhost和占位符）
  { 
    pattern: /https?:\/\/(?!localhost|127\.0\.0\.1|your-|example\.|docs\.|api\.|github\.com|npmjs\.com|upstash\.com)[a-z0-9-]+\.[a-z]{2,}/gi,
    type: 'hardcoded_url',
    severity: 'warning',
    exclude: ['console.upstash.com', 'api.siliconflow.cn', 'oss-cn-shanghai.aliyuncs.com']
  },
  
  // 硬编码的邮箱（排除示例邮箱）
  {
    pattern: /[a-z0-9._%+-]+@(?!example\.com|test\.com|your-)[a-z0-9.-]+\.[a-z]{2,}/gi,
    type: 'email',
    severity: 'info'
  },
  
  // 硬编码的API密钥模式
  { pattern: /sk-[a-zA-Z0-9]{40,}/g, type: 'api_key', severity: 'critical' },
  { pattern: /api_key\s*[:=]\s*["'][^"']+["']/gi, type: 'api_key', severity: 'critical' }
];

// 定义应该使用占位符的内容
const SHOULD_BE_PLACEHOLDER = [
  { text: 'your-domain.com', replacement: '{{PRODUCTION_DOMAIN}}' },
  { text: 'your-test-domain.com', replacement: '{{STAGING_DOMAIN}}' },
  { text: 'yourdomain.com', replacement: '{{PRODUCTION_DOMAIN}}' },
  { text: 'your-website.com', replacement: '{{ORG_WEBSITE}}' },
  { text: 'your-org', replacement: '{{ORG_NAME}}' },
  { text: 'your-repo', replacement: '{{REPO_NAME}}' }
];

// 统计信息
const stats = {
  filesChecked: 0,
  issues: [],
  fixed: 0
};

// 获取所有Markdown文件
const getMarkdownFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // 跳过某些目录
    if (stat.isDirectory() && !['scripts', 'node_modules', '.git'].includes(file)) {
      getMarkdownFiles(filePath, fileList);
    } else if (stat.isFile() && file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
};

// 检查文件中的硬编码内容
const checkFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const fileIssues = [];
  
  // 检查硬编码模式
  HARDCODED_PATTERNS.forEach(({ pattern, type, severity, exclude }) => {
    lines.forEach((line, index) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // 检查是否在排除列表中
          if (exclude && exclude.some(ex => match.includes(ex))) {
            return;
          }
          
          // 跳过代码块中的内容
          if (line.trim().startsWith('```') || line.trim().startsWith('`')) {
            return;
          }
          
          fileIssues.push({
            file: relativePath,
            line: index + 1,
            type,
            severity,
            match,
            content: line.trim()
          });
        });
      }
    });
  });
  
  // 检查应该使用占位符的内容
  let fixedContent = content;
  SHOULD_BE_PLACEHOLDER.forEach(({ text, replacement }) => {
    const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(content)) {
      const matches = content.match(regex);
      matches?.forEach(match => {
        fileIssues.push({
          file: relativePath,
          line: 'multiple',
          type: 'placeholder_needed',
          severity: 'warning',
          match,
          suggestion: replacement
        });
      });
      
      if (shouldFix) {
        fixedContent = fixedContent.replace(regex, replacement);
        stats.fixed++;
      }
    }
  });
  
  // 如果启用了修复模式且有修改，写回文件
  if (shouldFix && fixedContent !== content) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`🔧 Fixed: ${relativePath}`);
  }
  
  return fileIssues;
};

// 输出报告
const generateReport = () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 文档验证报告');
  console.log('='.repeat(60) + '\n');
  
  if (stats.issues.length === 0) {
    console.log('✅ 没有发现硬编码问题！');
    return;
  }
  
  // 按严重程度分组
  const grouped = {
    critical: [],
    error: [],
    warning: [],
    info: []
  };
  
  stats.issues.forEach(issue => {
    grouped[issue.severity].push(issue);
  });
  
  // 输出各级别的问题
  Object.entries(grouped).forEach(([severity, issues]) => {
    if (issues.length === 0) return;
    
    const icon = {
      critical: '🚨',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[severity];
    
    console.log(`\n${icon} ${severity.toUpperCase()} (${issues.length} issues)`);
    console.log('-'.repeat(40));
    
    issues.forEach(issue => {
      console.log(`📄 ${issue.file}:${issue.line}`);
      console.log(`   类型: ${issue.type}`);
      console.log(`   匹配: "${issue.match}"`);
      if (issue.suggestion) {
        console.log(`   建议: 使用 ${issue.suggestion}`);
      }
      if (issue.content && issue.line !== 'multiple') {
        console.log(`   内容: ${issue.content.substring(0, 80)}...`);
      }
      console.log('');
    });
  });
  
  // 输出统计
  console.log('\n' + '='.repeat(60));
  console.log('📈 统计信息');
  console.log('-'.repeat(40));
  console.log(`文件检查数: ${stats.filesChecked}`);
  console.log(`发现问题数: ${stats.issues.length}`);
  console.log(`  - 严重: ${grouped.critical.length}`);
  console.log(`  - 错误: ${grouped.error.length}`);
  console.log(`  - 警告: ${grouped.warning.length}`);
  console.log(`  - 信息: ${grouped.info.length}`);
  
  if (shouldFix) {
    console.log(`\n修复数量: ${stats.fixed}`);
  }
  
  console.log('='.repeat(60) + '\n');
  
  // 返回是否有严重问题
  return grouped.critical.length > 0 || grouped.error.length > 0;
};

// 主函数
const main = () => {
  console.log('🔍 开始验证文档...\n');
  
  if (shouldFix) {
    console.log('🔧 修复模式已启用\n');
  }
  
  const docsDir = path.join(__dirname, '..');
  const files = getMarkdownFiles(docsDir);
  
  console.log(`📁 找到 ${files.length} 个 Markdown 文件\n`);
  
  files.forEach(file => {
    const issues = checkFile(file);
    if (issues.length > 0) {
      stats.issues.push(...issues);
    }
    stats.filesChecked++;
  });
  
  const hasErrors = generateReport();
  
  // 保存报告
  const reportPath = path.join(__dirname, '../.validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    filesChecked: stats.filesChecked,
    issueCount: stats.issues.length,
    fixed: stats.fixed,
    issues: stats.issues
  }, null, 2));
  
  console.log(`📝 详细报告已保存到: .validation-report.json\n`);
  
  // 如果有严重问题，退出码为1
  if (hasErrors && !shouldFix) {
    console.log('❌ 发现严重问题，请修复后再提交！');
    process.exit(1);
  }
};

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { checkFile, HARDCODED_PATTERNS };