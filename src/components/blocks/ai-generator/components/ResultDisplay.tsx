/**
 * 结果显示组件
 * 
 * 功能：展示不同类型的AI生成结果
 * 特性：多媒体支持、复制功能、懒加载、错误处理
 */

import React, { memo, useCallback, useState, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Loader2, Video, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { 
  ResultDisplayProps, 
  TextGenerationResult, 
  ImageGenerationResult, 
  VideoGenerationResult 
} from "../types";
import { copyToClipboard, isValidURL } from "../utils";
import { DEFAULT_CONFIG, PERFORMANCE_CONFIG } from "../constants";

// 懒加载 Markdown 渲染器
const MarkdownRenderer = React.lazy(() => import("../markdown-renderer"));

const ResultDisplay = memo<ResultDisplayProps>(({ result, resultType, onCopy }) => {
  const t = useTranslations("ai_generator");
  const [imageError, setImageError] = useState(false);

  /**
   * 处理复制操作
   */
  const handleCopy = useCallback(async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success("Copied to clipboard!");
      onCopy?.(text);
    } else {
      toast.error("Failed to copy to clipboard");
    }
  }, [onCopy]);

  /**
   * 处理图片加载错误
   */
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Image load error:", e.currentTarget.src);
    setImageError(true);
    e.currentTarget.src = DEFAULT_CONFIG.placeholderImages.medium;
  }, []);

  /**
   * 渲染文本结果
   */
  const renderTextResult = useCallback((data: TextGenerationResult) => (
    <div className="space-y-4">
      {/* 推理过程（折叠展示） */}
      {data.reasoning && (
        <details className="mb-4 p-4 bg-muted/20 rounded-lg border border-border/50 transition-all duration-200 hover:bg-muted/30">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-2">
            🤔 {t("result.reasoning")}
            <span className="text-xs opacity-75">(Click to expand)</span>
          </summary>
          <div className="mt-4 p-4 bg-background/50 rounded-lg">
            <Suspense fallback={<div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>}>
              <MarkdownRenderer 
                content={data.reasoning.substring(0, PERFORMANCE_CONFIG.maxMarkdownLength)} 
              />
            </Suspense>
          </div>
        </details>
      )}
      
      {/* 主要内容 */}
      <div className="relative">
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2 h-8 w-8 z-10 bg-background/80 hover:bg-background"
          onClick={() => handleCopy(data.text || "")}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <div className="pt-8 pr-12">
          <Suspense fallback={<div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading content...</div>}>
            <MarkdownRenderer 
              content={data.text || t("result.no_text")} 
            />
          </Suspense>
        </div>
      </div>
    </div>
  ), [t, handleCopy]);

  /**
   * 渲染图像结果
   */
  const renderImageResult = useCallback((data: ImageGenerationResult) => (
    <div className="space-y-4">
      {data.image_url ? (
        <>
          <div className="relative">
            <img
              src={data.image_url}
              alt="Generated image"
              className="w-full rounded-lg shadow-lg transition-opacity duration-200 hover:opacity-95"
              onError={handleImageError}
              loading="lazy"
            />
            {/* 下载按钮 */}
            {isValidURL(data.image_url) && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = data.image_url!;
                  link.download = data.filename || 'generated_image.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* 图像信息 */}
          <div className="space-y-2">
            {data.filename && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                📄 {t("result.filename")}: <code className="bg-muted px-1 rounded text-xs">{data.filename}</code>
              </p>
            )}
            {data.revised_prompt && (
              <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Enhanced prompt:</strong> 
                  <span className="ml-1 font-normal">{data.revised_prompt}</span>
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 mt-2 text-xs"
                  onClick={() => handleCopy(data.revised_prompt || "")}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Enhanced Prompt
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed border-border/50">
          <p className="text-muted-foreground">{t("result.no_image")}</p>
        </div>
      )}
    </div>
  ), [t, handleImageError, handleCopy]);

  /**
   * 渲染视频结果
   */
  const renderVideoResult = useCallback((data: VideoGenerationResult) => {
    if (data.status === "completed" && data.video_url) {
      return (
        <div className="space-y-4">
          <video
            src={data.video_url}
            controls
            className="w-full rounded-lg shadow-lg"
            poster={data.preview_url}
          >
            Your browser does not support the video tag.
          </video>
          {data.video_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = data.video_url!;
                link.download = 'generated_video.mp4';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Video
            </Button>
          )}
        </div>
      );
    }

    if (data.status === "processing") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg">
            <div className="text-center space-y-3">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              <p className="text-muted-foreground">
                {data.message || "Processing video..."}
              </p>
              {data.frame_count && data.fps && (
                <p className="text-xs text-muted-foreground">
                  Generating {data.frame_count} frames at {data.fps} fps
                </p>
              )}
            </div>
          </div>

          {/* 预览帧 */}
          {data.frames && data.frames.length > 0 && (
            <div className="grid grid-cols-6 gap-2">
              {data.frames.slice(0, PERFORMANCE_CONFIG.maxImagesPerResult).map((frame, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={frame.url}
                    alt={`Frame ${idx + 1}`}
                    className="w-full h-auto rounded transition-all duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute bottom-0 right-0 text-xs bg-black/50 text-white px-1 rounded-tl">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Demo 或其他状态
    return (
      <div className="p-8 bg-muted/20 rounded-lg text-center border-2 border-dashed border-border/50">
        <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">
          {data.message || "Video generation demo"}
        </p>
        {data.preview_url && (
          <img
            src={data.preview_url}
            alt="Video preview"
            className="w-64 mx-auto rounded-lg mt-4"
            loading="lazy"
          />
        )}
        {data.credits_required && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              💳 Requires {data.credits_required} credits
            </p>
            <p className="text-xs text-muted-foreground">
              ⏱️ Estimated time: {data.estimated_time || 30} seconds
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
    );
  }, []);

  if (!result) {
    return null;
  }

  return (
    <Card className="p-6 bg-background/50 border-border/50 mt-6 transition-all duration-200 hover:bg-background/60">
      {/* 标题和提供商信息 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {t("result.title")}
        </h3>
        <div className="flex items-center gap-2">
          {'provider' in result && result.provider && (
            <Badge variant="secondary" className="text-xs">
              {result.provider}
            </Badge>
          )}
          {'model' in result && result.model && (
            <Badge variant="outline" className="text-xs">
              {result.model}
            </Badge>
          )}
        </div>
      </div>

      {/* 结果内容 */}
      {resultType === "text" && renderTextResult(result as TextGenerationResult)}
      {resultType === "image" && renderImageResult(result as ImageGenerationResult)}
      {resultType === "video" && renderVideoResult(result as VideoGenerationResult)}

      {/* 积分信息 */}
      {'credits_used' in result && result.credits_used && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground flex items-center justify-between">
            <span>Credits used: {result.credits_used}</span>
            {'credits_remaining' in result && result.credits_remaining !== undefined && (
              <span>Remaining: {result.credits_remaining}</span>
            )}
          </p>
        </div>
      )}
    </Card>
  );
});

ResultDisplay.displayName = "ResultDisplay";

export default ResultDisplay;