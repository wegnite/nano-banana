/**
 * Character Figure AI Generator Page
 * 
 * Problem: Users need an easy way to transform photos into character figures/collectibles
 * Solution: Intuitive interface for AI-powered character figure generation
 * 
 * Features:
 * - Image upload with drag & drop
 * - Multiple style presets (Ghibli, Figure, Anime, etc.)
 * - Real-time generation with nano-banana API
 * - Gallery of generated images
 */

import { Metadata } from 'next';
import CharacterFigureGenerator from '@/components/character-figure/CharacterFigureGenerator';
import CharacterFigureGallery from '@/components/character-figure/CharacterFigureGallery';
import CharacterFigureHero from '@/components/character-figure/CharacterFigureHero';
import CharacterFigureCTA from '@/components/character-figure/CharacterFigureCTA';

export const metadata: Metadata = {
  title: 'Character Figure AI Generator - Transform Photos into Collectible Art',
  description: 'Create stunning character figures, Ghibli-style art, and collectible designs from your photos using advanced AI technology. Fast, easy, and high-quality.',
  keywords: 'character figure, AI generator, ghibli style, anime figure, collectible toy, action figure generator, AI art',
};

interface CharacterFigurePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CharacterFigurePage({ params }: CharacterFigurePageProps) {
  const { locale } = await params;
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <CharacterFigureHero locale={locale} />
      
      {/* Main Generator Section */}
      <section className="container mx-auto px-4 py-12">
        <CharacterFigureGenerator locale={locale} />
      </section>
      
      {/* Gallery Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Community Creations
          </span>
        </h2>
        <CharacterFigureGallery />
      </section>
      
      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generate stunning character figures in under 10 seconds with nano-banana technology
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Multiple Styles</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose from Ghibli, Anime, Figure, Oil Painting, and more artistic styles
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Commercial Use</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All generated images come with commercial license for your projects
            </p>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-yellow-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Create Your First Character Figure?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of creators making amazing AI art every day
          </p>
          <CharacterFigureCTA />
        </div>
      </section>
    </main>
  );
}