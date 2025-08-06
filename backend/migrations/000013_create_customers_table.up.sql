-- Create customers table for CRM module
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    customer_code VARCHAR(32) UNIQUE NOT NULL, -- Unique customer identifier (e.g., C001, C002)
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    customer_type VARCHAR(32) DEFAULT 'individual', -- 'individual', 'business', 'organization'
    status VARCHAR(16) DEFAULT 'active', -- 'active', 'inactive', 'blacklisted'
    
    -- Primary contact information
    primary_email VARCHAR(128),
    primary_phone VARCHAR(32),
    
    -- Address information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(128),
    state VARCHAR(128),
    postal_code VARCHAR(32),
    country VARCHAR(64) DEFAULT 'Taiwan',
    
    -- Business information
    tax_id VARCHAR(32), -- Business tax ID or personal ID
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    credit_used DECIMAL(15,2) DEFAULT 0.00,
    payment_terms INTEGER DEFAULT 30, -- Payment terms in days
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Classification and segmentation
    industry VARCHAR(128),
    customer_segment VARCHAR(64), -- 'premium', 'standard', 'budget'
    lead_source VARCHAR(64), -- How customer was acquired
    assigned_sales_rep_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Additional metadata
    notes TEXT,
    tags JSONB, -- Flexible tagging system
    custom_fields JSONB, -- Additional custom fields for different business needs
    
    -- Timestamps
    first_purchase_date DATE,
    last_purchase_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for customer table
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(primary_email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(primary_phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_tax_id ON customers(tax_id);
CREATE INDEX IF NOT EXISTS idx_customers_sales_rep ON customers(assigned_sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(customer_segment);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(id) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create customer_contacts table for multiple contacts per customer
CREATE TABLE IF NOT EXISTS customer_contacts (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contact_type VARCHAR(32) DEFAULT 'general', -- 'primary', 'billing', 'shipping', 'technical', 'sales'
    
    -- Contact person information
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    title VARCHAR(128), -- Job title
    department VARCHAR(128),
    
    -- Contact details
    email VARCHAR(128),
    phone VARCHAR(32),
    mobile VARCHAR(32),
    fax VARCHAR(32),
    
    -- Address (if different from customer)
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(128),
    state VARCHAR(128),
    postal_code VARCHAR(32),
    country VARCHAR(64),
    
    -- Contact preferences
    is_primary BOOLEAN DEFAULT false,
    receive_marketing BOOLEAN DEFAULT true,
    receive_invoices BOOLEAN DEFAULT false,
    receive_shipping_updates BOOLEAN DEFAULT false,
    preferred_contact_method VARCHAR(16) DEFAULT 'email', -- 'email', 'phone', 'sms'
    
    -- Additional information
    notes TEXT,
    tags JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for customer_contacts table
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_email ON customer_contacts(email);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_phone ON customer_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_type ON customer_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_primary ON customer_contacts(customer_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_customer_contacts_active ON customer_contacts(id) WHERE deleted_at IS NULL;

-- Create trigger for customer_contacts updated_at
CREATE TRIGGER update_customer_contacts_updated_at
    BEFORE UPDATE ON customer_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create customer_activities table for tracking interactions and history
CREATE TABLE IF NOT EXISTS customer_activities (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contact_id BIGINT REFERENCES customer_contacts(id) ON DELETE SET NULL,
    
    -- Activity information
    activity_type VARCHAR(32) NOT NULL, -- 'call', 'email', 'meeting', 'quote', 'order', 'payment', 'complaint', 'support'
    activity_subtype VARCHAR(64), -- More specific categorization
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Activity status and priority
    status VARCHAR(16) DEFAULT 'completed', -- 'planned', 'in_progress', 'completed', 'cancelled'
    priority VARCHAR(16) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- Related information
    related_document_type VARCHAR(32), -- 'quote', 'order', 'invoice', 'ticket'
    related_document_id BIGINT,
    
    -- People involved
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER, -- For calls and meetings
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- Additional metadata
    tags JSONB,
    custom_fields JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for customer_activities table
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_contact_id ON customer_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_type ON customer_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_activities_status ON customer_activities(status);
CREATE INDEX IF NOT EXISTS idx_customer_activities_priority ON customer_activities(priority);
CREATE INDEX IF NOT EXISTS idx_customer_activities_created_by ON customer_activities(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_assigned_to ON customer_activities(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_scheduled ON customer_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_customer_activities_completed ON customer_activities(completed_at);
CREATE INDEX IF NOT EXISTS idx_customer_activities_follow_up ON customer_activities(follow_up_date) WHERE follow_up_required = true;
CREATE INDEX IF NOT EXISTS idx_customer_activities_related_doc ON customer_activities(related_document_type, related_document_id);

-- Create trigger for customer_activities updated_at
CREATE TRIGGER update_customer_activities_updated_at
    BEFORE UPDATE ON customer_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create customer credit tracking table
CREATE TABLE IF NOT EXISTS customer_credit_history (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Credit change information
    change_type VARCHAR(16) NOT NULL, -- 'increase', 'decrease', 'adjustment'
    amount DECIMAL(15,2) NOT NULL,
    previous_limit DECIMAL(15,2) NOT NULL,
    new_limit DECIMAL(15,2) NOT NULL,
    
    -- Reason and documentation
    reason VARCHAR(255) NOT NULL,
    reference_document_type VARCHAR(32),
    reference_document_id BIGINT,
    
    -- Approval workflow
    requested_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional information
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for customer_credit_history table
CREATE INDEX IF NOT EXISTS idx_customer_credit_history_customer_id ON customer_credit_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_history_type ON customer_credit_history(change_type);
CREATE INDEX IF NOT EXISTS idx_customer_credit_history_requested_by ON customer_credit_history(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_history_approved_by ON customer_credit_history(approved_by_user_id);

-- Insert default customer segments
INSERT INTO roles (name, description) VALUES 
    ('customer_manager', 'Customer relationship manager'),
    ('sales_rep', 'Sales representative')
ON CONFLICT (name) DO NOTHING;

-- Insert sample customer types and segments for reference
COMMENT ON COLUMN customers.customer_type IS 'Customer type: individual, business, organization';
COMMENT ON COLUMN customers.status IS 'Customer status: active, inactive, blacklisted';
COMMENT ON COLUMN customers.customer_segment IS 'Customer segment: premium, standard, budget, vip';
COMMENT ON COLUMN customer_contacts.contact_type IS 'Contact type: primary, billing, shipping, technical, sales, support';
COMMENT ON COLUMN customer_activities.activity_type IS 'Activity type: call, email, meeting, quote, order, payment, complaint, support, note';
COMMENT ON COLUMN customer_activities.status IS 'Activity status: planned, in_progress, completed, cancelled';
COMMENT ON COLUMN customer_activities.priority IS 'Priority level: low, medium, high, urgent';