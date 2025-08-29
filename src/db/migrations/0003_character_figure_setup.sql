-- Character Figure AI Generator Database Setup
-- Migration: 0003_character_figure_setup
-- Purpose: Create all Character Figure related tables with optimized indexes and constraints
-- Author: Database Optimization Expert
-- Date: 2025-08-28

-- =============================================
-- CHARACTER GENERATIONS TABLE
-- =============================================
-- Stores all character generation history with complete metadata
CREATE TABLE "character_generations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "character_generations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uuid" varchar(255) NOT NULL UNIQUE,
	"user_uuid" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW(),
	
	-- Generation parameters
	"original_prompt" text NOT NULL,
	"enhanced_prompt" text,
	"style" varchar(50) NOT NULL,
	"pose" varchar(50) NOT NULL,
	"gender" varchar(20) NOT NULL,
	"age" varchar(20) NOT NULL,
	
	-- Optional parameters
	"style_keywords" text,
	"clothing" text,
	"background" text,
	"color_palette" varchar(100),
	"aspect_ratio" varchar(10) NOT NULL DEFAULT '1:1',
	"quality" varchar(20) NOT NULL DEFAULT 'standard',
	"num_images" integer NOT NULL DEFAULT 1,
	"seed" integer,
	
	-- Generation results
	"generated_images" text,
	"generation_time" integer NOT NULL,
	"credits_used" integer NOT NULL,
	
	-- nano-banana API integration
	"nano_banana_request_id" varchar(255),
	"nano_banana_response" text,
	
	-- User operations
	"is_favorited" boolean NOT NULL DEFAULT false,
	"is_deleted" boolean NOT NULL DEFAULT false,
	"gallery_item_id" varchar(255),
	
	-- Technical metadata
	"client_info" text,
	"generation_params" text
);

-- Performance indexes for character_generations
CREATE INDEX "idx_character_generations_user_uuid" ON "character_generations" ("user_uuid");
CREATE INDEX "idx_character_generations_created_at" ON "character_generations" ("created_at" DESC);
CREATE INDEX "idx_character_generations_style" ON "character_generations" ("style");
CREATE INDEX "idx_character_generations_user_created" ON "character_generations" ("user_uuid", "created_at" DESC);
CREATE INDEX "idx_character_generations_favorited" ON "character_generations" ("user_uuid", "is_favorited") WHERE "is_favorited" = true;
CREATE INDEX "idx_character_generations_not_deleted" ON "character_generations" ("user_uuid", "created_at" DESC) WHERE "is_deleted" = false;

-- =============================================
-- CHARACTER GALLERY TABLE
-- =============================================
-- Public showcase of character creations with social features
CREATE TABLE "character_gallery" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "character_gallery_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uuid" varchar(255) NOT NULL UNIQUE,
	"generation_id" varchar(255) NOT NULL,
	"user_uuid" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW(),
	
	-- Display information
	"title" varchar(255) NOT NULL,
	"description" text,
	"tags" text,
	
	-- Image information
	"image_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"image_width" integer,
	"image_height" integer,
	
	-- Character metadata (denormalized for performance)
	"style" varchar(50) NOT NULL,
	"pose" varchar(50) NOT NULL,
	"enhanced_prompt" text,
	
	-- Social metrics
	"likes_count" integer NOT NULL DEFAULT 0,
	"views_count" integer NOT NULL DEFAULT 0,
	"bookmarks_count" integer NOT NULL DEFAULT 0,
	"comments_count" integer NOT NULL DEFAULT 0,
	
	-- Status management
	"is_public" boolean NOT NULL DEFAULT true,
	"is_featured" boolean NOT NULL DEFAULT false,
	"is_reported" boolean NOT NULL DEFAULT false,
	"is_approved" boolean NOT NULL DEFAULT true,
	
	-- Creator metadata (denormalized)
	"creator_username" varchar(255),
	"creator_avatar" varchar(255),
	
	"updated_at" timestamp with time zone DEFAULT NOW()
);

