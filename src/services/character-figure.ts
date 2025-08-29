/**
 * 角色图像服务层 - Character Figure Business Services
 * 
 * 功能说明：
 * 管理角色图像生成的核心业务逻辑，包括：
 * - 提示词优化和风格应用
 * - 角色生成历史管理
 * - 画廊项目管理
 * - 用户互动处理
 * - 模板和配置管理
 * 
 * 业务规则：
 * - 不同风格有不同的提示词增强策略
 * - 用户积分验证和消费
 * - 内容审核和安全检查
 * - 用户权限和限制管理
 * 
 * @module services/character-figure
 */

import { getNanoBananaService } from './nano-banana';
import { getUserCredits, deductCredits } from './credit';
import { getSnowId } from '@/lib/hash';
import {
  insertCharacterGeneration,
  getCharacterGenerationByUuid,
  getUserGenerationHistory,
  updateGenerationFavoriteStatus,
  insertGalleryItem,
  getGalleryItemByUuid,
  getGalleryItems,
  updateGalleryItemStats,
  recordGalleryInteraction,
  updateGalleryInteraction,
  getUserGalleryInteractions,
  getActiveCharacterTemplates,
  incrementTemplateUsage,
  getSystemConfig,
  getUserPreferences,
  upsertUserPreferences,
  getUserGenerationStats
} from '@/models/character-figure';
import { findUserByUuid } from '@/models/user';
// 导入枚举和类型
// 现在文件已经是 .ts 格式，可以正常导入枚举
import {
  CharacterFigureStyle,  // 枚举值
  CharacterPose,         // 枚举值
  type CharacterFigureRequest,
  type CharacterFigureResponse,
  type CharacterFigureImage,
  type GalleryItem,
  type GalleryFilters,
  GalleryAction,
  type GalleryActionResponse,
  type UserGenerationHistory,
  type HistoryQuery,
  type CharacterFigureStats,
  type StylePromptConfig
} from '@/types/character-figure';

/**
 * 角色生成积分配置
 */
const CHARACTER_GENERATION_CREDITS = {
  STANDARD_QUALITY: 15,  // 标准质量每张图片消耗积分
  HD_QUALITY: 25,        // 高清质量每张图片消耗积分
  MAX_IMAGES_PER_REQUEST: 4  // 单次请求最大图片数量
};

/**
 * 风格特定的提示词配置
 */
