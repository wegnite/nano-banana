/**
 * Character Figure AI Generator - SEO优化首页
 * 
 * 关键词密度策略：
 * - 主关键词 "character figure" 出现 15-20次
 * - LSI关键词合理分布
 * - H1-H3标签层级清晰
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Sparkles, Zap, Star, Trophy, Users, Palette, Video, Download, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Character Figure AI Generator | Create Stunning 3D Characters & Figures - CharacterFigure.com',
  description: 'Transform your ideas into amazing character figures with our AI-powered character figure generator. Create anime, realistic, and custom character figures in seconds. Professional character figure design tool with video generation.',
  keywords: 'character figure, AI character figure generator, 3D character figures, anime character figure, character figure design, figure creator, AI character generation, custom character figures, character figure maker, digital character figures',
  alternates: {
    canonical: 'https://characterfigure.com',
    languages: {
      'en-US': 'https://characterfigure.com/en',
      'zh-CN': 'https://characterfigure.com/zh',
      'ja-JP': 'https://characterfigure.com/ja',
      'es-ES': 'https://characterfigure.com/es',
      'fr-FR': 'https://characterfigure.com/fr',
      'de-DE': 'https://characterfigure.com/de',
    },
  },
  openGraph: {
    title: 'Character Figure AI Generator - Create Professional Character Figures',
    description: 'The most advanced character figure generation platform. Create stunning character figures with AI technology.',
    url: 'https://characterfigure.com',
    siteName: 'CharacterFigure',
    images: [
      {
        url: 'https://characterfigure.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Character Figure AI Generator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Character Figure AI Generator | Professional Character Design',
    description: 'Create stunning character figures with advanced AI. Perfect for games, animation, and collectibles.',
    images: ['https://characterfigure.com/twitter-card.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section - 高密度关键词区域 */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto">
            {/* 主标题 H1 - 包含核心关键词 */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Character Figure
              </span>{' '}
              AI Generator
              <br />
              <span className="text-2xl md:text-4xl lg:text-5xl text-gray-700 dark:text-gray-300">
                Create Professional Character Figures in Seconds
              </span>
            </h1>
            
            {/* 副标题 - 强化关键词 */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Transform your creative vision into stunning <strong>character figures</strong> with our advanced AI technology. 
              Design anime <strong>character figures</strong>, realistic 3D models, and custom collectibles effortlessly.
            </p>
            
            {/* CTA按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/character-figure">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-6 text-lg">
                  <Sparkles className="mr-2 h-6 w-6" />
                  Start Creating Character Figures
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/character-figure">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                  Browse Character Figure Gallery
                </Button>
              </Link>
            </div>
            
            {/* 信任指标 */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                <span><strong>50,000+</strong> Character Figure Creators</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-orange-500" />
                <span><strong>4.9/5</strong> User Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                <span><strong>1M+</strong> Character Figures Created</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 背景装饰 */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </section>
      
      {/* Features Section - H2标签优化 */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            Advanced <span className="text-orange-500">Character Figure</span> Features
          </h2>
          <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
            Our <strong>character figure generator</strong> offers professional tools for creating high-quality <strong>character figures</strong>
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                <Palette className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">10+ Character Figure Styles</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create diverse <strong>character figures</strong> including anime, realistic, cartoon, fantasy, and sci-fi styles. 
                Perfect for game character figures and collectible designs.
              </p>
            </Card>
            
            {/* Feature 2 */}
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                <Video className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Character Figure Videos</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Transform static <strong>character figures</strong> into dynamic videos. 
                Our AI creates smooth animations for your character figure designs.
              </p>
            </Card>
            
            {/* Feature 3 */}
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast Character Figure Generation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate professional <strong>character figures</strong> in under 10 seconds. 
                The fastest character figure creation tool powered by nano-banana AI.
              </p>
            </Card>
            
            {/* Feature 4 */}
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                <Download className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">HD Character Figure Export</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Export your <strong>character figures</strong> in high resolution for printing, 
                3D modeling, or digital display. Commercial use included.
              </p>
            </Card>
            
            {/* Feature 5 */}
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Character Figure Community</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Join thousands of <strong>character figure</strong> artists. 
                Share your creations, get inspired, and sell your character figure designs.
              </p>
            </Card>
            
            {/* Feature 6 */}
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                <Globe className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Global Character Figure Platform</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create <strong>character figures</strong> in multiple languages. 
                Our platform supports creators worldwide with localized interfaces.
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* How It Works - H2优化 */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            How to Create <span className="text-orange-500">Character Figures</span>
          </h2>
          <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
            Three simple steps to amazing <strong>character figure</strong> creation
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Choose Your Style</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select from our diverse <strong>character figure</strong> styles to match your vision
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Describe or Upload</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Describe your <strong>character figure</strong> concept or upload a reference image
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Generate & Download</h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI creates your <strong>character figure</strong> instantly, ready for use
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Preview */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            <span className="text-orange-500">Character Figure</span> Pricing Plans
          </h2>
          <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
            Start creating <strong>character figures</strong> for free
          </p>
          
          <div className="text-center">
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="px-8 py-4">
                View All Character Figure Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-yellow-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Start Creating Character Figures Today
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of artists using our <strong>character figure generator</strong> to bring their ideas to life
          </p>
          <Link href="/generate/character-figure">
            <Button size="lg" className="bg-white text-orange-500 hover:bg-gray-100 px-10 py-6 text-lg font-semibold">
              Create Your First Character Figure Free
              <Sparkles className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Character Figure AI Generator',
            url: 'https://characterfigure.com',
            description: 'AI-powered character figure generation platform for creating professional 3D characters and figures',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '12500',
            },
          }),
        }}
      />
    </main>
  );
}