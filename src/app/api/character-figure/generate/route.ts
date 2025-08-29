/**
 * Character Figure Generation API Route
 * 
 * Problem: Need specialized API endpoints for character figure generation with style-specific optimizations
 * Solution: Create dedicated endpoints that enhance prompts and manage character-specific features
 * 
 * Endpoint: POST /api/character-figure/generate
 * Features:
 * - Style-specific prompt enhancement
 * - Character figure validation
 * - Credit management
 * - History tracking
 * - Gallery integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { respData, respErr } from '@/lib/resp';
import { generateCharacterFigure } from '@/services/character-figure';
import { getUserCredits } from '@/services/credit';
import { 
  checkCharacterGenerationRateLimit,
  getUserTier
} from '@/lib/rate-limit';
import { 
  CharacterFigureRequest, 
  CharacterFigureStyle, 
  CharacterPose, 
  CharacterGender, 
  CharacterAge 
} from '../types';

/**
 * Rate limiting configuration for character generation
 */
const RATE_LIMITS = {
  FREE_USER_PER_HOUR: 5,
  PRO_USER_PER_HOUR: 20,
  PREMIUM_USER_PER_HOUR: 50
};

/**
 * POST /api/character-figure/generate
 * Generate character figures with style-specific optimizations
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized - Please sign in to generate character figures', 401);
    }

    // 2. Parse and validate request body
    const body: CharacterFigureRequest = await request.json();
    
    // Basic validation
    const validationError = validateCharacterRequest(body);
    if (validationError) {
      return respErr(validationError, 400);
    }

    // 3. Rate limiting check
    try {
      const userCredits = await getUserCredits(session.user.id!);
      const userTier = getUserTier(userCredits);
      const rateLimitCheck = await checkCharacterGenerationRateLimit(session.user.id!, userTier);
      
      if (!rateLimitCheck.allowed) {
        return NextResponse.json({
          code: -1,
          message: 'Rate limit exceeded. Please wait before generating more characters.',
          error: 'Rate limit exceeded. Please wait before generating more characters.',
          rate_limit_info: {
            remaining_requests: rateLimitCheck.remaining_requests,
            reset_at: rateLimitCheck.reset_at,
            limit_per_hour: rateLimitCheck.limit_per_hour,
            user_tier: userTier
          }
        }, { 
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-RateLimit-Remaining': rateLimitCheck.remaining_requests.toString(),
            'X-RateLimit-Reset': rateLimitCheck.reset_at,
            'Retry-After': Math.ceil((new Date(rateLimitCheck.reset_at).getTime() - Date.now()) / 1000).toString()
          }
        });
      }
    } catch (rateLimitError) {
      console.warn('Rate limit check failed:', rateLimitError);
      // Continue without rate limiting if check fails
    }

    // 4. Generate character figure
    console.log(`Generating character figure for user ${session.user.id}: ${body.style} style, ${body.pose} pose`);
    const startTime = Date.now();
    
    const response = await generateCharacterFigure(session.user.id!, body);
    
    const totalTime = Date.now() - startTime;
    console.log(`Character figure generation completed in ${totalTime}ms`);

    // 5. Handle generation result
    if (!response.success) {
      console.error('Character figure generation failed:', response.error);
      return respErr(response.error || 'Character figure generation failed. Please try again.', 400);
    }

    // 6. Return successful response
    return respData({
      success: true,
      data: {
        generation_id: response.data?.generation_id,
        images: response.data?.images || [],
        enhanced_prompt: response.data?.enhanced_prompt,
        style_applied: response.data?.style_applied
      },
      credits_used: response.credits_used,
      credits_remaining: response.credits_remaining,
      generation_time: response.generation_time,
      request_id: response.request_id,
      metadata: {
        original_request: {
          style: body.style,
          pose: body.pose,
          gender: body.gender,
          age: body.age
        },
        processing_time: totalTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Character figure API route error:', error);
    
    // Handle specific error types
    if (error.name === 'SyntaxError') {
      return respErr('Invalid JSON in request body', 400);
    }
    
    if (error.message?.includes('timeout')) {
      return respErr('Request timeout - The character generation took too long. Please try again.', 408);
    }
    
    if (error.message?.includes('rate limit')) {
      return respErr('Rate limit exceeded - Please wait before generating more characters.', 429);
    }
    
    return respErr('An unexpected error occurred during character generation. Please try again later.', 500);
  }
}

/**
 * GET /api/character-figure/generate
 * Get character generation configuration and user limits
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return respErr('Unauthorized', 401);
    }

    // Get user credits and generation stats
    // const userCredits = await getUserCredits(session.user.id!);
    // const userStats = await getUserStats(session.user.id!);
    
    return respData({
      available_styles: Object.values(CharacterFigureStyle).map(style => ({
        id: style,
        name: style.charAt(0).toUpperCase() + style.slice(1).replace('_', ' '),
        description: getStyleDescription(style),
        recommended_settings: getStyleRecommendedSettings(style)
      })),
      available_poses: Object.values(CharacterPose).map(pose => ({
        id: pose,
        name: pose.charAt(0).toUpperCase() + pose.slice(1).replace('_', ' '),
        description: getPoseDescription(pose)
      })),
      available_genders: Object.values(CharacterGender).map(gender => ({
        id: gender,
        name: gender.charAt(0).toUpperCase() + gender.slice(1).replace('_', ' ')
      })),
      available_ages: Object.values(CharacterAge).map(age => ({
        id: age,
        name: age.charAt(0).toUpperCase() + age.slice(1).replace('_', ' ')
      })),
      credits_per_image: {
        standard: 15,
        hd: 25
      },
      max_images_per_request: 4,
      supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      rate_limits: {
        per_hour: RATE_LIMITS.FREE_USER_PER_HOUR, // TODO: Determine user tier
        per_day: RATE_LIMITS.FREE_USER_PER_HOUR * 24
      }
      // user_credits: userCredits.left_credits,
      // user_stats: userStats
    });

  } catch (error) {
    console.error('GET character generation config error:', error);
    return respErr('Failed to retrieve character generation configuration', 500);
  }
}

/**
 * Validate character figure generation request
 * 
 * @param body Request body to validate
 * @returns Error message if validation fails, null if valid
 */
