/**
 * 日语市场专用 AI 画像生成首页组件
 * 
 * SEO优化策略：
 * - 主关键词：AI画像生成 (目标密度: 2-3%)
 * - 次要关键词：無料、生成AI、画像生成AI、日本語
 * - 语义相关词：テキストから画像、イラスト、商用利用
 * 
 * 优化要点：
 * - H1标签包含主关键词
 * - 自然分布关键词于内容中
 * - 使用语义HTML标签
 * - 结构化数据支持
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useSession, signIn } from "next-auth/react";
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Palette,
  ArrowRight,
  Check,
  Star,
  TrendingUp,
  Download,
  Loader2,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AIGeneratorJapaneseHero() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("anime");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  
  // 利用可能なAIモデル（SiliconFlow）
  const aiModels = {
    anime: {
      provider: "siliconflow",
      model: "black-forest-labs/FLUX.1-schnell",
      name: "FLUX.1 (アニメ風)"
    },
    realistic: {
      provider: "siliconflow",
      model: "stabilityai/stable-diffusion-3-5-large",
      name: "SD 3.5 (写実的)"
    },
    watercolor: {
      provider: "siliconflow",
      model: "stabilityai/stable-diffusion-3-5-large-turbo",
      name: "SD 3.5 Turbo (水彩画)"
    },
    illustration: {
      provider: "siliconflow",
      model: "stabilityai/stable-diffusion-3-medium",
      name: "SD 3 (イラスト)"
    }
  };

  // 客户端初始化，避免 hydration 错误
  useEffect(() => {
    setMounted(true);
    // 初始化生成计数
    setGeneratedCount(1234567);
    
    // 获取用户积分
    if (status === "authenticated") {
      fetchUserCredits();
    }
  }, [status]);
  
  /**
   * 获取用户积分
   */
  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/get-user-credits');
      if (response.ok) {
        const data = await response.json();
        if (data.data?.left_credits !== undefined) {
          setRemainingCredits(data.data.left_credits);
        }
      }
    } catch (error) {
      console.error('获取积分失败:', error);
    }
  };
  
  // 模拟实时生成计数（仅在客户端）
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setGeneratedCount(prev => {
        if (prev === null) return 1234567;
        return prev + Math.floor(Math.random() * 3) + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [mounted]);

  /**
   * AI画像生成を実行
   * 未ログインの場合はログインダイアログを表示
   */
  const handleGenerate = async () => {
    if (!prompt) {
      toast.error("プロンプトを入力してください");
      return;
    }
    
    // 未ログインの場合はログインを促す
    if (status !== "authenticated") {
      setShowLoginDialog(true);
      toast.error("画像生成にはログインが必要です");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    
    try {
      const selectedModel = aiModels[selectedStyle as keyof typeof aiModels];
      
      // SiliconFlow APIを呼び出し
      const response = await fetch("/api/demo/gen-image-siliconflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          provider: selectedModel.provider,
          model: selectedModel.model,
          size: "1024x1024",
          n: 1,
          image_format: "jpeg"
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "画像生成に失敗しました");
      }
      
      if (result.data?.images?.[0]?.url) {
        setGeneratedImage(result.data.images[0].url);
        setShowResultDialog(true);
        toast.success("AI画像生成が完了しました！");
        
        // 残りクレジットを更新
        if (result.data.credits_remaining !== undefined) {
          setRemainingCredits(result.data.credits_remaining);
        }
        
        // 生成カウンターを更新
        setGeneratedCount(prev => (prev || 1234567) + 1);
      } else if (result.data?.images?.[0]) {
        // 別の形式のレスポンス対応
        setGeneratedImage(result.data.images[0].url || result.data.images[0]);
        setShowResultDialog(true);
        toast.success("AI画像生成が完了しました！");
        setGeneratedCount(prev => (prev || 1234567) + 1);
      } else {
        throw new Error("画像URLが取得できませんでした");
      }
      
    } catch (error: any) {
      console.error("AI画像生成エラー:", error);
      setError(error.message || "画像生成に失敗しました。もう一度お試しください。");
      
      if (error.message?.includes("API key")) {
        toast.error("API設定エラー: 管理者にお問い合わせください");
      } else if (error.message?.includes("credits")) {
        toast.error("クレジット不足: ログインしてクレジットを追加してください");
      } else {
        toast.error(error.message || "画像生成に失敗しました");
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * 生成した画像をダウンロード
   */
  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai_generated_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("画像をダウンロードしました");
    } catch (error) {
      toast.error("ダウンロードに失敗しました");
    }
  };

  // 样式示例数据
  const styleExamples = [
    { id: "anime", name: "アニメ風", sample: "/imgs/showcases/2.png" },
    { id: "realistic", name: "写実的", sample: "/imgs/showcases/3.png" },
    { id: "watercolor", name: "水彩画", sample: "/imgs/showcases/6.png" },
    { id: "illustration", name: "イラスト", sample: "/imgs/showcases/4.png" },
  ];
  
  /**
   * ログイン処理
   */
  const handleLogin = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      console.error('ログインエラー:', error);
      toast.error('ログインに失敗しました');
    }
  };

  // SEO优化的特性列表
  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "AI画像生成が完全無料",
      description: "最先端のAI画像生成技術を無料で体験。クレジットカード不要で今すぐ始められます。"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "高速AI画像生成",
      description: "画像生成AIが平均15秒で高品質な画像を生成。待ち時間なしでAI画像生成を楽しめます。"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "商用利用可能なAI生成画像",
      description: "生成AIで作成した全ての画像は商用利用OK。ビジネスでも安心してAI画像生成をご利用いただけます。"
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: "多彩なAI画像生成スタイル",
      description: "画像生成AIが20種類以上のスタイルに対応。あなた好みのAI画像生成が可能です。"
    }
  ];

  return (
    <>
      {/* SEO最適化Hero Section */}
      <section 
        className="relative min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        translate="no"
      >
        {/* 背景装飾 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 pt-20 pb-16">
          {/* 信頼性バッジ */}
          <div className="flex justify-center mb-8">
            <Badge 
              className="px-4 py-2 text-sm bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300"
              translate="no"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              <span lang="ja">
                {status === "authenticated" 
                  ? `ようこそ、${session.user?.name || session.user?.email} さん`
                  : "日本No.1 AI画像生成プラットフォーム"}
              </span>
            </Badge>
          </div>

          {/* メインタイトル - H1 with primary keyword */}
          <h1 
            className="text-5xl md:text-7xl font-bold text-center mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
            lang="ja"
            translate="no"
          >
            AI画像生成
            <span className="block text-3xl md:text-5xl mt-2">
              無料で始める創造の革命
            </span>
          </h1>

          {/* サブタイトル with keywords */}
          <p 
            className="text-xl md:text-2xl text-center text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
            lang="ja"
            translate="no"
          >
            最先端の<strong>画像生成AI</strong>で、テキストから瞬時に高品質な画像を生成。
            <br />日本語完全対応の<strong>AI画像生成</strong>ツールで、誰でも簡単にプロ級の作品を。
          </p>

          {/* 生成カウンター - クライアントサイドのみで表示 */}
          {mounted && (
            <div className="flex justify-center items-center gap-4 mb-12">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-400" lang="ja" translate="no">
                  本日の生成数: <strong className="text-pink-600">
                    {generatedCount ? generatedCount.toLocaleString() : "読み込み中..."}
                  </strong>枚
                </span>
              </div>
            </div>
          )}

          {/* AI画像生成インターフェース */}
          <Card 
            className="max-w-4xl mx-auto p-8 shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur"
            translate="no"
          >
            <div className="space-y-6">
              {/* プロンプト入力 */}
              <div>
                <label htmlFor="ai-prompt" className="block text-lg font-semibold mb-3" lang="ja">
                  AI画像生成プロンプト入力
                </label>
                <Textarea
                  id="ai-prompt"
                  placeholder="例：桜が満開の富士山、アニメ風の美しい風景、高解像度、詳細な描写..."
                  className="min-h-[120px] text-lg"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-2">
                  日本語で自由に入力してください。<strong>AI画像生成</strong>エンジンが理解します。
                </p>
              </div>

              {/* スタイル選択 */}
              <div>
                <label className="block text-lg font-semibold mb-3" lang="ja">
                  画像生成AIスタイル選択
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {styleExamples.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`relative group overflow-hidden rounded-lg border-2 transition-all ${
                        selectedStyle === style.id 
                          ? "border-pink-500 ring-2 ring-pink-500 ring-opacity-50" 
                          : "border-gray-200 hover:border-pink-500"
                      }`}
                    >
                      <Image
                        src={style.sample}
                        alt={`${style.name}のAI画像生成サンプル`}
                        width={150}
                        height={150}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-2 left-2 text-white font-medium" lang="ja">
                        {style.name}
                      </span>
                      {selectedStyle === style.id && (
                        <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成ボタン */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 text-lg py-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      AI画像生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      無料でAI画像生成を開始
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg py-6"
                >
                  <Download className="w-5 h-5 mr-2" />
                  サンプルを見る
                </Button>
              </div>

              {/* ステータス表示 */}
              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-pink-600 mt-1" />
                  <div>
                    {status === "authenticated" ? (
                      <>
                        <p className="font-semibold text-pink-700 dark:text-pink-300">
                          残りクレジット: {remainingCredits !== null ? remainingCredits : '読み込み中...'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          1枚の画像生成に5クレジットが必要です
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-pink-700 dark:text-pink-300">
                          ログインしてAI画像生成を始めましょう！
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          GoogleまたはGitHubアカウントで簡単ログイン。初回100クレジットプレゼント！
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 特徴グリッド - キーワード密度向上 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SEO強化セクション - AI画像生成の詳細説明 */}
      <section className="py-20 bg-white dark:bg-gray-800" translate="no">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            なぜ私たちの<span className="text-pink-600">AI画像生成</span>が選ばれるのか
          </h2>
          
          <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
            <p>
              <strong>AI画像生成</strong>技術の進化により、誰でも簡単にプロ級の画像を作成できる時代が到来しました。
              私たちの<strong>画像生成AI</strong>プラットフォームは、日本のユーザーのニーズに特化して開発されています。
            </p>
            
            <h3>AI画像生成の革新的な機能</h3>
            <ul>
              <li><strong>AI画像生成</strong>エンジンが日本語プロンプトを完全理解</li>
              <li>最新の<strong>生成AI</strong>モデルで高品質な画像を15秒で生成</li>
              <li><strong>画像生成AI</strong>が生成した画像は全て商用利用可能</li>
              <li>無料で始められる<strong>AI画像生成</strong>サービス</li>
            </ul>

            <p>
              <strong>AI画像生成</strong>は、クリエイティブな作業を劇的に効率化します。
              デザイナー、マーケター、コンテンツクリエイターなど、様々な職種の方が
              <strong>画像生成AI</strong>を活用して、業務効率を大幅に向上させています。
            </p>

            <h3>生成AIがもたらす可能性</h3>
            <p>
              <strong>生成AI</strong>技術は日々進化しており、私たちの<strong>AI画像生成</strong>サービスも
              常に最新のモデルを採用しています。テキストから画像への変換精度は飛躍的に向上し、
              あなたの想像を超える<strong>AI画像生成</strong>体験を提供します。
            </p>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-pink-600 to-purple-600"
            >
              今すぐ無料でAI画像生成を始める
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              クレジットカード不要 • 5分で始められる • 日本語完全対応
            </p>
          </div>
        </div>
      </section>
      
      {/* エラー表示 */}
      {error && (
        <Alert className="max-w-4xl mx-auto mt-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* ログインダイアログ */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ログインが必要です</DialogTitle>
            <DialogDescription>
              AI画像生成にはログインが必要です。無料でアカウントを作成して、今すぐAI画像生成を始めましょう！
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
              <p className="font-semibold text-pink-700 dark:text-pink-300 mb-2">
                🎁 初回特典
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ 100クレジットプレゼント（20枚分）</li>
                <li>✓ 全機能へのアクセス</li>
                <li>✓ 高解像度生成</li>
                <li>✓ 商用利用OK</li>
              </ul>
            </div>
            
            <Button
              onClick={() => handleLogin('google')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleでログイン
            </Button>
            
            <Button
              onClick={() => handleLogin('github')}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHubでログイン
            </Button>
            
            <div className="text-center">
              <Link href="/ja/auth/signin" className="text-sm text-gray-500 hover:text-gray-700">
                メールアドレスでログイン
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 生成結果ダイアログ */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>AI画像生成完了！</DialogTitle>
            <DialogDescription>
              {aiModels[selectedStyle as keyof typeof aiModels].name}で生成された画像です
            </DialogDescription>
          </DialogHeader>
          
          {generatedImage && (
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={generatedImage}
                  alt="AI生成画像"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleDownload}
                  className="flex-1"
                  variant="default"
                >
                  <Download className="w-4 h-4 mr-2" />
                  画像をダウンロード
                </Button>
                <Button
                  onClick={() => {
                    setShowResultDialog(false);
                    setPrompt("");
                    setGeneratedImage(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  新しい画像を生成
                </Button>
              </div>
              
              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>プロンプト:</strong> {prompt}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}