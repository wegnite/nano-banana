/**
 * Slider 滑块组件
 * 
 * 功能说明：
 * - 基于 Radix UI 的滑块组件
 * - 支持范围选择和单值选择
 * - 可自定义样式和主题
 * 
 * 使用场景：
 * - 数值范围选择
 * - 音量/亮度调节
 * - 价格区间筛选
 * - 进度控制
 */

"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

/**
 * Slider 组件属性接口
 * 继承自 Radix UI Slider 的所有原生属性
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    {/* 滑块轨道 - 背景轨道 */}
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      {/* 滑块轨道 - 已选择范围 */}
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    
    {/* 滑块拖动手柄 */}
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }