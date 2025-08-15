/**
 * 国际化路由配置
 * 
 * 功能说明：
 * 定义应用的多语言路由规则
 * 与 middleware.ts 配合使用实现自动语言切换
 * 
 * 工作原理：
 * 1. 根据用户浏览器语言偏好自动选择语言
 * 2. 在 URL 中添加语言前缀（如 /zh/about）
 * 3. 保存用户语言选择到 cookie
 * 
 * @module i18n/routing
 */

import {
  defaultLocale,
  localeDetection,
  localePrefix,
  locales,
} from "./locale";

import { defineRouting } from "next-intl/routing";

/**
 * 定义国际化路由规则
 * 
 * 配置项说明：
 * - locales: 支持的语言列表
 * - defaultLocale: 默认语言
 * - localePrefix: URL 前缀策略
 * - localeDetection: 是否启用自动语言检测
 * 
 * 这个配置会被：
 * - middleware.ts 使用（处理路由重定向）
 * - 页面组件使用（获取当前语言）
 * - Link 组件使用（生成正确的链接）
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix,
  localeDetection,
});
