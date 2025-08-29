/**
 * Video Generation Service
 * 
 * Problem: Traditional video generation lacks control over key frames
 * Solution: Use nano-banana for high-quality first/last frames, Kling for video generation
 * 
 * Workflow:
 * 1. Generate first frame with nano-banana (high quality start)
 * 2. Generate last frame with nano-banana (controlled ending)
 * 3. Use Kling to interpolate between frames
 * 4. Combine into final video
 */

import { NanoBananaService } from './nano-banana';
import { createKling } from '@/aisdk/kling';
import { newStorage } from '@/lib/storage';
import { db } from '@/db';

export interface VideoGenerationRequest {
  // Basic parameters
  prompt: string;
  style: VideoStyle;
  duration: '3' | '5' | '10'; // seconds
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  quality: 'standard' | 'hd' | 'professional';
  
  // Frame control
  firstFramePrompt?: string; // Override prompt for first frame
  lastFramePrompt?: string;  // Override prompt for last frame
  transitionType?: TransitionType;
  
  // Advanced settings
  motionIntensity?: 'low' | 'medium' | 'high';
  cameraMovement?: CameraMovement;
  fps?: 24 | 30 | 60;
}

export enum VideoStyle {
  ANIME = 'anime',
  REALISTIC = 'realistic',
  CARTOON = 'cartoon',
  CINEMATIC = 'cinematic',
  FANTASY = 'fantasy',
  SCIFI = 'scifi',
  WATERCOLOR = 'watercolor',
  OILPAINTING = 'oil_painting',
  PIXEL = 'pixel_art',
  GHIBLI = 'ghibli'
}

export enum TransitionType {
  SMOOTH = 'smooth',
  FADE = 'fade',
  MORPH = 'morph',
  ZOOM = 'zoom',
  ROTATE = 'rotate',
  SLIDE = 'slide'
}

export enum CameraMovement {
  NONE = 'none',
  PAN_LEFT = 'pan_left',
  PAN_RIGHT = 'pan_right',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
  ORBIT = 'orbit',
  DOLLY = 'dolly'
}

export interface VideoGenerationResponse {
  videoId: string;
  status: 'pending' | 'processing_frames' | 'processing_video' | 'completed' | 'failed';
  progress: number;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  fps: number;
  resolution: string;
  fileSize?: number;
  creditsUsed: number;
  estimatedTime: number;
  error?: string;
}

export class VideoGenerationService {
  private nanoBanana: NanoBananaService;
  private kling: ReturnType<typeof createKling>;
  
  constructor() {
    this.nanoBanana = new NanoBananaService();
    this.kling = createKling({
      accessKey: process.env.KLING_ACCESS_KEY,
      secretKey: process.env.KLING_SECRET_KEY,
    });
  }
  
