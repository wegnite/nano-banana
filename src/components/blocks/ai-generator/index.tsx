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
import { Loader2, Sparkles, Zap, Image, FileText, Video } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// AI Provider logos and models configuration
const AI_PROVIDERS = {
  text: [
    { id: "openai", name: "OpenAI", logo: "🤖", models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"] },
    { id: "deepseek", name: "DeepSeek", logo: "🔮", models: ["deepseek-chat", "deepseek-r1"] },
    { id: "openrouter", name: "OpenRouter", logo: "🌐", models: ["deepseek/deepseek-r1", "meta-llama/llama-3.3-70b-instruct"] },
    { id: "siliconflow", name: "SiliconFlow", logo: "⚡", models: ["deepseek-ai/DeepSeek-R1", "Qwen/Qwen2.5-72B-Instruct"] },
  ],
  image: [
    { id: "midjourney", name: "Midjourney", logo: "🎨", models: ["v6", "v5.2"] },
    { id: "flux", name: "FLUX", logo: "✨", models: ["schnell", "pro"] },
    { id: "ideogram", name: "Ideogram", logo: "💫", models: ["v2", "v1"] },
    { id: "dalle", name: "DALL·E", logo: "🖼️", models: ["dall-e-3", "dall-e-2"] },
    { id: "replicate", name: "Replicate", logo: "🔄", models: ["black-forest-labs/flux-schnell", "stability-ai/sdxl"] },
  ],
  video: [
    { id: "kling", name: "KLING", logo: "🎬", models: ["kling-v1.5", "kling-v1"] },
    { id: "runway", name: "Runway", logo: "🎥", models: ["gen-3", "gen-2"] },
    { id: "pika", name: "Pika", logo: "📹", models: ["pika-1.0"] },
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
  const [activeTab, setActiveTab] = useState("text");
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
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
      setSelectedProvider(providers[0].id);
      setSelectedModel(providers[0].models[0]);
    }
  }, [activeTab]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
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
          endpoint = "/api/demo/gen-image";
          break;
        case "video":
          // Video generation endpoint (to be implemented)
          toast.error("Video generation coming soon!");
          setIsGenerating(false);
          return;
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      console.log("API Response:", data); // Debug log
      
      // Handle different response formats
      if (activeTab === "text") {
        // Text generation returns {data: {text, reasoning}}
        setResult(data.data);
      } else if (activeTab === "image") {
        // Image generation returns {data: [array of images]}
        // For demo, we'll use the first image or create a mock if upload failed
        const images = data.data;
        if (images && images.length > 0) {
          const firstImage = images[0];
          setResult({
            image_url: firstImage.url || `/api/placeholder/512/512`, // Fallback to placeholder
            provider: firstImage.provider,
            filename: firstImage.filename
          });
        } else {
          // If no image URL (upload might have failed), create a placeholder
          setResult({
            image_url: `/api/placeholder/512/512`,
            provider: selectedProvider,
            filename: "demo_image.png"
          });
        }
      }
      
      toast.success("Content generated successfully!");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate content");
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
                Text
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video
              </TabsTrigger>
            </TabsList>

            {/* Generator Content */}
            <TabsContent value={activeTab} className="space-y-6">
              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Describe what you want to generate...
                </label>
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeTab === "text"
                      ? "Write a compelling story about..."
                      : activeTab === "image"
                      ? "A beautiful landscape with..."
                      : "A cinematic scene showing..."
                  }
                  className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Model Selection */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    AI Provider
                  </label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getProviders().map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
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
                    Model
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
                    {credits} Credits
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
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate {activeTab === "text" ? "Text" : activeTab === "image" ? "Image" : "Video"}
                  </>
                )}
              </Button>

              {/* Result Display */}
              {result && (
                <Card className="p-6 bg-background/50 border-border/50 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    Generated Result
                    {result.provider && (
                      <Badge variant="secondary" className="text-xs">
                        {result.provider}
                      </Badge>
                    )}
                  </h3>
                  {activeTab === "text" ? (
                    <div className="prose prose-invert max-w-none">
                      {result.reasoning && (
                        <details className="mb-4">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                            View reasoning process
                          </summary>
                          <pre className="mt-2 p-4 bg-muted/20 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto">
                            {result.reasoning}
                          </pre>
                        </details>
                      )}
                      <div className="whitespace-pre-wrap text-foreground/90">
                        {result.text || "No text generated"}
                      </div>
                    </div>
                  ) : activeTab === "image" ? (
                    <div className="space-y-4">
                      {result.image_url ? (
                        <>
                          <img
                            src={result.image_url}
                            alt="Generated image"
                            className="w-full rounded-lg shadow-lg"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              e.currentTarget.src = `/api/placeholder/512/512`;
                            }}
                          />
                          {result.filename && (
                            <p className="text-sm text-muted-foreground">
                              Filename: {result.filename}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
                          <p className="text-muted-foreground">No image generated</p>
                        </div>
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