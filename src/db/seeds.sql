-- Seed Data for Character Figure AI Generator Testing
-- Purpose: Provide test data for development and testing
-- Author: Database Testing Expert  
-- Date: 2025-08-28

-- =============================================
-- SYSTEM CONFIGURATIONS
-- =============================================

INSERT INTO system_configs (config_key, config_value, description, is_active) VALUES
('character_generation_enabled', 'true', 'Enable/disable character generation feature', true),
('max_generations_per_user_per_hour', '10', 'Maximum generations per user per hour (rate limiting)', true),
('default_image_quality', 'standard', 'Default image quality setting', true),
('supported_aspect_ratios', '["1:1", "16:9", "9:16", "4:3", "3:4"]', 'Supported aspect ratios for generation', true),
('gallery_approval_required', 'false', 'Whether gallery items need admin approval', true),
('featured_gallery_rotation_hours', '24', 'How often to rotate featured gallery items (hours)', true),
('max_gallery_items_per_user', '100', 'Maximum gallery items per user', true),
('cleanup_old_generations_days', '90', 'Delete soft-deleted generations after N days', true),
('trending_calculation_window_days', '7', 'Window for trending calculations (days)', true),
('min_likes_for_trending', '5', 'Minimum likes required for trending consideration', true),
('cache_ttl_seconds', '300', 'Default cache TTL in seconds', true),
('maintenance_mode', 'false', 'Enable maintenance mode', true)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- =============================================
-- SUBSCRIPTION PLANS
-- =============================================

INSERT INTO subscription_plans (
  plan_id, plan_name, description,
  monthly_price, yearly_price, currency,
  monthly_generation_limit, daily_generation_limit,
  priority_queue, generation_speed,
  support_level, api_access, custom_models,
  is_active, is_featured
) VALUES
('free', 'Free Plan', 'Basic character generation with limited features', 
 0, 0, 'USD',
 10, 3,
 false, 'normal',
 'basic', false, false,
 true, false),

('basic', 'Basic Plan', 'Enhanced character generation with more styles and options',
 999, 9990, 'USD', 
 100, 20,
 false, 'normal',
 'basic', false, false,
 true, false),

('pro', 'Pro Plan', 'Professional character generation with priority processing',
 2999, 29990, 'USD',
 500, 50,
 true, 'fast',
 'priority', true, true,
 true, true),

('enterprise', 'Enterprise Plan', 'Unlimited character generation with dedicated support',
 9999, 99990, 'USD',
 NULL, NULL,
 true, 'fast',
 'dedicated', true, true,
 true, false)
ON CONFLICT (plan_id) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  updated_at = NOW();

-- =============================================
-- CHARACTER GENERATION TEMPLATES
-- =============================================

INSERT INTO character_templates (
  uuid, name, description, category, preview_image_url,
  template_params, usage_count, success_rate,
  is_active, is_featured, is_free, sort_order
) VALUES
(gen_random_uuid()::text, 'Anime Hero', 'Classic anime-style hero character', 'Anime',
 '/imgs/templates/anime-hero-preview.jpg',
 '{"style": "anime", "pose": "dynamic", "gender": "male", "age": "young_adult", "clothing": "hero costume", "background": "dramatic sky", "quality": "high"}',
 0, 100, true, true, true, 1),

(gen_random_uuid()::text, 'Fantasy Warrior', 'Medieval fantasy warrior with armor and sword', 'Fantasy',
 '/imgs/templates/fantasy-warrior-preview.jpg',
 '{"style": "fantasy", "pose": "battle_stance", "gender": "female", "age": "adult", "clothing": "plate armor", "background": "castle courtyard", "quality": "high"}',
 0, 100, true, true, true, 2),

(gen_random_uuid()::text, 'Cyberpunk Hacker', 'Futuristic cyberpunk character with tech gear', 'Sci-Fi',
 '/imgs/templates/cyberpunk-hacker-preview.jpg',
 '{"style": "cyberpunk", "pose": "sitting", "gender": "non_binary", "age": "young_adult", "clothing": "tech wear", "background": "neon city", "quality": "high"}',
 0, 100, true, true, true, 3),

