-- Create currencies table for multi-currency support
CREATE TABLE currencies (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1.0,
    is_base_currency BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_order_id BIGINT,
    supplier_id BIGINT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency_id BIGINT NOT NULL,
    exchange_rate DECIMAL(15,6) DEFAULT 1.0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    payment_terms VARCHAR(255),
    description TEXT,
    notes TEXT,
    attachment_url VARCHAR(500),
    created_by_user_id BIGINT,
    approved_by_user_id BIGINT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_invoices_purchase_order_id FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_invoices_supplier_id FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_invoices_currency_id FOREIGN KEY (currency_id) REFERENCES currencies(id),
    CONSTRAINT fk_invoices_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    CONSTRAINT fk_invoices_approved_by_user_id FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
);

-- Create invoice_items table for line items
CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    product_id BIGINT,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(15,3) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_invoice_items_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_items_product_id FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create accounts_payable table
CREATE TABLE accounts_payable (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency_id BIGINT NOT NULL,
    due_date DATE NOT NULL,
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'overdue', 'disputed', 'cancelled')),
    aging_bucket VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_accounts_payable_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    CONSTRAINT fk_accounts_payable_supplier_id FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_accounts_payable_currency_id FOREIGN KEY (currency_id) REFERENCES currencies(id),
    
    -- Ensure paid amount doesn't exceed total amount
    CONSTRAINT check_paid_amount CHECK (paid_amount <= amount),
    -- Ensure outstanding amount is correct
    CONSTRAINT check_outstanding_amount CHECK (outstanding_amount = amount - paid_amount)
);

-- Create payments table
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    currency_id BIGINT NOT NULL,
    exchange_rate DECIMAL(15,6) DEFAULT 1.0,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'check', 'cash', 'credit_card', 'wire_transfer', 'ach')),
    reference_number VARCHAR(100),
    bank_account VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    created_by_user_id BIGINT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_payments_supplier_id FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_payments_currency_id FOREIGN KEY (currency_id) REFERENCES currencies(id),
    CONSTRAINT fk_payments_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- Create payment_allocations table to link payments to specific invoices
