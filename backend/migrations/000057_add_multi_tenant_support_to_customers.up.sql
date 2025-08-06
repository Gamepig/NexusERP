-- Add multi-tenant support to customers and related tables
-- Business Priority: ⭐⭐⭐⭐⭐ CRITICAL - Data isolation security
-- Impact: Customer management, CRM, Sales, Reports
-- Risk Level: HIGH - Core business data

-- First check if columns already exist to avoid errors
DO $$ 
BEGIN
    -- Add multi-tenant isolation fields to customers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='company_id') THEN
        ALTER TABLE customers ADD COLUMN company_id bigint;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='created_by_user_id') THEN
        ALTER TABLE customers ADD COLUMN created_by_user_id bigint;
    END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
    -- Add company foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name='customers' AND constraint_name='fk_customers_company') THEN
        ALTER TABLE customers 
        ADD CONSTRAINT fk_customers_company 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;

    -- Add created_by_user foreign key if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name='customers' AND constraint_name='fk_customers_created_by_user') THEN
        ALTER TABLE customers 
        ADD CONSTRAINT fk_customers_created_by_user 
            FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by_user ON customers(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_active ON customers(company_id, status) 
    WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_customers_company_new ON customers(company_id);

-- Data migration: Assign all existing customers to the first available company
-- This is safe because we're dealing with test/demo data
UPDATE customers SET 
    company_id = (
        SELECT id FROM companies 
        WHERE is_active = true 
        ORDER BY id 
        LIMIT 1
    ),
    created_by_user_id = (
        SELECT id FROM users 
        WHERE email = 'gamepig1976@gmail.com' 
        LIMIT 1
    )
WHERE company_id IS NULL;

-- Set company_id as NOT NULL after data migration
ALTER TABLE customers 
ALTER COLUMN company_id SET NOT NULL;

-- Handle related tables - customer_contacts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_contacts' AND column_name='company_id') THEN
        ALTER TABLE customer_contacts ADD COLUMN company_id bigint;
        
        -- Add foreign key constraint
        ALTER TABLE customer_contacts 
        ADD CONSTRAINT fk_customer_contacts_company 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
            
        -- Migrate existing data
        UPDATE customer_contacts SET 
            company_id = (SELECT company_id FROM customers WHERE customers.id = customer_contacts.customer_id);
            
        -- Set as NOT NULL
        ALTER TABLE customer_contacts ALTER COLUMN company_id SET NOT NULL;
        
        -- Create index
        CREATE INDEX idx_customer_contacts_company ON customer_contacts(company_id);
    END IF;
END $$;

-- Handle related tables - customer_activities  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_activities' AND column_name='company_id') THEN
        ALTER TABLE customer_activities ADD COLUMN company_id bigint;
        
        -- Add foreign key constraint
        ALTER TABLE customer_activities 
        ADD CONSTRAINT fk_customer_activities_company 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
            
        -- Migrate existing data
        UPDATE customer_activities SET 
            company_id = (SELECT company_id FROM customers WHERE customers.id = customer_activities.customer_id);
            
        -- Set as NOT NULL
        ALTER TABLE customer_activities ALTER COLUMN company_id SET NOT NULL;
        
        -- Create index
        CREATE INDEX idx_customer_activities_company ON customer_activities(company_id);
    END IF;
END $$;

-- Handle related tables - customer_credit_history
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_credit_history' AND column_name='company_id') THEN
        ALTER TABLE customer_credit_history ADD COLUMN company_id bigint;
        
        -- Add foreign key constraint
        ALTER TABLE customer_credit_history 
        ADD CONSTRAINT fk_customer_credit_history_company 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
            
        -- Migrate existing data
        UPDATE customer_credit_history SET 
            company_id = (SELECT company_id FROM customers WHERE customers.id = customer_credit_history.customer_id);
            
        -- Set as NOT NULL
        ALTER TABLE customer_credit_history ALTER COLUMN company_id SET NOT NULL;
        
        -- Create index
        CREATE INDEX idx_customer_credit_history_company ON customer_credit_history(company_id);
    END IF;
END $$;

-- Update table comments to reflect multi-tenant support
COMMENT ON COLUMN customers.company_id IS 'Company ID for multi-tenant data isolation';
COMMENT ON COLUMN customers.created_by_user_id IS 'User who created this customer record';

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customers_company_code ON customers(company_id, customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_company_name_search ON customers(company_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_company_email ON customers(company_id, primary_email);
CREATE INDEX IF NOT EXISTS idx_customers_company_status ON customers(company_id, status);

-- Performance optimization: Create partial indexes for active customers
CREATE INDEX IF NOT EXISTS idx_customers_company_active_only ON customers(company_id, id) 
    WHERE deleted_at IS NULL AND status = 'active';

-- Add search optimization for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_customers_company_search ON customers(company_id, name, customer_code, primary_email)
    WHERE deleted_at IS NULL;