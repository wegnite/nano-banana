/**
 * Character Figure Mobile Navigation Component
 * 
 * Problem: Mobile users need easy navigation for character figure features
 * Solution: Bottom navigation with key actions always accessible
 */

'use client';

import { useState } from 'react';
import { Home, Image, Images, History, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
  locale: string;
  onGenerateClick?: () => void;
}

export default function CharacterFigureMobileNav({ locale, onGenerateClick }: MobileNavProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('generate');
  
  const navItems = [
    { id: 'home', icon: Home, label: locale === 'zh' ? '首页' : 'Home', href: `/${locale}` },
    { id: 'gallery', icon: Images, label: locale === 'zh' ? '画廊' : 'Gallery', href: `/${locale}/character-figure#gallery` },
    { id: 'generate', icon: Plus, label: locale === 'zh' ? '生成' : 'Create', special: true },
    { id: 'history', icon: History, label: locale === 'zh' ? '历史' : 'History', href: `/${locale}/character-figure/history` },
    { id: 'profile', icon: User, label: locale === 'zh' ? '我的' : 'Profile', href: `/${locale}/profile` },
  ];
  
  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            if (item.special) {
              return (
                <button
                  key={item.id}
                  onClick={onGenerateClick}
                  className="relative flex flex-col items-center justify-center"
                >
                  <div className="absolute -top-6 w-14 h-14 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs mt-5 text-orange-500 font-medium">
                    {item.label}
                  </span>
                </button>
              );
            }
            
            const isActive = pathname?.includes(item.id);
            
            return (
              <Link
                key={item.id}
                href={item.href || '#'}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center transition-colors",
                  isActive
                    ? "text-orange-500"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Spacer to prevent content overlap */}
      <div className="h-16 md:hidden" />
    </>
  );
}