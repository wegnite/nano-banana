/**
 * 全局应用上下文（Context）管理
 * 
 * 功能说明：
 * 1. 管理全局用户状态和认证信息
 * 2. 处理用户登录模态框显示状态
 * 3. 管理用户反馈组件状态
 * 4. 处理邀请码逻辑
 * 5. 集成 Google One-Tap 登录
 * 
 * 使用方式：
 * - 在组件中通过 useAppContext() 获取全局状态
 * - 包裹在应用根组件外层提供全局状态
 * 
 * @module contexts/app
 */
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { cacheGet, cacheRemove } from "@/lib/cache";

import { CacheKey } from "@/services/constant";
import { ContextValue } from "@/types/context";
import { User } from "@/types/user";
import moment from "moment";
import useOneTapLogin from "@/hooks/useOneTapLogin";
import { useSession } from "next-auth/react";
import { isAuthEnabled, isGoogleOneTapEnabled } from "@/lib/auth";

/**
 * 创建全局应用上下文
 * 初始值为空对象，实际值由 Provider 提供
 */
const AppContext = createContext({} as ContextValue);

/**
 * 自定义 Hook：获取应用上下文
 * @returns {ContextValue} 包含用户信息、模态框状态等的上下文对象
 */
export const useAppContext = () => useContext(AppContext);

/**
 * 应用上下文提供者组件
 * 
 * 主要职责：
 * 1. 初始化 Google One-Tap 登录（如果启用）
 * 2. 监听用户会话变化并获取用户详细信息
 * 3. 处理邀请码关联逻辑
 * 4. 提供全局状态管理
 * 
 * @param {Object} props - 组件属性
 * @param {ReactNode} props.children - 子组件
 */
export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  // 条件性启用 Google One-Tap 登录
  if (isAuthEnabled() && isGoogleOneTapEnabled()) {
    useOneTapLogin();
  }

  // 获取用户会话（仅在认证启用时）
  const { data: session } = isAuthEnabled() ? useSession() : { data: null };

  // 登录模态框显示状态
  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  // 用户详细信息
  const [user, setUser] = useState<User | null>(null);
  // 反馈组件显示状态
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  /**
   * 获取用户详细信息
   * 
   * 工作流程：
   * 1. 调用 /api/get-user-info 接口
   * 2. 更新本地用户状态
   * 3. 触发邀请码关联逻辑
   * 
   * 错误处理：
   * - 网络错误或接口错误时静默失败
   * - 在控制台记录错误信息
   */
  const fetchUserInfo = async function () {
    try {
      const resp = await fetch("/api/get-user-info", {
        method: "POST",
      });

      if (!resp.ok) {
        throw new Error("fetch user info failed with status: " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);

      updateInvite(data);
    } catch (e) {
      console.log("fetch user info failed");
    }
  };

  /**
   * 更新用户邀请关系
   * 
   * 业务逻辑：
   * 1. 检查用户是否已被邀请（避免重复）
   * 2. 从缓存获取邀请码
   * 3. 验证用户注册时间（必须在2小时内）
   * 4. 调用接口建立邀请关系
   * 5. 成功后清除缓存的邀请码
   * 
   * @param {User} user - 当前用户对象
   * 
   * 时间限制说明：
   * - 只有新注册2小时内的用户才能关联邀请码
   * - 防止老用户滥用邀请系统
   */
  const updateInvite = async (user: User) => {
    try {
      if (user.invited_by) {
        // 用户已有邀请人，跳过
        console.log("user already been invited", user.invited_by);
        return;
      }

      const inviteCode = cacheGet(CacheKey.InviteCode);
      if (!inviteCode) {
        // 缓存中无邀请码，跳过
        return;
      }

      // 计算用户注册时长
      const userCreatedAt = moment(user.created_at).unix();
      const currentTime = moment().unix();
      const timeDiff = Number(currentTime - userCreatedAt);

      if (timeDiff <= 0 || timeDiff > 7200) {
        // 用户注册超过2小时，不允许关联邀请码
        console.log("user created more than 2 hours");
        return;
      }

      // 调用接口更新邀请关系
      console.log("update invite", inviteCode, user.uuid);
      const req = {
        invite_code: inviteCode,
        user_uuid: user.uuid,
      };
      const resp = await fetch("/api/update-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });
      if (!resp.ok) {
        throw new Error("update invite failed with status: " + resp.status);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      // 更新用户状态并清除邀请码缓存
      setUser(data);
      cacheRemove(CacheKey.InviteCode);
    } catch (e) {
      console.log("update invite failed: ", e);
    }
  };

  /**
   * 监听会话变化
   * 当用户登录成功后，自动获取用户详细信息
   */
  useEffect(() => {
    if (session && session.user) {
      fetchUserInfo();
    }
  }, [session]);

  return (
    <AppContext.Provider
      value={{
        showSignModal,
        setShowSignModal,
        user,
        setUser,
        showFeedback,
        setShowFeedback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
