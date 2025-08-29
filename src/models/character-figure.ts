/**
 * 角色图像模型层 - Character Figure Data Access Layer
 * 
 * 功能说明：
 * 处理所有与角色图像生成相关的数据库操作
 * 使用 Drizzle ORM 进行类型安全的数据库查询
 * 
 * 主要操作：
 * - 角色生成历史的 CRUD 操作
 * - 画廊项目的管理
 * - 用户互动记录
 * - 模板和配置管理
 * 
 * @module models/character-figure
 */

import { db } from "@/db";
import { 
  character_generations, 
  character_gallery, 
  gallery_interactions, 
  character_templates,
  user_preferences,
  system_configs
} from "@/db/schema";
import { 
  desc, 
  eq, 
  and, 
  or, 
  gte, 
  lte, 
  inArray, 
  like, 
  count,
  sum,
  sql
} from "drizzle-orm";
import type {
  CharacterFigureRequest,
  CharacterFigureImage,
  GalleryItem,
  GalleryFilters,
  UserGenerationHistory,
  HistoryQuery,
  GalleryAction
} from "@/types/character-figure";

/**
 * ===============================
 * 角色生成历史相关操作
 * ===============================
 */

/**
 * 插入新的角色生成记录
 * 
 * @param data 生成记录数据
 * @returns 创建的记录
 */
export async function insertCharacterGeneration(
  data: typeof character_generations.$inferInsert
): Promise<typeof character_generations.$inferSelect | undefined> {
  const [generation] = await db()
    .insert(character_generations)
    .values(data)
    .returning();

  return generation;
}

/**
 * 根据UUID获取生成记录
 * 
 * @param uuid 生成记录唯一标识
 * @returns 生成记录
 */
export async function getCharacterGenerationByUuid(
  uuid: string
): Promise<typeof character_generations.$inferSelect | undefined> {
  const [generation] = await db()
    .select()
    .from(character_generations)
    .where(eq(character_generations.uuid, uuid))
    .limit(1);

  return generation;
}

/**
 * 获取用户的生成历史（分页）
 * 
 * @param userUuid 用户UUID
 * @param query 查询参数
 * @returns 生成历史列表
 */
export async function getUserGenerationHistory(
  userUuid: string,
  query: HistoryQuery = {}
): Promise<typeof character_generations.$inferSelect[]> {
  const {
    page = 1,
    limit = 20,
    style,
    date_from,
    date_to,
    favorites_only = false,
    sort_by = 'latest'
  } = query;

  const offset = (page - 1) * limit;
  
  let whereConditions = [
    eq(character_generations.user_uuid, userUuid),
    eq(character_generations.is_deleted, false)
  ];

  // 添加样式筛选
  if (style && style.length > 0) {
    whereConditions.push(inArray(character_generations.style, style));
  }

  // 添加日期范围筛选
  if (date_from) {
    whereConditions.push(gte(character_generations.created_at, new Date(date_from)));
  }
  if (date_to) {
    whereConditions.push(lte(character_generations.created_at, new Date(date_to)));
  }

  // 添加收藏筛选
  if (favorites_only) {
    whereConditions.push(eq(character_generations.is_favorited, true));
  }

  // 确定排序方式
  let orderBy;
  switch (sort_by) {
    case 'oldest':
      orderBy = character_generations.created_at;
      break;
    case 'most_credits':
      orderBy = desc(character_generations.credits_used);
      break;
    case 'favorites':
      orderBy = [desc(character_generations.is_favorited), desc(character_generations.created_at)];
      break;
    default:
      orderBy = desc(character_generations.created_at);
  }

  const generations = await db()
    .select()
    .from(character_generations)
    .where(and(...whereConditions))
    .orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
    .limit(limit)
    .offset(offset);

  return generations;
}

/**
 * 更新生成记录的收藏状态
 * 
 * @param uuid 生成记录UUID
 * @param isFavorited 是否收藏
 * @returns 更新后的记录
 */
export async function updateGenerationFavoriteStatus(
  uuid: string,
  isFavorited: boolean
): Promise<typeof character_generations.$inferSelect | undefined> {
  const [generation] = await db()
    .update(character_generations)
    .set({ 
      is_favorited: isFavorited,
      updated_at: new Date()
    })
    .where(eq(character_generations.uuid, uuid))
    .returning();

  return generation;
}