const STYLE_PROMPT_CONFIGS: Record<CharacterFigureStyle, StylePromptConfig> = {
  [CharacterFigureStyle.ANIME]: {
    style: CharacterFigureStyle.ANIME,
    prompt_prefix: "anime style, high quality anime art, detailed anime character,",
    prompt_suffix: ", anime art style, vibrant colors, clean lines, detailed shading",
    negative_prompt: "realistic, photorealistic, 3d render, blurry, low quality",
    recommended_settings: {
      quality: 'hd',
      aspect_ratio: '1:1'
    }
  },
  [CharacterFigureStyle.REALISTIC]: {
    style: CharacterFigureStyle.REALISTIC,
    prompt_prefix: "photorealistic, highly detailed, professional photography,",
    prompt_suffix: ", realistic lighting, detailed textures, high resolution, sharp focus",
    negative_prompt: "anime, cartoon, drawing, sketch, low quality, blurry",
    recommended_settings: {
      quality: 'hd',
      aspect_ratio: '4:3'
    }
  },
  [CharacterFigureStyle.CARTOON]: {
    style: CharacterFigureStyle.CARTOON,
    prompt_prefix: "cartoon style, stylized character design, colorful cartoon art,",
    prompt_suffix: ", bright colors, cartoon illustration, clean art style",
    negative_prompt: "realistic, photorealistic, dark, gritty, low quality",
    recommended_settings: {
      quality: 'standard',
      aspect_ratio: '1:1'
    }
  },
  [CharacterFigureStyle.FANTASY]: {
    style: CharacterFigureStyle.FANTASY,
    prompt_prefix: "fantasy art style, magical character, fantasy illustration,",
    prompt_suffix: ", mystical atmosphere, detailed fantasy art, enchanted setting",
    negative_prompt: "modern, contemporary, realistic photo, low quality",
    recommended_settings: {
      quality: 'hd',
      aspect_ratio: '3:4'
    }
  },
  [CharacterFigureStyle.CYBERPUNK]: {
    style: CharacterFigureStyle.CYBERPUNK,
    prompt_prefix: "cyberpunk style, futuristic character, neon-lit, high-tech,",
    prompt_suffix: ", cyberpunk aesthetic, neon colors, futuristic city, detailed sci-fi art",
    negative_prompt: "medieval, fantasy, natural, low quality, blurry",
    recommended_settings: {
      quality: 'hd',
      aspect_ratio: '16:9'
    }
  },
  [CharacterFigureStyle.STEAMPUNK]: {
    style: CharacterFigureStyle.STEAMPUNK,
    prompt_prefix: "steampunk style, Victorian-era technology, brass and copper details,",
    prompt_suffix: ", steampunk aesthetic, mechanical details, vintage technology, detailed art",
    negative_prompt: "modern, futuristic, digital, low quality",
    recommended_settings: {
      quality: 'hd',
      aspect_ratio: '4:3'
    }
  },
  [CharacterFigureStyle.MEDIEVAL]: {
    style: CharacterFigureStyle.MEDIEVAL,
    prompt_prefix: "medieval style, historical character, medieval period,",
    prompt_suffix: ", medieval aesthetic, historical accuracy, detailed period art",
    negative_prompt: "modern, futuristic, contemporary, low quality",
    recommended_settings: {
      quality: 'standard',
      aspect_ratio: '3:4'
    }
  },
  [CharacterFigureStyle.MODERN]: {
    style: CharacterFigureStyle.MODERN,
    prompt_prefix: "modern style, contemporary character, current fashion,",
    prompt_suffix: ", modern aesthetic, contemporary art style, clean design",
    negative_prompt: "historical, medieval, fantasy, low quality",
    recommended_settings: {
      quality: 'standard',
      aspect_ratio: '1:1'
    }
  },
  [CharacterFigureStyle.SCI_FI]: {
    style: CharacterFigureStyle.SCI_FI,
    prompt_prefix: "sci-fi style, science fiction character, futuristic design,",
    prompt_suffix: ", sci-fi aesthetic, advanced technology, space age, detailed sci-fi art",
    negative_prompt: "medieval, historical, fantasy magic, low quality",
    recommended_settings: {
      quality: 'hd',
      aspect_ratio: '16:9'
    }
  },
  [CharacterFigureStyle.CHIBI]: {
    style: CharacterFigureStyle.CHIBI,
    prompt_prefix: "chibi style, cute chibi character, super deformed style,",
    prompt_suffix: ", chibi art style, adorable, simplified features, kawaii",
    negative_prompt: "realistic, detailed anatomy, complex, low quality",
    recommended_settings: {
      quality: 'standard',
      aspect_ratio: '1:1'
    }
  }
};

/**
 * ===============================
 * 角色生成核心业务逻辑
 * ===============================
 */

/**
 * 生成角色图像
 * 
 * @param userUuid 用户UUID
 * @param request 生成请求
 * @returns 生成结果
 */
