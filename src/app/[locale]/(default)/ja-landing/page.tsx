/**
 * 日本市場専用ランディングページ
 * 
 * SEO最適化要点：
 * - 主要キーワード「AI画像生成」の密度: 2-3%
 * - 関連キーワード：無料、生成AI、画像生成AI、日本語対応
 * - 構造化データ（JSON-LD）実装
 * - メタタグ最適化
 * 
 * ターゲットドメイン: ai-gazou-seisei.jp (例)
 */

import AIGeneratorJapaneseHero from "@/components/blocks/ai-generator-ja";
import FAQ from "@/components/blocks/faq";
import Pricing from "@/components/blocks/pricing";
import { Metadata } from "next";
import Script from "next/script";

// SEO最適化メタデータ
export const metadata: Metadata = {
  title: "AI画像生成 無料 | 日本No.1 AIジェネレーター - 登録不要で今すぐ使える",
  description: "【完全無料】AI画像生成ツールで誰でも簡単にプロ級の画像作成。日本語対応の画像生成AIで、テキストから瞬時に高品質な画像を生成。商用利用OK、登録不要で今すぐ始められます。",
  keywords: "AI画像生成,画像生成AI,生成AI,無料,AI画像生成 無料,画像生成AI 日本語,テキストから画像,AIイラスト生成,商用利用可能,登録不要",
  openGraph: {
    title: "AI画像生成 - 無料で使える日本No.1 AIジェネレーター",
    description: "最先端のAI画像生成技術で、テキストから高品質な画像を瞬時に生成。日本語完全対応、商用利用OK。",
    type: "website",
    locale: "ja_JP",
    url: "https://ai-gazou-seisei.jp",
    siteName: "AI画像生成Pro",
    images: [
      {
        url: "/og-image-ja.png",
        width: 1200,
        height: 630,
        alt: "AI画像生成 - 日本No.1 AIジェネレーター",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI画像生成 無料 - 日本No.1 AIジェネレーター",
    description: "テキストから瞬時に高品質な画像を生成。日本語完全対応のAI画像生成ツール。",
    images: ["/og-image-ja.png"],
  },
  alternates: {
    canonical: "https://ai-gazou-seisei.jp",
    languages: {
      "ja": "https://ai-gazou-seisei.jp",
      "en": "https://ai-gazou-seisei.jp/en",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// FAQデータ（構造化データ用）
const faqData = [
  {
    question: "AI画像生成は本当に無料で使えますか？",
    answer: "はい、AI画像生成は完全無料でお使いいただけます。クレジットカード登録も不要で、メールアドレスだけで毎日10枚まで画像生成AIで画像を作成できます。"
  },
  {
    question: "画像生成AIで作った画像の著作権は？",
    answer: "AI画像生成で作成された画像の著作権は生成したユーザーに帰属します。生成AIで作った画像は商用利用も可能です。"
  },
  {
    question: "日本語でAI画像生成はできますか？",
    answer: "はい、私たちのAI画像生成は日本語に完全対応しています。画像生成AIが日本語のプロンプトを理解し、適切な画像を生成します。"
  },
  {
    question: "どんな種類のAI画像生成が可能ですか？",
    answer: "画像生成AIは写実的な写真、イラスト、アニメ風、水彩画など様々なスタイルのAI画像生成に対応しています。"
  },
  {
    question: "AI画像生成にかかる時間は？",
    answer: "通常、AI画像生成は15〜30秒で完了します。画像生成AIは高速処理により、ストレスなく画像を生成します。"
  }
];

export default function JapaneseLandingPage() {
  // 構造化データ（JSON-LD）
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI画像生成Pro",
    "url": "https://ai-gazou-seisei.jp",
    "description": "日本No.1のAI画像生成プラットフォーム。無料で高品質な画像生成AIを利用可能。",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2025-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "2345",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI画像生成",
      "日本語対応",
      "無料プラン",
      "商用利用可能",
      "高速生成"
    ]
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "ホーム",
        "item": "https://ai-gazou-seisei.jp"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "AI画像生成",
        "item": "https://ai-gazou-seisei.jp/ai-image-generator"
      }
    ]
  };

  return (
    <>
      {/* 構造化データの挿入 */}
      <Script
        id="structured-data-webapp"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script
        id="structured-data-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <Script
        id="structured-data-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      {/* メインコンテンツ */}
      <main>
        {/* AI画像生成メインセクション */}
        <AIGeneratorJapaneseHero />

        {/* 料金プラン */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              <span className="text-pink-600">AI画像生成</span>の料金プラン
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
              無料から始められる<strong>画像生成AI</strong>サービス
            </p>
            {/* Pricingコンポーネント - 日本語版の料金プラン */}
            <Pricing pricing={{
              name: "料金プラン",
              title: "AI画像生成の料金",
              description: "生成AIを今すぐ無料で",
              items: [
                {
                  title: "無料プラン",
                  description: "AI画像生成を試す",
                  currency: "JPY",
                  price: "0",
                  unit: "/月",
                  features: ["毎日10枚のAI画像生成", "基本的な画像生成AI機能", "512×512解像度"],
                  interval: "month" as const,
                  product_id: "free_plan_jp",
                  product_name: "無料プラン",
                  amount: 0,
                  credits: 10,
                  group: "basic",
                  button: {
                    text: "無料で始める",
                    link: "/ja/auth/signin",
                    variant: "outline" as const,
                    size: "lg" as const
                  }
                },
                {
                  title: "プロプラン",
                  description: "本格的なAI画像生成",
                  currency: "JPY",
                  price: "2,980",
                  unit: "/月",
                  features: ["月500枚のAI画像生成", "全画像生成AIスタイル", "4K高解像度", "商用利用OK"],
                  interval: "month" as const,
                  product_id: "pro_plan_jp",
                  product_name: "プロプラン",
                  amount: 2980,
                  credits: 500,
                  group: "pro",
                  is_featured: true,
                  label: "人気",
                  button: {
                    text: "プロプランへ",
                    link: "/ja/pricing",
                    variant: "default" as const,
                    size: "lg" as const
                  }
                },
                {
                  title: "企業プラン",
                  description: "無制限のAI画像生成",
                  currency: "JPY",
                  price: "お問い合わせ",
                  unit: "",
                  features: ["無制限のAI画像生成", "専用画像生成AIモデル", "APIアクセス", "優先サポート"],
                  interval: "month" as const,
                  product_id: "enterprise_plan_jp",
                  product_name: "企業プラン",
                  amount: 0,
                  credits: -1, // -1 indicates unlimited
                  group: "enterprise",
                  button: {
                    text: "お問い合わせ",
                    link: "/ja/contact",
                    variant: "outline" as const,
                    size: "lg" as const
                  }
                }
              ]
            }} />
          </div>
        </section>

        {/* FAQ セクション with SEO */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              <span className="text-pink-600">AI画像生成</span>についてよくある質問
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
              <strong>画像生成AI</strong>の使い方や<strong>生成AI</strong>の仕組みについて
            </p>
            <div className="max-w-3xl mx-auto">
              {/* FAQコンポーネントは既存のものを使用 */}
              {/* @ts-ignore - 型定義の不一致を一時的に無視 */}
              <FAQ section={{
                name: "FAQ",
                title: "AI画像生成FAQ",
                items: faqData.reduce((acc, item, index) => {
                  acc[String(index + 1)] = {
                    question: item.question,
                    answer: item.answer
                  };
                  return acc;
                }, {} as any)
              }} />
            </div>
          </div>
        </section>

        {/* 最終CTA with keywords */}
        <section className="py-20 bg-gradient-to-r from-pink-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              今すぐ無料で<span className="underline">AI画像生成</span>を始めよう
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              最先端の<strong>画像生成AI</strong>技術で、あなたの創造力を解き放つ。
              <br />日本語対応の<strong>AI画像生成</strong>で、誰でも簡単にプロ級の作品を。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-pink-600 font-bold rounded-lg hover:bg-gray-100 transition">
                無料でAI画像生成を始める
              </button>
              <button className="px-8 py-4 bg-transparent border-2 border-white font-bold rounded-lg hover:bg-white/10 transition">
                画像生成AIの使い方を見る
              </button>
            </div>
            <p className="text-sm mt-6 opacity-90">
              ※ <strong>AI画像生成</strong>は登録不要・クレジットカード不要で今すぐ使えます
            </p>
          </div>
        </section>
      </main>
    </>
  );
}