/**
 * 动态Sitemap生成器
 * 
 * 功能：为Google搜索引擎生成完整的网站地图
 * 包含：所有页面、博客文章、画廊内容的索引
 */

import { MetadataRoute } from 'next';

// 支持的语言列表
const locales = ['en', 'zh', 'ja', 'es', 'fr', 'de'];

// 基础URL
const baseUrl = 'https://characterfigure.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();
  
  // 核心页面 - 最高优先级
  const corePages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/generate/character-figure`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/generate/video`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];
  
  // 法律页面 - AdSense必需
  const legalPages = [
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookie-policy`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];
  
  // 工具页面
  const toolPages = [
    {
      url: `${baseUrl}/tools/prompt-generator`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/style-mixer`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/batch-processor`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ];
  
  // 博客文章 - 动态生成
  const blogPosts = [
    'how-to-create-perfect-character-figures-with-ai',
    'top-10-character-figure-styles-trending',
    'character-figure-design-concept-to-reality',
    'ai-vs-traditional-character-design',
    'monetizing-character-figure-creations',
    'character-figures-in-gaming-entertainment',
    'building-professional-character-portfolio',
  ].map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  
  // 画廊分类页面
  const galleryCategories = [
    'trending',
    'featured',
    'anime',
    'realistic',
    'fantasy',
    'sci-fi',
  ].map(category => ({
    url: `${baseUrl}/gallery/${category}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));
  
  // 静态文件 - ads.txt也需要包含
  const staticFiles = [
    {
      url: `${baseUrl}/ads.txt`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];
  
  // 为每种语言生成URL
  const localizedPages = locales.flatMap(locale => 
    corePages.map(page => ({
      ...page,
      url: locale === 'en' ? page.url : `${baseUrl}/${locale}${page.url.replace(baseUrl, '')}`,
      priority: locale === 'en' ? page.priority : page.priority * 0.8, // 非英文页面略低优先级
    }))
  );
  
  // 合并所有页面
  const allPages = [
    ...corePages,
    ...legalPages,
    ...toolPages,
    ...blogPosts,
    ...galleryCategories,
    ...staticFiles,
    ...localizedPages,
  ];
  
  // 去重（避免重复的英文页面）
  const uniqueUrls = new Set();
  const uniquePages = allPages.filter(page => {
    if (uniqueUrls.has(page.url)) {
      return false;
    }
    uniqueUrls.add(page.url);
    return true;
  });
  
  return uniquePages;
}