export async function generateCharacterFigure(
  userUuid: string,
  request: CharacterFigureRequest
): Promise<CharacterFigureResponse> {
  try {
    // 1. 验证用户权限和积分
    const creditCheck = await validateUserCredits(userUuid, request);
    if (!creditCheck.success) {
      return {
        success: false,
        error: creditCheck.error
      };
    }

    // 2. 优化提示词
    const enhancedPrompt = await enhancePromptWithStyle(request);

    // 3. 调用 nano-banana API 生成图像
    const nanoBananaService = getNanoBananaService();
    const startTime = Date.now();
    
    const apiResponse = await nanoBananaService.generateImage({
      prompt: enhancedPrompt,
      num_images: request.num_images || '1',
      aspect_ratio: request.aspect_ratio,
      quality: request.quality,
      seed: request.seed
    });

    const generationTime = Date.now() - startTime;

    // 4. 处理 API 响应
    if (!apiResponse.success) {
      return {
        success: false,
        error: apiResponse.error || 'Image generation failed',
        data: {
          error: apiResponse.error || 'Unknown error'
        }
      };
    }

    // 5. 扣除用户积分
    const creditsUsed = creditCheck.creditsRequired;
    const deducted = await deductCredits(
      userUuid,
      creditsUsed,
      'CHARACTER_GENERATION',
      `Generated character figure: ${request.style} style`
    );

    if (!deducted) {
      console.warn('Failed to deduct credits after successful generation');
    }

    // 6. 保存生成记录到数据库
    const generationId = getSnowId();
    const generationRecord = await saveGenerationRecord(
      generationId,
      userUuid,
      request,
      enhancedPrompt,
      apiResponse,
      creditsUsed,
      generationTime
    );

    // 7. 如果需要保存到画廊
    let galleryItemId: string | undefined;
    if (request.save_to_gallery) {
      galleryItemId = await saveToGallery(
        userUuid,
        generationId,
        request,
        enhancedPrompt,
        apiResponse.data?.images?.[0],
        request.make_public || false
      );
    }

    // 8. 更新用户偏好统计
    await updateUserPreferencesStats(userUuid, request);

    // 9. 构建响应
    const images: CharacterFigureImage[] = (apiResponse.data?.images || []).map(img => ({
      ...img,
      id: getSnowId(),
      enhanced_prompt: enhancedPrompt,
      style: request.style,
      pose: request.pose,
      character_info: {
        gender: request.gender,
        age: request.age,
        clothing: request.clothing,
        background: request.background,
        color_palette: request.color_palette
      },
      generation_params: {
        seed: request.seed,
        quality: request.quality,
        aspect_ratio: request.aspect_ratio
      }
    }));

    return {
      success: true,
      data: {
        images,
        enhanced_prompt: enhancedPrompt,
        style_applied: request.style,
        generation_id: generationId
      },
      credits_used: creditsUsed,
      credits_remaining: creditCheck.userCredits.left_credits - creditsUsed,
      generation_time: generationTime,
      request_id: apiResponse.request_id
    };

  } catch (error: any) {
    console.error('Character figure generation failed:', error);
    return {
      success: false,
      error: 'Internal server error during generation',
      data: {
        error: error.message || 'Unknown error occurred'
      }
    };
  }
}

/**
 * 验证用户积分是否充足
 * 
 * @param userUuid 用户UUID
 * @param request 生成请求
 * @returns 验证结果
 */
async function validateUserCredits(
  userUuid: string,
  request: CharacterFigureRequest
): Promise<{ success: boolean; error?: string; creditsRequired: number; userCredits: any }> {
  const userCredits = await getUserCredits(userUuid);
  const numImages = parseInt(request.num_images || '1');
  const quality = request.quality || 'standard';
  
  const creditsPerImage = quality === 'hd' 
    ? CHARACTER_GENERATION_CREDITS.HD_QUALITY 
    : CHARACTER_GENERATION_CREDITS.STANDARD_QUALITY;
  
  const creditsRequired = numImages * creditsPerImage;

  if (userCredits.left_credits < creditsRequired) {
    return {
      success: false,
      error: `Insufficient credits. You need ${creditsRequired} credits but only have ${userCredits.left_credits}. Please purchase more credits.`,
      creditsRequired,
      userCredits
    };
  }

  return {
    success: true,
    creditsRequired,
    userCredits
  };
}

/**
 * 使用风格配置增强提示词
 * 
 * @param request 生成请求
 * @returns 增强后的提示词
 */
