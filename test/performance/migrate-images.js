#!/usr/bin/env node

/**
 * 自动迁移 <img> 标签到 Next.js Image 组件
 * 
 * 功能：批量将项目中的 <img> 标签替换为优化的 Next.js Image 组件
 * 运行：node test/performance/migrate-images.js [--dry-run]
 * 
 * 注意：建议先使用 --dry-run 查看将要修改的内容
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  srcDir: path.join(__dirname, '../../src'),
  extensions: ['.tsx', '.jsx'],
  dryRun: process.argv.includes('--dry-run'),
  defaultImageSizes: {
    width: 500,
    height: 300,
  },
  // 特定路径的图片尺寸映射
  sizeMapping: {
    'logo': { width: 200, height: 60 },
    'avatar': { width: 100, height: 100 },
    'hero': { width: 1200, height: 600 },
    'thumbnail': { width: 300, height: 200 },
    'icon': { width: 32, height: 32 },
  }
};

// 统计信息
let stats = {
  filesProcessed: 0,
  imagesFound: 0,
  imagesMigrated: 0,
  errors: [],
  skipped: [],
};

/**
 * 根据 src 路径推测图片尺寸
 */
function inferImageSize(src, className = '') {
  // 检查路径中的关键词
  for (const [keyword, size] of Object.entries(config.sizeMapping)) {
    if (src.toLowerCase().includes(keyword) || className.toLowerCase().includes(keyword)) {
      return size;
    }
  }
  
  // 检查 className 中的尺寸提示
  if (className) {
    // Tailwind 类名匹配
    const widthMatch = className.match(/w-(\d+)/);
    const heightMatch = className.match(/h-(\d+)/);
    if (widthMatch && heightMatch) {
      return {
        width: parseInt(widthMatch[1]) * 4, // Tailwind 单位转像素
        height: parseInt(heightMatch[1]) * 4,
      };
    }
  }
  
  return config.defaultImageSizes;
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  const relativePath = path.relative(config.srcDir, filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // 跳过已经使用 Next Image 的文件
  if (content.includes('from "next/image"') || content.includes("from 'next/image'")) {
    stats.skipped.push(relativePath);
    return;
  }
  
  // 查找所有 img 标签
  const imgRegex = /<img\s+([^>]*?)\/?>(?:<\/img>)?/g;
  let matches = [];
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      attributes: match[1],
      index: match.index,
    });
    stats.imagesFound++;
  }
  
  if (matches.length === 0) return;
  
  console.log(`\n📄 Processing: ${relativePath}`);
  console.log(`   Found ${matches.length} <img> tags`);
  
  // 从后往前替换，避免索引错位
  matches.reverse().forEach((imgMatch) => {
    try {
      // 提取属性
      const attrs = parseAttributes(imgMatch.attributes);
      
      // 跳过已经是 Image 组件的
      if (attrs.src && attrs.src.startsWith('{')) {
        console.log(`   ⏭️  Skipping dynamic src: ${attrs.src}`);
        return;
      }
      
      // 推测尺寸
      const size = inferImageSize(attrs.src || '', attrs.className || '');
      
      // 构建 Next Image 组件
      const nextImage = buildNextImageTag(attrs, size);
      
      // 替换
      content = 
        content.substring(0, imgMatch.index) + 
        nextImage + 
        content.substring(imgMatch.index + imgMatch.fullMatch.length);
      
      stats.imagesMigrated++;
      console.log(`   ✅ Migrated: ${attrs.src || 'unknown'}`);
    } catch (error) {
      stats.errors.push({ file: relativePath, error: error.message });
      console.log(`   ❌ Error: ${error.message}`);
    }
  });
  
  // 添加 import 语句（如果需要）
  if (stats.imagesMigrated > 0 && !content.includes('import Image from')) {
    // 查找最后一个 import 语句的位置
    const importRegex = /^import\s+.*$/gm;
    let lastImportIndex = -1;
    let importMatch;
    
    while ((importMatch = importRegex.exec(content)) !== null) {
      lastImportIndex = importMatch.index + importMatch[0].length;
    }
    
    if (lastImportIndex > -1) {
      content = 
        content.substring(0, lastImportIndex) + 
        '\nimport Image from "next/image";' + 
        content.substring(lastImportIndex);
    } else {
      // 如果没有 import，添加到文件开头
      content = 'import Image from "next/image";\n\n' + content;
    }
  }
  
  // 写入文件（或预览）
  if (config.dryRun) {
    console.log('\n   🔍 Preview changes (dry run):');
    // 显示差异
    if (content !== originalContent) {
      console.log('   File would be modified');
    }
  } else {
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('   💾 File updated');
    }
  }
  
  stats.filesProcessed++;
}

