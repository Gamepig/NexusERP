-- Drop prediction tables and related objects
-- This file reverts the changes made in 000027_create_prediction_tables.up.sql

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_model_accuracy ON prediction_accuracy;
DROP TRIGGER IF EXISTS update_prediction_models_updated_at ON prediction_models;

-- Drop functions
DROP FUNCTION IF EXISTS update_model_accuracy();
DROP FUNCTION IF EXISTS calculate_mape(BIGINT, INTEGER);

-- Drop views
DROP VIEW IF EXISTS inventory_movement_data;
DROP VIEW IF EXISTS historical_sales_data;

-- Drop indexes (they will be dropped automatically with tables, but explicit for clarity)
DROP INDEX IF EXISTS idx_predictions_entity_id_date;
DROP INDEX IF EXISTS idx_predictions_type_entity_date;
DROP INDEX IF EXISTS idx_prediction_accuracy_evaluated_at;
DROP INDEX IF EXISTS idx_prediction_accuracy_prediction_id;
DROP INDEX IF EXISTS idx_prediction_models_name;
DROP INDEX IF EXISTS idx_prediction_models_active;
DROP INDEX IF EXISTS idx_prediction_models_type;
DROP INDEX IF EXISTS idx_predictions_created_at;
DROP INDEX IF EXISTS idx_predictions_model;
DROP INDEX IF EXISTS idx_predictions_date;
DROP INDEX IF EXISTS idx_predictions_entity_id;
DROP INDEX IF EXISTS idx_predictions_type_entity;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS prediction_accuracy;
DROP TABLE IF EXISTS prediction_models;
DROP TABLE IF EXISTS predictions;