-- Row Level Security Policies for Character Figure AI Generator
-- Purpose: Secure data access with granular permissions in Supabase
-- Author: Database Security Expert
-- Date: 2025-08-28

-- =============================================
-- ENABLE RLS ON ALL CHARACTER FIGURE TABLES
-- =============================================

ALTER TABLE "character_generations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "character_gallery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gallery_interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "character_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "system_configs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscription_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscription_usage" ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CHARACTER GENERATIONS POLICIES
-- =============================================

-- Users can view their own generation history
CREATE POLICY "Users can view their own character generations"
ON "character_generations" FOR SELECT
TO authenticated
USING (auth.uid()::text = user_uuid);

-- Users can create their own generation records
CREATE POLICY "Users can create their own character generations"
ON "character_generations" FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_uuid);

-- Users can update their own generation records (for favoriting, etc.)
CREATE POLICY "Users can update their own character generations"
ON "character_generations" FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_uuid)
WITH CHECK (auth.uid()::text = user_uuid);

-- Users can soft-delete their own generations
CREATE POLICY "Users can delete their own character generations"
ON "character_generations" FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_uuid AND is_deleted = false)
WITH CHECK (auth.uid()::text = user_uuid);

-- Admin policy for character generations
CREATE POLICY "Admin full access to character generations"
ON "character_generations" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE uuid = auth.uid()::text 
    AND email IN ('admin@nano-banana.com', 'support@nano-banana.com')
  )
);

-- =============================================
-- CHARACTER GALLERY POLICIES
-- =============================================

-- Anyone can view public, approved gallery items
CREATE POLICY "Public can view approved gallery items"
ON "character_gallery" FOR SELECT
TO public
USING (is_public = true AND is_approved = true);

-- Authenticated users can view all public gallery items (including pending approval)
CREATE POLICY "Authenticated users can view public gallery items"
ON "character_gallery" FOR SELECT
TO authenticated
USING (is_public = true OR auth.uid()::text = user_uuid);

-- Users can create gallery items from their own generations
CREATE POLICY "Users can create gallery items"
ON "character_gallery" FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_uuid AND
  EXISTS (
    SELECT 1 FROM character_generations 
    WHERE uuid = generation_id AND user_uuid = auth.uid()::text
  )
);

-- Users can update their own gallery items
CREATE POLICY "Users can update their own gallery items"
ON "character_gallery" FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_uuid)
WITH CHECK (auth.uid()::text = user_uuid);

-- Users can delete their own gallery items
CREATE POLICY "Users can delete their own gallery items"
ON "character_gallery" FOR DELETE
TO authenticated
USING (auth.uid()::text = user_uuid);

-- Admin policy for gallery moderation
CREATE POLICY "Admin full access to gallery"
ON "character_gallery" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE uuid = auth.uid()::text 
    AND email IN ('admin@nano-banana.com', 'support@nano-banana.com')
  )
);

-- =============================================
-- GALLERY INTERACTIONS POLICIES
-- =============================================

-- Users can view interactions on public gallery items
CREATE POLICY "Users can view interactions on public items"
ON "gallery_interactions" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM character_gallery 
    WHERE uuid = gallery_item_id AND (is_public = true OR user_uuid = auth.uid()::text)
  )
);

-- Users can create interactions (like, bookmark, etc.)
CREATE POLICY "Users can create interactions"
ON "gallery_interactions" FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_uuid AND
  EXISTS (
    SELECT 1 FROM character_gallery 
    WHERE uuid = gallery_item_id AND is_public = true AND is_approved = true
  )
);

-- Users can update their own interactions
CREATE POLICY "Users can update their own interactions"
ON "gallery_interactions" FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_uuid)
WITH CHECK (auth.uid()::text = user_uuid);

-- Users can delete their own interactions
CREATE POLICY "Users can delete their own interactions"
ON "gallery_interactions" FOR DELETE
TO authenticated
USING (auth.uid()::text = user_uuid);

-- =============================================
-- CHARACTER TEMPLATES POLICIES
-- =============================================

-- Everyone can view active templates
CREATE POLICY "Public can view active templates"
ON "character_templates" FOR SELECT
TO public
USING (is_active = true);

-- Admin policy for template management
CREATE POLICY "Admin full access to templates"
ON "character_templates" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE uuid = auth.uid()::text 
    AND email IN ('admin@nano-banana.com', 'support@nano-banana.com')
  )
);