async function enhancePromptWithStyle(request: CharacterFigureRequest): Promise<string> {
  const styleConfig = STYLE_PROMPT_CONFIGS[request.style];
  let enhancedPrompt = request.prompt.trim();

  // 添加风格前缀
  enhancedPrompt = `${styleConfig.prompt_prefix} ${enhancedPrompt}`;

  // 添加姿势描述
  if (request.pose !== CharacterPose.CUSTOM) {
    enhancedPrompt += `, ${request.pose} pose`;
  }

  // 添加性别和年龄描述
  if (request.gender !== 'any') {
    enhancedPrompt += `, ${request.gender}`;
  }
  
  if (request.age !== 'any') {
    enhancedPrompt += `, ${request.age.replace('_', ' ')}`;
  }

  // 添加服装描述
  if (request.clothing) {
    enhancedPrompt += `, wearing ${request.clothing}`;
  }

  // 添加背景描述
  if (request.background) {
    enhancedPrompt += `, ${request.background} background`;
  }

  // 添加色彩方案
  if (request.color_palette) {
    enhancedPrompt += `, ${request.color_palette} color scheme`;
  }

  // 添加风格关键词
  if (request.style_keywords && request.style_keywords.length > 0) {
    enhancedPrompt += `, ${request.style_keywords.join(', ')}`;
  }

  // 添加风格后缀
  enhancedPrompt += styleConfig.prompt_suffix;

  return enhancedPrompt;
}

/**
 * 保存生成记录到数据库
 */
async function saveGenerationRecord(
  generationId: string,
  userUuid: string,
  request: CharacterFigureRequest,
  enhancedPrompt: string,
  apiResponse: any,
  creditsUsed: number,
  generationTime: number
) {
  const generationData = {
    uuid: generationId,
    user_uuid: userUuid,
    original_prompt: request.prompt,
    enhanced_prompt: enhancedPrompt,
    style: request.style,
    pose: request.pose,
    gender: request.gender,
    age: request.age,
    style_keywords: request.style_keywords ? JSON.stringify(request.style_keywords) : null,
    clothing: request.clothing || null,
    background: request.background || null,
    color_palette: request.color_palette || null,
    aspect_ratio: request.aspect_ratio || '1:1',
    quality: request.quality || 'standard',
    num_images: parseInt(request.num_images || '1'),
    seed: request.seed || null,
    generated_images: JSON.stringify(apiResponse.data?.images || []),
    generation_time: generationTime,
    credits_used: creditsUsed,
    nano_banana_request_id: apiResponse.request_id || null,
    nano_banana_response: JSON.stringify(apiResponse),
    generation_params: JSON.stringify({
      original_request: request,
      enhanced_prompt: enhancedPrompt,
      credits_used: creditsUsed
    })
  };

  return await insertCharacterGeneration(generationData);
}

/**
 * 保存到公共画廊
 */
async function saveToGallery(
  userUuid: string,
  generationId: string,
  request: CharacterFigureRequest,
  enhancedPrompt: string,
  firstImage: any,
  isPublic: boolean
): Promise<string | undefined> {
  if (!firstImage) {
    return undefined;
  }

  try {
    // 获取用户信息
    const user = await findUserByUuid(userUuid);
    const galleryId = getSnowId();

    // 生成标题和描述
    const title = `${request.style.charAt(0).toUpperCase() + request.style.slice(1)} Character`;
    const description = `A ${request.style} style character in ${request.pose} pose. Generated with: "${request.prompt.substring(0, 100)}..."`;

    const galleryData = {
      uuid: galleryId,
      generation_id: generationId,
      user_uuid: userUuid,
      title: title,
      description: description,
      tags: JSON.stringify([request.style, request.pose, request.gender, request.age]),
      image_url: firstImage.url,
      image_width: firstImage.width,
      image_height: firstImage.height,
      style: request.style,
      pose: request.pose,
      enhanced_prompt: enhancedPrompt,
      is_public: isPublic,
      creator_username: user?.nickname || 'Anonymous',
      creator_avatar: user?.avatar_url || null
    };

    const galleryItem = await insertGalleryItem(galleryData);
    return galleryItem?.uuid;
  } catch (error) {
    console.error('Failed to save to gallery:', error);
    return undefined;
  }
}

