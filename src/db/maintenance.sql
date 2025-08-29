-- Database Maintenance and Administration Scripts
-- Purpose: Regular maintenance, cleanup, and optimization tasks
-- Author: Database Administrator
-- Date: 2025-08-28

-- =============================================
-- PERFORMANCE MONITORING QUERIES
-- =============================================

-- Query to check database size and table sizes
CREATE OR REPLACE VIEW database_table_sizes AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query to check index usage statistics
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Query to identify slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  rows
FROM pg_stat_statements 
WHERE mean_exec_time > 100  -- queries taking more than 100ms on average
ORDER BY mean_exec_time DESC;

-- =============================================
-- CLEANUP FUNCTIONS
-- =============================================

-- Function to clean up old soft-deleted generations
CREATE OR REPLACE FUNCTION cleanup_deleted_generations(
  older_than_days INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM character_generations
  WHERE is_deleted = true
  AND created_at < NOW() - (older_than_days || ' days')::INTERVAL
  AND gallery_item_id IS NULL;  -- Don't delete if still referenced in gallery
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % old deleted generations', deleted_count;
  RETURN deleted_count;
END;
$$;

-- Function to clean up old gallery interactions (keep recent ones)
CREATE OR REPLACE FUNCTION cleanup_old_gallery_interactions(
  keep_days INTEGER DEFAULT 180,
  keep_per_item INTEGER DEFAULT 1000
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER := 0;
  item_record RECORD;
BEGIN
  -- For each gallery item, keep only the most recent interactions
  FOR item_record IN 
    SELECT DISTINCT gallery_item_id FROM gallery_interactions 
  LOOP
    -- Delete old view interactions beyond the limit
    DELETE FROM gallery_interactions
    WHERE gallery_item_id = item_record.gallery_item_id
    AND interaction_type = 'view'
    AND id NOT IN (
      SELECT id FROM gallery_interactions
      WHERE gallery_item_id = item_record.gallery_item_id
      AND interaction_type = 'view'
      ORDER BY created_at DESC
      LIMIT keep_per_item
    );
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  END LOOP;
  
  -- Delete very old interactions (older than keep_days)
  DELETE FROM gallery_interactions
  WHERE created_at < NOW() - (keep_days || ' days')::INTERVAL
  AND interaction_type = 'view';
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % old gallery interactions', deleted_count;
  RETURN deleted_count;
END;
$$;

-- Function to clean up old subscription usage records
CREATE OR REPLACE FUNCTION cleanup_old_subscription_usage(
  keep_months INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM subscription_usage
  WHERE created_at < NOW() - (keep_months || ' months')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % old subscription usage records', deleted_count;
  RETURN deleted_count;
END;
$$;

-- Function to clean up old visitor logs
CREATE OR REPLACE FUNCTION cleanup_old_visitor_logs(
  keep_days INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM visitor_logs
  WHERE visited_at < NOW() - (keep_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % old visitor logs', deleted_count;
  RETURN deleted_count;
END;
$$;

-- =============================================
-- MAINTENANCE PROCEDURES
-- =============================================

-- Comprehensive maintenance procedure
CREATE OR REPLACE FUNCTION run_database_maintenance(
  cleanup_deleted_gens BOOLEAN DEFAULT true,
  cleanup_interactions BOOLEAN DEFAULT true,
  cleanup_usage BOOLEAN DEFAULT true,
  cleanup_logs BOOLEAN DEFAULT true,
  vacuum_analyze BOOLEAN DEFAULT true
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := 'Database Maintenance Report:' || E'\n';
  deleted_count INTEGER;
BEGIN
  -- Cleanup operations
  IF cleanup_deleted_gens THEN
    SELECT cleanup_deleted_generations() INTO deleted_count;
    result := result || '- Cleaned up ' || deleted_count || ' old deleted generations' || E'\n';
  END IF;
  
  IF cleanup_interactions THEN
    SELECT cleanup_old_gallery_interactions() INTO deleted_count;
    result := result || '- Cleaned up ' || deleted_count || ' old gallery interactions' || E'\n';
  END IF;
  
  IF cleanup_usage THEN
    SELECT cleanup_old_subscription_usage() INTO deleted_count;
    result := result || '- Cleaned up ' || deleted_count || ' old subscription usage records' || E'\n';
  END IF;
  
  IF cleanup_logs THEN
    SELECT cleanup_old_visitor_logs() INTO deleted_count;
    result := result || '- Cleaned up ' || deleted_count || ' old visitor logs' || E'\n';
  END IF;
  
  -- Vacuum and analyze
  IF vacuum_analyze THEN
    VACUUM ANALYZE character_generations;
    VACUUM ANALYZE character_gallery;
    VACUUM ANALYZE gallery_interactions;
    VACUUM ANALYZE subscription_usage;
    VACUUM ANALYZE visitor_logs;
    result := result || '- Completed VACUUM ANALYZE on main tables' || E'\n';
  END IF;
  
  -- Update table statistics
  ANALYZE;
  result := result || '- Updated table statistics' || E'\n';
  
  result := result || 'Maintenance completed at: ' || NOW();
  RETURN result;
END;
$$;

-- Function to recalculate gallery social counts (in case of inconsistencies)
CREATE OR REPLACE FUNCTION recalculate_gallery_social_counts()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER := 0;
  gallery_record RECORD;
BEGIN
  FOR gallery_record IN SELECT uuid FROM character_gallery LOOP
    PERFORM update_gallery_social_counts(gallery_record.uuid);
    updated_count := updated_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Recalculated social counts for % gallery items', updated_count;
  RETURN updated_count;
END;
$$;

-- Function to reset monthly subscription usage (run at beginning of each month)
CREATE OR REPLACE FUNCTION reset_monthly_subscription_usage()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE subscriptions 
  SET used_this_month = 0, updated_at = NOW()
  WHERE status = 'active';
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  RAISE NOTICE 'Reset monthly usage for % active subscriptions', reset_count;
  RETURN reset_count;
END;
$$;

-- =============================================
-- INDEX MAINTENANCE
-- =============================================

-- Function to rebuild indexes if they become bloated
CREATE OR REPLACE FUNCTION rebuild_indexes_if_needed(
  bloat_threshold NUMERIC DEFAULT 20.0  -- Rebuild if more than 20% bloated
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := 'Index Maintenance Report:' || E'\n';
  index_record RECORD;
  index_size BIGINT;
  table_size BIGINT;
  bloat_ratio NUMERIC;
BEGIN
  -- Check each index for bloat
  FOR index_record IN 
    SELECT indexname, tablename, schemaname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
  LOOP
    -- Get index and table sizes
    SELECT pg_relation_size(index_record.indexname::regclass) INTO index_size;
    SELECT pg_relation_size((index_record.schemaname||'.'||index_record.tablename)::regclass) INTO table_size;
    
    -- Calculate approximate bloat ratio (simplified calculation)
    IF table_size > 0 THEN
      bloat_ratio := (index_size::NUMERIC / table_size::NUMERIC) * 100;
      
      -- Rebuild if bloated beyond threshold
      IF bloat_ratio > bloat_threshold THEN
        EXECUTE 'REINDEX INDEX ' || quote_ident(index_record.indexname);
        result := result || '- Rebuilt index: ' || index_record.indexname || 
                  ' (bloat: ' || round(bloat_ratio, 1) || '%)' || E'\n';
      END IF;
    END IF;
  END LOOP;
  
  result := result || 'Index maintenance completed at: ' || NOW();
  RETURN result;
END;
$$;

-- =============================================
-- MONITORING AND ALERTING
-- =============================================

-- Function to check database health
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  value TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check table sizes
  RETURN QUERY
  SELECT 
    'Large Tables' as check_name,
    CASE WHEN bytes > 1024*1024*1024 THEN 'WARNING' ELSE 'OK' END as status,
    tablename || ': ' || size as value,
    CASE WHEN bytes > 1024*1024*1024 
         THEN 'Consider partitioning or archiving old data' 
         ELSE 'Table size is acceptable' END as recommendation
  FROM database_table_sizes 
  WHERE bytes > 100*1024*1024;  -- Show tables larger than 100MB
  
  -- Check unused indexes
  RETURN QUERY
  SELECT 
    'Unused Indexes' as check_name,
    CASE WHEN idx_scan < 10 THEN 'WARNING' ELSE 'OK' END as status,
    indexname || ' (scans: ' || idx_scan || ')' as value,
    CASE WHEN idx_scan < 10 
         THEN 'Consider dropping if truly unused' 
         ELSE 'Index is being used' END as recommendation
  FROM index_usage_stats 
  WHERE idx_scan < 10;
  
  -- Check slow queries
  RETURN QUERY
  SELECT 
    'Slow Queries' as check_name,
    'WARNING' as status,
    'Avg: ' || round(mean_exec_time, 2) || 'ms' as value,
    'Optimize query or add appropriate indexes' as recommendation
  FROM slow_queries 
  LIMIT 5;
  
END;
$$;

-- Function to generate usage analytics
CREATE OR REPLACE FUNCTION generate_usage_analytics(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  metric_name TEXT,
  metric_value TEXT,
  period TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Total Generations' as metric_name,
    COUNT(*)::TEXT as metric_value,
    start_date::DATE || ' to ' || end_date::DATE as period
  FROM character_generations 
  WHERE created_at BETWEEN start_date AND end_date;
  
  RETURN QUERY
  SELECT 
    'Active Users' as metric_name,
    COUNT(DISTINCT user_uuid)::TEXT as metric_value,
    start_date::DATE || ' to ' || end_date::DATE as period
  FROM character_generations 
  WHERE created_at BETWEEN start_date AND end_date;
  
  RETURN QUERY
  SELECT 
    'Gallery Items Created' as metric_name,
    COUNT(*)::TEXT as metric_value,
    start_date::DATE || ' to ' || end_date::DATE as period
  FROM character_gallery 
  WHERE created_at BETWEEN start_date AND end_date;
  
  RETURN QUERY
  SELECT 
    'Most Popular Style' as metric_name,
    style as metric_value,
    start_date::DATE || ' to ' || end_date::DATE as period
  FROM character_generations 
  WHERE created_at BETWEEN start_date AND end_date
  GROUP BY style 
  ORDER BY COUNT(*) DESC 
  LIMIT 1;
  
  RETURN QUERY
  SELECT 
    'Average Generation Time' as metric_name,
    round(AVG(generation_time)::NUMERIC, 0)::TEXT || 'ms' as metric_value,
    start_date::DATE || ' to ' || end_date::DATE as period
  FROM character_generations 
  WHERE created_at BETWEEN start_date AND end_date;
  
END;
$$;

-- =============================================
-- BACKUP AND RECOVERY HELPERS
-- =============================================

-- Function to prepare for backup (cleanup temp data)
CREATE OR REPLACE FUNCTION prepare_for_backup()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := 'Backup Preparation:' || E'\n';
  cleaned_count INTEGER;
BEGIN
  -- Clean up temporary data that doesn't need to be backed up
  
  -- Remove old session-based interactions
  DELETE FROM gallery_interactions 
  WHERE interaction_type = 'view' 
  AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  result := result || '- Cleaned ' || cleaned_count || ' old view interactions' || E'\n';
  
  -- Clean up very old visitor logs
  DELETE FROM visitor_logs 
  WHERE visited_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  result := result || '- Cleaned ' || cleaned_count || ' old visitor logs' || E'\n';
  
  -- Vacuum to reclaim space
  VACUUM ANALYZE;
  result := result || '- Completed VACUUM ANALYZE' || E'\n';
  
  result := result || 'Ready for backup at: ' || NOW();
  RETURN result;
END;
$$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions for maintenance functions
GRANT EXECUTE ON FUNCTION cleanup_deleted_generations(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION run_database_maintenance(BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION check_database_health() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_usage_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Grant view permissions for monitoring
GRANT SELECT ON database_table_sizes TO authenticated;
GRANT SELECT ON index_usage_stats TO authenticated;

-- =============================================
-- SCHEDULED MAINTENANCE RECOMMENDATIONS
-- =============================================

/*
-- Recommended cron jobs for regular maintenance:

-- Daily cleanup (run at 2 AM):
-- 0 2 * * * psql -d your_database -c "SELECT run_database_maintenance(false, true, false, true, false);"

-- Weekly full maintenance (run on Sunday at 3 AM):
-- 0 3 * * 0 psql -d your_database -c "SELECT run_database_maintenance(true, true, true, true, true);"

-- Monthly subscription reset (run on 1st of each month at 1 AM):
-- 0 1 1 * * psql -d your_database -c "SELECT reset_monthly_subscription_usage();"

-- Monthly analytics report (run on 1st of each month at 9 AM):
-- 0 9 1 * * psql -d your_database -c "SELECT * FROM generate_usage_analytics(NOW() - INTERVAL '1 month', NOW());"
*/