/**
 * 归因追踪组件
 * 
 * 问题：需要在客户端收集屏幕信息并发送追踪请求
 * 解决方案：创建一个自动执行的追踪组件
 * 
 * 功能：
 * - 收集客户端信息（屏幕分辨率、视口大小等）
 * - 调用追踪API记录访问
 * - 不影响页面渲染
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function AttributionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // 构建完整的页面URL
    const pageUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    // 收集客户端信息
    const clientData = {
      page_url: pageUrl,
      referrer: document.referrer,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      color_depth: window.screen.colorDepth,
    };
    
    // 发送追踪请求（异步，不阻塞页面）
    fetch('/api/attribution/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('归因追踪成功:', {
          visitor_id: data.visitor_id,
          session_id: data.session_id,
        });
      }
    })
    .catch(error => {
      console.error('归因追踪失败:', error);
    });
    
  }, [pathname, searchParams]); // 当路径或参数变化时重新追踪
  
  // 不渲染任何内容
  return null;
}