CREATE TABLE payment_allocations (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    invoice_id BIGINT NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_payment_allocations_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_allocations_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    
    -- Ensure allocated amount is positive
    CONSTRAINT check_allocated_amount CHECK (allocated_amount > 0),
    
    -- Unique constraint to prevent duplicate allocations
    UNIQUE(payment_id, invoice_id)
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX idx_invoices_purchase_order_id ON invoices(purchase_order_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_currency_id ON invoices(currency_id);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

CREATE INDEX idx_accounts_payable_invoice_id ON accounts_payable(invoice_id);
CREATE INDEX idx_accounts_payable_supplier_id ON accounts_payable(supplier_id);
CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX idx_accounts_payable_due_date ON accounts_payable(due_date);

CREATE INDEX idx_payments_supplier_id ON payments(supplier_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_number ON payments(payment_number);

CREATE INDEX idx_payment_allocations_payment_id ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice_id ON payment_allocations(invoice_id);

-- Create triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_currencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_currencies_updated_at
    BEFORE UPDATE ON currencies
    FOR EACH ROW
    EXECUTE FUNCTION update_currencies_updated_at();

CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoices_updated_at();

CREATE OR REPLACE FUNCTION update_invoice_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoice_items_updated_at
    BEFORE UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_items_updated_at();

CREATE OR REPLACE FUNCTION update_accounts_payable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_accounts_payable_updated_at
    BEFORE UPDATE ON accounts_payable
    FOR EACH ROW
    EXECUTE FUNCTION update_accounts_payable_updated_at();

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Function to generate unique invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_invoice_number VARCHAR(50);
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 4) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM invoices
    WHERE invoice_number LIKE 'INV' || year_part || '%';
    
    new_invoice_number := 'INV' || year_part || LPAD(sequence_part::VARCHAR, 6, '0');
    
    RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_invoice_number();

-- Function to generate unique payment numbers
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_payment_number VARCHAR(50);
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 4) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM payments
    WHERE payment_number LIKE 'PAY' || year_part || '%';
    
    new_payment_number := 'PAY' || year_part || LPAD(sequence_part::VARCHAR, 6, '0');
    
    RETURN new_payment_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate payment numbers
CREATE OR REPLACE FUNCTION auto_generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
        NEW.payment_number := generate_payment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_payment_number
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_payment_number();

-- Function to update invoice totals when items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    new_subtotal DECIMAL(15,2);
    new_tax_amount DECIMAL(15,2);
    new_total_amount DECIMAL(15,2);
    invoice_id_val BIGINT;
BEGIN
    -- Get the invoice ID
    IF TG_OP = 'DELETE' THEN
        invoice_id_val := OLD.invoice_id;
    ELSE
        invoice_id_val := NEW.invoice_id;
    END IF;
    
    -- Calculate new totals
    SELECT COALESCE(SUM(line_total), 0), COALESCE(SUM(tax_amount), 0)
    INTO new_subtotal, new_tax_amount
    FROM invoice_items
    WHERE invoice_id = invoice_id_val;
    
    new_total_amount := new_subtotal + new_tax_amount;
    
    -- Update the invoice
    UPDATE invoices
    SET subtotal = new_subtotal,
        tax_amount = new_tax_amount,
        total_amount = new_total_amount
    WHERE id = invoice_id_val;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_totals
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

-- Function to create accounts payable record when invoice is approved
CREATE OR REPLACE FUNCTION create_accounts_payable_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create AP record when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO accounts_payable (
            invoice_id,
            supplier_id,
            amount,
            currency_id,
            due_date,
            outstanding_amount
        ) VALUES (
            NEW.id,
            NEW.supplier_id,
            NEW.total_amount,
            NEW.currency_id,
            NEW.due_date,
            NEW.total_amount
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_accounts_payable_on_approval
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION create_accounts_payable_on_approval();

-- Function to update aging buckets
CREATE OR REPLACE FUNCTION update_aging_bucket()
RETURNS TRIGGER AS $$
DECLARE
    days_overdue INTEGER;
BEGIN
    days_overdue := CURRENT_DATE - NEW.due_date;
    
    IF days_overdue <= 0 THEN
        NEW.aging_bucket := 'current';
    ELSIF days_overdue <= 30 THEN
        NEW.aging_bucket := '1-30_days';
    ELSIF days_overdue <= 60 THEN
        NEW.aging_bucket := '31-60_days';
    ELSIF days_overdue <= 90 THEN
        NEW.aging_bucket := '61-90_days';
    ELSE
        NEW.aging_bucket := 'over_90_days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_aging_bucket
    BEFORE INSERT OR UPDATE ON accounts_payable
    FOR EACH ROW
    EXECUTE FUNCTION update_aging_bucket();

-- Function to update accounts payable when payments are allocated
CREATE OR REPLACE FUNCTION update_ap_on_payment_allocation()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(15,2);
    ap_record RECORD;
BEGIN
    -- Calculate total paid amount for the invoice
    SELECT COALESCE(SUM(allocated_amount), 0)
    INTO total_paid
    FROM payment_allocations
    WHERE invoice_id = NEW.invoice_id;
    
    -- Get the AP record
    SELECT * INTO ap_record
    FROM accounts_payable
    WHERE invoice_id = NEW.invoice_id;
    
    -- Update accounts payable record
    UPDATE accounts_payable
    SET paid_amount = total_paid,
        outstanding_amount = amount - total_paid,
        status = CASE
            WHEN total_paid = 0 THEN 'pending'
            WHEN total_paid < amount THEN 'partially_paid'
            WHEN total_paid = amount THEN 'paid'
            ELSE 'overpaid'
        END
    WHERE invoice_id = NEW.invoice_id;
    
    -- Update invoice status
    UPDATE invoices
    SET status = CASE
        WHEN total_paid = 0 THEN 'approved'
        WHEN total_paid < total_amount THEN 'partially_paid'
        WHEN total_paid = total_amount THEN 'paid'
        ELSE 'overpaid'
    END
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ap_on_payment_allocation
    AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_ap_on_payment_allocation();

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, is_base_currency, is_active) VALUES
('USD', 'US Dollar', '$', TRUE, TRUE),
('EUR', 'Euro', '€', FALSE, TRUE),
('GBP', 'British Pound', '£', FALSE, TRUE),
('JPY', 'Japanese Yen', '¥', FALSE, TRUE),
('CAD', 'Canadian Dollar', 'C$', FALSE, TRUE),
('AUD', 'Australian Dollar', 'A$', FALSE, TRUE),
('CHF', 'Swiss Franc', 'CHF', FALSE, TRUE),
('CNY', 'Chinese Yuan', '¥', FALSE, TRUE),
('INR', 'Indian Rupee', '₹', FALSE, TRUE),
('TWD', 'Taiwan Dollar', 'NT$', FALSE, TRUE);