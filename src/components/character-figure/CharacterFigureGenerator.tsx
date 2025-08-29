/**
 * Character Figure Generator Component
 * 
 * Problem: Complex UI for image generation needs to be simple and intuitive
 * Solution: Step-by-step interface with clear visual feedback
 * 
 * Core functionality:
 * - Image upload with preview
 * - Style selection grid
 * - Parameter adjustment
 * - Real-time generation status
 */

'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Upload, Sparkles, Download, Share2, RefreshCw, LogIn } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useAppContext } from '@/contexts/app';

interface GeneratorProps {
  locale: string;
}

// Style presets with their descriptions
const STYLE_PRESETS = [
  { id: 'ghibli', name: '吉卜力风格', nameEn: 'Ghibli Style', icon: '🏯', description: '宫崎骏动画风格' },
  { id: 'figure', name: '手办风格', nameEn: 'Character Figure', icon: '🎭', description: '收藏级手办效果' },
  { id: 'anime', name: '动漫风格', nameEn: 'Anime Style', icon: '✨', description: '经典日系动漫' },
  { id: 'oil', name: '油画风格', nameEn: 'Oil Painting', icon: '🎨', description: '传统油画艺术' },
  { id: 'watercolor', name: '水彩风格', nameEn: 'Watercolor', icon: '💧', description: '清新水彩画风' },
  { id: 'pixel', name: '像素风格', nameEn: 'Pixel Art', icon: '🎮', description: '复古游戏像素' },
  { id: 'none', name: '无风格', nameEn: 'No Style', icon: '📷', description: '保持原始风格' },
];

// Aspect ratio options
const ASPECT_RATIOS = [
  { value: '1:1', label: '正方形 1:1' },
  { value: '4:3', label: '横向 4:3' },
  { value: '3:4', label: '纵向 3:4' },
  { value: '16:9', label: '宽屏 16:9' },
  { value: '9:16', label: '竖屏 9:16' },
];

