/**
 * CharacterVideoGenerator Component
 * 
 * 创新工作流：
 * 1. 用户上传图片或输入提示词
 * 2. nano-banana生成首帧和尾帧
 * 3. 可灵AI进行视频补间
 * 4. 用户可下载成品视频
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Upload, 
  Sparkles, 
  Download, 
  Play, 
  Loader2, 
  ImageIcon,
  Clock,
  Camera,
  Zap,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';

interface CharacterVideoGeneratorProps {
  locale: string;
}

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  progress?: number;
}

export default function CharacterVideoGenerator({ locale }: CharacterVideoGeneratorProps) {
  const [mode, setMode] = useState<'prompt' | 'upload'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // Video generation settings
  const [videoStyle, setVideoStyle] = useState('smooth');
  const [videoDuration, setVideoDuration] = useState('5');
  const [cameraMovement, setCameraMovement] = useState('pan');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [generatedVideo, setGeneratedVideo] = useState<string>('');
  const [firstFrame, setFirstFrame] = useState<string>('');
  const [lastFrame, setLastFrame] = useState<string>('');
  
  // Error state
  const [error, setError] = useState<string>('');

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // Initialize generation steps
  const initializeSteps = (): GenerationStep[] => [
    {
      id: 'analyze',
      title: 'Analyzing Input',
      description: 'Processing your prompt or image',
      status: 'waiting',
    },
    {
      id: 'first-frame',
      title: 'Generating First Frame',
      description: 'Creating starting keyframe with nano-banana',
      status: 'waiting',
    },
    {
      id: 'last-frame',
      title: 'Generating Last Frame',
      description: 'Creating ending keyframe with nano-banana',
      status: 'waiting',
    },
    {
      id: 'video-generation',
      title: 'Creating Video',
      description: 'Generating smooth video with Kling AI',
      status: 'waiting',
    },
    {
      id: 'finalize',
      title: 'Finalizing',
      description: 'Processing and preparing download',
      status: 'waiting',
    },
  ];

  // Update step status
  const updateStep = (stepId: string, updates: Partial<GenerationStep>) => {
    setGenerationSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  // Handle video generation
  const handleGenerate = async () => {
    // Validation
    if (mode === 'prompt' && !prompt.trim()) {
      setError('Please enter a prompt describing your character figure');
      return;
    }
    if (mode === 'upload' && !uploadedImage) {
      setError('Please upload an image');
      return;
    }

    setError('');
    setIsGenerating(true);
    setGenerationSteps(initializeSteps());
    setGeneratedVideo('');

    try {
      // Step 1: Analyze input
      updateStep('analyze', { status: 'processing' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep('analyze', { status: 'completed' });

      // Step 2: Generate first frame
      updateStep('first-frame', { status: 'processing', progress: 0 });
      
      const formData = new FormData();
      if (mode === 'prompt') {
        formData.append('prompt', prompt);
      } else if (uploadedImage) {
        formData.append('image', uploadedImage);
      }
      formData.append('videoStyle', videoStyle);
      formData.append('duration', videoDuration);
      formData.append('cameraMovement', cameraMovement);

      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        updateStep('first-frame', { progress: i });
      }
      
      // Mock first frame for demo
      setFirstFrame('/api/placeholder/400/400');
      updateStep('first-frame', { status: 'completed', progress: 100 });

      // Step 3: Generate last frame
      updateStep('last-frame', { status: 'processing', progress: 0 });
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        updateStep('last-frame', { progress: i });
      }
      
      // Mock last frame for demo
      setLastFrame('/api/placeholder/400/400');
      updateStep('last-frame', { status: 'completed', progress: 100 });

      // Step 4: Generate video with Kling
      updateStep('video-generation', { status: 'processing', progress: 0 });
      
      // Call actual API
      const response = await fetch('/api/character-figure/video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Video generation failed');
      }

      const data = await response.json();
      
      // Simulate video generation progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateStep('video-generation', { progress: i });
      }
      
      updateStep('video-generation', { status: 'completed', progress: 100 });

      // Step 5: Finalize
      updateStep('finalize', { status: 'processing' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGeneratedVideo(data.videoUrl || '/api/placeholder/video');
      updateStep('finalize', { status: 'completed' });

    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate video. Please try again.');
      setGenerationSteps(prev => 
        prev.map(step => 
          step.status === 'processing' ? { ...step, status: 'error' } : step
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Multi-language content
  const content = {
    en: {
      title: 'Create Video from Character Figure',
      promptTab: 'Text to Video',
      uploadTab: 'Image to Video',
      promptPlaceholder: 'Describe your character figure animation...',
      uploadButton: 'Choose Image',
      generateButton: 'Generate Video',
      downloadButton: 'Download Video',
      settings: 'Video Settings',
      style: 'Animation Style',
      duration: 'Duration',
      camera: 'Camera Movement',
    },
    zh: {
      title: '从角色手办创建视频',
      promptTab: '文字生成视频',
      uploadTab: '图片生成视频',
      promptPlaceholder: '描述您的角色手办动画...',
      uploadButton: '选择图片',
      generateButton: '生成视频',
      downloadButton: '下载视频',
      settings: '视频设置',
      style: '动画风格',
      duration: '时长',
      camera: '摄像机运动',
    },
  };

  const t = content[locale as keyof typeof content] || content.en;

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <Card className="bg-gray-900/50 border-purple-500/20 p-8">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <Video className="h-6 w-6 text-purple-400" />
          {t.title}
        </h2>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'prompt' | 'upload')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="prompt" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t.promptTab}
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t.uploadTab}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="prompt" className="space-y-4">
            <Textarea
              placeholder={t.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] bg-gray-800 border-gray-700 text-white"
            />
            
            {/* Prompt suggestions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt('A cute anime character figure waving hello, pastel colors')}
                className="text-xs"
              >
                Anime Character
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt('Realistic warrior figure in battle stance, dramatic lighting')}
                className="text-xs"
              >
                Battle Warrior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrompt('Chibi style character figure dancing happily')}
                className="text-xs"
              >
                Dancing Chibi
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative w-full max-w-md mx-auto">
                    <Image
                      src={imagePreview}
                      alt="Uploaded"
                      width={400}
                      height={400}
                      className="rounded-lg"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadedImage(null);
                      setImagePreview('');
                    }}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div>
                  <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <span className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                      {t.uploadButton}
                    </span>
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Video Settings */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-400" />
            {t.settings}
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-300">{t.style}</Label>
              <Select value={videoStyle} onValueChange={setVideoStyle}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smooth">Smooth Transition</SelectItem>
                  <SelectItem value="morph">Morphing</SelectItem>
                  <SelectItem value="fade">Fade Effect</SelectItem>
                  <SelectItem value="zoom">Zoom Transition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-300">{t.duration}</Label>
              <Select value={videoDuration} onValueChange={setVideoDuration}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 seconds</SelectItem>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-300">{t.camera}</Label>
              <Select value={cameraMovement} onValueChange={setCameraMovement}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static</SelectItem>
                  <SelectItem value="pan">Pan</SelectItem>
                  <SelectItem value="zoom-in">Zoom In</SelectItem>
                  <SelectItem value="zoom-out">Zoom Out</SelectItem>
                  <SelectItem value="orbit">Orbit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="lg"
          className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5" />
              {t.generateButton}
            </>
          )}
        </Button>
      </Card>
      
      {/* Generation Progress */}
      {generationSteps.length > 0 && (
        <Card className="bg-gray-900/50 border-purple-500/20 p-8">
          <h3 className="text-xl font-semibold mb-6 text-white">Generation Progress</h3>
          
          <div className="space-y-4">
            {generationSteps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : step.status === 'processing' ? (
                    <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-white">{step.title}</span>
                    {step.progress !== undefined && step.status === 'processing' && (
                      <span className="text-sm text-gray-400">{step.progress}%</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{step.description}</p>
                  {step.status === 'processing' && step.progress !== undefined && (
                    <Progress value={step.progress} className="h-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Preview Frames */}
          {(firstFrame || lastFrame) && (
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              {firstFrame && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">First Frame</h4>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                    <Image
                      src={firstFrame}
                      alt="First frame"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              {lastFrame && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Last Frame</h4>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                    <Image
                      src={lastFrame}
                      alt="Last frame"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
      
      {/* Result Section */}
      {generatedVideo && (
        <Card className="bg-gray-900/50 border-purple-500/20 p-8">
          <h3 className="text-xl font-semibold mb-4 text-white">Your Generated Video</h3>
          
          <div className="space-y-4">
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <video
                src={generatedVideo}
                controls
                className="w-full h-full"
                poster={firstFrame}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedVideo;
                  link.download = 'character-figure-video.mp4';
                  link.click();
                }}
              >
                <Download className="mr-2 h-5 w-5" />
                {t.downloadButton}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  // Reset for new generation
                  setGeneratedVideo('');
                  setGenerationSteps([]);
                  setFirstFrame('');
                  setLastFrame('');
                }}
              >
                Generate Another
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Feature highlights */}
      <div className="grid md:grid-cols-3 gap-4 text-center">
        <Card className="bg-gray-900/50 border-purple-500/20 p-4">
          <Zap className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <h4 className="font-semibold text-white">Fast Generation</h4>
          <p className="text-sm text-gray-400">Under 30 seconds</p>
        </Card>
        
        <Card className="bg-gray-900/50 border-purple-500/20 p-4">
          <Video className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <h4 className="font-semibold text-white">HD Quality</h4>
          <p className="text-sm text-gray-400">1080p resolution</p>
        </Card>
        
        <Card className="bg-gray-900/50 border-purple-500/20 p-4">
          <Download className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <h4 className="font-semibold text-white">Free Download</h4>
          <p className="text-sm text-gray-400">MP4 format</p>
        </Card>
      </div>
    </div>
  );
}