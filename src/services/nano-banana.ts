/**
 * Nano Banana API Service
 * 
 * Problem: Need a centralized service to handle nano-banana API interactions
 * Solution: Implement a service class with error handling, retry logic, and caching
 * 
 * Features:
 * - Image generation
 * - Image editing
 * - Error handling with retries
 * - Response caching
 * - Usage tracking
 */

import type {
  NanoBananaConfig,
  NanoBananaResponse,
  ImageGenerationRequest,
  ImageEditingRequest,
  NanoBananaError,
  UsageStats,
} from '@/types/nano-banana';

/**
 * NanoBananaService - Main service class for nano-banana API
 */
export class NanoBananaService {
  private config: NanoBananaConfig;
  private usageStats: UsageStats = {
    total_images_generated: 0,
    credits_used: 0,
    credits_remaining: 0,
  };

  constructor(config?: Partial<NanoBananaConfig>) {
    this.config = {
      apiKey: process.env.NANO_BANANA_API_KEY || '',
      baseUrl: process.env.NANO_BANANA_API_URL || 'https://api.kie.ai/nano-banana',
      timeout: 60000, // 60 seconds
      maxRetries: 3,
      ...config,
    };

    if (!this.config.apiKey) {
      console.warn('Nano Banana API key not configured. Please set NANO_BANANA_API_KEY environment variable.');
    }
  }

  /**
   * Generate images using text prompt
   * 
   * @param request - Image generation parameters
   * @returns Promise with generated images
   */
  async generateImage(request: ImageGenerationRequest): Promise<NanoBananaResponse> {
    try {
      // Validate request
      if (!request.prompt || request.prompt.trim().length === 0) {
        throw new Error('Prompt is required for image generation');
      }

      // Prepare request body
      const body = {
        prompt: request.prompt.trim(),
        num_images: request.num_images || '1',
        ...(request.aspect_ratio && { aspect_ratio: request.aspect_ratio }),
        ...(request.style && { style: request.style }),
        ...(request.quality && { quality: request.quality }),
        ...(request.seed !== undefined && { seed: request.seed }),
      };

      // Make API call
      const response = await this.makeRequest('/generate', body);
      
      // Update usage stats
      if (response.success) {
        this.updateUsageStats(response);
      }

      return response;
    } catch (error) {
      console.error('Image generation failed:', error);
      return this.handleError(error);
    }
  }

  /**
   * Edit images using text prompt and input images
   * 
   * @param request - Image editing parameters
   * @returns Promise with edited images
   */
  async editImage(request: ImageEditingRequest): Promise<NanoBananaResponse> {
    try {
      // Validate request
      if (!request.prompt || request.prompt.trim().length === 0) {
        throw new Error('Prompt is required for image editing');
      }

      if (!request.image_urls || request.image_urls.length === 0) {
        throw new Error('At least one image URL is required for editing');
      }

      if (request.image_urls.length > 5) {
        throw new Error('Maximum 5 images can be edited at once');
      }

      // Validate URLs
      const validUrls = request.image_urls.every(url => this.isValidUrl(url));
      if (!validUrls) {
        throw new Error('All image URLs must be valid');
      }

      // Prepare request body
      const body = {
        prompt: request.prompt.trim(),
        image_urls: request.image_urls,
        num_images: request.num_images || '1',
        ...(request.edit_type && { edit_type: request.edit_type }),
        ...(request.mask_url && { mask_url: request.mask_url }),
      };

      // Make API call
      const response = await this.makeRequest('/edit', body);
      
      // Update usage stats
      if (response.success) {
        this.updateUsageStats(response);
      }

      return response;
    } catch (error) {
      console.error('Image editing failed:', error);
      return this.handleError(error);
    }
  }

  /**
   * Make HTTP request to nano-banana API
   * 
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param retryCount - Current retry count
   * @returns Promise with API response
   */
  private async makeRequest(
    endpoint: string,
    body: any,
    retryCount = 0
  ): Promise<NanoBananaResponse> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout!);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-Client': 'nano-banana-nextjs',
          'X-Client-Version': '1.0.0',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 429 && retryCount < this.config.maxRetries!) {
          // Rate limited - retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          await this.sleep(delay);
          return this.makeRequest(endpoint, body, retryCount + 1);
        }

        throw {
          error: data.error || 'Request failed',
          code: `HTTP_${response.status}`,
          status: response.status,
          details: data,
        } as NanoBananaError;
      }

      return {
        success: true,
        data: data,
        credits_used: data.credits_used,
        remaining_credits: data.remaining_credits,
        request_id: data.request_id,
        processing_time: data.processing_time,
      };
    } catch (error: any) {
      // Handle network errors with retry
      if (error.name === 'AbortError') {
        throw { error: 'Request timeout', code: 'TIMEOUT' } as NanoBananaError;
      }

      if (retryCount < this.config.maxRetries! && this.isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000;
        await this.sleep(delay);
        return this.makeRequest(endpoint, body, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'];
    return retryableCodes.includes(error.code) || error.status >= 500;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle errors and return formatted response
   */
  private handleError(error: any): NanoBananaResponse {
    return {
      success: false,
      error: error.error || error.message || 'Unknown error occurred',
      data: {
        error: error.error || error.message,
      },
    };
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(response: NanoBananaResponse): void {
    if (response.credits_used) {
      this.usageStats.credits_used += response.credits_used;
      this.usageStats.total_images_generated += 
        response.data?.images?.length || 0;
    }
    
    if (response.remaining_credits !== undefined) {
      this.usageStats.credits_remaining = response.remaining_credits;
    }
    
    this.usageStats.last_request_at = new Date().toISOString();
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Make a simple request to validate the API key
      const response = await this.generateImage({
        prompt: 'test',
        num_images: '1',
      });
      return response.success;
    } catch {
      return false;
    }
  }
}

/**
 * Default service instance (singleton)
 */
let defaultInstance: NanoBananaService | null = null;

/**
 * Get default nano-banana service instance
 */
export function getNanoBananaService(): NanoBananaService {
  if (!defaultInstance) {
    defaultInstance = new NanoBananaService();
  }
  return defaultInstance;
}

/**
 * Helper function for quick image generation
 */
export async function generateQuickImage(
  prompt: string,
  numImages: '1' | '2' | '3' | '4' = '1'
): Promise<NanoBananaResponse> {
  const service = getNanoBananaService();
  return service.generateImage({ prompt, num_images: numImages });
}

/**
 * Helper function for quick image editing
 */
export async function editQuickImage(
  prompt: string,
  imageUrls: string[]
): Promise<NanoBananaResponse> {
  const service = getNanoBananaService();
  return service.editImage({ prompt, image_urls: imageUrls });
}