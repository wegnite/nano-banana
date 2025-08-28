#!/usr/bin/env node

/**
 * 文档变量替换脚本
 * 
 * 功能：将文档中的占位符替换为实际配置值
 * 用法：node replace-variables.js [--env=production|staging|local]
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const environment = envArg ? envArg.split('=')[1] : 'local';

console.log(`🔧 Using environment: ${environment}`);

// 加载项目配置
const configPath = path.join(__dirname, '../config/project.config.json');
let config = {};

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('❌ Failed to load project.config.json:', error.message);
  process.exit(1);
}

// 构建变量映射
const buildVariableMapping = () => {
  const mapping = {};
  
  // 项目基础信息
  mapping['PROJECT_NAME'] = process.env.PROJECT_NAME || config.project?.name || 'ai-universal-generator';
  mapping['PROJECT_DISPLAY_NAME'] = process.env.PROJECT_DISPLAY_NAME || config.project?.displayName || 'AI通用生成器';
  mapping['PROJECT_VERSION'] = process.env.PROJECT_VERSION || config.project?.version || '2.6.0';
  mapping['PROJECT_DESCRIPTION'] = process.env.PROJECT_DESCRIPTION || config.project?.description || '';
  
  // 组织信息
  mapping['ORG_NAME'] = process.env.ORG_NAME || config.organization?.name || '您的组织';
  mapping['TEAM_NAME'] = process.env.TEAM_NAME || config.organization?.team || '开发团队';
  mapping['ORG_WEBSITE'] = process.env.ORG_WEBSITE || config.organization?.website || 'https://example.com';
  mapping['GITHUB_URL'] = process.env.GITHUB_URL || config.organization?.github || 'https://github.com/your-org/your-repo';
  
  // 部署相关
  const deployConfig = config.deployment?.[environment] || config.deployment?.local || {};
  mapping['PRODUCTION_DOMAIN'] = process.env.NEXT_PUBLIC_WEB_URL || deployConfig.domain || 'https://your-domain.com';
  mapping['API_URL'] = process.env.API_URL || deployConfig.apiUrl || 'https://api.your-domain.com';
  mapping['LOCAL_PORT'] = process.env.PORT || deployConfig.port || 3000;
  
  // 支付配置
  mapping['PRIMARY_PAYMENT_PROVIDER'] = process.env.PRIMARY_PAYMENT_PROVIDER || config.payment?.providers?.primary || 'stripe';
  mapping['SECONDARY_PAYMENT_PROVIDER'] = process.env.SECONDARY_PAYMENT_PROVIDER || config.payment?.providers?.secondary || 'custom';
  mapping['PAYMENT_SUCCESS_URL'] = `${mapping['PRODUCTION_DOMAIN']}${config.payment?.webhooks?.success || '/pay-success'}`;
  mapping['PAYMENT_CANCEL_URL'] = `${mapping['PRODUCTION_DOMAIN']}${config.payment?.webhooks?.cancel || '/pricing'}`;
  mapping['PAYMENT_NOTIFY_URL'] = `${mapping['PRODUCTION_DOMAIN']}${config.payment?.webhooks?.notify || '/api/pay/notify'}`;
  
  // 文档相关
  mapping['DOCS_BASE_URL'] = process.env.DOCS_BASE_URL || config.documentation?.baseUrl || 'https://docs.your-domain.com';
  mapping['API_DOCS_URL'] = process.env.API_DOCS_URL || config.documentation?.apiDocs || 'https://api-docs.your-domain.com';
  mapping['LAST_UPDATED'] = new Date().toISOString().split('T')[0];
  mapping['MAINTAINER'] = config.documentation?.maintainer || mapping['TEAM_NAME'];
  
  return mapping;
};

// 获取所有Markdown文件
const getMarkdownFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // 跳过config和scripts目录
    if (stat.isDirectory() && !['config', 'scripts', 'node_modules', '.git'].includes(file)) {
      getMarkdownFiles(filePath, fileList);
    } else if (stat.isFile() && file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
};

// 替换文件中的变量
const replaceVariablesInFile = (filePath, mapping) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let replacementCount = 0;
    
    // 替换所有 {{VARIABLE}} 格式的占位符
    Object.entries(mapping).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const matches = content.match(regex);
      if (matches) {
        replacementCount += matches.length;
        content = content.replace(regex, value);
      }
    });
    
    if (replacementCount > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '..'), filePath);
      console.log(`✅ Processed: ${relativePath} (${replacementCount} replacements)`);
      return replacementCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
};

// 主函数
const main = () => {
  console.log('🚀 Starting document variable replacement...\n');
  
  const mapping = buildVariableMapping();
  const docsDir = path.join(__dirname, '..');
  const files = getMarkdownFiles(docsDir);
  
  console.log(`📁 Found ${files.length} markdown files\n`);
  
  let totalReplacements = 0;
  let processedFiles = 0;
  
  files.forEach(file => {
    const replacements = replaceVariablesInFile(file, mapping);
    if (replacements > 0) {
      totalReplacements += replacements;
      processedFiles++;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`✨ Processing complete!`);
  console.log(`📊 Statistics:`);
  console.log(`   - Files processed: ${processedFiles}/${files.length}`);
  console.log(`   - Total replacements: ${totalReplacements}`);
  console.log(`   - Environment: ${environment}`);
  console.log('='.repeat(50));
  
  // 保存处理日志
  const logPath = path.join(__dirname, '../.last-process.log');
  const logContent = {
    timestamp: new Date().toISOString(),
    environment,
    filesProcessed: processedFiles,
    totalReplacements,
    mapping: Object.keys(mapping)
  };
  
  fs.writeFileSync(logPath, JSON.stringify(logContent, null, 2));
  console.log(`\n📝 Process log saved to: .last-process.log`);
};

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { buildVariableMapping, replaceVariablesInFile };