-- Performance indexes for character_gallery
CREATE INDEX "idx_character_gallery_public" ON "character_gallery" ("is_public", "is_approved", "created_at" DESC) WHERE "is_public" = true AND "is_approved" = true;
CREATE INDEX "idx_character_gallery_featured" ON "character_gallery" ("is_featured", "created_at" DESC) WHERE "is_featured" = true;
CREATE INDEX "idx_character_gallery_style" ON "character_gallery" ("style", "created_at" DESC) WHERE "is_public" = true;
CREATE INDEX "idx_character_gallery_user" ON "character_gallery" ("user_uuid", "created_at" DESC);
CREATE INDEX "idx_character_gallery_trending" ON "character_gallery" ("likes_count" DESC, "views_count" DESC, "created_at" DESC) WHERE "is_public" = true;
CREATE INDEX "idx_character_gallery_generation_id" ON "character_gallery" ("generation_id");

-- GIN index for tag search
CREATE INDEX "idx_character_gallery_tags_gin" ON "character_gallery" USING GIN (("tags"::jsonb)) WHERE "is_public" = true;

-- =============================================
-- GALLERY INTERACTIONS TABLE
-- =============================================
-- Track user interactions with gallery items
CREATE TABLE "gallery_interactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gallery_interactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_uuid" varchar(255) NOT NULL,
	"gallery_item_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW(),
	
	-- Interaction details
	"interaction_type" varchar(20) NOT NULL,
	"is_active" boolean NOT NULL DEFAULT true,
	"metadata" text,
	
	"updated_at" timestamp with time zone DEFAULT NOW()
);

-- Unique constraint and performance indexes
CREATE UNIQUE INDEX "user_gallery_interaction_unique" ON "gallery_interactions" ("user_uuid", "gallery_item_id", "interaction_type", "is_active") WHERE "is_active" = true;
CREATE INDEX "idx_gallery_interactions_gallery_item" ON "gallery_interactions" ("gallery_item_id", "interaction_type", "is_active");
CREATE INDEX "idx_gallery_interactions_user" ON "gallery_interactions" ("user_uuid", "created_at" DESC);

-- =============================================
-- CHARACTER TEMPLATES TABLE
-- =============================================
-- Predefined templates for quick character generation
CREATE TABLE "character_templates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "character_templates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uuid" varchar(255) NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT NOW(),
	
	-- Template information
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"preview_image_url" varchar(500),
	
	-- Template parameters (JSON)
	"template_params" text NOT NULL,
	
	-- Usage statistics
	"usage_count" integer NOT NULL DEFAULT 0,
	"success_rate" integer NOT NULL DEFAULT 100,
	
	-- Status management
	"is_active" boolean NOT NULL DEFAULT true,
	"is_featured" boolean NOT NULL DEFAULT false,
	"is_free" boolean NOT NULL DEFAULT true,
	
	-- Sorting
	"sort_order" integer NOT NULL DEFAULT 0,
	
	"updated_at" timestamp with time zone DEFAULT NOW()
);

-- Performance indexes for character_templates
CREATE INDEX "idx_character_templates_active" ON "character_templates" ("is_active", "sort_order", "created_at" DESC) WHERE "is_active" = true;
CREATE INDEX "idx_character_templates_category" ON "character_templates" ("category", "sort_order") WHERE "is_active" = true;
CREATE INDEX "idx_character_templates_featured" ON "character_templates" ("is_featured", "sort_order") WHERE "is_featured" = true;
CREATE INDEX "idx_character_templates_usage" ON "character_templates" ("usage_count" DESC, "success_rate" DESC);

-- =============================================
-- SYSTEM CONFIGS TABLE
-- =============================================
-- Dynamic system configuration for Character Figure
CREATE TABLE "system_configs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_configs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"config_key" varchar(100) NOT NULL UNIQUE,
	"config_value" text,
	"description" varchar(500),
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp with time zone DEFAULT NOW(),
	"updated_at" timestamp with time zone DEFAULT NOW()
);

-- Performance index for system_configs
CREATE INDEX "idx_system_configs_active" ON "system_configs" ("is_active", "config_key") WHERE "is_active" = true;

