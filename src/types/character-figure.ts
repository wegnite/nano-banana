/**
 * Character Figure AI Generator Type Definitions
 * 
 * Problem: Need type safety for character figure generation features
 * Solution: Define comprehensive TypeScript interfaces for all character figure operations
 * 
 * Features:
 * - Character generation with style-specific prompts
 * - Gallery management (public showcase)
 * - User generation history
 * - Like/rating system
 */

import { GeneratedImage, NanoBananaResponse } from './nano-banana';

/**
 * Character figure styles with specific prompt optimizations
 */
export enum CharacterFigureStyle {
  ANIME = 'anime',
  REALISTIC = 'realistic', 
  CARTOON = 'cartoon',
  FANTASY = 'fantasy',
  CYBERPUNK = 'cyberpunk',
  STEAMPUNK = 'steampunk',
  MEDIEVAL = 'medieval',
  MODERN = 'modern',
  SCI_FI = 'sci_fi',
  CHIBI = 'chibi'
}

/**
 * Character pose presets
 */
export enum CharacterPose {
  STANDING = 'standing',
  SITTING = 'sitting',
  ACTION = 'action',
  PORTRAIT = 'portrait',
  FULL_BODY = 'full_body',
  DYNAMIC = 'dynamic',
  FIGHTING = 'fighting',
  DANCING = 'dancing',
  FLYING = 'flying',
  CUSTOM = 'custom'
}

/**
 * Character gender options
 */
export enum CharacterGender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  ANY = 'any'
}

/**
 * Character age groups
 */
export enum CharacterAge {
  CHILD = 'child',
  TEEN = 'teen', 
  YOUNG_ADULT = 'young_adult',
  ADULT = 'adult',
  ELDER = 'elder',
  ANY = 'any'
}

/**
 * Character figure generation request
 */
export interface CharacterFigureRequest {
  /** Base character description */
  prompt: string;
  
  /** Character style */
  style: CharacterFigureStyle;
  
  /** Character pose */
  pose: CharacterPose;
  
  /** Character gender */
  gender: CharacterGender;
  
  /** Character age group */
  age: CharacterAge;
  
  /** Additional style keywords */
  style_keywords?: string[];
  
  /** Clothing/outfit description */
  clothing?: string;
  
  /** Background setting */
  background?: string;
  
  /** Color palette preference */
  color_palette?: string;
  
  /** Quality setting */
  quality?: 'standard' | 'hd';
  
  /** Number of variations */
  num_images?: '1' | '2' | '3' | '4';
  
  /** Aspect ratio */
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  
  /** Random seed for reproducible results */
  seed?: number;
  
  /** Whether to save to user's gallery */
  save_to_gallery?: boolean;
  
  /** Whether to make publicly visible */
  make_public?: boolean;
}

/**
 * Enhanced character figure generation response
 */
export interface CharacterFigureResponse extends NanoBananaResponse {
  data?: {
    images?: CharacterFigureImage[];
    enhanced_prompt?: string;
    style_applied?: CharacterFigureStyle;
    generation_id?: string;
    error?: string;
    message?: string;
  };
  credits_used?: number;
  credits_remaining?: number;
  generation_time?: number;
}

/**
 * Character figure image with metadata
 */
export interface CharacterFigureImage extends GeneratedImage {
  /** Unique image ID */
  id?: string;
  
  /** Enhanced prompt used */
  enhanced_prompt?: string;
  
  /** Style applied */
  style: CharacterFigureStyle;
  
  /** Pose applied */
  pose: CharacterPose;
  
  /** Character metadata */
  character_info?: {
    gender: CharacterGender;
    age: CharacterAge;
    clothing?: string;
    background?: string;
    color_palette?: string;
  };
  
  /** Generation parameters */
  generation_params?: {
    seed?: number;
    quality?: string;
    aspect_ratio?: string;
  };
}

/**
 * Gallery item for public showcase
 */
export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  style: CharacterFigureStyle;
  pose: CharacterPose;
  enhanced_prompt?: string;
  creator_username?: string;
  creator_avatar?: string;
  likes_count: number;
  views_count: number;
  is_featured: boolean;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  
  /** User interaction state (if authenticated) */
  user_liked?: boolean;
  user_bookmarked?: boolean;
}