  /**
   * Main video generation workflow
   */
  async generateVideo(
    request: VideoGenerationRequest,
    userId: string
  ): Promise<VideoGenerationResponse> {
    try {
      // Step 1: Validate credits
      const requiredCredits = this.calculateCredits(request);
      const hasCredits = await this.validateCredits(userId, requiredCredits);
      if (!hasCredits) {
        throw new Error('Insufficient credits for video generation');
      }
      
      // Step 2: Create video generation record
      const videoId = await this.createVideoRecord(userId, request);
      
      // Step 3: Start async generation process
      this.processVideoGeneration(videoId, request, userId).catch(error => {
        console.error(`Video generation failed for ${videoId}:`, error);
        this.updateVideoStatus(videoId, 'failed', 0, error.message);
      });
      
      // Return immediately with pending status
      return {
        videoId,
        status: 'pending',
        progress: 0,
        duration: parseInt(request.duration),
        fps: request.fps || 30,
        resolution: this.getResolution(request.aspectRatio, request.quality),
        creditsUsed: requiredCredits,
        estimatedTime: this.estimateTime(request),
      };
    } catch (error) {
      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Async video generation process
   */
  private async processVideoGeneration(
    videoId: string,
    request: VideoGenerationRequest,
    userId: string
  ): Promise<void> {
    try {
      // Phase 1: Generate key frames with nano-banana
      await this.updateVideoStatus(videoId, 'processing_frames', 10);
      
      // Generate first frame
      const firstFramePrompt = this.buildFramePrompt(
        request.firstFramePrompt || request.prompt,
        request.style,
        'first'
      );
      
      const firstFrameResult = await this.nanoBanana.generateImage({
        prompt: firstFramePrompt,
        aspect_ratio: request.aspectRatio,
        quality: request.quality === 'professional' ? 'hd' : request.quality,
        style: this.mapStyleToNanoBanana(request.style),
        num_images: '1',
      });
      
      const firstFrameUrl = await this.uploadFrame(firstFrameResult.data?.images?.[0]?.url || '', `${videoId}_first`);
      await this.updateVideoStatus(videoId, 'processing_frames', 30, undefined, { firstFrameUrl });
      
      // Generate last frame
      const lastFramePrompt = this.buildFramePrompt(
        request.lastFramePrompt || request.prompt,
        request.style,
        'last'
      );
      
      const lastFrameResult = await this.nanoBanana.generateImage({
        prompt: lastFramePrompt,
        aspect_ratio: request.aspectRatio,
        quality: request.quality === 'professional' ? 'hd' : request.quality,
        style: this.mapStyleToNanoBanana(request.style),
        num_images: '1',
      });
      
      const lastFrameUrl = await this.uploadFrame(lastFrameResult.data?.images?.[0]?.url || '', `${videoId}_last`);
      await this.updateVideoStatus(videoId, 'processing_frames', 50, undefined, { lastFrameUrl });
      
      // Phase 2: Generate video with Kling
      await this.updateVideoStatus(videoId, 'processing_video', 60);
      
      const videoPrompt = this.buildVideoPrompt(request, firstFrameUrl, lastFrameUrl);
      
      // Use Kling's video generation
      const videoResult = await this.kling.video('kling-v1').doGenerate({
        prompt: videoPrompt,
        n: 1, // Generate 1 video
        providerOptions: {
          kling: {
            cfg_scale: request.quality === 'professional' ? 0.8 : 0.5,
            mode: 'std', // Standard mode for frame interpolation
            duration: parseInt(request.duration),
            aspect_ratio: request.aspectRatio,
            camera_movement: this.mapCameraMovement(request.cameraMovement),
          }
        }
      });
      
      // Check for errors in the video generation result
      if (videoResult.warnings && videoResult.warnings.length > 0) {
        const errorWarning = videoResult.warnings.find(w => w.type === 'other');
        if (errorWarning) {
          throw new Error(`Video generation failed: ${errorWarning.message}`);
        }
      }
      
      if (!videoResult.videos || videoResult.videos.length === 0) {
        throw new Error('No videos were generated');
      }
      
      // Phase 3: Post-processing and upload
      const videoUrl = await this.processAndUploadVideo(
        videoResult.videos[0] as Uint8Array, // Use first (and only) video - Kling returns Uint8Array
        videoId,
        request
      );
      
      // Create thumbnail from first frame
      const thumbnailUrl = firstFrameUrl;
      
      // Calculate file size
      const fileSize = await this.getVideoFileSize(videoUrl);
      
      // Phase 4: Finalize
      await this.updateVideoStatus(videoId, 'completed', 100, undefined, {
        videoUrl,
        thumbnailUrl,
        fileSize,
      });
      
      // Deduct credits
      await this.deductCredits(userId, this.calculateCredits(request));
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Video generation error for ${videoId}:`, error);
      await this.updateVideoStatus(videoId, 'failed', 0, errorMessage);
      throw error;
    }
  }
  
  /**
   * Build optimized prompt for frame generation
   */
  private buildFramePrompt(basePrompt: string, style: VideoStyle, frameType: 'first' | 'last'): string {
    const styleEnhancements = {
      [VideoStyle.ANIME]: 'high quality anime art, vibrant colors, studio quality',
      [VideoStyle.REALISTIC]: 'photorealistic, high detail, professional photography',
      [VideoStyle.CARTOON]: 'cartoon style, bright colors, clean lines',
      [VideoStyle.CINEMATIC]: 'cinematic shot, dramatic lighting, film quality',
      [VideoStyle.FANTASY]: 'fantasy art, magical atmosphere, detailed',
      [VideoStyle.SCIFI]: 'science fiction, futuristic, high tech',
      [VideoStyle.WATERCOLOR]: 'watercolor painting, soft edges, artistic',
      [VideoStyle.OILPAINTING]: 'oil painting, textured, classical art',
      [VideoStyle.PIXEL]: 'pixel art, retro game style, 16-bit',
      [VideoStyle.GHIBLI]: 'Studio Ghibli style, anime, watercolor backgrounds'
    };
    
    const frameHints = {
      first: 'establishing shot, clear composition, strong opening',
      last: 'conclusive scene, resolution, memorable ending'
    };
    
    return `${basePrompt}, ${styleEnhancements[style]}, ${frameHints[frameType]}, masterpiece, best quality`;
  }
  
  /**
   * Build video generation prompt for Kling
   */
  private buildVideoPrompt(
    request: VideoGenerationRequest,
    firstFrameUrl: string,
    lastFrameUrl: string
  ): string {
    const motionDescriptions = {
      low: 'subtle movement, gentle animation',
      medium: 'moderate motion, smooth transitions',
      high: 'dynamic movement, energetic animation'
    };
    
    const transitionDescriptions = {
      [TransitionType.SMOOTH]: 'smooth interpolation between frames',
      [TransitionType.FADE]: 'fade transition effect',
      [TransitionType.MORPH]: 'morphing transformation',
      [TransitionType.ZOOM]: 'zooming transition',
      [TransitionType.ROTATE]: 'rotating transition',
      [TransitionType.SLIDE]: 'sliding transition'
    };
    
    return `${request.prompt}, 
      ${motionDescriptions[request.motionIntensity || 'medium']}, 
      ${transitionDescriptions[request.transitionType || TransitionType.SMOOTH]},
      transitioning from first frame to last frame,
      maintaining consistent style and quality throughout`;
  }
  
  /**
   * Map styles between nano-banana and our system
   */
  private mapStyleToNanoBanana(style: VideoStyle): string {
    const styleMap = {
      [VideoStyle.ANIME]: 'anime',
      [VideoStyle.REALISTIC]: 'photorealistic',
      [VideoStyle.CARTOON]: 'cartoon',
      [VideoStyle.CINEMATIC]: 'cinematic',
      [VideoStyle.FANTASY]: 'fantasy_art',
      [VideoStyle.SCIFI]: 'sci_fi',
      [VideoStyle.WATERCOLOR]: 'watercolor',
      [VideoStyle.OILPAINTING]: 'oil_painting',
      [VideoStyle.PIXEL]: 'pixel_art',
      [VideoStyle.GHIBLI]: 'ghibli'
    };
    return styleMap[style] || 'general';
  }
  
  /**
   * Map camera movement for Kling
   */
  private mapCameraMovement(movement?: CameraMovement): string {
    if (!movement || movement === CameraMovement.NONE) return 'static';
    
    const movementMap = {
      [CameraMovement.PAN_LEFT]: 'pan_left',
      [CameraMovement.PAN_RIGHT]: 'pan_right',
      [CameraMovement.ZOOM_IN]: 'zoom_in',
      [CameraMovement.ZOOM_OUT]: 'zoom_out',
      [CameraMovement.ORBIT]: 'orbit',
      [CameraMovement.DOLLY]: 'dolly_forward'
    };
    
    return movementMap[movement] || 'static';
  }
  
  /**
   * Calculate required credits for video generation
   */
  private calculateCredits(request: VideoGenerationRequest): number {
    const baseCredits = {
      '3': 50,
      '5': 80,
      '10': 150
    };
    
    const qualityMultiplier = {
      'standard': 1,
      'hd': 1.5,
      'professional': 2
    };
    
    const base = baseCredits[request.duration];
    const multiplier = qualityMultiplier[request.quality];
    
    return Math.ceil(base * multiplier);
  }
  
  /**
   * Get resolution string based on aspect ratio and quality
   */
  private getResolution(aspectRatio: string, quality: string): string {
    const resolutions = {
      'standard': {
        '16:9': '1280x720',
        '9:16': '720x1280',
        '1:1': '720x720',
        '4:3': '960x720'
      },
      'hd': {
        '16:9': '1920x1080',
        '9:16': '1080x1920',
        '1:1': '1080x1080',
        '4:3': '1440x1080'
      },
      'professional': {
        '16:9': '3840x2160',
        '9:16': '2160x3840',
        '1:1': '2160x2160',
        '4:3': '2880x2160'
      }
    };
    
    return resolutions[quality as keyof typeof resolutions]?.[aspectRatio as keyof typeof resolutions['standard']] || '1920x1080';
  }
  
  /**
   * Estimate generation time
   */
  private estimateTime(request: VideoGenerationRequest): number {
    const baseTime = {
      '3': 60,
      '5': 90,
      '10': 150
    };
    
    const qualityTime = {
      'standard': 1,
      'hd': 1.3,
      'professional': 1.6
    };
    
    return Math.ceil(baseTime[request.duration] * qualityTime[request.quality]);
  }
  
  // Database operations
  private async createVideoRecord(userId: string, request: VideoGenerationRequest): Promise<string> {
    // Implementation for database record creation
    const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    // Save to database
    return videoId;
  }
  
  private async updateVideoStatus(
    videoId: string,
    status: string,
    progress: number,
    error?: string,
    updates?: Partial<VideoGenerationResponse>
  ): Promise<void> {
    // Implementation for status update
    console.log(`Video ${videoId}: ${status} - ${progress}%`);
  }
  
  private async validateCredits(userId: string, required: number): Promise<boolean> {
    // Implementation for credit validation
    return true; // Placeholder
  }
  
  private async deductCredits(userId: string, amount: number): Promise<void> {
    // Implementation for credit deduction
  }
  
  private async uploadFrame(imageUrl: string, key: string): Promise<string> {
    // Implementation for frame upload to R2
    // In a real implementation, you would download the image from imageUrl
    // and upload it to your storage service
    return `https://storage.example.com/${key}.jpg`;
  }
  
  private async processAndUploadVideo(
    videoData: Uint8Array,
    videoId: string,
    request: VideoGenerationRequest
  ): Promise<string> {
    // Implementation for video processing and upload
    // In a real implementation, you would upload the videoData to your storage service
    return `https://storage.example.com/${videoId}.mp4`;
  }
  
  private async checkKlingStatus(taskId: string): Promise<any> {
    // Implementation for checking Kling task status
    return { status: 'completed' };
  }
  
  private async getVideoFileSize(url: string): Promise<number> {
    // Implementation for getting video file size
    return 10485760; // 10MB placeholder
  }
}

// Export singleton instance
export const videoGenerationService = new VideoGenerationService();