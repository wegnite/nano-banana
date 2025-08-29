/**
 * Character Figure Hero Component
 * 
 * Problem: Need an engaging hero section to capture user attention
 * Solution: Dynamic, animated hero with clear value proposition
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

interface HeroProps {
  locale: string;
}

const SAMPLE_IMAGES = [
  '/imgs/showcases/character-figure-1.jpg',
  '/imgs/showcases/character-figure-2.jpg',
  '/imgs/showcases/character-figure-3.jpg',
  '/imgs/showcases/character-figure-4.jpg',
];

export default function CharacterFigureHero({ locale }: HeroProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % SAMPLE_IMAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 md:py-24">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Powered by nano-banana AI
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                {locale === 'zh' ? '使用 AI 创建' : 'Create Amazing'}
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                {locale === 'zh' ? '吉卜力风格的艺术作品' : 'Character Figures'}
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
              {locale === 'zh' 
                ? '将您的照片转换为精美的吉卜力风格艺术作品和角色手办。快速、简单、高质量。'
                : 'Transform your photos into stunning Ghibli-style art and collectible character figures. Fast, easy, and high-quality.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold px-8"
                onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {locale === 'zh' ? '立即开始创作' : 'Start Creating'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Link href="#gallery">
                <Button size="lg" variant="outline" className="border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                  {locale === 'zh' ? '浏览作品集' : 'Browse Gallery'}
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12">
              <div>
                <div className="text-3xl font-bold text-orange-500">10K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {locale === 'zh' ? '创作者' : 'Creators'}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500">100K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {locale === 'zh' ? '生成作品' : 'Artworks'}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500">4.9/5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {locale === 'zh' ? '用户评分' : 'Rating'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Image Showcase */}
          <div className="relative">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main showcase image */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-3xl transform rotate-3" />
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-2">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden">
                    {/* Placeholder for actual images */}
                    <div className="aspect-square bg-gradient-to-br from-orange-200 to-yellow-200 dark:from-orange-800 dark:to-yellow-800 flex items-center justify-center">
                      <div className="text-center p-8">
                        <Sparkles className="w-24 h-24 text-orange-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                          {locale === 'zh' ? 'AI 生成示例' : 'AI Generated Sample'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                <div className="text-2xl">🎭</div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                <div className="text-2xl">🏯</div>
              </div>
              <div className="absolute top-1/2 -right-8 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                <div className="text-2xl">✨</div>
              </div>
            </div>
            
            {/* Feature badges */}
            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {locale === 'zh' ? '10秒生成' : '10s Generation'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}