/**
 * 认证（Authentication）工具函数库
 * 
 * 功能说明：
 * 提供统一的认证状态检查函数，用于判断各种认证方式是否启用
 * 
 * 支持的认证方式：
 * - Google OAuth 登录
 * - GitHub OAuth 登录  
 * - Google One-Tap 快速登录
 * 
 * @module lib/auth
 */

/**
 * 检查是否启用了任意一种认证方式
 * 
 * 判断逻辑：
 * 1. 检查是否有任何一种认证方式被设置为 "true"
 * 2. 确保 AUTH_ENABLED 没有被明确设置为 "false"（优先级最高）
 * 
 * @returns {boolean} true 表示认证功能已启用
 * 
 * 使用场景：
 * - 决定是否显示登录按钮
 * - 判断是否需要初始化认证相关组件
 * - 控制受保护路由的访问
 */
export function isAuthEnabled(): boolean {
  return (
    !!(
      process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" ||
      process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" ||
      process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" ||
      process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true"
    ) && !!(process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false")
  );
}

/**
 * 检查 Google OAuth 登录是否启用
 * 
 * 前提条件：
 * 1. NEXT_PUBLIC_AUTH_GOOGLE_ENABLED 设置为 "true"
 * 2. NEXT_PUBLIC_AUTH_GOOGLE_ID 必须存在（Google OAuth 客户端 ID）
 * 
 * @returns {boolean} true 表示 Google 登录可用
 * 
 * 配置要求：
 * - 需要在 Google Cloud Console 创建 OAuth 2.0 客户端
 * - 设置正确的重定向 URI
 */
export function isGoogleAuthEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" &&
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
  );
}

/**
 * 检查 GitHub OAuth 登录是否启用
 * 
 * @returns {boolean} true 表示 GitHub 登录可用
 * 
 * 配置要求：
 * - 需要在 GitHub 创建 OAuth App
 * - 配置 Client ID 和 Client Secret
 * - 设置授权回调 URL
 */
export function isGitHubAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true";
}

/**
 * 检查 Google One-Tap 快速登录是否启用
 * 
 * Google One-Tap 特点：
 * - 自动显示登录提示（如果用户已登录 Google）
 * - 一键快速登录，无需跳转
 * - 提高用户转化率
 * 
 * @returns {boolean} true 表示 One-Tap 登录可用
 * 
 * 前提条件：
 * 1. NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED 设置为 "true"
 * 2. NEXT_PUBLIC_AUTH_GOOGLE_ID 必须存在
 * 
 * 注意事项：
 * - 需要用户浏览器已登录 Google 账号
 * - 可能被浏览器的第三方 Cookie 限制影响
 */
export function isGoogleOneTapEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
  );
}