(gen_random_uuid()::text, 'Cute Chibi', 'Adorable chibi-style character perfect for beginners', 'Cute',
 '/imgs/templates/cute-chibi-preview.jpg',
 '{"style": "chibi", "pose": "happy", "gender": "female", "age": "child", "clothing": "school uniform", "background": "pastel colors", "quality": "standard"}',
 0, 100, true, false, true, 4),

(gen_random_uuid()::text, 'Realistic Portrait', 'High-quality realistic character portrait', 'Realistic',
 '/imgs/templates/realistic-portrait-preview.jpg',
 '{"style": "realistic", "pose": "portrait", "gender": "male", "age": "middle_aged", "clothing": "casual", "background": "studio", "quality": "ultra"}',
 0, 100, true, false, false, 5),

(gen_random_uuid()::text, 'Magical Girl', 'Magical girl transformation scene', 'Anime',
 '/imgs/templates/magical-girl-preview.jpg',
 '{"style": "anime", "pose": "transformation", "gender": "female", "age": "teenager", "clothing": "magical outfit", "background": "sparkles", "quality": "high"}',
 0, 100, true, true, true, 6),

(gen_random_uuid()::text, 'Steampunk Inventor', 'Victorian-era steampunk character with gadgets', 'Steampunk',
 '/imgs/templates/steampunk-inventor-preview.jpg',
 '{"style": "steampunk", "pose": "working", "gender": "male", "age": "adult", "clothing": "victorian coat", "background": "workshop", "quality": "high"}',
 0, 100, true, false, true, 7),

(gen_random_uuid()::text, 'Space Explorer', 'Futuristic space explorer in suit', 'Sci-Fi',
 '/imgs/templates/space-explorer-preview.jpg',
 '{"style": "sci_fi", "pose": "exploring", "gender": "female", "age": "adult", "clothing": "space suit", "background": "alien planet", "quality": "high"}',
 0, 100, true, false, true, 8);

-- =============================================
-- SAMPLE USER DATA (for testing)
-- =============================================
-- Note: This assumes you have test users in your users table
-- You may need to adjust UUIDs based on your actual test users

-- Sample character generations (replace UUIDs with actual test user UUIDs)
DO $$
DECLARE
  test_user_uuid VARCHAR := (SELECT uuid FROM users LIMIT 1);
BEGIN
  IF test_user_uuid IS NOT NULL THEN
    INSERT INTO character_generations (
      uuid, user_uuid, original_prompt, enhanced_prompt,
      style, pose, gender, age, generated_images, generation_time,
      credits_used, is_favorited, created_at
    ) VALUES
    (gen_random_uuid()::text, test_user_uuid,
     'A brave knight in shining armor',
     'A brave knight in shining silver armor, standing heroically with a sword, medieval fantasy style, detailed armor, dramatic lighting',
     'fantasy', 'heroic', 'male', 'adult',
     '[{"url": "/imgs/generated/sample1.jpg", "width": 512, "height": 512}]',
     3500, 10, false, NOW() - INTERVAL '2 days'),
    
    (gen_random_uuid()::text, test_user_uuid,
     'Cute anime girl with blue hair',
     'Cute anime girl with long blue hair, big eyes, school uniform, kawaii style, soft lighting, detailed face',
     'anime', 'cute', 'female', 'teenager',
     '[{"url": "/imgs/generated/sample2.jpg", "width": 512, "height": 512}]',
     2800, 10, true, NOW() - INTERVAL '1 day'),
    
    (gen_random_uuid()::text, test_user_uuid,
     'Cyberpunk warrior with neon lights',
     'Cyberpunk warrior with glowing neon implants, futuristic armor, city background with neon lights, dark atmosphere',
     'cyberpunk', 'action', 'female', 'adult',
     '[{"url": "/imgs/generated/sample3.jpg", "width": 512, "height": 512}]',
     4200, 15, true, NOW() - INTERVAL '3 hours');
  END IF;
END $$;

-- Sample gallery items
DO $$
DECLARE
  test_user_uuid VARCHAR := (SELECT uuid FROM users LIMIT 1);
  test_generation_uuid VARCHAR;
  test_user_nickname VARCHAR := (SELECT nickname FROM users LIMIT 1);
