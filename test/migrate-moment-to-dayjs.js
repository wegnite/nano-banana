#!/usr/bin/env node

/**
 * 迁移脚本：将 moment.js 替换为 dayjs
 * 
 * 功能：
 * - 自动替换所有 moment 导入为 dayjs
 * - 配置 dayjs 插件以保持兼容性
 * - 创建 dayjs 配置文件
 */

const fs = require('fs');
const path = require('path');

// 需要替换的文件列表
const filesToMigrate = [
  'src/app/[locale]/(admin)/admin/orders/page.tsx',
  'src/contexts/app.tsx',
  'src/app/[locale]/(admin)/admin/feedbacks/page.tsx',
  'src/app/[locale]/(admin)/admin/users/page.tsx',
  'src/app/[locale]/(admin)/admin/posts/page.tsx',
  'src/app/[locale]/(default)/(console)/my-credits/page.tsx',
  'src/app/[locale]/(default)/(console)/my-invites/page.tsx',
  'src/app/[locale]/(default)/(console)/my-orders/page.tsx',
  'src/app/[locale]/(default)/(console)/api-keys/page.tsx',
  'src/components/blocks/blog-detail/index.tsx',
  'src/components/blocks/table/time.tsx'
];

// 创建 dayjs 配置文件
const dayjsConfigContent = `/**
 * Dayjs 全局配置
 * 配置插件以兼容 moment.js 的功能
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/zh-cn';

// 扩展插件
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(duration);

// 设置默认语言
dayjs.locale('en');

export default dayjs;
`;

// 替换规则
const replacements = [
  // 替换导入语句
  { from: /import moment from ["']moment["']/g, to: 'import dayjs from "@/lib/dayjs"' },
  
  // 替换 API 调用
  { from: /moment\((.*?)\)\.format\((.*?)\)/g, to: 'dayjs($1).format($2)' },
  { from: /moment\((.*?)\)\.fromNow\(\)/g, to: 'dayjs($1).fromNow()' },
  { from: /moment\((.*?)\)\.unix\(\)/g, to: 'dayjs($1).unix()' },
  { from: /moment\(\)\.unix\(\)/g, to: 'dayjs().unix()' },
  { from: /moment\((.*?)\)/g, to: 'dayjs($1)' },
  { from: /moment\(\)/g, to: 'dayjs()' }
];

function migrateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;
  
  // 应用所有替换规则
  replacements.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ 已迁移: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  无需修改: ${filePath}`);
    return false;
  }
}

function createDayjsConfig() {
  const configPath = path.join(process.cwd(), 'src/lib/dayjs.ts');
  const libDir = path.join(process.cwd(), 'src/lib');
  
  // 确保 lib 目录存在
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, dayjsConfigContent, 'utf-8');
  console.log('✅ 已创建 dayjs 配置文件: src/lib/dayjs.ts');
}

function main() {
  console.log('🚀 开始迁移 moment.js 到 dayjs...\n');
  
  // 创建 dayjs 配置
  createDayjsConfig();
  
  // 迁移所有文件
  console.log('\n📝 迁移文件...\n');
  let successCount = 0;
  
  filesToMigrate.forEach(file => {
    if (migrateFile(file)) {
      successCount++;
    }
  });
  
  console.log(`\n✨ 迁移完成！成功迁移 ${successCount}/${filesToMigrate.length} 个文件`);
  console.log('\n📋 后续步骤：');
  console.log('1. 安装必要的 dayjs 插件：pnpm add dayjs');
  console.log('2. 运行测试确保功能正常：npm run build');
  console.log('3. 卸载 moment：pnpm remove moment');
}

// 运行脚本
main();