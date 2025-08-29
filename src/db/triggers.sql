-- Database Triggers for Character Figure AI Generator
-- Purpose: Automatic timestamp updates and data synchronization
-- Author: Database Automation Expert
-- Date: 2025-08-28

-- =============================================
-- TIMESTAMP UPDATE TRIGGERS
-- =============================================

-- Generic function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating updated_at timestamp on all relevant tables
CREATE TRIGGER update_character_gallery_updated_at
  BEFORE UPDATE ON character_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_templates_updated_at
  BEFORE UPDATE ON character_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at
  BEFORE UPDATE ON system_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_interactions_updated_at
  BEFORE UPDATE ON gallery_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GALLERY SOCIAL COUNT TRIGGERS
-- =============================================

-- Function to automatically update gallery social counts when interactions change
CREATE OR REPLACE FUNCTION sync_gallery_social_counts()
RETURNS TRIGGER AS $$
DECLARE
  item_uuid VARCHAR;
  like_count INTEGER;
  bookmark_count INTEGER;
BEGIN
  -- Determine which gallery item to update
  IF TG_OP = 'DELETE' THEN
    item_uuid := OLD.gallery_item_id;
  ELSE
    item_uuid := NEW.gallery_item_id;
  END IF;
  
  -- Only update for like and bookmark interactions
  IF (TG_OP = 'DELETE' AND OLD.interaction_type IN ('like', 'bookmark')) OR
     (TG_OP != 'DELETE' AND NEW.interaction_type IN ('like', 'bookmark')) THEN
    
    -- Count active likes
    SELECT COUNT(*) INTO like_count
    FROM gallery_interactions
    WHERE gallery_item_id = item_uuid
    AND interaction_type = 'like'
    AND is_active = true;
    
    -- Count active bookmarks
    SELECT COUNT(*) INTO bookmark_count
    FROM gallery_interactions
    WHERE gallery_item_id = item_uuid
    AND interaction_type = 'bookmark'
    AND is_active = true;
    
    -- Update the gallery item
    UPDATE character_gallery
    SET 
      likes_count = like_count,
      bookmarks_count = bookmark_count,
      updated_at = NOW()
    WHERE uuid = item_uuid;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers for gallery interactions
CREATE TRIGGER sync_gallery_counts_on_insert
  AFTER INSERT ON gallery_interactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_gallery_social_counts();

CREATE TRIGGER sync_gallery_counts_on_update
  AFTER UPDATE ON gallery_interactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_gallery_social_counts();

CREATE TRIGGER sync_gallery_counts_on_delete
  AFTER DELETE ON gallery_interactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_gallery_social_counts();

-- =============================================
-- SUBSCRIPTION USAGE TRACKING TRIGGERS
-- =============================================

-- Function to update subscription usage when generations are created
CREATE OR REPLACE FUNCTION track_subscription_usage()
RETURNS TRIGGER AS $$
DECLARE
  user_subscription_id INTEGER;
  usage_type VARCHAR := 'character_generation';
BEGIN
  -- Only track for new generations, not updates
  IF TG_OP = 'INSERT' THEN
    -- Find user's active subscription
    SELECT id INTO user_subscription_id
    FROM subscriptions
    WHERE user_uuid = NEW.user_uuid
    AND status = 'active'
    AND current_period_end > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If user has active subscription, record usage
    IF user_subscription_id IS NOT NULL THEN
      INSERT INTO subscription_usage (
        user_uuid,
        subscription_id,
        usage_type,
        model_used,
        prompt,
        result_id,
        credits_consumed,
        count
      ) VALUES (
        NEW.user_uuid,
        user_subscription_id,
        usage_type,
        'character-figure-ai',
        LEFT(NEW.original_prompt, 1000),
        NEW.uuid,
        NEW.credits_used,
        NEW.num_images
      );
      
      -- Update monthly usage counter
      UPDATE subscriptions
      SET 
        used_this_month = used_this_month + NEW.num_images,
        updated_at = NOW()
      WHERE id = user_subscription_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscription usage tracking
CREATE TRIGGER track_character_generation_usage
  AFTER INSERT ON character_generations
  FOR EACH ROW
  EXECUTE FUNCTION track_subscription_usage();

-- =============================================
-- USER PREFERENCE SYNC TRIGGERS
-- =============================================

-- Function to update user preferences based on generation patterns
CREATE OR REPLACE FUNCTION sync_user_preferences()
RETURNS TRIGGER AS $$
DECLARE
  user_prefs RECORD;
  style_usage JSONB;
  pose_usage JSONB;