-- =============================================
-- USER PREFERENCES TABLE
-- =============================================
-- User preferences for character generation
CREATE TABLE "user_preferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_preferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_uuid" varchar(255) NOT NULL UNIQUE,
	
	-- Default generation preferences
	"default_style" varchar(50),
	"default_pose" varchar(50),
	"default_quality" varchar(20),
	"default_aspect_ratio" varchar(10),
	
	-- Preference statistics (JSON arrays)
	"favorite_styles" text,
	"favorite_poses" text,
	
	-- Personalization settings
	"auto_save_to_gallery" boolean NOT NULL DEFAULT false,
	"auto_make_public" boolean NOT NULL DEFAULT false,
	
	-- Notification settings
	"notify_on_generation_complete" boolean NOT NULL DEFAULT true,
	"notify_on_gallery_interaction" boolean NOT NULL DEFAULT true,
	
	-- Display preferences
	"display_order" integer NOT NULL DEFAULT 0,
	
	"created_at" timestamp with time zone DEFAULT NOW(),
	"updated_at" timestamp with time zone DEFAULT NOW()
);

-- Performance index for user_preferences
CREATE INDEX "idx_user_preferences_user_uuid" ON "user_preferences" ("user_uuid");

-- =============================================
-- SUBSCRIPTION TABLES
-- =============================================
-- Subscription plans table
CREATE TABLE "subscription_plans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscription_plans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	
	-- Plan identification
	"plan_id" varchar(50) NOT NULL UNIQUE,
	"plan_name" varchar(100) NOT NULL,
	"description" varchar(500),
	
	-- Pricing
	"monthly_price" integer NOT NULL,
	"yearly_price" integer NOT NULL,
	"currency" varchar(10) NOT NULL DEFAULT 'USD',
	
	-- Usage limits
	"monthly_generation_limit" integer,
	"daily_generation_limit" integer,
	
	-- Performance features
	"priority_queue" boolean NOT NULL DEFAULT false,
	"generation_speed" varchar(20) NOT NULL DEFAULT 'normal',
	
	-- Access privileges
	"support_level" varchar(20) NOT NULL DEFAULT 'basic',
	"api_access" boolean NOT NULL DEFAULT false,
	"custom_models" boolean NOT NULL DEFAULT false,
	
	-- Status
	"is_active" boolean NOT NULL DEFAULT true,
	"is_featured" boolean NOT NULL DEFAULT false,
	
	"created_at" timestamp with time zone DEFAULT NOW(),
	"updated_at" timestamp with time zone DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE "subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	
	-- User identification
	"user_uuid" varchar(255) NOT NULL UNIQUE,
	"user_email" varchar(255) NOT NULL,
	
	-- Plan information
	"plan_id" varchar(50) NOT NULL,
	"plan_name" varchar(100) NOT NULL,
	
	-- Subscription status
	"status" varchar(50) NOT NULL,
	
	-- Billing details
	"interval" varchar(20) NOT NULL,
	"price" integer NOT NULL,
	"currency" varchar(10) NOT NULL DEFAULT 'USD',
	
	-- Time management
	"started_at" timestamp with time zone NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	
	-- Payment integration
	"stripe_subscription_id" varchar(255),
	"stripe_customer_id" varchar(255),
	"last_payment_at" timestamp with time zone,
	"next_payment_at" timestamp with time zone,
	
	-- Usage tracking
	"monthly_limit" integer,
	"used_this_month" integer NOT NULL DEFAULT 0,
	
	"created_at" timestamp with time zone DEFAULT NOW(),
	"updated_at" timestamp with time zone DEFAULT NOW()
);

-- Performance indexes for subscription tables
CREATE INDEX "idx_subscription_plans_active" ON "subscription_plans" ("is_active", "is_featured") WHERE "is_active" = true;
CREATE INDEX "idx_subscriptions_user_uuid" ON "subscriptions" ("user_uuid");
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" ("status", "current_period_end");
CREATE INDEX "idx_subscriptions_stripe" ON "subscriptions" ("stripe_subscription_id") WHERE "stripe_subscription_id" IS NOT NULL;

-- Subscription usage tracking
CREATE TABLE "subscription_usage" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscription_usage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	
	-- Relations
	"user_uuid" varchar(255) NOT NULL,
	"subscription_id" integer NOT NULL,
	
	-- Usage details
	"usage_type" varchar(50) NOT NULL,
	"model_used" varchar(100),
	"prompt" varchar(1000),
	"result_id" varchar(255),
	
	-- Consumption tracking
	"credits_consumed" integer NOT NULL DEFAULT 0,
	"count" integer NOT NULL DEFAULT 1,
	
	"created_at" timestamp with time zone DEFAULT NOW()
);