/**
 * Gallery query filters
 */
export interface GalleryFilters {
  style?: CharacterFigureStyle[];
  pose?: CharacterPose[];
  sort_by?: 'latest' | 'popular' | 'trending' | 'most_liked';
  time_range?: 'today' | 'week' | 'month' | 'all';
  featured_only?: boolean;
  page?: number;
  limit?: number;
  search_query?: string;
  tags?: string[];
}

/**
 * User generation history item
 */
export interface UserGenerationHistory {
  id: string;
  user_uuid: string;
  request: CharacterFigureRequest;
  images: CharacterFigureImage[];
  credits_used: number;
  generation_time: number;
  created_at: string;
  is_favorited: boolean;
  gallery_item_id?: string; // If shared to gallery
}

/**
 * User generation history query
 */
export interface HistoryQuery {
  page?: number;
  limit?: number;
  style?: CharacterFigureStyle[];
  date_from?: string;
  date_to?: string;
  favorites_only?: boolean;
  sort_by?: 'latest' | 'oldest' | 'most_credits' | 'favorites';
}

/**
 * Gallery action types
 */
export enum GalleryAction {
  LIKE = 'like',
  UNLIKE = 'unlike',
  BOOKMARK = 'bookmark',
  UNBOOKMARK = 'unbookmark',
  REPORT = 'report',
  VIEW = 'view'
}

/**
 * Gallery action request
 */
export interface GalleryActionRequest {
  gallery_item_id: string;
  action: GalleryAction;
}

/**
 * Gallery action response
 */
export interface GalleryActionResponse {
  success: boolean;
  new_count?: number; // Updated likes/bookmarks count
  user_action_state?: boolean; // New user action state
  message?: string;
}

/**
 * Character figure statistics
 */
export interface CharacterFigureStats {
  total_generations: number;
  total_credits_used: number;
  favorite_style: CharacterFigureStyle;
  favorite_pose: CharacterPose;
  total_gallery_items: number;
  total_likes_received: number;
  generation_streak: number; // Days with at least one generation
  last_generation_at?: string;
}

/**
 * Public character figure trends
 */
export interface CharacterFigureTrends {
  popular_styles: { style: CharacterFigureStyle; count: number }[];
  popular_poses: { pose: CharacterPose; count: number }[];
  trending_tags: { tag: string; count: number }[];
  featured_creators: { username: string; avatar?: string; generations_count: number }[];
  daily_stats: { date: string; generations: number; unique_users: number }[];
}

/**
 * Rate limiting info
 */
export interface RateLimitInfo {
  remaining_requests: number;
  reset_at: string;
  limit_per_hour: number;
  limit_per_day: number;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * API error response with validation details
 */
export interface CharacterFigureError {
  error: string;
  code?: string;
  validation_errors?: ValidationError[];
  rate_limit_info?: RateLimitInfo;
}

/**
 * Batch generation request (for future use)
 */
export interface BatchGenerationRequest {
  requests: CharacterFigureRequest[];
  parallel_processing?: boolean;
  max_concurrent?: number;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Batch generation response
 */
export interface BatchGenerationResponse {
  batch_id: string;
  total_requests: number;
  completed: number;
  failed: number;
  total_credits_used: number;
  results: (CharacterFigureResponse | CharacterFigureError)[];
  processing_time: number;
  status: 'completed' | 'partial' | 'failed';
}

/**
 * Style prompt enhancement configuration
 */
export interface StylePromptConfig {
  style: CharacterFigureStyle;
  prompt_prefix: string;
  prompt_suffix: string;
  negative_prompt?: string;
  recommended_settings?: {
    quality?: 'standard' | 'hd';
    aspect_ratio?: string;
  };
}

/**
 * Character figure generation context
 */
export interface GenerationContext {
  user_uuid: string;
  request_id: string;
  session_id?: string;
  user_tier?: 'free' | 'pro' | 'premium';
  priority?: 'low' | 'normal' | 'high';
  client_info?: {
    user_agent?: string;
    ip_address?: string;
    referrer?: string;
  };
}