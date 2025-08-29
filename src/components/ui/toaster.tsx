/**
 * Toaster 组件 - Toast 通知容器
 * 
 * 功能说明：
 * - 渲染所有活动的 toast 通知
 * - 管理 toast 的生命周期
 * - 提供全局通知显示能力
 * 
 * 使用方式：
 * 1. 在根布局中添加 <Toaster />
 * 2. 在任何地方使用 toast() 函数显示通知
 * 
 * @example
 * // 在 layout.tsx 中
 * <body>
 *   <Toaster />
 *   {children}
 * </body>
 * 
 * // 在组件中使用
 * import { toast } from '@/components/ui/use-toast'
 * toast({ title: '成功！', description: '操作已完成' })
 */

"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}