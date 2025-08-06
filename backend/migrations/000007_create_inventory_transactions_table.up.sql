-- Create inventory_transaction_types table first
CREATE TABLE IF NOT EXISTS inventory_transaction_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    description VARCHAR(255),
    is_inbound BOOLEAN NOT NULL, -- true for receipts, false for issues
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default transaction types
INSERT INTO inventory_transaction_types (name, description, is_inbound) VALUES 
    ('RECEIPT', 'Product receipt/inbound', true),
    ('ISSUE', 'Product issue/outbound', false),
    ('TRANSFER_IN', 'Transfer from another warehouse (inbound)', true),
    ('TRANSFER_OUT', 'Transfer to another warehouse (outbound)', false),
    ('ADJUSTMENT_IN', 'Positive inventory adjustment', true),
    ('ADJUSTMENT_OUT', 'Negative inventory adjustment', false),
    ('SALE', 'Sale/shipment to customer', false),
    ('RETURN', 'Product return from customer', true),
    ('PRODUCTION_IN', 'Production completion', true),
    ('PRODUCTION_OUT', 'Production consumption', false)
ON CONFLICT (name) DO NOTHING;

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_type_id BIGINT NOT NULL REFERENCES inventory_transaction_types(id),
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity_changed INTEGER NOT NULL, -- Positive for inbound, negative for outbound
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_cost DECIMAL(12,2), -- Cost per unit at time of transaction
    total_cost DECIMAL(12,2), -- Total cost of transaction
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reference_document_type VARCHAR(32), -- e.g., 'PURCHASE_ORDER', 'SALES_ORDER', 'TRANSFER_ORDER'
    reference_document_id BIGINT, -- ID of the referencing document
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- User who performed the transaction
    notes TEXT,
    batch_number VARCHAR(128), -- For batch tracking
    expiry_date DATE, -- For perishable goods
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for product lookups
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);

-- Create index for warehouse lookups
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_warehouse_id ON inventory_transactions(warehouse_id);

-- Create index for transaction type lookups
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type_id ON inventory_transactions(transaction_type_id);

-- Create index for transaction date range queries
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);

-- Create index for reference document lookups
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_document_type, reference_document_id) 
WHERE reference_document_type IS NOT NULL AND reference_document_id IS NOT NULL;

-- Create index for user tracking
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON inventory_transactions(user_id) WHERE user_id IS NOT NULL;

-- Create index for batch tracking
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_batch ON inventory_transactions(batch_number) WHERE batch_number IS NOT NULL;