/**
 * 更新用户偏好统计
 */
async function updateUserPreferencesStats(
  userUuid: string,
  request: CharacterFigureRequest
): Promise<void> {
  try {
    const preferences = await getUserPreferences(userUuid);
    
    // 更新常用风格和姿势统计
    const favoriteStyles = preferences?.favorite_styles 
      ? JSON.parse(preferences.favorite_styles) 
      : {};
    const favoritePoses = preferences?.favorite_poses 
      ? JSON.parse(preferences.favorite_poses) 
      : {};

    favoriteStyles[request.style] = (favoriteStyles[request.style] || 0) + 1;
    favoritePoses[request.pose] = (favoritePoses[request.pose] || 0) + 1;

    await upsertUserPreferences(userUuid, {
      favorite_styles: JSON.stringify(favoriteStyles),
      favorite_poses: JSON.stringify(favoritePoses),
      default_style: request.style,
      default_pose: request.pose,
      default_quality: request.quality || 'standard',
      default_aspect_ratio: request.aspect_ratio || '1:1'
    });
  } catch (error) {
    console.error('Failed to update user preferences:', error);
  }
}

/**
 * ===============================
 * 画廊管理服务
 * ===============================
 */

/**
 * 获取画廊列表
 * 
 * @param filters 筛选条件
 * @param userUuid 当前用户UUID（用于获取互动状态）
 * @returns 画廊项目列表
 */
export async function getGalleryItemsList(
  filters: GalleryFilters,
  userUuid?: string
): Promise<GalleryItem[]> {
  const items = await getGalleryItems(filters);
  
  // 如果有用户登录，获取用户的互动状态
  let userInteractions = new Map();
  if (userUuid && items.length > 0) {
    const itemIds = items.map(item => item.uuid);
    userInteractions = await getUserGalleryInteractions(userUuid, itemIds);
  }

  // 转换为前端需要的格式
  return items.map(item => {
    const interaction = userInteractions.get(item.uuid) || { liked: false, bookmarked: false };
    
    return {
      id: item.uuid,
      title: item.title,
      description: item.description || undefined,
      image_url: item.image_url,
      thumbnail_url: item.thumbnail_url || undefined,
      style: item.style as CharacterFigureStyle,
      pose: item.pose as CharacterPose,
      enhanced_prompt: item.enhanced_prompt || undefined,
      creator_username: item.creator_username || undefined,
      creator_avatar: item.creator_avatar || undefined,
      likes_count: item.likes_count,
      views_count: item.views_count,
      is_featured: item.is_featured,
      is_public: item.is_public,
      created_at: item.created_at!.toISOString(),
      updated_at: item.updated_at?.toISOString(),
      tags: item.tags ? JSON.parse(item.tags) : [],
      user_liked: interaction.liked,
      user_bookmarked: interaction.bookmarked
    };
  });
}

/**
 * 处理画廊互动
 * 
 * @param userUuid 用户UUID
 * @param galleryItemId 画廊项目ID
 * @param action 互动动作
 * @returns 操作结果
 */
