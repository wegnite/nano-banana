/**
 * Character Figure Types for API Routes
 * 
 * Problem: API routes have trouble resolving @/ aliases in some Next.js configurations
 * Solution: Define required types locally to ensure proper resolution
 */

/**
 * Character figure styles
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
  prompt: string;
  style: CharacterFigureStyle;
  pose: CharacterPose;
  gender: CharacterGender;
  age: CharacterAge;
  style_keywords?: string[];
  clothing?: string;
  background?: string;
  color_palette?: string;
  quality?: 'standard' | 'hd';
  num_images?: '1' | '2' | '3' | '4';
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  seed?: number;
  save_to_gallery?: boolean;
  make_public?: boolean;
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
  new_count?: number;
  user_action_state?: boolean;
  message?: string;
}