/**
 * 解析 HTML 属性字符串
 */
function parseAttributes(attrString) {
  const attrs = {};
  const regex = /(\w+)(?:="([^"]*)"|='([^']*)'|=(\S+))?/g;
  let match;
  
  while ((match = regex.exec(attrString)) !== null) {
    const key = match[1];
    const value = match[2] || match[3] || match[4] || true;
    attrs[key] = value;
  }
  
  return attrs;
}

/**
 * 构建 Next.js Image 组件标签
 */
function buildNextImageTag(attrs, size) {
  const props = [];
  
  // src - 必需
  if (attrs.src) {
    props.push(`src="${attrs.src}"`);
  } else if (attrs['data-src']) {
    props.push(`src="${attrs['data-src']}"`);
  }
  
  // alt - 必需（可以为空）
  props.push(`alt="${attrs.alt || ''}"`);
  
  // 尺寸
  props.push(`width={${size.width}}`);
  props.push(`height={${size.height}}`);
  
  // className
  if (attrs.className) {
    props.push(`className="${attrs.className}"`);
  }
  
  // 其他有用的属性
  if (attrs.title) {
    props.push(`title="${attrs.title}"`);
  }
  
  // 性能优化属性
  props.push(`loading="lazy"`);
  
  // 对于小图片，添加 placeholder
  if (size.width < 200 && size.height < 200) {
    props.push(`placeholder="blur"`);
    props.push(`blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size.width} ${size.height}'%3E%3Crect fill='%23f0f0f0'/%3E%3C/svg%3E"`);
  }
  
  // 如果是外部图片，可能需要 unoptimized
  if (attrs.src && (attrs.src.startsWith('http://') || attrs.src.startsWith('https://'))) {
    // 已在 next.config.js 中配置了 remotePatterns，不需要 unoptimized
  }
  
  return `<Image\n        ${props.join('\n        ')}\n      />`;
}

/**
 * 递归搜索文件
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .next
      if (!file.startsWith('.') && file !== 'node_modules') {
        findFiles(filePath, fileList);
      }
    } else {
      // 检查文件扩展名
      if (config.extensions.some(ext => file.endsWith(ext))) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 Next.js Image Migration Tool');
  console.log('================================\n');
  
  if (config.dryRun) {
    console.log('🔍 Running in DRY RUN mode - no files will be modified\n');
  }
  
  // 查找所有文件
  console.log('📂 Scanning for files...');
  const files = findFiles(config.srcDir);
  console.log(`   Found ${files.length} ${config.extensions.join(', ')} files\n`);
  
  // 处理每个文件
  files.forEach(processFile);
  
  // 输出统计
  console.log('\n\n📊 Migration Summary');
  console.log('====================');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Images found: ${stats.imagesFound}`);
  console.log(`Images migrated: ${stats.imagesMigrated}`);
  console.log(`Files skipped: ${stats.skipped.length}`);
  console.log(`Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(err => {
      console.log(`   ${err.file}: ${err.error}`);
    });
  }
  
  if (config.dryRun) {
    console.log('\n💡 To apply changes, run without --dry-run flag:');
    console.log('   node test/performance/migrate-images.js');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('   Remember to test your application after these changes.');
  }
  
  // 额外建议
  if (stats.imagesMigrated > 0) {
    console.log('\n📝 Next Steps:');
    console.log('1. Review the image sizes in the migrated components');
    console.log('2. Add proper alt texts for accessibility');
    console.log('3. Consider using priority={true} for above-fold images');
    console.log('4. Test responsive behavior on different screen sizes');
    console.log('5. Run npm run build to check for any build errors');
  }
}

// 运行脚本
if (require.main === module) {
  main();
}