/**
 * 本地缓存管理工具库
 * 
 * 功能说明：
 * 基于 localStorage 实现的带过期时间的缓存系统
 * 
 * 特点：
 * - 支持设置过期时间
 * - 自动清理过期数据
 * - 统一的缓存格式
 * 
 * 存储格式：
 * "过期时间戳:实际值"
 * 例如："1704067200:user_token_value"
 * 
 * @module lib/cache
 */

import { getTimestamp } from "./time";

/**
 * 从缓存中获取数据
 * 
 * 工作流程：
 * 1. 从 localStorage 读取原始数据
 * 2. 解析过期时间和实际值
 * 3. 检查是否过期
 * 4. 过期则删除并返回 null
 * 5. 未过期则返回实际值
 * 
 * @param {string} key - 缓存键名
 * @returns {string | null} 缓存的值，过期或不存在返回 null
 * 
 * 数据格式说明：
 * - 存储格式："expiresAt:value"
 * - expiresAt = -1 表示永不过期
 */
export const cacheGet = (key: string): string | null => {
  let valueWithExpires = localStorage.getItem(key);
  if (!valueWithExpires) {
    return null;
  }

  let valueArr = valueWithExpires.split(":");
  if (!valueArr || valueArr.length < 2) {
    return null;
  }

  const expiresAt = Number(valueArr[0]);
  const currTimestamp = getTimestamp();

  if (expiresAt !== -1 && expiresAt < currTimestamp) {
    // value expired
    cacheRemove(key);

    return null;
  }

  const searchStr = valueArr[0] + ":";
  const value = valueWithExpires.replace(searchStr, "");

  return value;
};

/**
 * 设置缓存数据
 * 
 * @param {string} key - 缓存键名
 * @param {string} value - 要缓存的值
 * @param {number} expiresAt - 过期时间戳（绝对时间）
 *                              -1 表示永不过期
 * 
 * 使用示例：
 * ```typescript
 * // 缓存1小时
 * const expiresAt = getTimestamp() + 3600;
 * cacheSet('user_token', 'abc123', expiresAt);
 * 
 * // 永久缓存
 * cacheSet('app_config', JSON.stringify(config), -1);
 * ```
 */
export const cacheSet = (key: string, value: string, expiresAt: number) => {
  const valueWithExpires = expiresAt + ":" + value;

  localStorage.setItem(key, valueWithExpires);
};

/**
 * 删除指定的缓存数据
 * 
 * @param {string} key - 要删除的缓存键名
 * 
 * 使用场景：
 * - 用户登出时清除 token
 * - 数据更新后清除旧缓存
 * - 手动清理过期数据
 */
export const cacheRemove = (key: string) => {
  localStorage.removeItem(key);
};

/**
 * 清空所有缓存数据
 * 
 * 警告：
 * 此操作会清除 localStorage 中的所有数据
 * 包括其他功能模块的缓存
 * 
 * 使用场景：
 * - 用户完全登出
 * - 应用重置
 * - 清理调试数据
 */
export const cacheClear = () => {
  localStorage.clear();
};
