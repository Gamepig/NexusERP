-- ============================================================================
-- NexusERP - Tenant Data Schema Constraints Enforcement
-- ============================================================================
--
-- This script enforces NOT NULL and foreign key constraints on tenant-scoped
-- tables to support PostgreSQL Row-Level Security (RLS) implementation.
--
-- PREREQUISITES:
-- 1. All orphaned records must be fixed before running this script
-- 2. Run as database owner (nexus) or superuser
-- 3. Execute during maintenance window to avoid conflicts
--
-- TABLES AFFECTED:
-- - customers
-- - suppliers  
-- - products
-- - invoices
-- - sales_orders (already has NOT NULL, will add FK constraint)
--
-- ============================================================================

-- Start transaction
BEGIN;

-- Set search path
SET search_path TO public;

-- ============================================================================
-- CUSTOMERS Table Constraints
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Processing customers table...';
    
    -- Make company_id NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'company_id' 
        AND is_nullable = 'YES'
    ) THEN
        RAISE NOTICE '  Making company_id NOT NULL...';
        ALTER TABLE customers ALTER COLUMN company_id SET NOT NULL;
    ELSE
        RAISE NOTICE '  company_id is already NOT NULL';
    END IF;
    
    -- Add foreign key constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'customers' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'customers_company_id_foreign'
    ) THEN
        RAISE NOTICE '  Adding foreign key constraint...';
        ALTER TABLE customers 
        ADD CONSTRAINT customers_company_id_foreign 
        FOREIGN KEY (company_id) REFERENCES companies(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    ELSE
        RAISE NOTICE '  Foreign key constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- SUPPLIERS Table Constraints  
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Processing suppliers table...';
    
    -- Make company_id NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'company_id' 
        AND is_nullable = 'YES'
    ) THEN
        RAISE NOTICE '  Making company_id NOT NULL...';
        ALTER TABLE suppliers ALTER COLUMN company_id SET NOT NULL;
    ELSE
        RAISE NOTICE '  company_id is already NOT NULL';
    END IF;
    
    -- Add foreign key constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'suppliers' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'suppliers_company_id_foreign'
    ) THEN
        RAISE NOTICE '  Adding foreign key constraint...';
        ALTER TABLE suppliers 
        ADD CONSTRAINT suppliers_company_id_foreign 
        FOREIGN KEY (company_id) REFERENCES companies(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    ELSE
        RAISE NOTICE '  Foreign key constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- PRODUCTS Table Constraints
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Processing products table...';
    
    -- Make company_id NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'company_id' 
        AND is_nullable = 'YES'
    ) THEN
        RAISE NOTICE '  Making company_id NOT NULL...';
        ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
    ELSE
        RAISE NOTICE '  company_id is already NOT NULL';
    END IF;
    
    -- Add foreign key constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'products_company_id_foreign'
    ) THEN
        RAISE NOTICE '  Adding foreign key constraint...';
        ALTER TABLE products 
        ADD CONSTRAINT products_company_id_foreign 
        FOREIGN KEY (company_id) REFERENCES companies(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    ELSE
        RAISE NOTICE '  Foreign key constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- INVOICES Table Constraints
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Processing invoices table...';
    
    -- Make company_id NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'company_id' 
        AND is_nullable = 'YES'
    ) THEN
        RAISE NOTICE '  Making company_id NOT NULL...';
        ALTER TABLE invoices ALTER COLUMN company_id SET NOT NULL;
    ELSE
        RAISE NOTICE '  company_id is already NOT NULL';
    END IF;
    
    -- Add foreign key constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'invoices' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'invoices_company_id_foreign'
    ) THEN
        RAISE NOTICE '  Adding foreign key constraint...';
        ALTER TABLE invoices 
        ADD CONSTRAINT invoices_company_id_foreign 
        FOREIGN KEY (company_id) REFERENCES companies(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    ELSE
        RAISE NOTICE '  Foreign key constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- SALES_ORDERS Table Constraints
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Processing sales_orders table...';
    
    -- company_id should already be NOT NULL, but check anyway
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' 
        AND column_name = 'company_id' 
        AND is_nullable = 'YES'
    ) THEN
        RAISE NOTICE '  Making company_id NOT NULL...';
        ALTER TABLE sales_orders ALTER COLUMN company_id SET NOT NULL;
    ELSE
        RAISE NOTICE '  company_id is already NOT NULL';
    END IF;
    
    -- Add foreign key constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sales_orders' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'sales_orders_company_id_foreign'
    ) THEN
        RAISE NOTICE '  Adding foreign key constraint...';
        ALTER TABLE sales_orders 
        ADD CONSTRAINT sales_orders_company_id_foreign 
        FOREIGN KEY (company_id) REFERENCES companies(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    ELSE
        RAISE NOTICE '  Foreign key constraint already exists';
    END IF;
END $$;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Verifying constraints...';
    
    -- Check NOT NULL constraints
    FOR rec IN 
        SELECT table_name, column_name, is_nullable
        FROM information_schema.columns 
        WHERE table_name IN ('customers', 'suppliers', 'products', 'sales_orders', 'invoices')
        AND column_name = 'company_id'
        AND table_schema = 'public'
        ORDER BY table_name
    LOOP
        RAISE NOTICE '  %: company_id nullable = %', rec.table_name, rec.is_nullable;
    END LOOP;
    
    -- Check foreign key constraints
    FOR rec IN
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('customers', 'suppliers', 'products', 'sales_orders', 'invoices')
        AND tc.constraint_name LIKE '%company_id_foreign'
        ORDER BY tc.table_name
    LOOP
        RAISE NOTICE '  %: FK constraint = %', rec.table_name, rec.constraint_name;
    END LOOP;
END $$;

-- Commit transaction
COMMIT;

RAISE NOTICE 'Schema constraints enforcement completed successfully!';