export async function handleGalleryAction(
  userUuid: string,
  galleryItemId: string,
  action: GalleryAction
): Promise<GalleryActionResponse> {
  try {
    // 验证画廊项目是否存在
    const galleryItem = await getGalleryItemByUuid(galleryItemId);
    if (!galleryItem) {
      return {
        success: false,
        message: 'Gallery item not found'
      };
    }

    let newCount: number | undefined;
    let userActionState: boolean | undefined;

    switch (action) {
      case GalleryAction.LIKE:
        // 记录点赞互动
        await recordGalleryInteraction({
          user_uuid: userUuid,
          gallery_item_id: galleryItemId,
          interaction_type: 'like',
          is_active: true
        });
        // 更新点赞数
        const likedItem = await updateGalleryItemStats(galleryItemId, 'likes_count', 1);
        newCount = likedItem?.likes_count;
        userActionState = true;
        break;

      case GalleryAction.UNLIKE:
        // 取消点赞
        await updateGalleryInteraction(userUuid, galleryItemId, 'like', false);
        // 减少点赞数
        const unlikedItem = await updateGalleryItemStats(galleryItemId, 'likes_count', -1);
        newCount = Math.max(0, unlikedItem?.likes_count || 0);
        userActionState = false;
        break;

      case GalleryAction.BOOKMARK:
        // 记录收藏互动
        await recordGalleryInteraction({
          user_uuid: userUuid,
          gallery_item_id: galleryItemId,
          interaction_type: 'bookmark',
          is_active: true
        });
        // 更新收藏数
        const bookmarkedItem = await updateGalleryItemStats(galleryItemId, 'bookmarks_count', 1);
        newCount = bookmarkedItem?.bookmarks_count;
        userActionState = true;
        break;

      case GalleryAction.UNBOOKMARK:
        // 取消收藏
        await updateGalleryInteraction(userUuid, galleryItemId, 'bookmark', false);
        // 减少收藏数
        const unbookmarkedItem = await updateGalleryItemStats(galleryItemId, 'bookmarks_count', -1);
        newCount = Math.max(0, unbookmarkedItem?.bookmarks_count || 0);
        userActionState = false;
        break;

      case GalleryAction.VIEW:
        // 记录浏览互动（每次都记录，不去重）
        await recordGalleryInteraction({
          user_uuid: userUuid,
          gallery_item_id: galleryItemId,
          interaction_type: 'view',
          is_active: true
        });
        // 更新浏览数
        const viewedItem = await updateGalleryItemStats(galleryItemId, 'views_count', 1);
        newCount = viewedItem?.views_count;
        break;

      case GalleryAction.REPORT:
        // 记录举报
        await recordGalleryInteraction({
          user_uuid: userUuid,
          gallery_item_id: galleryItemId,
          interaction_type: 'report',
          is_active: true,
          metadata: JSON.stringify({ reported_at: new Date().toISOString() })
        });
        break;

      default:
        return {
          success: false,
          message: 'Invalid action'
        };
    }

    return {
      success: true,
      new_count: newCount,
      user_action_state: userActionState,
      message: 'Action completed successfully'
    };

  } catch (error: any) {
    console.error('Gallery action failed:', error);
    
    // 处理重复操作错误
    if (error.message?.includes('unique') || error.code === '23505') {
      return {
        success: false,
        message: 'Action already performed'
      };
    }

    return {
      success: false,
      message: 'Failed to perform action'
    };
  }
}

/**
 * ===============================
 * 用户历史管理服务
 * ===============================
 */

/**
 * 获取用户生成历史
 * 
 * @param userUuid 用户UUID
 * @param query 查询参数
 * @returns 生成历史列表
 */
export async function getUserHistory(
  userUuid: string,
  query: HistoryQuery = {}
): Promise<UserGenerationHistory[]> {
  const generations = await getUserGenerationHistory(userUuid, query);

  return generations.map(gen => ({
    id: gen.uuid,
    user_uuid: gen.user_uuid,
    request: {
      prompt: gen.original_prompt,
      style: gen.style as CharacterFigureStyle,
      pose: gen.pose as CharacterPose,
      gender: gen.gender as any,
      age: gen.age as any,
      style_keywords: gen.style_keywords ? JSON.parse(gen.style_keywords) : undefined,
      clothing: gen.clothing || undefined,
      background: gen.background || undefined,
      color_palette: gen.color_palette || undefined,
      aspect_ratio: gen.aspect_ratio as any,
      quality: gen.quality as any,
      num_images: gen.num_images.toString() as any,
      seed: gen.seed || undefined
    },
    images: gen.generated_images ? JSON.parse(gen.generated_images) : [],
    credits_used: gen.credits_used,
    generation_time: gen.generation_time,
    created_at: gen.created_at!.toISOString(),
    is_favorited: gen.is_favorited,
    gallery_item_id: gen.gallery_item_id || undefined
  }));
}

