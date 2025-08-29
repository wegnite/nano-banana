/**
 * Character Figure Video Generation Page
 * 
 * 功能：让用户通过nano-banana生成首尾帧，再通过可灵生成完整视频
 * 创新点：首尾帧控制 + AI视频补间
 */

import { Metadata } from 'next';
import CharacterVideoGenerator from '@/components/character-figure/CharacterVideoGenerator';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    en: 'Character Figure Video Generator | Transform Images to Videos',
    zh: '角色手办视频生成器 | 图片转视频',
    ja: 'キャラクターフィギュア動画生成 | 画像から動画へ',
    es: 'Generador de Videos de Figuras | Imágenes a Videos',
    fr: 'Générateur de Vidéos de Figurines | Images en Vidéos',
    de: 'Figuren Video Generator | Bilder zu Videos',
  };
  
  const descriptions = {
    en: 'Transform your character figures into dynamic videos with AI. Generate smooth animations from static images.',
    zh: '用AI将角色手办转换为动态视频。从静态图片生成流畅动画。',
    ja: 'AIでキャラクターフィギュアを動画に変換。静止画から滑らかなアニメーションを生成。',
    es: 'Transforma tus figuras en videos dinámicos con IA.',
    fr: 'Transformez vos figurines en vidéos dynamiques avec l\'IA.',
    de: 'Verwandeln Sie Ihre Figuren in dynamische Videos mit KI.',
  };

  return {
    title: titles[locale as keyof typeof titles] || titles.en,
    description: descriptions[locale as keyof typeof descriptions] || descriptions.en,
    keywords: 'character figure video, AI animation, image to video, character animation',
  };
}

export default async function CharacterVideoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-950 via-gray-950 to-black">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Character Figure Video Generator
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Transform static character figures into dynamic videos with advanced AI technology
            </p>
          </div>
          
          {/* Main Video Generator Component */}
          <CharacterVideoGenerator locale={locale} />
        </div>
      </div>
    </main>
  );
}