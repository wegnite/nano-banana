/**
 * Character Figure AI Generator - 主页
 * 域名: characterfigure.com
 * 
 * SEO优化重点:
 * - 主关键词 "character figure" 高密度分布
 * - 清晰的H1-H3标题层级
 * - 优化的meta标签和结构化数据
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Sparkles, Zap, Star, Trophy, Users, Palette, Video, Download, Globe, CheckCircle2, Clock, Shield } from 'lucide-react';
import CharacterFigureHero from '@/components/character-figure/CharacterFigureHero';
import CharacterFigureGallery from '@/components/character-figure/CharacterFigureGallery';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const titles = {
    en: 'Character Figure AI Generator | Create Stunning 3D Characters - CharacterFigure.com',
    zh: 'AI角色手办生成器 | 创建惊艳的3D角色 - CharacterFigure.com',
    ja: 'キャラクターフィギュアAIジェネレーター | 3Dキャラクター作成',
    es: 'Generador AI de Figuras | Crea Personajes 3D',
    fr: 'Générateur AI de Figurines | Créez des Personnages 3D',
    de: 'KI Figuren Generator | 3D Charaktere Erstellen',
  };
  
  const descriptions = {
    en: 'Transform ideas into amazing character figures with AI. Create anime, realistic, custom character figures in seconds. Free trial available.',
    zh: '用AI将创意转化为惊艳的角色手办。几秒内创建动漫、写实、自定义角色手办。免费试用。',
    ja: 'AIでアイデアをキャラクターフィギュアに変換。アニメ、リアル、カスタムフィギュアを数秒で作成。',
    es: 'Transforma ideas en figuras con IA. Crea figuras anime, realistas y personalizadas en segundos.',
    fr: 'Transformez vos idées en figurines avec l\'IA. Créez des figurines anime, réalistes en secondes.',
    de: 'Verwandeln Sie Ideen in Figuren mit KI. Erstellen Sie Anime, realistische Figuren in Sekunden.',
  };

  return {
    title: titles[locale as keyof typeof titles] || titles.en,
    description: descriptions[locale as keyof typeof descriptions] || descriptions.en,
    keywords: 'character figure, AI generator, 3D characters, anime figure, character design, figure creator',
    alternates: {
      canonical: `https://characterfigure.com/${locale}`,
      languages: {
        'en': 'https://characterfigure.com/en',
        'zh': 'https://characterfigure.com/zh',
        'ja': 'https://characterfigure.com/ja',
        'es': 'https://characterfigure.com/es',
        'fr': 'https://characterfigure.com/fr',
        'de': 'https://characterfigure.com/de',
      },
    },
    openGraph: {
      title: 'Character Figure AI Generator',
      description: 'Create stunning character figures with AI technology',
      url: 'https://characterfigure.com',
      siteName: 'CharacterFigure',
      locale: locale === 'zh' ? 'zh_CN' : locale === 'ja' ? 'ja_JP' : 'en_US',
      type: 'website',
    },
  };
}

export default async function CharacterFigurePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // 多语言文案
  const content = {
    en: {
      heroTitle: 'Character Figure',
      heroSubtitle: 'AI Generator',
      heroDescription: 'Create Professional Character Figures in Seconds',
      heroTagline: 'Transform your creative vision into stunning character figures with advanced AI',
      ctaStart: 'Start Creating Character Figures',
      ctaGallery: 'Browse Gallery',
      statsUsers: 'Character Figure Creators',
      statsRating: 'User Rating',
      statsCreated: 'Character Figures Created',
      featuresTitle: 'Advanced Character Figure Features',
      featuresSubtitle: 'Professional tools for creating high-quality character figures',
      pricingTitle: 'Character Figure Pricing Plans',
      pricingSubtitle: 'Start creating character figures for free',
      howTitle: 'How to Create Character Figures',
      howSubtitle: 'Three simple steps to amazing character figure creation',
    },
    zh: {
      heroTitle: '角色手办',
      heroSubtitle: 'AI 生成器',
      heroDescription: '几秒内创建专业角色手办',
      heroTagline: '用先进的AI技术将您的创意转化为惊艳的角色手办',
      ctaStart: '开始创建角色手办',
      ctaGallery: '浏览画廊',
      statsUsers: '角色手办创作者',
      statsRating: '用户评分',
      statsCreated: '已创建角色手办',
      featuresTitle: '高级角色手办功能',
      featuresSubtitle: '创建高质量角色手办的专业工具',
      pricingTitle: '角色手办定价方案',
      pricingSubtitle: '免费开始创建角色手办',
      howTitle: '如何创建角色手办',
      howSubtitle: '三个简单步骤创建惊艳的角色手办',
    },
  };
  
  const t = content[locale as keyof typeof content] || content.en;
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-950 via-gray-950 to-black text-white">
      {/* Hero Section - 高关键词密度 */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* 新时代标签 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full mb-6">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">✨ New Era of AI Image Creation</span>
            </div>
            
            {/* 主标题 - H1 */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                {t.heroTitle}
              </span>
              <br />
              <span className="text-3xl md:text-5xl lg:text-6xl text-white/90">
                {t.heroSubtitle}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              {t.heroTagline}
            </p>
            
            {/* CTA按钮组 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href={`/${locale}/character-figure`}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="mr-2 h-6 w-6" />
                  {t.ctaStart}
                </Button>
              </Link>
              <Link href={`/${locale}/gallery`}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 px-8 py-6 text-lg"
                >
                  {t.ctaGallery}
                </Button>
              </Link>
            </div>
            
            {/* 信任指标 */}
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300"><strong className="text-white">50,000+</strong> {t.statsUsers}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300"><strong className="text-white">4.9/5</strong> {t.statsRating}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300"><strong className="text-white">1M+</strong> {t.statsCreated}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* 主生成器区域 */}
      
      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            {t.featuresTitle}
          </h2>
          <p className="text-xl text-center text-gray-400 mb-16 max-w-3xl mx-auto">
            {t.featuresSubtitle}
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 特性卡片 */}
            <Card className="bg-gray-900/50 border-purple-500/20 p-6 hover:border-purple-500/50 transition-all">
              <Palette className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">10+ Character Figure Styles</h3>
              <p className="text-gray-400">
                Create diverse character figures including anime, realistic, fantasy styles
              </p>
            </Card>
            
            <Card className="bg-gray-900/50 border-purple-500/20 p-6 hover:border-purple-500/50 transition-all">
              <Video className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Video Generation</h3>
              <p className="text-gray-400">
                Transform static character figures into dynamic videos with AI
              </p>
            </Card>
            
            <Card className="bg-gray-900/50 border-purple-500/20 p-6 hover:border-purple-500/50 transition-all">
              <Zap className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Lightning Fast</h3>
              <p className="text-gray-400">
                Generate character figures in under 10 seconds with nano-banana AI
              </p>
            </Card>
            
            <Card className="bg-gray-900/50 border-purple-500/20 p-6 hover:border-purple-500/50 transition-all">
              <Download className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">HD Export</h3>
              <p className="text-gray-400">
                Export character figures in high resolution for any use
              </p>
            </Card>
            
            <Card className="bg-gray-900/50 border-purple-500/20 p-6 hover:border-purple-500/50 transition-all">
              <Shield className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Commercial License</h3>
              <p className="text-gray-400">
                All character figures include commercial usage rights
              </p>
            </Card>
            
            <Card className="bg-gray-900/50 border-purple-500/20 p-6 hover:border-purple-500/50 transition-all">
              <Globe className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Global Platform</h3>
              <p className="text-gray-400">
                Available in 6 languages for creators worldwide
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-purple-950/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            {t.pricingTitle}
          </h2>
          <p className="text-xl text-center text-gray-400 mb-12">
            {t.pricingSubtitle}
          </p>
          
          {/* 定价卡片预览 */}
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-700 p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <p className="text-gray-400 mb-4">1 per day</p>
              <Button variant="outline" className="w-full">Get Started</Button>
            </Card>
            
            <Card className="bg-gradient-to-b from-purple-900/50 to-gray-900/50 border-purple-500 p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full">
                BEST VALUE
              </div>
              <h3 className="text-xl font-bold mb-2">Trial</h3>
              <p className="text-3xl font-bold mb-4">$3.99</p>
              <p className="text-gray-400 mb-4">10 generations</p>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">Try Now</Button>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700 p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">$10.99</p>
              <p className="text-gray-400 mb-4">50 per month</p>
              <Button variant="outline" className="w-full">Subscribe</Button>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700 p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Ultra</h3>
              <p className="text-3xl font-bold mb-4">$34.99</p>
              <p className="text-gray-400 mb-4">200 per month</p>
              <Button variant="outline" className="w-full">Go Ultra</Button>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <Link href={`/${locale}/pricing`}>
              <Button variant="link" className="text-purple-400 hover:text-purple-300">
                View detailed pricing →
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Gallery Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
            Community Character Figures
          </h2>
          <CharacterFigureGallery />
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Start Creating Character Figures Today
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Join thousands using our character figure generator to bring ideas to life
          </p>
          <Link href={`/${locale}/character-figure`}>
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-10 py-6 text-lg font-semibold">
              Create Your First Character Figure Free
              <Sparkles className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}