/**
 * 软删除生成记录
 * 
 * @param uuid 生成记录UUID
 * @returns 是否成功删除
 */
export async function softDeleteGeneration(uuid: string): Promise<boolean> {
  const [result] = await db()
    .update(character_generations)
    .set({ 
      is_deleted: true,
      updated_at: new Date()
    })
    .where(eq(character_generations.uuid, uuid))
    .returning();

  return !!result;
}

/**
 * 获取用户的生成统计信息
 * 
 * @param userUuid 用户UUID
 * @returns 统计信息
 */
export async function getUserGenerationStats(userUuid: string) {
  const stats = await db()
    .select({
      total_generations: count(),
      total_credits_used: sum(character_generations.credits_used),
      total_favorites: count(sql`CASE WHEN ${character_generations.is_favorited} = true THEN 1 END`),
    })
    .from(character_generations)
    .where(
      and(
        eq(character_generations.user_uuid, userUuid),
        eq(character_generations.is_deleted, false)
      )
    );

  // 获取最常用的风格和姿势
  const styleStats = await db()
    .select({
      style: character_generations.style,
      count: count()
    })
    .from(character_generations)
    .where(
      and(
        eq(character_generations.user_uuid, userUuid),
        eq(character_generations.is_deleted, false)
      )
    )
    .groupBy(character_generations.style)
    .orderBy(desc(count()))
    .limit(1);

  const poseStats = await db()
    .select({
      pose: character_generations.pose,
      count: count()
    })
    .from(character_generations)
    .where(
      and(
        eq(character_generations.user_uuid, userUuid),
        eq(character_generations.is_deleted, false)
      )
    )
    .groupBy(character_generations.pose)
    .orderBy(desc(count()))
    .limit(1);

  return {
    ...stats[0],
    favorite_style: styleStats[0]?.style || null,
    favorite_pose: poseStats[0]?.pose || null,
  };
}

/**
 * ===============================
 * 画廊相关操作
 * ===============================
 */

/**
 * 插入新的画廊项目
 * 
 * @param data 画廊项目数据
 * @returns 创建的画廊项目
 */
export async function insertGalleryItem(
  data: typeof character_gallery.$inferInsert
): Promise<typeof character_gallery.$inferSelect | undefined> {
  const [item] = await db()
    .insert(character_gallery)
    .values(data)
    .returning();

  return item;
}

/**
 * 根据UUID获取画廊项目
 * 
 * @param uuid 画廊项目UUID
 * @returns 画廊项目
 */
export async function getGalleryItemByUuid(
  uuid: string
): Promise<typeof character_gallery.$inferSelect | undefined> {
  const [item] = await db()
    .select()
    .from(character_gallery)
    .where(eq(character_gallery.uuid, uuid))
    .limit(1);

  return item;
}

/**
 * 获取画廊项目列表（支持筛选和分页）
 * 
 * @param filters 筛选条件
 * @returns 画廊项目列表
 */
export async function getGalleryItems(
  filters: GalleryFilters = {}
): Promise<typeof character_gallery.$inferSelect[]> {
  const {
    style,
    pose,
    sort_by = 'latest',
    time_range = 'all',
    featured_only = false,
    page = 1,
    limit = 20,
    search_query,
    tags
  } = filters;

  const offset = (page - 1) * limit;
  
  let whereConditions = [
    eq(character_gallery.is_public, true),
    eq(character_gallery.is_approved, true)
  ];

  // 添加风格筛选
  if (style && style.length > 0) {
    whereConditions.push(inArray(character_gallery.style, style));
  }

  // 添加姿势筛选
  if (pose && pose.length > 0) {
    whereConditions.push(inArray(character_gallery.pose, pose));
  }

  // 添加推荐筛选
  if (featured_only) {
    whereConditions.push(eq(character_gallery.is_featured, true));
  }

  // 添加时间范围筛选
  if (time_range !== 'all') {
    const timeMap = {
      'today': 1,
      'week': 7,
      'month': 30
    };
    const days = timeMap[time_range as keyof typeof timeMap];
    if (days) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);
      whereConditions.push(gte(character_gallery.created_at, dateThreshold));
    }
  }

  // 添加搜索查询
  if (search_query) {
    const searchConditions = [
      like(character_gallery.title, `%${search_query}%`),
      like(character_gallery.description, `%${search_query}%`),
      like(character_gallery.enhanced_prompt, `%${search_query}%`)
    ];
    const searchCondition = or(...searchConditions);
    if (searchCondition) {
      whereConditions.push(searchCondition);
    }
  }

  // 添加标签筛选（JSON 数组查询）
  if (tags && tags.length > 0) {
    // 注意：这里需要根据实际的 PostgreSQL JSON 操作符来实现
    // 这是一个简化的示例，实际实现可能需要更复杂的查询
    const tagConditions = tags.map(tag => 
      sql`${character_gallery.tags}::text LIKE ${'%"' + tag + '"%'}`
    );
    const tagCondition = or(...tagConditions);
    if (tagCondition) {
      whereConditions.push(tagCondition);
    }
  }

  // 确定排序方式
  let orderBy;
  switch (sort_by) {
    case 'popular':
      orderBy = desc(character_gallery.likes_count);
      break;
    case 'trending':
      orderBy = [desc(character_gallery.views_count), desc(character_gallery.created_at)];
      break;
    case 'most_liked':
      orderBy = [desc(character_gallery.likes_count), desc(character_gallery.created_at)];
      break;
    default:
      orderBy = desc(character_gallery.created_at);
  }

  const items = await db()
    .select()
    .from(character_gallery)
    .where(and(...whereConditions))
    .orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
    .limit(limit)
    .offset(offset);

  return items;
}