BEGIN
  IF test_user_uuid IS NOT NULL THEN
    -- Get a sample generation ID
    SELECT uuid INTO test_generation_uuid 
    FROM character_generations 
    WHERE user_uuid = test_user_uuid 
    LIMIT 1;
    
    IF test_generation_uuid IS NOT NULL THEN
      INSERT INTO character_gallery (
        uuid, generation_id, user_uuid, title, description,
        image_url, thumbnail_url, style, pose, enhanced_prompt,
        likes_count, views_count, creator_username, is_public, is_approved
      ) VALUES
      (gen_random_uuid()::text, test_generation_uuid, test_user_uuid,
       'Epic Fantasy Knight',
       'A majestic knight in shining armor, perfect for fantasy campaigns or storytelling',
       '/imgs/generated/sample1.jpg', '/imgs/generated/sample1_thumb.jpg',
       'fantasy', 'heroic',
       'A brave knight in shining silver armor, standing heroically with a sword, medieval fantasy style',
       5, 23, COALESCE(test_user_nickname, 'TestUser'), true, true);
    END IF;
  END IF;
END $$;

-- Sample gallery interactions
DO $$
DECLARE
  test_user_uuid VARCHAR := (SELECT uuid FROM users LIMIT 1);
  test_gallery_uuid VARCHAR;
BEGIN
  IF test_user_uuid IS NOT NULL THEN
    SELECT uuid INTO test_gallery_uuid FROM character_gallery LIMIT 1;
    
    IF test_gallery_uuid IS NOT NULL THEN
      INSERT INTO gallery_interactions (
        user_uuid, gallery_item_id, interaction_type, is_active
      ) VALUES
      (test_user_uuid, test_gallery_uuid, 'like', true),
      (test_user_uuid, test_gallery_uuid, 'view', true),
      (test_user_uuid, test_gallery_uuid, 'bookmark', true);
    END IF;
  END IF;
END $$;

-- Sample user preferences
DO $$
DECLARE
  test_user_uuid VARCHAR := (SELECT uuid FROM users LIMIT 1);
BEGIN
  IF test_user_uuid IS NOT NULL THEN
    INSERT INTO user_preferences (
      user_uuid, default_style, default_pose, default_quality,
      favorite_styles, favorite_poses,
      auto_save_to_gallery, notify_on_generation_complete
    ) VALUES
    (test_user_uuid, 'anime', 'cute', 'high',
     '[{"style": "anime", "count": 5}, {"style": "fantasy", "count": 3}]',
     '[{"pose": "cute", "count": 4}, {"pose": "heroic", "count": 2}]',
     false, true)
    ON CONFLICT (user_uuid) DO NOTHING;
  END IF;
END $$;

-- Sample subscription (free tier)
DO $$
DECLARE
  test_user_uuid VARCHAR := (SELECT uuid FROM users LIMIT 1);
  test_user_email VARCHAR := (SELECT email FROM users LIMIT 1);
BEGIN
  IF test_user_uuid IS NOT NULL THEN
    INSERT INTO subscriptions (
      user_uuid, user_email, plan_id, plan_name, status,
      interval, price, started_at, current_period_start, current_period_end,
      monthly_limit, used_this_month
    ) VALUES
    (test_user_uuid, test_user_email, 'free', 'Free Plan', 'active',
     'monthly', 0, NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month',
     10, 3)
    ON CONFLICT (user_uuid) DO UPDATE SET
      status = 'active',
      current_period_end = NOW() + INTERVAL '1 month';
  END IF;
END $$;

-- =============================================
-- ANALYTICS SAMPLE DATA
-- =============================================

-- Generate some historical data for analytics testing
DO $$
DECLARE
  i INTEGER;
  test_user_uuid VARCHAR;
  styles VARCHAR[] := ARRAY['anime', 'fantasy', 'realistic', 'cyberpunk', 'chibi'];
  poses VARCHAR[] := ARRAY['portrait', 'action', 'cute', 'heroic', 'dramatic'];
  random_style VARCHAR;
  random_pose VARCHAR;
