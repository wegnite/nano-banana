-- Database Functions for Character Figure AI Generator
-- Purpose: Optimized database functions for common query patterns
-- Author: Database Performance Expert
-- Date: 2025-08-28

-- =============================================
-- GALLERY TRENDING AND POPULAR FUNCTIONS
-- =============================================

-- Function to get trending gallery items (last 7 days with high engagement)
CREATE OR REPLACE FUNCTION get_trending_gallery_items(
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  uuid VARCHAR,
  title VARCHAR,
  image_url VARCHAR,
  thumbnail_url VARCHAR,
  creator_username VARCHAR,
  likes_count INTEGER,
  views_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  trend_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cg.uuid,
    cg.title,
    cg.image_url,
    cg.thumbnail_url,
    cg.creator_username,
    cg.likes_count,
    cg.views_count,
    cg.created_at,
    -- Trend score calculation: weighted combination of likes, views, and recency
    (
      (cg.likes_count * 3.0) + 
      (cg.views_count * 1.0) + 
      (EXTRACT(EPOCH FROM (NOW() - cg.created_at)) / 3600.0 * -0.1)
    ) AS trend_score
  FROM character_gallery cg
  WHERE 
    cg.is_public = true 
    AND cg.is_approved = true
    AND cg.created_at >= NOW() - INTERVAL '7 days'
  ORDER BY trend_score DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to get popular gallery items (all time with high engagement)
CREATE OR REPLACE FUNCTION get_popular_gallery_items(
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0,
  style_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  uuid VARCHAR,
  title VARCHAR,
  image_url VARCHAR,
  thumbnail_url VARCHAR,
  creator_username VARCHAR,
  style VARCHAR,
  likes_count INTEGER,
  views_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  popularity_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cg.uuid,
    cg.title,
    cg.image_url,
    cg.thumbnail_url,
    cg.creator_username,
    cg.style,
    cg.likes_count,
    cg.views_count,
    cg.created_at,
    -- Popularity score: likes and views with recency decay
    (
      (cg.likes_count * 2.0) + 
      (cg.views_count * 0.5) +
      (CASE 
        WHEN cg.created_at >= NOW() - INTERVAL '7 days' THEN 10
        WHEN cg.created_at >= NOW() - INTERVAL '30 days' THEN 5
        ELSE 0
      END)
    ) AS popularity_score
  FROM character_gallery cg
  WHERE 
    cg.is_public = true 
    AND cg.is_approved = true
    AND (style_filter IS NULL OR cg.style = style_filter)
  ORDER BY popularity_score DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- =============================================
-- USER ANALYTICS FUNCTIONS
-- =============================================

-- Function to get user generation statistics
CREATE OR REPLACE FUNCTION get_user_generation_stats(user_id VARCHAR)
RETURNS TABLE (
  total_generations INTEGER,
  total_credits_used INTEGER,
  favorite_style VARCHAR,
  favorite_pose VARCHAR,
  avg_generation_time NUMERIC,
  recent_generations INTEGER,
  gallery_items INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*)::INTEGER as total_gens,
      SUM(credits_used)::INTEGER as total_credits,
      AVG(generation_time)::NUMERIC as avg_time,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::INTEGER as recent_gens,
      COUNT(CASE WHEN gallery_item_id IS NOT NULL THEN 1 END)::INTEGER as gallery_count
    FROM character_generations 
    WHERE user_uuid = user_id AND is_deleted = false
  ),
  style_stats AS (
    SELECT style, COUNT(*) as style_count
    FROM character_generations 
    WHERE user_uuid = user_id AND is_deleted = false
    GROUP BY style
    ORDER BY style_count DESC
    LIMIT 1
  ),
  pose_stats AS (
    SELECT pose, COUNT(*) as pose_count
    FROM character_generations 
    WHERE user_uuid = user_id AND is_deleted = false
    GROUP BY pose
    ORDER BY pose_count DESC
    LIMIT 1
  )
  SELECT 
    us.total_gens,
    us.total_credits,
    ss.style,
    ps.pose,
    us.avg_time,
    us.recent_gens,
    us.gallery_count
  FROM user_stats us
  LEFT JOIN style_stats ss ON true
  LEFT JOIN pose_stats ps ON true;
END;
$$;

-- Function to get user's subscription status and usage
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_id VARCHAR)
RETURNS TABLE (
  has_active_subscription BOOLEAN,
  plan_name VARCHAR,
  monthly_limit INTEGER,
  used_this_month INTEGER,
  remaining_generations INTEGER,
  current_period_end TIMESTAMP WITH TIME ZONE,
  next_payment_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH subscription_info AS (
    SELECT 
      s.plan_name,
      s.monthly_limit,
      s.used_this_month,
      s.current_period_end,
      s.next_payment_at,
      CASE 
        WHEN s.status = 'active' AND s.current_period_end > NOW() THEN true
        ELSE false
      END as is_active
    FROM subscriptions s
    WHERE s.user_uuid = user_id
    ORDER BY s.created_at DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(si.is_active, false),
    si.plan_name,
    si.monthly_limit,
    COALESCE(si.used_this_month, 0),
    CASE 
      WHEN si.monthly_limit IS NULL THEN -1  -- Unlimited
      ELSE GREATEST(0, si.monthly_limit - COALESCE(si.used_this_month, 0))
    END,
    si.current_period_end,
    si.next_payment_at
  FROM subscription_info si;
END;
$$;

-- =============================================
-- GALLERY INTERACTION FUNCTIONS
-- =============================================

-- Function to update gallery item social counts
CREATE OR REPLACE FUNCTION update_gallery_social_counts(item_uuid VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  like_count INTEGER;
  bookmark_count INTEGER;
  view_count INTEGER;
BEGIN
  -- Count likes
  SELECT COUNT(*) INTO like_count
  FROM gallery_interactions
  WHERE gallery_item_id = item_uuid
  AND interaction_type = 'like'
  AND is_active = true;
  
  -- Count bookmarks
  SELECT COUNT(*) INTO bookmark_count
  FROM gallery_interactions
  WHERE gallery_item_id = item_uuid
  AND interaction_type = 'bookmark'
  AND is_active = true;
  
  -- Count views (distinct users)
  SELECT COUNT(DISTINCT user_uuid) INTO view_count
  FROM gallery_interactions
  WHERE gallery_item_id = item_uuid
  AND interaction_type = 'view';
  
  -- Update the gallery item
  UPDATE character_gallery
  SET 
    likes_count = like_count,
    bookmarks_count = bookmark_count,
    views_count = view_count,
    updated_at = NOW()
  WHERE uuid = item_uuid;
END;
$$;

-- Function to record gallery interaction
CREATE OR REPLACE FUNCTION record_gallery_interaction(
  user_id VARCHAR,
  item_uuid VARCHAR,
  interaction_type VARCHAR,
  metadata_json TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  existing_interaction RECORD;
BEGIN
  -- Check for existing interaction
  SELECT * INTO existing_interaction
  FROM gallery_interactions
  WHERE user_uuid = user_id
  AND gallery_item_id = item_uuid
  AND interaction_type = interaction_type
  AND is_active = true;
  
  IF interaction_type IN ('like', 'bookmark') THEN
    -- Toggle behavior for likes and bookmarks
    IF existing_interaction IS NOT NULL THEN
      -- Deactivate existing interaction
      UPDATE gallery_interactions
      SET is_active = false, updated_at = NOW()
      WHERE id = existing_interaction.id;
    ELSE
      -- Create new interaction
      INSERT INTO gallery_interactions (user_uuid, gallery_item_id, interaction_type, metadata)
      VALUES (user_id, item_uuid, interaction_type, metadata_json);
    END IF;
  ELSE
    -- For views and other interactions, always create new record
    INSERT INTO gallery_interactions (user_uuid, gallery_item_id, interaction_type, metadata)
    VALUES (user_id, item_uuid, interaction_type, metadata_json)
    ON CONFLICT DO NOTHING;  -- Prevent duplicate views within same session
  END IF;
  
  -- Update social counts
  PERFORM update_gallery_social_counts(item_uuid);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- =============================================
-- SEARCH AND RECOMMENDATION FUNCTIONS
-- =============================================

-- Function to search gallery items with filters
CREATE OR REPLACE FUNCTION search_gallery_items(
  search_query TEXT DEFAULT NULL,
  style_filter VARCHAR DEFAULT NULL,
  creator_filter VARCHAR DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0,
  sort_by VARCHAR DEFAULT 'recent' -- 'recent', 'popular', 'trending'
)
RETURNS TABLE (
  uuid VARCHAR,
  title VARCHAR,
  description TEXT,
  image_url VARCHAR,
  thumbnail_url VARCHAR,
  creator_username VARCHAR,
  style VARCHAR,
  likes_count INTEGER,
  views_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
  order_clause TEXT;
BEGIN
  -- Determine sort order
  CASE sort_by
    WHEN 'popular' THEN
      order_clause := 'ORDER BY (likes_count * 2 + views_count) DESC, created_at DESC';
    WHEN 'trending' THEN
      order_clause := 'ORDER BY (likes_count * 3 + views_count - EXTRACT(EPOCH FROM (NOW() - created_at))/3600 * 0.1) DESC';
    ELSE
      order_clause := 'ORDER BY created_at DESC';
  END CASE;
  
  RETURN QUERY EXECUTE format('
    SELECT 
      cg.uuid,
      cg.title,
      cg.description,
      cg.image_url,
      cg.thumbnail_url,
      cg.creator_username,
      cg.style,
      cg.likes_count,
      cg.views_count,
      cg.created_at
    FROM character_gallery cg
    WHERE 
      cg.is_public = true 
      AND cg.is_approved = true
      AND ($1 IS NULL OR (
        cg.title ILIKE ''%%'' || $1 || ''%%'' OR 
        cg.description ILIKE ''%%'' || $1 || ''%%''
      ))
      AND ($2 IS NULL OR cg.style = $2)
      AND ($3 IS NULL OR cg.creator_username ILIKE ''%%'' || $3 || ''%%'')
    %s
    LIMIT $4
    OFFSET $5
  ', order_clause)
  USING search_query, style_filter, creator_filter, limit_count, offset_count;
END;
$$;

-- Function to get recommended items for user
CREATE OR REPLACE FUNCTION get_user_recommendations(
  user_id VARCHAR,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  uuid VARCHAR,
  title VARCHAR,
  image_url VARCHAR,
  thumbnail_url VARCHAR,
  style VARCHAR,
  likes_count INTEGER,
  recommendation_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_preferences AS (
    -- Get user's favorite styles and poses
    SELECT 
      style,
      COUNT(*) as usage_count
    FROM character_generations
    WHERE user_uuid = user_id AND is_deleted = false
    GROUP BY style
    ORDER BY usage_count DESC
    LIMIT 3
  ),
  user_interactions AS (
    -- Get styles from items user liked
    SELECT DISTINCT cg.style
    FROM gallery_interactions gi
    JOIN character_gallery cg ON gi.gallery_item_id = cg.uuid
    WHERE gi.user_uuid = user_id AND gi.interaction_type = 'like' AND gi.is_active = true
  ),
  recommendations AS (
    SELECT 
      cg.uuid,
      cg.title,
      cg.image_url,
      cg.thumbnail_url,
      cg.style,
      cg.likes_count,
      (
        -- Base score from popularity
        (cg.likes_count * 1.0 + cg.views_count * 0.3) +
        -- Bonus for user's preferred styles
        (CASE WHEN up.style IS NOT NULL THEN up.usage_count * 5.0 ELSE 0 END) +
        -- Bonus for styles user liked
        (CASE WHEN ui.style IS NOT NULL THEN 10.0 ELSE 0 END) +
        -- Recency bonus
        (CASE 
          WHEN cg.created_at >= NOW() - INTERVAL '7 days' THEN 5.0
          WHEN cg.created_at >= NOW() - INTERVAL '30 days' THEN 2.0
          ELSE 0
        END)
      ) as recommendation_score
    FROM character_gallery cg
    LEFT JOIN user_preferences up ON cg.style = up.style
    LEFT JOIN user_interactions ui ON cg.style = ui.style
    WHERE 
      cg.is_public = true 
      AND cg.is_approved = true
      AND cg.user_uuid != user_id  -- Don't recommend user's own items
      -- Exclude items user already interacted with
      AND NOT EXISTS (
        SELECT 1 FROM gallery_interactions gi2
        WHERE gi2.gallery_item_id = cg.uuid 
        AND gi2.user_uuid = user_id
        AND gi2.interaction_type IN ('like', 'bookmark', 'view')
      )
    ORDER BY recommendation_score DESC
    LIMIT limit_count
  )
  SELECT * FROM recommendations;
END;
$$;

-- =============================================
-- TEMPLATE USAGE FUNCTIONS
-- =============================================

-- Function to record template usage
CREATE OR REPLACE FUNCTION record_template_usage(
  template_uuid VARCHAR,
  success BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  new_success_rate INTEGER;
  total_usage INTEGER;
  successful_usage INTEGER;
BEGIN
  -- Update usage count
  UPDATE character_templates
  SET 
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE uuid = template_uuid;
  
  -- Recalculate success rate
  SELECT 
    usage_count,
    CASE 
      WHEN success THEN LEAST(100, success_rate + 1)
      ELSE GREATEST(0, success_rate - 1)
    END
  INTO total_usage, new_success_rate
  FROM character_templates
  WHERE uuid = template_uuid;
  
  -- Update success rate with weighted average
  UPDATE character_templates
  SET success_rate = new_success_rate
  WHERE uuid = template_uuid;
END;
$$;

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Function to get platform analytics
CREATE OR REPLACE FUNCTION get_platform_analytics(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_generations INTEGER,
  total_users INTEGER,
  total_gallery_items INTEGER,
  avg_generation_time NUMERIC,
  most_popular_style VARCHAR,
  total_credits_consumed INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH analytics AS (
    SELECT 
      COUNT(*)::INTEGER as total_gens,
      COUNT(DISTINCT user_uuid)::INTEGER as unique_users,
      AVG(generation_time)::NUMERIC as avg_time,
      SUM(credits_used)::INTEGER as total_credits
    FROM character_generations
    WHERE created_at BETWEEN start_date AND end_date
    AND is_deleted = false
  ),
  gallery_stats AS (
    SELECT COUNT(*)::INTEGER as gallery_count
    FROM character_gallery
    WHERE created_at BETWEEN start_date AND end_date
    AND is_public = true
  ),
  style_stats AS (
    SELECT style, COUNT(*) as style_count
    FROM character_generations
    WHERE created_at BETWEEN start_date AND end_date
    AND is_deleted = false
    GROUP BY style
    ORDER BY style_count DESC
    LIMIT 1
  )
  SELECT 
    a.total_gens,
    a.unique_users,
    g.gallery_count,
    a.avg_time,
    s.style,
    a.total_credits
  FROM analytics a
  CROSS JOIN gallery_stats g
  LEFT JOIN style_stats s ON true;
END;
$$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_trending_gallery_items(INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_popular_gallery_items(INTEGER, INTEGER, VARCHAR) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_generation_stats(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_info(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION update_gallery_social_counts(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION record_gallery_interaction(VARCHAR, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_gallery_items(TEXT, VARCHAR, VARCHAR, INTEGER, INTEGER, VARCHAR) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_recommendations(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION record_template_usage(VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;