/**
 * 切换生成记录的收藏状态
 * 
 * @param userUuid 用户UUID
 * @param generationId 生成记录ID
 * @returns 操作结果
 */
export async function toggleGenerationFavorite(
  userUuid: string,
  generationId: string
): Promise<{ success: boolean; is_favorited?: boolean; message?: string }> {
  try {
    // 获取当前记录
    const generation = await getCharacterGenerationByUuid(generationId);
    if (!generation) {
      return { success: false, message: 'Generation record not found' };
    }

    // 验证用户权限
    if (generation.user_uuid !== userUuid) {
      return { success: false, message: 'Unauthorized access' };
    }

    // 切换收藏状态
    const newFavoriteState = !generation.is_favorited;
    const updated = await updateGenerationFavoriteStatus(generationId, newFavoriteState);

    if (!updated) {
      return { success: false, message: 'Failed to update favorite status' };
    }

    return {
      success: true,
      is_favorited: newFavoriteState,
      message: newFavoriteState ? 'Added to favorites' : 'Removed from favorites'
    };

  } catch (error) {
    console.error('Toggle favorite failed:', error);
    return { success: false, message: 'Internal server error' };
  }
}

/**
 * 获取用户的角色生成统计
 * 
 * @param userUuid 用户UUID
 * @returns 统计信息
 */
export async function getUserStats(userUuid: string): Promise<CharacterFigureStats> {
  const stats = await getUserGenerationStats(userUuid);

  // 获取画廊相关统计
  // TODO: 实现画廊统计查询

  return {
    total_generations: Number(stats.total_generations) || 0,
    total_credits_used: Number(stats.total_credits_used) || 0,
    favorite_style: stats.favorite_style as CharacterFigureStyle,
    favorite_pose: stats.favorite_pose as CharacterPose,
    total_gallery_items: 0, // TODO: 实现
    total_likes_received: 0, // TODO: 实现
    generation_streak: 0, // TODO: 实现
    last_generation_at: undefined // TODO: 实现
  };
}

/**
 * ===============================
 * 模板和配置管理
 * ===============================
 */

/**
 * 获取角色模板列表
 * 
 * @param featured 是否只获取推荐模板
 * @returns 模板列表
 */
export async function getCharacterTemplates(featured: boolean = false) {
  const templates = await getActiveCharacterTemplates(featured);
  
  return templates.map(template => ({
    id: template.uuid,
    name: template.name,
    description: template.description,
    category: template.category,
    preview_image_url: template.preview_image_url,
    template_params: JSON.parse(template.template_params),
    usage_count: template.usage_count,
    success_rate: template.success_rate,
    is_featured: template.is_featured,
    is_free: template.is_free
  }));
}

/**
 * 使用模板生成角色
 * 
 * @param userUuid 用户UUID
 * @param templateId 模板ID
 * @param customizations 自定义修改
 * @returns 生成结果
 */
export async function generateWithTemplate(
  userUuid: string,
  templateId: string,
  customizations: Partial<CharacterFigureRequest> = {}
): Promise<CharacterFigureResponse> {
  try {
    // 获取模板
    const templates = await getActiveCharacterTemplates();
    const template = templates.find(t => t.uuid === templateId);
    
    if (!template) {
      return {
        success: false,
        error: 'Template not found'
      };
    }

    // 解析模板参数并应用自定义修改
    const templateParams: CharacterFigureRequest = JSON.parse(template.template_params);
    const request: CharacterFigureRequest = {
      ...templateParams,
      ...customizations
    };

    // 增加模板使用次数
    await incrementTemplateUsage(templateId);

    // 执行生成
    return await generateCharacterFigure(userUuid, request);

  } catch (error: any) {
    console.error('Template generation failed:', error);
    return {
      success: false,
      error: 'Template generation failed'
    };
  }
}