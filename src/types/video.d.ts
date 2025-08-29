/**
 * Video Generation Type Definitions
 * 
 * 定义视频生成相关的类型
 */

export type VideoStyle = 
  | 'smooth'      // 平滑过渡
  | 'morph'       // 变形效果
  | 'fade'        // 渐变效果
  | 'zoom';       // 缩放效果

export type CameraMovement = 
  | 'static'      // 静止
  | 'pan'         // 平移
  | 'zoom-in'     // 放大
  | 'zoom-out'    // 缩小
  | 'orbit';      // 环绕

export type VideoQuality = 
  | 'standard'    // 720p
  | 'high'        // 1080p
  | 'ultra';      // 4K

export type AspectRatio = 
  | '16:9'        // 横屏
  | '9:16'        // 竖屏
  | '1:1'         // 方形
  | '4:3';        // 传统

export interface VideoGenerationRequest {
  mode: 'text' | 'image';
  prompt?: string;
  imageUrl?: string;
  style: VideoStyle;
  duration: number; // seconds
  cameraMovement: CameraMovement;
  quality: VideoQuality;
  aspectRatio: AspectRatio;
  seed?: number;
}

export interface VideoGenerationResponse {
  success: boolean;
  taskId: string;
  videoUrl?: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  duration?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  progress?: number;
  estimatedTime?: number;
}

export interface VideoTask {
  id: string;
  userId: string;
  request: VideoGenerationRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface VideoMetadata {
  width: number;
  height: number;
  fps: number;
  duration: number;
  codec: string;
  bitrate: number;
  fileSize: number;
}