BEGIN
  -- Only process for new generations
  IF TG_OP = 'INSERT' THEN
    -- Check if user preferences exist
    SELECT * INTO user_prefs
    FROM user_preferences
    WHERE user_uuid = NEW.user_uuid;
    
    -- If no preferences exist, create them
    IF NOT FOUND THEN
      INSERT INTO user_preferences (user_uuid, default_style, default_pose)
      VALUES (NEW.user_uuid, NEW.style, NEW.pose);
    ELSE
      -- Update style usage statistics
      WITH style_stats AS (
        SELECT style, COUNT(*) as count
        FROM character_generations
        WHERE user_uuid = NEW.user_uuid AND is_deleted = false
        GROUP BY style
        ORDER BY count DESC
        LIMIT 5
      )
      SELECT json_agg(json_build_object('style', style, 'count', count))::jsonb
      INTO style_usage
      FROM style_stats;
      
      -- Update pose usage statistics
      WITH pose_stats AS (
        SELECT pose, COUNT(*) as count
        FROM character_generations
        WHERE user_uuid = NEW.user_uuid AND is_deleted = false
        GROUP BY pose
        ORDER BY count DESC
        LIMIT 5
      )
      SELECT json_agg(json_build_object('pose', pose, 'count', count))::jsonb
      INTO pose_usage
      FROM pose_stats;
      
      -- Update user preferences
      UPDATE user_preferences
      SET 
        favorite_styles = COALESCE(style_usage::text, favorite_styles),
        favorite_poses = COALESCE(pose_usage::text, favorite_poses),
        updated_at = NOW()
      WHERE user_uuid = NEW.user_uuid;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user preference synchronization
CREATE TRIGGER sync_user_preferences_on_generation
  AFTER INSERT ON character_generations
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_preferences();

-- =============================================
-- GALLERY ITEM CREATION TRIGGER
-- =============================================

-- Function to automatically populate gallery item metadata from generation
CREATE OR REPLACE FUNCTION populate_gallery_metadata()
RETURNS TRIGGER AS $$
DECLARE
  generation_data RECORD;
  user_data RECORD;