function validateCharacterRequest(body: CharacterFigureRequest): string | null {
  // Check required fields
  if (!body.prompt || typeof body.prompt !== 'string') {
    return 'Prompt is required and must be a string';
  }

  if (body.prompt.trim().length === 0) {
    return 'Prompt cannot be empty';
  }

  if (body.prompt.length > 2000) {
    return 'Prompt is too long (maximum 2000 characters)';
  }

  // Validate style
  if (!body.style || !Object.values(CharacterFigureStyle).includes(body.style)) {
    return 'Invalid or missing style. Must be one of: ' + Object.values(CharacterFigureStyle).join(', ');
  }

  // Validate pose
  if (!body.pose || !Object.values(CharacterPose).includes(body.pose)) {
    return 'Invalid or missing pose. Must be one of: ' + Object.values(CharacterPose).join(', ');
  }

  // Validate gender
  if (!body.gender || !Object.values(CharacterGender).includes(body.gender)) {
    return 'Invalid or missing gender. Must be one of: ' + Object.values(CharacterGender).join(', ');
  }

  // Validate age
  if (!body.age || !Object.values(CharacterAge).includes(body.age)) {
    return 'Invalid or missing age. Must be one of: ' + Object.values(CharacterAge).join(', ');
  }

  // Validate optional fields
  if (body.num_images) {
    const numImages = parseInt(body.num_images);
    if (isNaN(numImages) || numImages < 1 || numImages > 4) {
      return 'num_images must be between 1 and 4';
    }
  }

  if (body.quality && !['standard', 'hd'].includes(body.quality)) {
    return 'quality must be either "standard" or "hd"';
  }

  if (body.aspect_ratio && !['1:1', '16:9', '9:16', '4:3', '3:4'].includes(body.aspect_ratio)) {
    return 'aspect_ratio must be one of: 1:1, 16:9, 9:16, 4:3, 3:4';
  }

  if (body.seed !== undefined && (typeof body.seed !== 'number' || body.seed < 0 || body.seed > 2147483647)) {
    return 'seed must be a positive integer between 0 and 2147483647';
  }

  // Validate arrays
  if (body.style_keywords && !Array.isArray(body.style_keywords)) {
    return 'style_keywords must be an array';
  }

  if (body.style_keywords && body.style_keywords.length > 10) {
    return 'style_keywords array cannot have more than 10 items';
  }

  // Validate string lengths
  if (body.clothing && body.clothing.length > 200) {
    return 'clothing description is too long (maximum 200 characters)';
  }

  if (body.background && body.background.length > 200) {
    return 'background description is too long (maximum 200 characters)';
  }

  if (body.color_palette && body.color_palette.length > 100) {
    return 'color_palette description is too long (maximum 100 characters)';
  }

  return null;
}

