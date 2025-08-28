/**
 * Nano Banana API Type Definitions
 * 
 * Problem: Need type safety for nano-banana API integration
 * Solution: Define TypeScript interfaces for all API operations
 * 
 * API Documentation: https://kie.ai/nano-banana
 */

/**
 * Base response structure for nano-banana API
 */
export interface NanoBananaResponse {
  success: boolean;
  data?: {
    images?: GeneratedImage[];
    error?: string;
    message?: string;
  };
  error?: string;
  credits_used?: number;
  remaining_credits?: number;
  request_id?: string;
  processing_time?: number;
}

/**
 * Generated image data structure
 */
export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  format: string;
  size?: number;
  created_at?: string;
  expires_at?: string;
}

/**
 * Image generation request parameters
 */
export interface ImageGenerationRequest {
  /** Text prompt for image generation */
  prompt: string;
  
  /** Number of images to generate (1-4) */
  num_images?: '1' | '2' | '3' | '4';
  
  /** Optional parameters that might be supported */
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  style?: string;
  quality?: 'standard' | 'hd';
  seed?: number;
}

/**
 * Image editing request parameters
 */
export interface ImageEditingRequest {
  /** Text prompt describing the edit */
  prompt: string;
  
  /** Input image URLs (up to 5) */
  image_urls: string[];
  
  /** Number of edited images to generate (1-4) */
  num_images?: '1' | '2' | '3' | '4';
  
  /** Edit type (if supported) */
  edit_type?: 'inpaint' | 'outpaint' | 'variation' | 'style_transfer';
  
  /** Mask URL for inpainting (if supported) */
  mask_url?: string;
}

/**
 * API configuration
 */
export interface NanoBananaConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Error response structure
 */
export interface NanoBananaError {
  error: string;
  code?: string;
  details?: any;
  status?: number;
}

/**
 * Usage statistics
 */
export interface UsageStats {
  total_images_generated: number;
  credits_used: number;
  credits_remaining: number;
  last_request_at?: string;
}

/**
 * Batch processing request
 */
export interface BatchRequest {
  requests: (ImageGenerationRequest | ImageEditingRequest)[];
  parallel?: boolean;
}

/**
 * Pricing information
 */
export interface PricingInfo {
  price_per_image: number;
  currency: string;
  minimum_purchase: number;
}