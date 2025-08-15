/**
 * Next.js 中间件配置文件
 * 
 * 功能说明：
 * 1. 处理国际化（i18n）路由
 * 2. 自动根据用户语言偏好重定向到对应的语言版本
 * 3. 确保所有页面路由都带有正确的语言前缀
 * 
 * 工作原理：
 * - 使用 next-intl 的中间件创建器
 * - 基于 routing 配置自动处理语言切换
 * - 在请求到达页面组件之前进行处理
 * 
 * @module middleware
 */
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * 创建并导出中间件实例
 * 该中间件会自动处理：
 * - 语言检测（从 Accept-Language 头）
 * - URL 重定向（添加语言前缀）
 * - Cookie 设置（保存用户语言偏好）
 */
export default createMiddleware(routing);

/**
 * 中间件配置
 * 定义哪些路径需要经过中间件处理
 */
export const config = {
  matcher: [
    // 根路径
    "/",
    // 所有支持的语言路径
    // 包括：英语、中文（各地区）、日语、韩语、俄语、法语、德语、阿拉伯语、西班牙语、意大利语
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    // 排除特定路径：
    // - privacy-policy, terms-of-service: 法律页面，不需要语言前缀
    // - api/: API 路由不需要国际化
    // - _next, _vercel: Next.js 和 Vercel 内部路径
    // - .*\\..*: 静态文件（带扩展名的文件）
    "/((?!privacy-policy|terms-of-service|api/|_next|_vercel|.*\\..*).*)",
  ],
};
