#!/bin/bash

# Character Figure AI Generator Database Setup Script
# Purpose: Automate the complete database setup process
# Author: Database Setup Expert
# Date: 2025-08-28

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME=${DB_NAME:-"nano-banana"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DB_DIR="$PROJECT_ROOT/src/db"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v psql &> /dev/null; then
        error "PostgreSQL client (psql) is required but not installed"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        error "npx is required but not installed"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Test database connection
test_connection() {
    log "Testing database connection..."
    
    if psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        success "Database connection successful"
    else
        error "Failed to connect to database"
        error "Please check your database credentials and ensure the database is running"
        exit 1
    fi
}

# Run migrations using Drizzle
run_migrations() {
    log "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Generate migration if needed
    if [ ! -f "$DB_DIR/migrations/0003_character_figure_setup.sql" ]; then
        log "Generating Character Figure migration..."
        npx drizzle-kit generate:pg --config=drizzle.config.ts
    fi
    
    # Run migrations
    log "Applying migrations..."
    npx drizzle-kit push:pg --config=drizzle.config.ts
    
    success "Migrations completed"
}

# Apply RLS policies
apply_rls_policies() {
    log "Applying Row Level Security policies..."
    
    if [ -f "$DB_DIR/rls-policies.sql" ]; then
        psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -f "$DB_DIR/rls-policies.sql"
        success "RLS policies applied"
    else
        warning "RLS policies file not found, skipping..."
    fi
}

# Create database functions
create_functions() {
    log "Creating database functions..."
    
    if [ -f "$DB_DIR/functions.sql" ]; then
        psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -f "$DB_DIR/functions.sql"
        success "Database functions created"
    else
        warning "Functions file not found, skipping..."
    fi
}

# Setup triggers
setup_triggers() {
    log "Setting up database triggers..."
    
    if [ -f "$DB_DIR/triggers.sql" ]; then
        psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -f "$DB_DIR/triggers.sql"
        success "Database triggers created"
    else
        warning "Triggers file not found, skipping..."
    fi
}

# Load seed data
load_seed_data() {
    if [ "$1" = "--with-seeds" ] || [ "$2" = "--with-seeds" ]; then
        log "Loading seed data..."
        
        if [ -f "$DB_DIR/seeds.sql" ]; then
            psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -f "$DB_DIR/seeds.sql"
            success "Seed data loaded"
        else
            warning "Seeds file not found, skipping..."
        fi
    else
        log "Skipping seed data (use --with-seeds to include)"
    fi
}

# Setup maintenance functions
setup_maintenance() {
    log "Setting up maintenance functions..."
    
    if [ -f "$DB_DIR/maintenance.sql" ]; then
        psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -f "$DB_DIR/maintenance.sql"
        success "Maintenance functions created"
    else
        warning "Maintenance file not found, skipping..."
    fi
}

# Optimize database settings
optimize_database() {
    log "Applying database optimizations..."
    
    # Create optimized configuration
    psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" <<EOF
-- Performance optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Memory settings (adjust based on available RAM)
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET effective_cache_size = '512MB';

-- Checkpoint settings
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- Autovacuum settings
ALTER SYSTEM SET autovacuum_max_workers = 3;
ALTER SYSTEM SET autovacuum_naptime = '20s';

SELECT pg_reload_conf();
EOF
    
    success "Database optimizations applied"
}

# Verify setup
verify_setup() {
    log "Verifying database setup..."
    
    # Check if tables exist
    local tables=(
        "character_generations"
        "character_gallery"
        "gallery_interactions"
        "character_templates"
        "system_configs"
        "user_preferences"
        "subscription_plans"
        "subscriptions"
        "subscription_usage"
    )
    
    for table in "${tables[@]}"; do
        if psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -c "\dt $table" | grep -q "$table"; then
            success "✓ Table '$table' exists"
        else
            error "✗ Table '$table' missing"
            return 1
        fi
    done
    
    # Check if functions exist
    local functions=(
        "get_trending_gallery_items"
        "get_popular_gallery_items"
        "get_user_generation_stats"
        "record_gallery_interaction"
        "run_database_maintenance"
    )
    
    for func in "${functions[@]}"; do
        if psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -c "\df $func" | grep -q "$func"; then
            success "✓ Function '$func' exists"
        else
            warning "⚠ Function '$func' missing"
        fi
    done
    
    # Check if indexes exist
    local indexes=(
        "idx_character_generations_user_uuid"
        "idx_character_gallery_public"
        "idx_gallery_interactions_gallery_item"
        "idx_character_templates_active"
    )
    
    for index in "${indexes[@]}"; do
        if psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -c "\di $index" | grep -q "$index"; then
            success "✓ Index '$index' exists"
        else
            warning "⚠ Index '$index' missing"
        fi
    done
    
    success "Database setup verification completed"
}

# Generate setup report
generate_report() {
    log "Generating setup report..."
    
    local report_file="$PROJECT_ROOT/database-setup-report.md"
    
    cat > "$report_file" <<EOF
# Character Figure Database Setup Report

**Date:** $(date)
**Database:** $DB_NAME
**Host:** $DB_HOST:$DB_PORT

## Setup Summary

$(psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -c "
SELECT 
    'Tables Created: ' || COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'character_%' OR table_name LIKE 'subscription_%' OR table_name = 'gallery_interactions' OR table_name = 'system_configs' OR table_name = 'user_preferences';
")

$(psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -c "
SELECT 
    'Indexes Created: ' || COUNT(*) 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
")

$(psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -c "
SELECT 
    'Functions Created: ' || COUNT(*) 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname LIKE '%gallery%' OR p.proname LIKE '%generation%' OR p.proname LIKE '%subscription%';
")

## Table Sizes

$(psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME" -c "
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
AND (tablename LIKE 'character_%' OR tablename LIKE 'subscription_%' OR tablename = 'gallery_interactions' OR tablename = 'system_configs' OR tablename = 'user_preferences')
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
")

## Next Steps

1. Update your application's database configuration
2. Test the Character Figure API endpoints
3. Verify RLS policies are working correctly
4. Set up monitoring and alerting
5. Schedule regular maintenance tasks

## Useful Commands

\`\`\`bash
# Connect to database
psql "postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

# Run maintenance
SELECT run_database_maintenance();

# Check database health
SELECT * FROM check_database_health();

# View trending gallery items
SELECT * FROM get_trending_gallery_items(10);
\`\`\`

---
Generated by Character Figure Database Setup Script
EOF
    
    success "Setup report generated: $report_file"
}

# Main setup function
main() {
    log "Starting Character Figure AI Generator database setup..."
    
    # Parse arguments
    local with_seeds=false
    local optimize=false
    local skip_verify=false
    
    for arg in "$@"; do
        case $arg in
            --with-seeds)
                with_seeds=true
                ;;
            --optimize)
                optimize=true
                ;;
            --skip-verify)
                skip_verify=true
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --with-seeds    Load seed data for testing"
                echo "  --optimize      Apply database performance optimizations"
                echo "  --skip-verify   Skip setup verification"
                echo "  --help          Show this help message"
                echo ""
                echo "Environment variables:"
                echo "  DB_NAME         Database name (default: nano-banana)"
                echo "  DB_HOST         Database host (default: localhost)"
                echo "  DB_PORT         Database port (default: 5432)"
                echo "  DB_USER         Database user (default: postgres)"
                exit 0
                ;;
        esac
    done
    
    # Execute setup steps
    check_prerequisites
    test_connection
    run_migrations
    apply_rls_policies
    create_functions
    setup_triggers
    setup_maintenance
    
    if [ "$with_seeds" = true ]; then
        load_seed_data --with-seeds
    fi
    
    if [ "$optimize" = true ]; then
        optimize_database
    fi
    
    if [ "$skip_verify" != true ]; then
        verify_setup
    fi
    
    generate_report
    
    success "Character Figure database setup completed successfully!"
    log "Check the generated report for detailed information"
    
    if [ "$with_seeds" = true ]; then
        log "Seed data has been loaded - you can now test the application"
    fi
    
    log "Remember to:"
    log "1. Update your environment variables"
    log "2. Test your API endpoints"
    log "3. Set up monitoring"
    log "4. Schedule maintenance tasks"
}

# Run main function with all arguments
main "$@"