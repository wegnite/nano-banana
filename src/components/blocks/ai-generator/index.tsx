/**
 * AI Generator 组件
 * 
 * 功能：提供统一的 AI 内容生成界面
 * 支持：文本、图像、视频生成（多提供商）
 * 
 * 修改历史：
 * - 默认选择 OpenRouter（因为 OpenAI 配额问题）
 * - 添加提供商状态指示（✅ 可用，⚠️ 警告）
 * - 改进错误处理，自动切换到可用提供商
 * - 添加 i18n 国际化支持
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Zap, Image, FileText, Video, Copy } from "lucide-react";
import NextImage from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import MarkdownRenderer from "./markdown-renderer";

/**
 * AI 提供商配置
 * status 字段说明：
 * - working: 正常工作
 * - quota_exceeded: 配额超限
 * - needs_key: 需要配置 API key
 */
const AI_PROVIDERS = {
  text: [
    { id: "openrouter", name: "OpenRouter ✅", logo: "🌐", models: ["meta-llama/llama-3.3-70b-instruct", "deepseek/deepseek-r1", "google/gemini-2.0-flash-thinking-exp-1219", "anthropic/claude-3.5-sonnet"], status: "working" },
    { id: "openai", name: "OpenAI ⚠️", logo: "🤖", models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"], status: "quota_exceeded" },
    { id: "deepseek", name: "DeepSeek", logo: "🔮", models: ["deepseek-chat", "deepseek-r1"], status: "needs_key" },
    { id: "siliconflow", name: "SiliconFlow ✅", logo: "⚡", models: ["deepseek-ai/DeepSeek-R1", "Qwen/Qwen2.5-72B-Instruct"], status: "working" },
  ],
  image: [
    { id: "siliconflow", name: "SiliconFlow ✅", logo: "⚡", models: ["black-forest-labs/FLUX.1-schnell", "stabilityai/stable-diffusion-3-5-large", "stabilityai/stable-diffusion-3-5-large-turbo"], status: "working" },
    { id: "openrouter", name: "OpenRouter 🚧", logo: "🌐", models: ["stable-diffusion", "flux-experimental", "dalle-style"], status: "experimental" },
    { id: "midjourney", name: "Midjourney", logo: "🎨", models: ["v6", "v5.2"], status: "needs_key" },
    { id: "flux", name: "FLUX", logo: "✨", models: ["schnell", "pro"], status: "needs_key" },
    { id: "ideogram", name: "Ideogram", logo: "💫", models: ["v2", "v1"], status: "needs_key" },
    { id: "dalle", name: "DALL·E", logo: "🖼️", models: ["dall-e-3", "dall-e-2"], status: "quota_exceeded" },
    { id: "replicate", name: "Replicate", logo: "🔄", models: ["black-forest-labs/flux-schnell", "stability-ai/sdxl"], status: "needs_key" },
  ],
  video: [
    { id: "siliconflow", name: "SiliconFlow ✅", logo: "⚡", models: ["Wan-AI/Wan2.2-T2V-A14B", "Pro/CogVideoX-5B-OpenSource"], status: "working" },
    { id: "openrouter-video", name: "OpenRouter Video 🚧", logo: "🌐", models: ["animation/stable-diffusion-animation", "replicate/stable-video-diffusion"], status: "experimental" },
    { id: "kling", name: "KLING", logo: "🎬", models: ["kling-v1.5", "kling-v1"], status: "needs_key" },
    { id: "runway", name: "Runway", logo: "🎥", models: ["gen-3", "gen-2"], status: "needs_key" },
    { id: "pika", name: "Pika", logo: "📹", models: ["pika-1.0"], status: "needs_key" },
  ],
};

interface AIGeneratorProps {
  hero?: {
    title?: string;
    subtitle?: string;
    badge?: string;
  };
}

export default function AIGenerator({ hero }: AIGeneratorProps) {
  const { data: session } = useSession();
  const t = useTranslations("ai_generator");
  const [activeTab, setActiveTab] = useState("text");
  // 默认选择 OpenRouter，因为它目前可用（OpenAI 配额问题）
  const [selectedProvider, setSelectedProvider] = useState("openrouter");
  const [selectedModel, setSelectedModel] = useState("meta-llama/llama-3.3-70b-instruct");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [credits, setCredits] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [prompt]);

  // Update selected provider and model when tab changes
  useEffect(() => {
    const providers = AI_PROVIDERS[activeTab as keyof typeof AI_PROVIDERS];
    if (providers && providers.length > 0) {
      // Default to SiliconFlow for image and video since it's working
      if (activeTab === "image" || activeTab === "video") {
        const siliconflow = providers.find(p => p.id === "siliconflow");
        if (siliconflow) {
          setSelectedProvider(siliconflow.id);
          setSelectedModel(siliconflow.models[0]);
        } else {
          setSelectedProvider(providers[0].id);
          setSelectedModel(providers[0].models[0]);
        }
      } else {
        // For text, default to OpenRouter as it's working
        setSelectedProvider(providers[0].id);
        setSelectedModel(providers[0].models[0]);
      }
    }
  }, [activeTab]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t("errors.empty_prompt"));
      return;
    }

    // Remove authentication requirement for demo
    // if (!session) {
    //   toast.error("Please sign in to generate content");
    //   return;
    // }

    setIsGenerating(true);
    setResult(null);

    try {
      let endpoint = "";
      let body: any = {
        prompt: prompt.trim(),
        provider: selectedProvider,
        model: selectedModel,
      };

      switch (activeTab) {
        case "text":
          endpoint = "/api/demo/gen-text";
          break;
        case "image":
          // 根据提供商选择不同的端点
          if (selectedProvider === "siliconflow") {
            endpoint = "/api/demo/gen-image-siliconflow"; // 使用 SiliconFlow 图像生成
          } else if (selectedProvider === "openrouter") {
            endpoint = "/api/demo/gen-image-simple"; // 使用简化的 API
          } else {
            endpoint = "/api/demo/gen-image";
          }
          break;
        case "video":
          // 视频生成端点
          if (selectedProvider === "siliconflow") {
            endpoint = "/api/demo/gen-video-siliconflow"; // 使用 SiliconFlow 视频生成
          } else if (selectedProvider === "openrouter-video") {
            endpoint = "/api/demo/gen-video-openrouter";
          } else {
            toast.error(t("errors.video_coming_soon"));
            setIsGenerating(false);
            return;
          }
          break;
        default:
          throw new Error("Invalid generation type");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // First check if response is ok before trying to parse JSON
      console.log("Response OK:", response.ok, "Status:", response.status);
      console.log("Endpoint:", endpoint);
      
      let data;
      const responseText = await response.text();
      console.log("Raw response:", responseText.substring(0, 500)); // Log first 500 chars
      
      // Check if response is HTML (error page) instead of JSON
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error("Received HTML instead of JSON. This usually means the endpoint doesn't exist.");
        if (response.status === 404) {
          throw new Error("API endpoint not found. Please check the server is running correctly.");
        } else {
          throw new Error("Server error. Please try again later.");
        }
      }
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        console.error("Response text was:", responseText);
        throw new Error("Server returned invalid response. Please try again.");
      }

      console.log("API Response:", data); // Debug log

      // Check for API errors
      if (!response.ok || data.code !== 0) {
        throw new Error(data.error || data.message || "Generation failed");
      }

      // Check if data.data exists and has content
      if (!data.data) {
        throw new Error("No data returned from API");
      }
      
      // Handle different response formats
      if (activeTab === "text") {
        // Text generation returns {data: {text, reasoning, credits_used, credits_remaining}}
        setResult(data.data);
        
        // 更新积分显示
        if (data.data.credits_remaining !== undefined) {
          setCredits(data.data.credits_remaining);
          toast.info(`Used ${data.data.credits_used || 1} credit(s). ${data.data.credits_remaining} remaining.`);
        }
      } else if (activeTab === "image") {
        // Handle different image response formats
        if (selectedProvider === "siliconflow") {
          // SiliconFlow returns {data: {images: [...], credits_used, credits_remaining}}
          const imageData = data.data;
          if (imageData.images && imageData.images.length > 0) {
            const firstImage = imageData.images[0];
            setResult({
              image_url: firstImage.url || `/api/placeholder/1024/1024`,
              provider: firstImage.provider || "siliconflow",
              model: firstImage.model,
              filename: firstImage.filename,
              revised_prompt: firstImage.revised_prompt,
            });
            // Update credits if returned
            if (imageData.credits_remaining !== undefined) {
              setCredits(imageData.credits_remaining);
              toast.info(`Used ${imageData.credits_used || 5} credit(s). ${imageData.credits_remaining} remaining.`);
            }
          } else {
            setResult({
              image_url: `/api/placeholder/1024/1024`,
              provider: selectedProvider,
              filename: "generated_image.png"
            });
          }
        } else if (selectedProvider === "openrouter") {
          // OpenRouter returns {data: {images: [...], credits_used, credits_remaining}}
          const imageData = data.data;
          if (imageData.images && imageData.images.length > 0) {
            const firstImage = imageData.images[0];
            setResult({
              image_url: firstImage.url || `/api/placeholder/1024/1024`,
              provider: firstImage.provider || "openrouter",
              model: firstImage.model,
              filename: firstImage.filename,
              revised_prompt: firstImage.revised_prompt,
            });
            // Update credits if returned
            if (imageData.credits_remaining !== undefined) {
              setCredits(imageData.credits_remaining);
            }
          } else {
            setResult({
              image_url: `/api/placeholder/1024/1024`,
              provider: selectedProvider,
              filename: "generated_image.png"
            });
          }
        } else {
          // Original image generation format
          const images = data.data;
          if (images && images.length > 0) {
            const firstImage = images[0];
            setResult({
              image_url: firstImage.url || `/api/placeholder/512/512`,
              provider: firstImage.provider,
              filename: firstImage.filename
            });
          } else {
            setResult({
              image_url: `/api/placeholder/512/512`,
              provider: selectedProvider,
              filename: "demo_image.png"
            });
          }
        }
      } else if (activeTab === "video") {
        // Video generation response
        setResult(data.data);
        // Update credits if returned
        if (data.data.credits_remaining !== undefined) {
          setCredits(data.data.credits_remaining);
        }
      }
      
      toast.success(t("success.generated"));
    } catch (error: any) {
      console.error("Generation error:", error);
      
      let errorMessage = error.message || t("errors.generation_failed");
      
      /**
       * 智能错误处理
       * - 检测积分不足错误
       * - 检测未登录错误
       * - 检测 OpenAI 配额错误
       * - 提供友好的用户提示
       */
      if (errorMessage.includes("Insufficient credits")) {
        // 积分不足
        const match = errorMessage.match(/You have (\d+) credits/);
        if (match) {
          setCredits(parseInt(match[1]));
        }
        errorMessage = "💳 " + errorMessage;
        toast.error(errorMessage, {
          action: {
            label: "Recharge",
            onClick: () => window.location.href = "/pricing"
          }
        });
      } else if (errorMessage.includes("Please login first")) {
        // 未登录
        errorMessage = "🔐 Please login to use AI generation";
        toast.error(errorMessage, {
          action: {
            label: "Login",
            onClick: () => window.location.href = "/login"
          }
        });
      } else if (errorMessage.includes("quota exceeded") || errorMessage.includes("insufficient_quota")) {
        // OpenAI 配额问题
        errorMessage = "⚠️ OpenAI quota exceeded. Please switch to OpenRouter (it's working!) or add credits to your OpenAI account.";
        
        setSelectedProvider("openrouter");
        setSelectedModel("meta-llama/llama-3.3-70b-instruct");
        toast.info("Switched to OpenRouter - try generating again!");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getProviders = () => {
    return AI_PROVIDERS[activeTab as keyof typeof AI_PROVIDERS] || [];
  };

  const getCurrentProvider = () => {
    return getProviders().find((p) => p.id === selectedProvider);
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          {hero?.badge && (
            <Badge className="px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {hero.badge}
            </Badge>
          )}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              {hero?.title || "Unleash Your Creativity with"}
            </span>
            <br />
            <span className="text-foreground">AI Universal Generator</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {hero?.subtitle || "Transform your ideas into stunning content using cutting-edge AI models from leading providers"}
          </p>
        </div>

        {/* Main Generator Interface */}
        <Card className="p-8 bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
          {/* Tab Selection */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t("tabs.text")}
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                {t("tabs.image")}
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                {t("tabs.video")}
              </TabsTrigger>
            </TabsList>

            {/* Generator Content */}
            <TabsContent value={activeTab} className="space-y-6">
              {/* 提供商状态提示：显示当前选择的提供商是否可用 */}
              {activeTab === "text" && selectedProvider === "openai" && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ OpenAI API quota exceeded. Please switch to <strong>OpenRouter</strong> or <strong>SiliconFlow</strong>.
                  </p>
                </div>
              )}
              {activeTab === "text" && selectedProvider === "openrouter" && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ OpenRouter is ready to use with your API key!
                  </p>
                </div>
              )}
              {activeTab === "text" && selectedProvider === "siliconflow" && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ SiliconFlow (硅基流动) is ready with DeepSeek-R1 and Qwen models!
                  </p>
                </div>
              )}
              {activeTab === "image" && selectedProvider === "siliconflow" && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ SiliconFlow image generation with FLUX.1 and Stable Diffusion 3.5 is ready!
                  </p>
                </div>
              )}
              {activeTab === "image" && selectedProvider === "openrouter" && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    🚧 OpenRouter image generation is experimental. Try SiliconFlow for real image generation!
                  </p>
                </div>
              )}
              {activeTab === "video" && selectedProvider === "siliconflow" && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ SiliconFlow video generation with CogVideoX and LTX-Video is ready! (May take 30-60 seconds)
                  </p>
                </div>
              )}
              {activeTab === "video" && selectedProvider === "openrouter-video" && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    🎬 Video generation through OpenRouter is in development. Try SiliconFlow for real video generation!
                  </p>
                </div>
              )}
              
              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("prompt.label")}
                </label>
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeTab === "text"
                      ? t("prompt.placeholder_text")
                      : activeTab === "image"
                      ? t("prompt.placeholder_image")
                      : t("prompt.placeholder_video")
                  }
                  className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Model Selection */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t("model_selection.provider_label")}
                  </label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getProviders().map((provider) => (
                        <SelectItem 
                          key={provider.id} 
                          value={provider.id}
                          className={cn(
                            (provider as any).status === "working" && "bg-green-50 dark:bg-green-900/20",
                            (provider as any).status === "quota_exceeded" && "bg-yellow-50 dark:bg-yellow-900/20"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span>{provider.logo}</span>
                            <span>{provider.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t("model_selection.model_label")}
                  </label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getCurrentProvider()?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Badge variant="secondary" className="h-10 px-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {credits} {t("credits")}
                  </Badge>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t("generate_button.generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {activeTab === "text" ? t("generate_button.text") : activeTab === "image" ? t("generate_button.image") : t("generate_button.video")}
                  </>
                )}
              </Button>

              {/* Result Display */}
              {result && (
                <Card className="p-6 bg-background/50 border-border/50 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {t("result.title")}
                    {result.provider && (
                      <Badge variant="secondary" className="text-xs">
                        {result.provider}
                      </Badge>
                    )}
                  </h3>
                  {activeTab === "text" ? (
                    <div className="space-y-4">
                      {result.reasoning && (
                        <details className="mb-4 p-4 bg-muted/20 rounded-lg border border-border/50">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors font-medium">
                            🤔 {t("result.reasoning")}
                          </summary>
                          <div className="mt-4 p-4 bg-background/50 rounded-lg">
                            <MarkdownRenderer content={result.reasoning} />
                          </div>
                        </details>
                      )}
                      <div className="relative">
                        {/* Copy button for the entire result */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-2 top-2 h-8 w-8"
                          onClick={() => {
                            navigator.clipboard.writeText(result.text || "");
                            toast.success("Copied to clipboard!");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {/* Render the main content with Markdown support */}
                        <div className="pt-8">
                          <MarkdownRenderer content={result.text || t("result.no_text")} />
                        </div>
                      </div>
                    </div>
                  ) : activeTab === "image" ? (
                    <div className="space-y-4">
                      {result.image_url ? (
                        <>
                          <NextImage
                            src={result.image_url}
                            alt="Generated image"
                            width={1024}
                            height={1024}
                            className="w-full rounded-lg shadow-lg"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyBZWVZbAnoCR1xzFTlTEqabgDbvhLnbVA/wGFyVccRRdTCqQjwTKLOZ+KZOjLb8Y2IVHWcNgF0eF8pX4pzwRLfvTOdCe7N5YYUNAhhJKyT6JYgKdREGODdxHvGqVxOdAl3JjYkOvHKe4VlQ1bwPOmDEwGbLt5+5LnKWoqyZbD0nMXpvKGvHpV78Q7f6Jb6nHZuLe/HcJoB2b5SgZDRbgkaSJAYVhWTMILI/wBA6ZNGBs4qOTKW8e8Q6SLzWRgHbK2AqHHlELCW/bH2pLXdEZ/+k9zPP/v//Z"
                          />
                          {result.filename && (
                            <p className="text-sm text-muted-foreground">
                              {t("result.filename")}: {result.filename}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
                          <p className="text-muted-foreground">{t("result.no_image")}</p>
                        </div>
                      )}
                      {result.revised_prompt && (
                        <div className="mt-2 p-3 bg-muted/20 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            <strong>Enhanced prompt:</strong> {result.revised_prompt}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : activeTab === "video" ? (
                    <div className="space-y-4">
                      {result.status === "completed" && result.video_url ? (
                        <video
                          src={result.video_url}
                          controls
                          className="w-full rounded-lg shadow-lg"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : result.status === "processing" ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg">
                            <div className="text-center space-y-3">
                              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                              <p className="text-muted-foreground">
                                {result.message || "Processing video..."}
                              </p>
                              {result.frame_count && (
                                <p className="text-xs text-muted-foreground">
                                  Generating {result.frame_count} frames at {result.fps} fps
                                </p>
                              )}
                            </div>
                          </div>
                          {result.frames && result.frames.length > 0 && (
                            <div className="grid grid-cols-6 gap-2">
                              {result.frames.slice(0, 6).map((frame: any, idx: number) => (
                                <div key={idx} className="relative">
                                  <NextImage
                                    src={frame.url}
                                    alt={`Video frame ${idx + 1}`}
                                    width={120}
                                    height={80}
                                    className="w-full h-auto rounded object-cover"
                                    loading="lazy"
                                  />
                                  <span className="absolute bottom-0 right-0 text-xs bg-black/50 text-white px-1">
                                    {idx + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : result.status === "demo" || result.demo ? (
                        <div className="p-8 bg-muted/20 rounded-lg text-center">
                          <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground mb-2">
                            {result.message || "Video generation demo"}
                          </p>
                          {result.preview_url && (
                            <NextImage
                              src={result.preview_url}
                              alt="Video preview"
                              width={256}
                              height={256}
                              className="w-64 mx-auto rounded-lg mt-4"
                              loading="lazy"
                            />
                          )}
                          {result.credits_required && (
                            <div className="mt-4 space-y-2">
                              <p className="text-sm text-muted-foreground">
                                💳 Requires {result.credits_required} credits
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ⏱️ Estimated time: {result.estimated_time || 30} seconds
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = "/login"}
                                className="mt-2"
                              >
                                Login to Generate Real Videos
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
                          <p className="text-muted-foreground">{t("result.no_video") || "No video generated"}</p>
                        </div>
                      )}
                      {result.credits_used && (
                        <p className="text-sm text-muted-foreground">
                          Credits used: {result.credits_used} | Remaining: {result.credits_remaining}
                        </p>
                      )}
                    </div>
                  ) : null}
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Provider Badges */}
        <div className="flex flex-wrap justify-center gap-4 opacity-60">
          {AI_PROVIDERS[activeTab as keyof typeof AI_PROVIDERS]?.map((provider) => (
            <Badge
              key={provider.id}
              variant="outline"
              className="px-3 py-1.5 border-border/50"
            >
              <span className="mr-1.5">{provider.logo}</span>
              {provider.name}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}