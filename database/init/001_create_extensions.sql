-- Create necessary PostgreSQL extensions for NexusERP
-- This script runs during database initialization

-- UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_trgm extension for text similarity and full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- btree_gin extension for GIN indexes on scalar types
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- pgcrypto extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial schemas
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS reports;

-- Set up basic database configuration
ALTER DATABASE nexus_erp SET timezone TO 'UTC';

-- Create a basic log table for system events
CREATE TABLE IF NOT EXISTS system_log (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initialization log
INSERT INTO system_log (event_type, message, details) 
VALUES ('system', 'Database initialization completed', 
        jsonb_build_object('timestamp', CURRENT_TIMESTAMP, 'version', '1.0.0'));

-- Create index for system_log
CREATE INDEX IF NOT EXISTS idx_system_log_event_type ON system_log(event_type);
CREATE INDEX IF NOT EXISTS idx_system_log_created_at ON system_log(created_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE nexus_erp TO nexus;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nexus;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nexus;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO nexus;
GRANT ALL PRIVILEGES ON SCHEMA audit TO nexus;
GRANT ALL PRIVILEGES ON SCHEMA reports TO nexus;