/**
 * 更新画廊项目的统计数据
 * 
 * @param uuid 画廊项目UUID
 * @param field 要更新的字段
 * @param increment 增加的数量（可以为负数）
 * @returns 更新后的项目
 */
export async function updateGalleryItemStats(
  uuid: string,
  field: 'likes_count' | 'views_count' | 'bookmarks_count',
  increment: number
): Promise<typeof character_gallery.$inferSelect | undefined> {
  const [item] = await db()
    .update(character_gallery)
    .set({
      [field]: sql`${character_gallery[field]} + ${increment}`,
      updated_at: new Date()
    })
    .where(eq(character_gallery.uuid, uuid))
    .returning();

  return item;
}

/**
 * ===============================
 * 用户互动相关操作
 * ===============================
 */

/**
 * 记录用户互动
 * 
 * @param data 互动数据
 * @returns 创建的互动记录
 */
export async function recordGalleryInteraction(
  data: typeof gallery_interactions.$inferInsert
): Promise<typeof gallery_interactions.$inferSelect | undefined> {
  try {
    const [interaction] = await db()
      .insert(gallery_interactions)
      .values(data)
      .returning();

    return interaction;
  } catch (error) {
    // 处理唯一约束冲突（用户重复操作）
    console.error('Gallery interaction error:', error);
    return undefined;
  }
}

/**
 * 更新用户互动状态
 * 
 * @param userUuid 用户UUID
 * @param galleryItemId 画廊项目ID
 * @param interactionType 互动类型
 * @param isActive 是否激活
 * @returns 更新后的互动记录
 */
export async function updateGalleryInteraction(
  userUuid: string,
  galleryItemId: string,
  interactionType: string,
  isActive: boolean
): Promise<typeof gallery_interactions.$inferSelect | undefined> {
  const [interaction] = await db()
    .update(gallery_interactions)
    .set({
      is_active: isActive,
      updated_at: new Date()
    })
    .where(
      and(
        eq(gallery_interactions.user_uuid, userUuid),
        eq(gallery_interactions.gallery_item_id, galleryItemId),
        eq(gallery_interactions.interaction_type, interactionType)
      )
    )
    .returning();

  return interaction;
}

/**
 * 获取用户对画廊项目的互动状态
 * 
 * @param userUuid 用户UUID
 * @param galleryItemIds 画廊项目ID数组
 * @returns 互动状态映射
 */
export async function getUserGalleryInteractions(
  userUuid: string,
  galleryItemIds: string[]
): Promise<Map<string, { liked: boolean; bookmarked: boolean }>> {
  const interactions = await db()
    .select()
    .from(gallery_interactions)
    .where(
      and(
        eq(gallery_interactions.user_uuid, userUuid),
        inArray(gallery_interactions.gallery_item_id, galleryItemIds),
        eq(gallery_interactions.is_active, true)
      )
    );

  const interactionMap = new Map<string, { liked: boolean; bookmarked: boolean }>();
  
  // 初始化所有项目的状态
  galleryItemIds.forEach(id => {
    interactionMap.set(id, { liked: false, bookmarked: false });
  });

  // 更新实际的互动状态
  interactions.forEach(interaction => {
    const current = interactionMap.get(interaction.gallery_item_id) || { liked: false, bookmarked: false };
    if (interaction.interaction_type === 'like') {
      current.liked = true;
    } else if (interaction.interaction_type === 'bookmark') {
      current.bookmarked = true;
    }
    interactionMap.set(interaction.gallery_item_id, current);
  });

  return interactionMap;
}