/**
 * Get style description for frontend display
 */
function getStyleDescription(style: CharacterFigureStyle): string {
  const descriptions = {
    [CharacterFigureStyle.ANIME]: 'High-quality anime art style with vibrant colors and clean lines',
    [CharacterFigureStyle.REALISTIC]: 'Photorealistic characters with detailed textures and lighting',
    [CharacterFigureStyle.CARTOON]: 'Stylized cartoon characters with bright, playful aesthetics',
    [CharacterFigureStyle.FANTASY]: 'Magical fantasy characters in enchanted settings',
    [CharacterFigureStyle.CYBERPUNK]: 'Futuristic characters with neon-lit, high-tech aesthetics',
    [CharacterFigureStyle.STEAMPUNK]: 'Victorian-era characters with brass and copper mechanical details',
    [CharacterFigureStyle.MEDIEVAL]: 'Historical medieval characters with period-accurate details',
    [CharacterFigureStyle.MODERN]: 'Contemporary characters with current fashion and styling',
    [CharacterFigureStyle.SCI_FI]: 'Science fiction characters with advanced technology themes',
    [CharacterFigureStyle.CHIBI]: 'Cute, super-deformed characters with simplified, adorable features'
  };
  return descriptions[style];
}

/**
 * Get pose description for frontend display
 */
function getPoseDescription(pose: CharacterPose): string {
  const descriptions = {
    [CharacterPose.STANDING]: 'Character in a natural standing position',
    [CharacterPose.SITTING]: 'Character in a comfortable sitting pose',
    [CharacterPose.ACTION]: 'Dynamic action pose showing movement',
    [CharacterPose.PORTRAIT]: 'Close-up portrait focusing on face and upper body',
    [CharacterPose.FULL_BODY]: 'Full body view showing the complete character',
    [CharacterPose.DYNAMIC]: 'Energetic pose with dramatic angles',
    [CharacterPose.FIGHTING]: 'Combat-ready pose showing strength and power',
    [CharacterPose.DANCING]: 'Graceful dancing pose in mid-movement',
    [CharacterPose.FLYING]: 'Airborne pose as if flying or jumping',
    [CharacterPose.CUSTOM]: 'Custom pose based on your specific description'
  };
  return descriptions[pose];
}

/**
 * Get recommended settings for each style
 */
function getStyleRecommendedSettings(style: CharacterFigureStyle) {
  const settings = {
    [CharacterFigureStyle.ANIME]: { quality: 'hd', aspect_ratio: '1:1' },
    [CharacterFigureStyle.REALISTIC]: { quality: 'hd', aspect_ratio: '4:3' },
    [CharacterFigureStyle.CARTOON]: { quality: 'standard', aspect_ratio: '1:1' },
    [CharacterFigureStyle.FANTASY]: { quality: 'hd', aspect_ratio: '3:4' },
    [CharacterFigureStyle.CYBERPUNK]: { quality: 'hd', aspect_ratio: '16:9' },
    [CharacterFigureStyle.STEAMPUNK]: { quality: 'hd', aspect_ratio: '4:3' },
    [CharacterFigureStyle.MEDIEVAL]: { quality: 'standard', aspect_ratio: '3:4' },
    [CharacterFigureStyle.MODERN]: { quality: 'standard', aspect_ratio: '1:1' },
    [CharacterFigureStyle.SCI_FI]: { quality: 'hd', aspect_ratio: '16:9' },
    [CharacterFigureStyle.CHIBI]: { quality: 'standard', aspect_ratio: '1:1' }
  };
  return settings[style];
}