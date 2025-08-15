/**
 * 国际化语言配置
 * 
 * 功能说明：
 * 定义应用支持的语言和相关配置
 * 
 * @module i18n/locale
 */

import { Pathnames } from "next-intl/routing";

/**
 * 支持的语言列表
 * 
 * 目前支持：
 * - en: 英语
 * - zh: 中文
 * 
 * 扩展方法：
 * 1. 在此数组添加语言代码
 * 2. 在 messages 目录添加对应的翻译文件
 * 3. 在 localeNames 添加显示名称
 * 4. 更新 middleware.ts 的 matcher
 */
export const locales = ["en", "zh"];

/**
 * 语言显示名称映射
 * 
 * 用于在语言切换器中显示
 * key: 语言代码
 * value: 显示名称
 */
export const localeNames: any = {
  en: "English",
  zh: "中文",
};

/**
 * 默认语言
 * 
 * 使用场景：
 * - 用户首次访问时的默认语言
 * - 检测不到用户语言偏好时使用
 * - URL 中没有语言前缀时使用
 */
export const defaultLocale = "en";

/**
 * URL 语言前缀策略
 * 
 * 可选值：
 * - "always": 总是添加语言前缀（/en/about, /zh/about）
 * - "as-needed": 默认语言不添加前缀（/about, /zh/about）
 * - "never": 从不添加前缀（使用 cookie 或 header）
 * 
 * 当前策略："as-needed"
 * - 英语（默认）：/about
 * - 中文：/zh/about
 */
export const localePrefix = "as-needed";

/**
 * 自动语言检测
 * 
 * 启用时会：
 * - 检测浏览器 Accept-Language 头
 * - 根据用户偏好自动选择语言
 * - 保存选择到 cookie
 * 
 * 通过环境变量 NEXT_PUBLIC_LOCALE_DETECTION 控制
 */
export const localeDetection =
  process.env.NEXT_PUBLIC_LOCALE_DETECTION === "true";
