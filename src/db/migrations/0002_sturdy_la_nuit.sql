CREATE TABLE "visitor_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "visitor_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"visitor_id" varchar(100) NOT NULL,
	"user_uuid" varchar(255),
	"session_id" varchar(100) NOT NULL,
	"visited_at" timestamp with time zone NOT NULL,
	"page_url" varchar(500),
	"referrer" varchar(500),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(255),
	"utm_term" varchar(255),
	"utm_content" varchar(255),
	"user_agent" text,
	"device_type" varchar(50),
	"os" varchar(50),
	"os_version" varchar(50),
	"browser" varchar(50),
	"browser_version" varchar(50),
	"ip_address" varchar(45),
	"country" varchar(100),
	"country_code" varchar(10),
	"region" varchar(100),
	"city" varchar(100),
	"timezone" varchar(100),
	"language" varchar(10),
	"screen_resolution" varchar(20),
	"viewport_size" varchar(20),
	"color_depth" integer
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_source" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_medium" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_campaign" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_device_type" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_os" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_browser" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_user_agent" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_ip_address" varchar(45);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_country" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_region" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_city" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_page_url" varchar(500);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_session_id" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "attribution_source" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "attribution_medium" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "attribution_campaign" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "attribution_term" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "attribution_content" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "attribution_landing" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_visit_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_referrer" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_user_agent" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_ip_address" varchar(45);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_country" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_region" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_city" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_device_type" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_os" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_browser" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_language" varchar(10);