BEGIN
  SELECT uuid INTO test_user_uuid FROM users LIMIT 1;
  
  IF test_user_uuid IS NOT NULL THEN
    -- Generate 50 historical generations over the past 30 days
    FOR i IN 1..50 LOOP
      random_style := styles[1 + (random() * (array_length(styles, 1) - 1))::INTEGER];
      random_pose := poses[1 + (random() * (array_length(poses, 1) - 1))::INTEGER];
      
      INSERT INTO character_generations (
        uuid, user_uuid, original_prompt, style, pose, gender, age,
        generated_images, generation_time, credits_used,
        created_at
      ) VALUES (
        gen_random_uuid()::text, test_user_uuid,
        'Historical test generation prompt ' || i,
        random_style, random_pose, 'female', 'adult',
        '[{"url": "/imgs/generated/historical' || i || '.jpg"}]',
        2000 + (random() * 3000)::INTEGER,
        10 + (random() * 10)::INTEGER,
        NOW() - (random() * INTERVAL '30 days')
      );
    END LOOP;
  END IF;
END $$;

-- =============================================
-- PERFORMANCE TEST DATA
-- =============================================

-- Create additional test data for performance testing (commented out by default)
-- Uncomment and run when you need to test with larger datasets

/*
-- Generate 1000 character generations for performance testing
DO $$
DECLARE
  i INTEGER;
  test_user_uuid VARCHAR := (SELECT uuid FROM users LIMIT 1);
BEGIN
  IF test_user_uuid IS NOT NULL THEN
    FOR i IN 1..1000 LOOP
      INSERT INTO character_generations (
        uuid, user_uuid, original_prompt, style, pose, gender, age,
        generated_images, generation_time, credits_used, created_at
      ) VALUES (
        gen_random_uuid()::text, test_user_uuid,
        'Performance test generation ' || i,
        (ARRAY['anime', 'fantasy', 'realistic'])[1 + (random() * 2)::INTEGER],
        (ARRAY['portrait', 'action', 'cute'])[1 + (random() * 2)::INTEGER],
        (ARRAY['male', 'female'])[1 + (random() * 1)::INTEGER],
        (ARRAY['child', 'teenager', 'adult'])[1 + (random() * 2)::INTEGER],
        '[{"url": "/imgs/generated/perf' || i || '.jpg"}]',
        1000 + (random() * 5000)::INTEGER,
        5 + (random() * 15)::INTEGER,
        NOW() - (random() * INTERVAL '90 days')
      );
      
      -- Add some to gallery (10% chance)
      IF random() < 0.1 THEN
        INSERT INTO character_gallery (
          uuid, generation_id, user_uuid, title,
          image_url, style, pose, creator_username,
          likes_count, views_count, is_public, is_approved
        ) VALUES (
          gen_random_uuid()::text, 
          (SELECT uuid FROM character_generations ORDER BY id DESC LIMIT 1),
          test_user_uuid,
          'Performance Test Item ' || i,
          '/imgs/generated/perf' || i || '.jpg',
          (ARRAY['anime', 'fantasy', 'realistic'])[1 + (random() * 2)::INTEGER],
          (ARRAY['portrait', 'action', 'cute'])[1 + (random() * 2)::INTEGER],
          'TestUser',
          (random() * 100)::INTEGER,
          (random() * 500)::INTEGER,
          true, true
        );
      END IF;
    END LOOP;
  END IF;
END $$;
*/

-- =============================================
-- DATA CONSISTENCY CHECKS
-- =============================================

-- Verify seed data was inserted correctly
DO $$
DECLARE
  config_count INTEGER;
  plan_count INTEGER;
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO config_count FROM system_configs WHERE is_active = true;
  SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE is_active = true;
  SELECT COUNT(*) INTO template_count FROM character_templates WHERE is_active = true;
  
  RAISE NOTICE 'Seed data summary:';
  RAISE NOTICE '- System configs: %', config_count;
  RAISE NOTICE '- Subscription plans: %', plan_count;
  RAISE NOTICE '- Character templates: %', template_count;
  
  IF config_count = 0 OR plan_count = 0 OR template_count = 0 THEN
    RAISE WARNING 'Some seed data may not have been inserted correctly';
  END IF;
END $$;