-- Performance indexes for subscription_usage
CREATE INDEX "idx_subscription_usage_user" ON "subscription_usage" ("user_uuid", "created_at" DESC);
CREATE INDEX "idx_subscription_usage_subscription" ON "subscription_usage" ("subscription_id", "created_at" DESC);
CREATE INDEX "idx_subscription_usage_monthly" ON "subscription_usage" ("user_uuid", "usage_type", "created_at" DESC);

-- =============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================

-- Composite indexes for common query patterns
CREATE INDEX "idx_character_generations_trending" ON "character_generations" ("created_at" DESC, "credits_used") WHERE "is_deleted" = false;
CREATE INDEX "idx_gallery_popular_recent" ON "character_gallery" ("created_at" DESC, "likes_count" DESC, "views_count" DESC) WHERE "is_public" = true AND "is_approved" = true;

-- Partial indexes for better performance on filtered queries
CREATE INDEX "idx_gallery_recent_public" ON "character_gallery" ("created_at" DESC) WHERE "is_public" = true AND "is_approved" = true AND "is_deleted" = false;
CREATE INDEX "idx_generations_user_recent" ON "character_generations" ("user_uuid", "created_at" DESC) WHERE "is_deleted" = false;

-- Text search indexes (requires pg_trgm extension)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX "idx_gallery_title_trgm" ON "character_gallery" USING gin ("title" gin_trgm_ops) WHERE "is_public" = true;
-- CREATE INDEX "idx_gallery_description_trgm" ON "character_gallery" USING gin ("description" gin_trgm_ops) WHERE "is_public" = true;

-- =============================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE "character_generations" IS 'Stores all character generation requests and results with full metadata tracking';
COMMENT ON TABLE "character_gallery" IS 'Public gallery for showcasing character creations with social interaction features';
COMMENT ON TABLE "gallery_interactions" IS 'Tracks user interactions (likes, bookmarks, views) with gallery items';
COMMENT ON TABLE "character_templates" IS 'Predefined templates for quick character generation with usage analytics';
COMMENT ON TABLE "system_configs" IS 'Dynamic system configuration for Character Figure feature flags and settings';
COMMENT ON TABLE "user_preferences" IS 'User-specific preferences and settings for character generation';
COMMENT ON TABLE "subscription_plans" IS 'Available subscription plans with pricing and feature definitions';
COMMENT ON TABLE "subscriptions" IS 'Active user subscriptions with billing and usage tracking';
COMMENT ON TABLE "subscription_usage" IS 'Detailed usage tracking for subscription billing and analytics';

-- =============================================
-- CONSTRAINTS AND FOREIGN KEYS
-- =============================================

-- Add check constraints for data integrity
ALTER TABLE "character_generations" ADD CONSTRAINT "check_generation_time_positive" CHECK ("generation_time" > 0);
ALTER TABLE "character_generations" ADD CONSTRAINT "check_credits_used_positive" CHECK ("credits_used" >= 0);
ALTER TABLE "character_generations" ADD CONSTRAINT "check_num_images_range" CHECK ("num_images" BETWEEN 1 AND 10);

ALTER TABLE "character_gallery" ADD CONSTRAINT "check_social_counts_positive" CHECK (
	"likes_count" >= 0 AND "views_count" >= 0 AND "bookmarks_count" >= 0 AND "comments_count" >= 0
);

ALTER TABLE "character_templates" ADD CONSTRAINT "check_usage_count_positive" CHECK ("usage_count" >= 0);
ALTER TABLE "character_templates" ADD CONSTRAINT "check_success_rate_range" CHECK ("success_rate" BETWEEN 0 AND 100);

ALTER TABLE "subscription_plans" ADD CONSTRAINT "check_prices_positive" CHECK ("monthly_price" > 0 AND "yearly_price" > 0);
ALTER TABLE "subscriptions" ADD CONSTRAINT "check_subscription_price_positive" CHECK ("price" > 0);
ALTER TABLE "subscriptions" ADD CONSTRAINT "check_used_this_month_positive" CHECK ("used_this_month" >= 0);