BEGIN
  -- Get generation data
  SELECT * INTO generation_data
  FROM character_generations
  WHERE uuid = NEW.generation_id;
  
  -- Get user data
  SELECT nickname, avatar_url INTO user_data
  FROM users
  WHERE uuid = NEW.user_uuid;
  
  -- Populate metadata if not already set
  IF generation_data IS NOT NULL THEN
    NEW.style := COALESCE(NEW.style, generation_data.style);
    NEW.pose := COALESCE(NEW.pose, generation_data.pose);
    NEW.enhanced_prompt := COALESCE(NEW.enhanced_prompt, generation_data.enhanced_prompt);
  END IF;
  
  -- Populate creator metadata
  IF user_data IS NOT NULL THEN
    NEW.creator_username := COALESCE(NEW.creator_username, user_data.nickname);
    NEW.creator_avatar := COALESCE(NEW.creator_avatar, user_data.avatar_url);
  END IF;
  
  -- Set timestamps
  NEW.created_at := COALESCE(NEW.created_at, NOW());
  NEW.updated_at := COALESCE(NEW.updated_at, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for gallery item metadata population
CREATE TRIGGER populate_gallery_metadata_on_insert
  BEFORE INSERT ON character_gallery
  FOR EACH ROW
  EXECUTE FUNCTION populate_gallery_metadata();

-- =============================================
-- TEMPLATE USAGE ANALYTICS TRIGGER
-- =============================================

-- Function to track template usage success/failure
CREATE OR REPLACE FUNCTION track_template_usage()
RETURNS TRIGGER AS $$
DECLARE
  template_uuid VARCHAR;
  is_successful BOOLEAN;
BEGIN
  -- Only process for new generations from templates
  IF TG_OP = 'INSERT' AND NEW.generation_params IS NOT NULL THEN
    -- Extract template UUID from generation params if exists
    template_uuid := (NEW.generation_params::jsonb ->> 'template_id');
    
    -- Determine if generation was successful
    is_successful := (NEW.generated_images IS NOT NULL AND NEW.generated_images != '');
    
    -- Update template usage if template was used
    IF template_uuid IS NOT NULL THEN
      PERFORM record_template_usage(template_uuid, is_successful);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for template usage tracking
CREATE TRIGGER track_template_usage_on_generation
  AFTER INSERT ON character_generations
  FOR EACH ROW
  EXECUTE FUNCTION track_template_usage();

-- =============================================
-- SYSTEM CONFIG CACHE INVALIDATION TRIGGER
-- =============================================

-- Function to notify application about config changes
CREATE OR REPLACE FUNCTION notify_config_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification for config cache invalidation
  PERFORM pg_notify('config_changed', json_build_object(
    'config_key', COALESCE(NEW.config_key, OLD.config_key),
    'operation', TG_OP,
    'timestamp', extract(epoch from now())
  )::text);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers for system config changes
CREATE TRIGGER notify_config_change_on_insert
  AFTER INSERT ON system_configs
  FOR EACH ROW
  EXECUTE FUNCTION notify_config_change();

CREATE TRIGGER notify_config_change_on_update
  AFTER UPDATE ON system_configs
  FOR EACH ROW
  EXECUTE FUNCTION notify_config_change();

CREATE TRIGGER notify_config_change_on_delete
  AFTER DELETE ON system_configs
  FOR EACH ROW
  EXECUTE FUNCTION notify_config_change();

-- =============================================
-- DATA INTEGRITY TRIGGERS
-- =============================================

-- Function to prevent deletion of referenced gallery items
CREATE OR REPLACE FUNCTION prevent_generation_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if generation is referenced in gallery
  IF EXISTS (
    SELECT 1 FROM character_gallery 
    WHERE generation_id = OLD.uuid
  ) THEN
    RAISE EXCEPTION 'Cannot delete generation that is referenced in gallery. Use soft delete instead.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent hard deletion of referenced generations
CREATE TRIGGER prevent_generation_hard_delete_trigger
  BEFORE DELETE ON character_generations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_generation_hard_delete();

-- =============================================
-- AUDIT TRAIL TRIGGERS
-- =============================================

-- Function to log important changes
CREATE OR REPLACE FUNCTION log_important_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log subscription status changes
  IF TG_TABLE_NAME = 'subscriptions' AND TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO visitor_logs (
        visitor_id,
        user_uuid,
        session_id,
        visited_at,
        page_url,
        user_agent
      ) VALUES (
        'system',
        NEW.user_uuid,
        'audit',
        NOW(),
        'subscription_status_change',
        json_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'subscription_id', NEW.id
        )::text
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit logging
CREATE TRIGGER log_subscription_changes
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_important_changes();

-- =============================================
-- PERFORMANCE OPTIMIZATION TRIGGERS
-- =============================================

-- Function to maintain view count accuracy without constant updates
CREATE OR REPLACE FUNCTION batch_update_view_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update view counts in batches to reduce write load
  -- Views are tracked in interactions table and synced periodically
  IF NEW.interaction_type = 'view' THEN
    -- Update view count only every 10 views to reduce database load
    IF (
      SELECT COUNT(*) FROM gallery_interactions 
      WHERE gallery_item_id = NEW.gallery_item_id 
      AND interaction_type = 'view'
    ) % 10 = 0 THEN
      UPDATE character_gallery
      SET 
        views_count = (
          SELECT COUNT(DISTINCT user_uuid) 
          FROM gallery_interactions 
          WHERE gallery_item_id = NEW.gallery_item_id 
          AND interaction_type = 'view'
        ),
        updated_at = NOW()
      WHERE uuid = NEW.gallery_item_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for batch view count updates
CREATE TRIGGER batch_update_view_counts_trigger
  AFTER INSERT ON gallery_interactions
  FOR EACH ROW
  WHEN (NEW.interaction_type = 'view')
  EXECUTE FUNCTION batch_update_view_counts();

-- =============================================
-- CLEANUP TRIGGERS
-- =============================================

-- Function to clean up old interaction records
CREATE OR REPLACE FUNCTION cleanup_old_interactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up old view records (keep only last 1000 per item)
  DELETE FROM gallery_interactions
  WHERE gallery_item_id = NEW.gallery_item_id
  AND interaction_type = 'view'
  AND id NOT IN (
    SELECT id FROM gallery_interactions
    WHERE gallery_item_id = NEW.gallery_item_id
    AND interaction_type = 'view'
    ORDER BY created_at DESC
    LIMIT 1000
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for periodic cleanup (runs on every 100th view)
CREATE TRIGGER cleanup_old_interactions_trigger
  AFTER INSERT ON gallery_interactions
  FOR EACH ROW
  WHEN (NEW.interaction_type = 'view' AND (random() < 0.01))
  EXECUTE FUNCTION cleanup_old_interactions();