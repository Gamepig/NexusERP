-- Create prediction tables for sales forecasting and inventory optimization
-- According to Task 19 requirements and models/prediction.go

-- Create predictions table for storing prediction results
CREATE TABLE predictions (
    id BIGSERIAL PRIMARY KEY,
    prediction_type VARCHAR(32) NOT NULL CHECK (prediction_type IN ('sales', 'inventory')),
    target_entity_type VARCHAR(32) NOT NULL CHECK (target_entity_type IN ('product', 'category', 'total')),
    target_entity_id BIGINT,
    prediction_date DATE NOT NULL,
    predicted_value NUMERIC(14,2) NOT NULL,
    confidence_interval_lower NUMERIC(14,2),
    confidence_interval_upper NUMERIC(14,2),
    model_used VARCHAR(32) NOT NULL CHECK (model_used IN ('arima', 'moving_average', 'exponential_smoothing', 'linear_regression')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create prediction_models table for model configuration
CREATE TABLE prediction_models (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    model_type VARCHAR(32) NOT NULL CHECK (model_type IN ('arima', 'moving_average', 'exponential_smoothing', 'linear_regression')),
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_trained_at TIMESTAMP WITH TIME ZONE,
    accuracy_mape NUMERIC(5,4), -- Mean Absolute Percentage Error (0.0000 to 1.0000)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create prediction_accuracy table for tracking prediction accuracy
CREATE TABLE prediction_accuracy (
    id BIGSERIAL PRIMARY KEY,
    prediction_id BIGINT NOT NULL,
    actual_value NUMERIC(14,2) NOT NULL,
    predicted_value NUMERIC(14,2) NOT NULL,
    absolute_error NUMERIC(14,2) NOT NULL, -- Calculated as ABS(actual_value - predicted_value)
    percentage_error NUMERIC(7,4) NOT NULL, -- Calculated as (absolute_error / actual_value) * 100
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_prediction_accuracy_prediction_id FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_predictions_type_entity ON predictions(prediction_type, target_entity_type);
CREATE INDEX idx_predictions_entity_id ON predictions(target_entity_id);
CREATE INDEX idx_predictions_date ON predictions(prediction_date);
CREATE INDEX idx_predictions_model ON predictions(model_used);
CREATE INDEX idx_predictions_created_at ON predictions(created_at);

CREATE INDEX idx_prediction_models_type ON prediction_models(model_type);
CREATE INDEX idx_prediction_models_active ON prediction_models(is_active);
CREATE INDEX idx_prediction_models_name ON prediction_models(name);

CREATE INDEX idx_prediction_accuracy_prediction_id ON prediction_accuracy(prediction_id);
CREATE INDEX idx_prediction_accuracy_evaluated_at ON prediction_accuracy(evaluated_at);

-- Create composite indexes for common queries
CREATE INDEX idx_predictions_type_entity_date ON predictions(prediction_type, target_entity_type, prediction_date);
CREATE INDEX idx_predictions_entity_id_date ON predictions(target_entity_id, prediction_date) WHERE target_entity_id IS NOT NULL;

-- Create trigger for updated_at on prediction_models
CREATE TRIGGER update_prediction_models_updated_at
    BEFORE UPDATE ON prediction_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create historical sales data view for forecasting
-- This view aggregates sales data from sales_orders and sales_order_items
CREATE OR REPLACE VIEW historical_sales_data AS
SELECT 
    so.order_date as date,
    soi.product_id,
    p.category_id,
    SUM(soi.quantity) as quantity,
    SUM(soi.total_price) as amount,
    COUNT(DISTINCT so.id) as order_count
FROM sales_orders so
JOIN sales_order_items soi ON so.id = soi.sales_order_id
JOIN products p ON soi.product_id = p.id
WHERE so.status NOT IN ('draft', 'cancelled')
GROUP BY so.order_date, soi.product_id, p.category_id
ORDER BY so.order_date DESC;

-- Create inventory movement data view for inventory optimization
-- This view aggregates inventory transactions to show daily stock movements
CREATE OR REPLACE VIEW inventory_movement_data AS
SELECT 
    DATE(it.transaction_date) as date,
    it.product_id,
    it.warehouse_id,
    -- Calculate opening stock (previous day's closing)
    LAG(il.quantity_on_hand, 1, 0) OVER (
        PARTITION BY it.product_id, it.warehouse_id 
        ORDER BY DATE(it.transaction_date)
    ) as opening_stock,
    -- Inbound movements (positive quantity_changed)
    COALESCE(SUM(CASE WHEN it.quantity_changed > 0 THEN it.quantity_changed ELSE 0 END), 0) as inbound,
    -- Outbound movements (negative quantity_changed, converted to positive)
    COALESCE(SUM(CASE WHEN it.quantity_changed < 0 THEN ABS(it.quantity_changed) ELSE 0 END), 0) as outbound,
    -- Closing stock (current quantity_on_hand)
    il.quantity_on_hand as closing_stock,
    -- Check if stockout occurred (quantity went to 0 or below)
    CASE WHEN MIN(it.quantity_after) <= 0 THEN true ELSE false END as stockout_occurred
FROM inventory_transactions it
JOIN inventory_levels il ON it.product_id = il.product_id AND it.warehouse_id = il.warehouse_id
GROUP BY DATE(it.transaction_date), it.product_id, it.warehouse_id, il.quantity_on_hand
ORDER BY date DESC, it.product_id, it.warehouse_id;

-- Insert default prediction models
INSERT INTO prediction_models (name, model_type, configuration, is_active) VALUES
('Default Moving Average', 'moving_average', '{"window_size": 7, "description": "7-day moving average for short-term forecasting"}', true),
('Extended Moving Average', 'moving_average', '{"window_size": 30, "description": "30-day moving average for medium-term forecasting"}', true),
('Simple Exponential Smoothing', 'exponential_smoothing', '{"alpha": 0.3, "description": "Exponential smoothing with alpha=0.3"}', true),
('Adaptive Exponential Smoothing', 'exponential_smoothing', '{"alpha": 0.1, "beta": 0.1, "description": "Double exponential smoothing for trend data"}', false);

-- Create function to calculate MAPE (Mean Absolute Percentage Error)
CREATE OR REPLACE FUNCTION calculate_mape(model_id BIGINT, days_back INTEGER DEFAULT 30)
RETURNS NUMERIC(5,4) AS $$
DECLARE
    mape_result NUMERIC(5,4);
BEGIN
    SELECT AVG(pa.percentage_error / 100.0)
    INTO mape_result
    FROM prediction_accuracy pa
    JOIN predictions p ON pa.prediction_id = p.id
    JOIN prediction_models pm ON p.model_used = pm.model_type
    WHERE pm.id = model_id
    AND pa.evaluated_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    AND pa.actual_value > 0; -- Avoid division by zero
    
    RETURN COALESCE(mape_result, 0.0);
END;
$$ LANGUAGE plpgsql;

-- Create function to update model accuracy
CREATE OR REPLACE FUNCTION update_model_accuracy()
RETURNS TRIGGER AS $$
DECLARE
    model_id BIGINT;
    new_mape NUMERIC(5,4);
BEGIN
    -- Get model ID from the prediction
    SELECT pm.id INTO model_id
    FROM prediction_models pm
    JOIN predictions p ON p.model_used = pm.model_type
    WHERE p.id = NEW.prediction_id;
    
    -- Calculate new MAPE for the last 30 days
    new_mape := calculate_mape(model_id, 30);
    
    -- Update the model's accuracy
    UPDATE prediction_models 
    SET accuracy_mape = new_mape
    WHERE id = model_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update model accuracy when new accuracy data is added
CREATE TRIGGER trigger_update_model_accuracy
    AFTER INSERT ON prediction_accuracy
    FOR EACH ROW
    EXECUTE FUNCTION update_model_accuracy();

-- Add comments for documentation
COMMENT ON TABLE predictions IS 'Stores prediction results for sales forecasting and inventory optimization';
COMMENT ON TABLE prediction_models IS 'Configuration and metadata for prediction models';
COMMENT ON TABLE prediction_accuracy IS 'Tracks accuracy metrics for predictions to evaluate model performance';

COMMENT ON COLUMN predictions.prediction_type IS 'Type of prediction: sales or inventory';
COMMENT ON COLUMN predictions.target_entity_type IS 'Entity being predicted: product, category, or total';
COMMENT ON COLUMN predictions.target_entity_id IS 'ID of the specific entity (NULL for total predictions)';
COMMENT ON COLUMN predictions.model_used IS 'Model algorithm used for this prediction';

COMMENT ON COLUMN prediction_models.configuration IS 'JSON configuration for model parameters';
COMMENT ON COLUMN prediction_models.accuracy_mape IS 'Mean Absolute Percentage Error (0.0-1.0)';

COMMENT ON COLUMN prediction_accuracy.percentage_error IS 'Percentage error ((|actual-predicted|/actual)*100)';

COMMENT ON VIEW historical_sales_data IS 'Aggregated historical sales data for forecasting algorithms';
COMMENT ON VIEW inventory_movement_data IS 'Daily inventory movements for optimization analysis';