/**
 * 获取用户收藏的画廊项目
 * 
 * @param userUuid 用户UUID
 * @param page 页码
 * @param limit 每页数量
 * @returns 用户收藏的画廊项目
 */
export async function getUserBookmarkedGalleryItems(
  userUuid: string,
  page: number = 1,
  limit: number = 20
): Promise<typeof character_gallery.$inferSelect[]> {
  const offset = (page - 1) * limit;

  const items = await db()
    .select({
      gallery: character_gallery
    })
    .from(character_gallery)
    .innerJoin(
      gallery_interactions,
      and(
        eq(gallery_interactions.gallery_item_id, character_gallery.uuid),
        eq(gallery_interactions.user_uuid, userUuid),
        eq(gallery_interactions.interaction_type, 'bookmark'),
        eq(gallery_interactions.is_active, true)
      )
    )
    .where(
      and(
        eq(character_gallery.is_public, true),
        eq(character_gallery.is_approved, true)
      )
    )
    .orderBy(desc(gallery_interactions.created_at))
    .limit(limit)
    .offset(offset);

  return items.map(item => item.gallery);
}

/**
 * ===============================
 * 模板和配置相关操作
 * ===============================
 */

/**
 * 获取活跃的角色模板
 * 
 * @param featured 是否只获取推荐模板
 * @returns 模板列表
 */
export async function getActiveCharacterTemplates(
  featured: boolean = false
): Promise<typeof character_templates.$inferSelect[]> {
  let whereConditions = [eq(character_templates.is_active, true)];
  
  if (featured) {
    whereConditions.push(eq(character_templates.is_featured, true));
  }

  const templates = await db()
    .select()
    .from(character_templates)
    .where(and(...whereConditions))
    .orderBy(desc(character_templates.sort_order), desc(character_templates.usage_count));

  return templates;
}

/**
 * 更新模板使用次数
 * 
 * @param uuid 模板UUID
 * @returns 更新后的模板
 */
export async function incrementTemplateUsage(
  uuid: string
): Promise<typeof character_templates.$inferSelect | undefined> {
  const [template] = await db()
    .update(character_templates)
    .set({
      usage_count: sql`${character_templates.usage_count} + 1`,
      updated_at: new Date()
    })
    .where(eq(character_templates.uuid, uuid))
    .returning();

  return template;
}

/**
 * 获取系统配置
 * 
 * @param configKey 配置键
 * @returns 配置值
 */
export async function getSystemConfig(
  configKey: string
): Promise<typeof system_configs.$inferSelect | undefined> {
  const [config] = await db()
    .select()
    .from(system_configs)
    .where(
      and(
        eq(system_configs.config_key, configKey),
        eq(system_configs.is_active, true)
      )
    )
    .limit(1);

  return config;
}

/**
 * 获取用户偏好设置
 * 
 * @param userUuid 用户UUID
 * @returns 用户偏好
 */
export async function getUserPreferences(
  userUuid: string
): Promise<typeof user_preferences.$inferSelect | undefined> {
  const [preferences] = await db()
    .select()
    .from(user_preferences)
    .where(eq(user_preferences.user_uuid, userUuid))
    .limit(1);

  return preferences;
}

/**
 * 更新或插入用户偏好设置
 * 
 * @param userUuid 用户UUID
 * @param data 偏好数据
 * @returns 更新后的偏好
 */
export async function upsertUserPreferences(
  userUuid: string,
  data: Partial<typeof user_preferences.$inferInsert>
): Promise<typeof user_preferences.$inferSelect | undefined> {
  // 首先尝试更新
  const [existing] = await db()
    .update(user_preferences)
    .set({
      ...data,
      updated_at: new Date()
    })
    .where(eq(user_preferences.user_uuid, userUuid))
    .returning();

  if (existing) {
    return existing;
  }

  // 如果不存在，则插入
  const [newPreferences] = await db()
    .insert(user_preferences)
    .values({
      user_uuid: userUuid,
      ...data
    })
    .returning();

  return newPreferences;
}