-- =============================================
-- SYSTEM CONFIGS POLICIES
-- =============================================

-- Everyone can read active system configs
CREATE POLICY "Public can read active system configs"
ON "system_configs" FOR SELECT
TO public
USING (is_active = true);

-- Admin policy for system config management
CREATE POLICY "Admin full access to system configs"
ON "system_configs" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE uuid = auth.uid()::text 
    AND email IN ('admin@nano-banana.com', 'support@nano-banana.com')
  )
);

-- =============================================
-- USER PREFERENCES POLICIES
-- =============================================

-- Users can view and manage their own preferences
CREATE POLICY "Users can manage their own preferences"
ON "user_preferences" FOR ALL
TO authenticated
USING (auth.uid()::text = user_uuid)
WITH CHECK (auth.uid()::text = user_uuid);

-- =============================================
-- SUBSCRIPTION PLANS POLICIES
-- =============================================

-- Everyone can view active subscription plans
CREATE POLICY "Public can view active subscription plans"
ON "subscription_plans" FOR SELECT
TO public
USING (is_active = true);

-- Admin policy for subscription plan management
CREATE POLICY "Admin full access to subscription plans"
ON "subscription_plans" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE uuid = auth.uid()::text 
    AND email IN ('admin@nano-banana.com', 'support@nano-banana.com')
  )
);

-- =============================================
-- SUBSCRIPTIONS POLICIES
-- =============================================

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON "subscriptions" FOR SELECT
TO authenticated
USING (auth.uid()::text = user_uuid);

-- Users can create their own subscription (handled by Stripe webhook)
CREATE POLICY "Users can create their own subscription"
ON "subscriptions" FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_uuid);

-- Users can update their own subscription (for plan changes)
CREATE POLICY "Users can update their own subscription"
ON "subscriptions" FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_uuid)
WITH CHECK (auth.uid()::text = user_uuid);

-- Admin policy for subscription management
CREATE POLICY "Admin full access to subscriptions"
ON "subscriptions" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE uuid = auth.uid()::text 
    AND email IN ('admin@nano-banana.com', 'support@nano-banana.com')
  )
);

-- =============================================
-- SUBSCRIPTION USAGE POLICIES
-- =============================================

-- Users can view their own usage history
CREATE POLICY "Users can view their own usage"
ON "subscription_usage" FOR SELECT
TO authenticated
USING (auth.uid()::text = user_uuid);

-- System can create usage records
CREATE POLICY "System can create usage records"
ON "subscription_usage" FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_uuid);

-- Admin policy for usage analytics
CREATE POLICY "Admin full access to usage"
ON "subscription_usage" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE uuid = auth.uid()::text 
    AND email IN ('admin@nano-banana.com', 'support@nano-banana.com')
  )
);

-- =============================================
-- SECURITY FUNCTIONS
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE uuid = user_uuid 
    AND email IN ('admin@nano-banana.com', 'support@nano-banana.com')
  );
END;
$$;

-- Function to check if gallery item is accessible
CREATE OR REPLACE FUNCTION can_access_gallery_item(item_uuid text, user_uuid text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM character_gallery 
    WHERE uuid = item_uuid 
    AND (
      (is_public = true AND is_approved = true) OR 
      character_gallery.user_uuid = user_uuid OR 
      is_admin(user_uuid)
    )
  );
END;
$$;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(user_uuid text, usage_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_subscription RECORD;
  monthly_usage INTEGER;
BEGIN
  -- Get user's active subscription
  SELECT * INTO user_subscription
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.plan_id
  WHERE s.user_uuid = user_uuid
  AND s.status = 'active'
  AND s.current_period_end > NOW();
  
  -- If no active subscription, deny
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If unlimited (NULL limit), allow
  IF user_subscription.monthly_generation_limit IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check monthly usage
  SELECT COALESCE(SUM(count), 0) INTO monthly_usage
  FROM subscription_usage
  WHERE subscription_usage.user_uuid = user_uuid
  AND usage_type = usage_type
  AND created_at >= DATE_TRUNC('month', NOW());
  
  -- Check if under limit
  RETURN monthly_usage < user_subscription.monthly_generation_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_gallery_item(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_subscription_limit(text, text) TO authenticated;