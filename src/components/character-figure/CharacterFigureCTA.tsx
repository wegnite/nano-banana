/**
 * Character Figure CTA Button Component
 * 
 * 问题：服务端组件不能直接包含事件处理器
 * 解决：将带有onClick的按钮提取为独立的客户端组件
 * 
 * 功能：点击后平滑滚动到页面顶部，让用户开始创建
 */

'use client';

export default function CharacterFigureCTA() {
  // 处理点击事件，平滑滚动到页面顶部
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button 
      onClick={handleClick}
      className="px-8 py-4 bg-white text-orange-500 font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105"
    >
      Start Creating Now
    </button>
  );
}