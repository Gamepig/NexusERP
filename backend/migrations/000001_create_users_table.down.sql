-- Drop tables in reverse order to avoid foreign key constraint issues
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

-- Drop the trigger and function
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes (they will be dropped with the tables automatically)
-- This is just for completeness/documentation
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP INDEX IF EXISTS idx_users_active;
-- DROP INDEX IF EXISTS idx_password_reset_tokens_token;
-- DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;