export default function CharacterFigureGenerator({ locale }: GeneratorProps) {
  // 认证状态和上下文
  const { data: session } = useSession();
  const { setShowSignModal } = useAppContext();
  
  // State management
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('figure');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState('hd');
  const [numImages, setNumImages] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generationTab, setGenerationTab] = useState('upload');
  
  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);
  
  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);
  
  // Handle generation
  const handleGenerate = async () => {
    // 检查用户是否已登录
    if (!session) {
      toast({
        title: '需要登录 / Sign in required',
        description: '请先登录以使用AI生成功能 / Please sign in to use AI generation',
        variant: 'destructive',
        action: (
          <Button
            size="sm"
            onClick={() => setShowSignModal(true)}
            className="ml-auto"
          >
            <LogIn className="mr-2 h-4 w-4" />
            登录 / Sign In
          </Button>
        ),
      });
      // 同时打开登录模态框
      setShowSignModal(true);
      return;
    }
    
    if (generationTab === 'upload' && !uploadedImage && !prompt) {
      toast({
        title: 'Missing input',
        description: 'Please upload an image or enter a prompt',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Build the generation prompt based on style
      const stylePrompt = STYLE_PRESETS.find(s => s.id === selectedStyle);
      let fullPrompt = prompt || '';
      
      if (selectedStyle === 'figure') {
        fullPrompt = `Turn this into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Set the scene indoors. ${prompt}`;
      } else if (selectedStyle === 'ghibli') {
        fullPrompt = `Transform in Studio Ghibli anime style, with soft watercolor backgrounds, whimsical atmosphere, and Hayao Miyazaki's signature artistic touch. ${prompt}`;
      } else if (selectedStyle === 'anime') {
        fullPrompt = `Convert to high-quality anime art style with vibrant colors, expressive eyes, and dynamic composition. ${prompt}`;
      }
      
      const response = await fetch('/api/nano-banana/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          input_image: uploadedImage,
          style: selectedStyle,
          aspect_ratio: aspectRatio,
          num_images: numImages,
          quality: quality,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // 处理特定错误
        if (response.status === 401) {
          setShowSignModal(true);
          toast({
            title: '需要登录 / Authentication required',
            description: data.error || '请登录后继续 / Please sign in to continue',
            variant: 'destructive',
          });
        } else if (data.error && data.error.includes('credits')) {
          toast({
            title: '积分不足 / Insufficient Credits',
            description: data.error || '请购买更多积分 / Please purchase more credits',
            variant: 'destructive',
          });
        } else {
          toast({
            title: '生成失败 / Generation failed',
            description: data.error || '请稍后重试 / Please try again later',
            variant: 'destructive',
          });
        }
        return;
      }
      
      setGeneratedImages(data.images || []);
      
      toast({
        title: '生成成功! / Success!',
        description: `成功生成${data.images?.length || 1}张图片 / Successfully generated ${data.images?.length || 1} images`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: '生成错误 / Generation Error',
        description: '发生意外错误，请重试 / An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Input */}
        <div className="space-y-6">
          <Card className="p-6 border-orange-200 dark:border-orange-900">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-500" />
              Input Settings
            </h2>
            
            <Tabs value={generationTab} onValueChange={setGenerationTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Image to Image</TabsTrigger>
                <TabsTrigger value="text">Text to Image</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  {uploadedImage ? (
                    <div className="relative">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="max-w-full h-auto rounded-lg mx-auto max-h-64"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedImage(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">
                        Drag & drop your image here
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse (JPG, PNG, WebP • Max 10MB)
                      </p>
                    </>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label htmlFor="main-prompt">Main Prompt</Label>
                  <Textarea
                    id="main-prompt"
                    placeholder="A futuristic city powered by nano technology, golden hour lighting, ultra detailed..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] mt-2"
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Additional prompt for both modes */}
            <div className="mt-4">
              <Label htmlFor="additional-prompt">Additional Instructions (Optional)</Label>
              <Textarea
                id="additional-prompt"
                placeholder="Add any additional details or modifications..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-2"
              />
            </div>
          </Card>
          
          {/* Style Selection */}
          <Card className="p-6 border-orange-200 dark:border-orange-900">
            <h3 className="text-lg font-semibold mb-4">Select Style</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedStyle === style.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{style.icon}</div>
                  <div className="text-sm font-medium">
                    {locale === 'zh' ? style.name : style.nameEn}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </Card>
          
          {/* Advanced Settings */}
          <Card className="p-6 border-orange-200 dark:border-orange-900">
            <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Quality</Label>
                <RadioGroup value={quality} onValueChange={setQuality} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard">Standard</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hd" id="hd" />
                    <Label htmlFor="hd">HD (High Quality)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label>Number of Images: {numImages}</Label>
                <Slider
                  value={[parseInt(numImages)]}
                  onValueChange={(v) => setNumImages(v[0].toString())}
                  min={1}
                  max={4}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
          
          {/* Generate Button with Authentication Check */}
          {!session && (
            <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-700 dark:text-orange-300">
              <LogIn className="inline-block mr-2 h-4 w-4" />
              登录后即可开始生成 / Sign in to start generating
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                生成中... / Generating...
              </>
            ) : !session ? (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                登录并生成 / Sign In & Generate
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                立即生成 / Generate Now
              </>
            )}
          </Button>
        </div>
        
        {/* Right Panel - Output */}
        <div className="space-y-6">
          <Card className="p-6 border-orange-200 dark:border-orange-900 min-h-[600px]">
            <h2 className="text-2xl font-bold mb-4">Output Gallery</h2>
            
            {generatedImages.length > 0 ? (
              <div className="space-y-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Generated ${index + 1}`}
                      className="w-full rounded-lg"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // Download logic
                          const a = document.createElement('a');
                          a.href = image;
                          a.download = `character-figure-${Date.now()}.png`;
                          a.click();
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // Share logic
                          navigator.share?.({
                            title: 'Check out my AI Character Figure!',
                            text: 'Created with Character Figure AI Generator',
                            url: window.location.href,
                          });
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleGenerate()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate More Variations
                </Button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 mb-6 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Ready for instant generation</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your prompt and unleash the power of AI
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}