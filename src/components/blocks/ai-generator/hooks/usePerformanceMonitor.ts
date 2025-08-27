/**
 * 性能监控 Hook
 * 
 * 功能：监控组件性能和渲染情况
 * 特性：渲染次数追踪、性能测量、内存监控
 */

import { useRef, useEffect, useCallback } from "react";

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage?: number;
}

export function usePerformanceMonitor(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  });
  
  const renderTimesRef = useRef<number[]>([]);

  // 在每次渲染时记录性能指标
  useEffect(() => {
    const startTime = performance.now();
    
    // 增加渲染计数
    metricsRef.current.renderCount++;
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 记录渲染时间
      renderTimesRef.current.push(renderTime);
      metricsRef.current.lastRenderTime = renderTime;
      
      // 计算平均渲染时间（保留最近10次）
      if (renderTimesRef.current.length > 10) {
        renderTimesRef.current.shift();
      }
      metricsRef.current.averageRenderTime = 
        renderTimesRef.current.reduce((sum, time) => sum + time, 0) / 
        renderTimesRef.current.length;

      // 记录内存使用情况（如果支持）
      if ('memory' in performance) {
        metricsRef.current.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }

      // 在开发环境下打印性能信息
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${componentName}] Render #${metricsRef.current.renderCount}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          avgRenderTime: `${metricsRef.current.averageRenderTime.toFixed(2)}ms`,
          memoryUsage: metricsRef.current.memoryUsage 
            ? `${(metricsRef.current.memoryUsage / 1024 / 1024).toFixed(2)}MB`
            : 'N/A'
        });
      }
    };
  });

  // 获取当前性能指标
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // 重置性能指标
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0
    };
    renderTimesRef.current = [];
  }, []);

  // 检查是否存在性能问题
  const hasPerformanceIssues = useCallback(() => {
    const metrics = metricsRef.current;
    return (
      metrics.renderCount > 100 || // 渲染次数过多
      metrics.averageRenderTime > 16 || // 平均渲染时间超过16ms（60fps阈值）
      (metrics.memoryUsage && metrics.memoryUsage > 50 * 1024 * 1024) // 内存使用超过50MB
    );
  }, []);

  return {
    getMetrics,
    resetMetrics,
    hasPerformanceIssues
  };
}