/**
 * 性能监控 Hook
 * 
 * 功能：实时监控和报告应用性能指标
 * 用途：开发和生产环境的性能追踪
 * 
 * 监控指标：
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)  
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - TTFB (Time to First Byte)
 * - 组件渲染时间
 * - API 调用延迟
 */

import { useEffect, useCallback, useRef, useState } from 'react';

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  renderTime?: number;
  apiLatency?: Record<string, number[]>;
}

interface UsePerformanceMonitorOptions {
  // 是否启用监控
  enabled?: boolean;
  // 是否在控制台输出
  logToConsole?: boolean;
  // 是否发送到分析服务
  sendToAnalytics?: boolean;
  // 采样率 (0-1)
  sampleRate?: number;
  // 自定义报告函数
  onReport?: (metrics: PerformanceMetrics) => void;
}

/**
 * 性能监控 Hook
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    logToConsole = true,
    sendToAnalytics = false,
    sampleRate = 1,
    onReport,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const renderStartTime = useRef<number>(performance.now());
  const apiCallTimes = useRef<Record<string, number[]>>({});

  /**
   * 获取 Web Vitals 指标
   */
  const measureWebVitals = useCallback(() => {
    if (!enabled || Math.random() > sampleRate) return;

    // 检查 Performance Observer API 是否可用
    if (!('PerformanceObserver' in window)) return;

    try {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        setMetrics(prev => ({ ...prev, lcp: lastEntry.renderTime || lastEntry.loadTime }));
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const firstInput = entries[0] as any;
        setMetrics(prev => ({ ...prev, fid: firstInput.processingStart - firstInput.startTime }));
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // FCP (First Contentful Paint)
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });

      // TTFB (Time to First Byte)
      const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        setMetrics(prev => ({ ...prev, ttfb }));
      }

      // Cleanup
      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        fcpObserver.disconnect();
      };
    } catch (error) {
      console.error('Error measuring Web Vitals:', error);
    }
  }, [enabled, sampleRate]);

  /**
   * 测量组件渲染时间
   */
  const measureRenderTime = useCallback(() => {
    if (!enabled) return;

    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));

    if (logToConsole) {
      console.log(`⚡ Component render time: ${renderTime.toFixed(2)}ms`);
    }
  }, [enabled, logToConsole]);

  /**
   * 监控 API 调用性能
   */
  const monitorAPICall = useCallback((url: string, startTime: number) => {
    if (!enabled) return;

    const endTime = performance.now();
    const latency = endTime - startTime;

    if (!apiCallTimes.current[url]) {
      apiCallTimes.current[url] = [];
    }
    apiCallTimes.current[url].push(latency);

    // 保持最近 10 次调用记录
    if (apiCallTimes.current[url].length > 10) {
      apiCallTimes.current[url].shift();
    }

    setMetrics(prev => ({ ...prev, apiLatency: { ...apiCallTimes.current } }));

    if (logToConsole) {
      console.log(`🌐 API call to ${url}: ${latency.toFixed(2)}ms`);
    }
  }, [enabled, logToConsole]);

  /**
   * 包装 fetch 以监控 API 性能
   */
  const monitoredFetch = useCallback(async (url: string, options?: RequestInit) => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, options);
      monitorAPICall(url, startTime);
      return response;
    } catch (error) {
      monitorAPICall(url, startTime);
      throw error;
    }
  }, [monitorAPICall]);

  /**
   * 生成性能报告
   */
  const generateReport = useCallback(() => {
    if (!enabled) return;

    const report = {
      ...metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      connectionType: (navigator as any).connection?.effectiveType,
    };

    if (logToConsole) {
      console.group('📊 Performance Report');
      console.table({
        'FCP': metrics.fcp ? `${metrics.fcp.toFixed(2)}ms` : 'N/A',
        'LCP': metrics.lcp ? `${metrics.lcp.toFixed(2)}ms` : 'N/A',
        'FID': metrics.fid ? `${metrics.fid.toFixed(2)}ms` : 'N/A',
        'CLS': metrics.cls ? metrics.cls.toFixed(3) : 'N/A',
        'TTFB': metrics.ttfb ? `${metrics.ttfb.toFixed(2)}ms` : 'N/A',
        'Render Time': metrics.renderTime ? `${metrics.renderTime.toFixed(2)}ms` : 'N/A',
      });
      
      if (metrics.apiLatency) {
        console.group('API Latency');
        Object.entries(metrics.apiLatency).forEach(([url, times]) => {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          console.log(`${url}: avg ${avg.toFixed(2)}ms, samples: ${times.length}`);
        });
        console.groupEnd();
      }
      
      console.groupEnd();
    }

    if (sendToAnalytics) {
      // 发送到分析服务
      sendPerformanceData(report);
    }

    if (onReport) {
      onReport(metrics);
    }

    return report;
  }, [enabled, metrics, logToConsole, sendToAnalytics, onReport]);

  /**
   * 发送性能数据到分析服务
   */
  const sendPerformanceData = async (data: any) => {
    try {
      // 使用 sendBeacon 确保数据发送
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon('/api/analytics/performance', JSON.stringify(data));
      } else {
        // Fallback to fetch
        fetch('/api/analytics/performance', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        });
      }
    } catch (error) {
      console.error('Failed to send performance data:', error);
    }
  };

  /**
   * 性能预警
   */
  const checkPerformanceThresholds = useCallback(() => {
    const thresholds = {
      fcp: 1800,    // 1.8s
      lcp: 2500,    // 2.5s
      fid: 100,     // 100ms
      cls: 0.1,     // 0.1
      ttfb: 800,    // 800ms
    };

    const warnings: string[] = [];

    if (metrics.fcp && metrics.fcp > thresholds.fcp) {
      warnings.push(`FCP is ${metrics.fcp.toFixed(0)}ms (threshold: ${thresholds.fcp}ms)`);
    }
    if (metrics.lcp && metrics.lcp > thresholds.lcp) {
      warnings.push(`LCP is ${metrics.lcp.toFixed(0)}ms (threshold: ${thresholds.lcp}ms)`);
    }
    if (metrics.fid && metrics.fid > thresholds.fid) {
      warnings.push(`FID is ${metrics.fid.toFixed(0)}ms (threshold: ${thresholds.fid}ms)`);
    }
    if (metrics.cls && metrics.cls > thresholds.cls) {
      warnings.push(`CLS is ${metrics.cls.toFixed(3)} (threshold: ${thresholds.cls})`);
    }
    if (metrics.ttfb && metrics.ttfb > thresholds.ttfb) {
      warnings.push(`TTFB is ${metrics.ttfb.toFixed(0)}ms (threshold: ${thresholds.ttfb}ms)`);
    }

    if (warnings.length > 0 && logToConsole) {
      console.warn('⚠️ Performance warnings:', warnings);
    }

    return warnings;
  }, [metrics, logToConsole]);

  // 初始化监控
  useEffect(() => {
    if (!enabled) return;

    measureWebVitals();
    measureRenderTime();

    // 页面卸载时发送报告
    const handleUnload = () => {
      generateReport();
    };

    window.addEventListener('beforeunload', handleUnload);
    
    // 定期检查性能阈值
    const intervalId = setInterval(() => {
      checkPerformanceThresholds();
    }, 5000);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(intervalId);
    };
  }, [enabled, measureWebVitals, measureRenderTime, generateReport, checkPerformanceThresholds]);

  return {
    metrics,
    monitoredFetch,
    generateReport,
    checkPerformanceThresholds,
  };
}

/**
 * 开发环境性能调试组件
 */
export function PerformanceDebugger() {
  const { metrics, generateReport } = usePerformanceMonitor({
    enabled: true,
    logToConsole: true,
  });

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-sm">
      <h3 className="font-bold mb-2">Performance Metrics</h3>
      <div className="space-y-1">
        <div>FCP: {metrics.fcp?.toFixed(0) || '—'} ms</div>
        <div>LCP: {metrics.lcp?.toFixed(0) || '—'} ms</div>
        <div>FID: {metrics.fid?.toFixed(0) || '—'} ms</div>
        <div>CLS: {metrics.cls?.toFixed(3) || '—'}</div>
        <div>TTFB: {metrics.ttfb?.toFixed(0) || '—'} ms</div>
      </div>
      <button
        onClick={generateReport}
        className="mt-2 px-2 py-1 bg-blue-500 rounded text-xs"
      >
        Generate Report
      </button>
    </div>
  );
}