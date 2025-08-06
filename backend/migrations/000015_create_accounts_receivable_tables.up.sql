-- Extend invoices table to support both purchase and sales invoices
ALTER TABLE invoices 
  ADD COLUMN invoice_type VARCHAR(20) DEFAULT 'purchase' CHECK (invoice_type IN ('purchase', 'sales')),
  ADD COLUMN customer_id BIGINT,
  ADD COLUMN sales_order_id BIGINT;

-- Add foreign key constraints for customer and sales order
ALTER TABLE invoices 
  ADD CONSTRAINT fk_invoices_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id),
  ADD CONSTRAINT fk_invoices_sales_order_id FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id);

-- Modify the supplier_id constraint to be nullable for sales invoices
ALTER TABLE invoices 
  ALTER COLUMN supplier_id DROP NOT NULL;

-- Add check constraint to ensure either supplier_id (for purchase) or customer_id (for sales) is provided
ALTER TABLE invoices 
  ADD CONSTRAINT check_invoice_entity CHECK (
    (invoice_type = 'purchase' AND supplier_id IS NOT NULL AND customer_id IS NULL) OR
    (invoice_type = 'sales' AND customer_id IS NOT NULL AND supplier_id IS NULL)
  );

-- Create accounts_receivable table
CREATE TABLE accounts_receivable (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    amount_due DECIMAL(15,2) NOT NULL,
    balance_due DECIMAL(15,2) NOT NULL,
    currency_id BIGINT NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'partially_paid', 'paid', 'overdue', 'disputed', 'written_off')),
    aging_bucket VARCHAR(20),
    terms VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_accounts_receivable_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    CONSTRAINT fk_accounts_receivable_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_accounts_receivable_currency_id FOREIGN KEY (currency_id) REFERENCES currencies(id),
    
    -- Ensure balance_due doesn't exceed amount_due
    CONSTRAINT check_balance_due CHECK (balance_due <= amount_due AND balance_due >= 0)
);

-- Create customer_payments table
CREATE TABLE customer_payments (
    id BIGSERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency_id BIGINT NOT NULL,
    exchange_rate DECIMAL(15,6) DEFAULT 1.0,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'check', 'cash', 'credit_card', 'wire_transfer', 'ach', 'online_payment')),
    reference_number VARCHAR(100),
    bank_account VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    unapplied_amount DECIMAL(15,2) DEFAULT 0,
    created_by_user_id BIGINT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_customer_payments_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_customer_payments_currency_id FOREIGN KEY (currency_id) REFERENCES currencies(id),
    CONSTRAINT fk_customer_payments_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    
    -- Ensure amount is positive
    CONSTRAINT check_payment_amount CHECK (amount > 0),
    -- Ensure unapplied amount doesn't exceed total amount
    CONSTRAINT check_unapplied_amount CHECK (unapplied_amount >= 0 AND unapplied_amount <= amount)
);

-- Create customer_payment_allocations table to link payments to specific invoices
CREATE TABLE customer_payment_allocations (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    accounts_receivable_id BIGINT NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL,
    allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_customer_payment_allocations_payment_id FOREIGN KEY (payment_id) REFERENCES customer_payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_payment_allocations_ar_id FOREIGN KEY (accounts_receivable_id) REFERENCES accounts_receivable(id),
    
    -- Ensure allocated amount is positive
    CONSTRAINT check_allocated_amount CHECK (allocated_amount > 0),
    
    -- Unique constraint to prevent duplicate allocations
    UNIQUE(payment_id, accounts_receivable_id)
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_invoice_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_sales_order_id ON invoices(sales_order_id);

CREATE INDEX idx_accounts_receivable_invoice_id ON accounts_receivable(invoice_id);
CREATE INDEX idx_accounts_receivable_customer_id ON accounts_receivable(customer_id);
CREATE INDEX idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX idx_accounts_receivable_aging_bucket ON accounts_receivable(aging_bucket);

CREATE INDEX idx_customer_payments_customer_id ON customer_payments(customer_id);
CREATE INDEX idx_customer_payments_payment_date ON customer_payments(payment_date);
CREATE INDEX idx_customer_payments_status ON customer_payments(status);
CREATE INDEX idx_customer_payments_payment_number ON customer_payments(payment_number);

CREATE INDEX idx_customer_payment_allocations_payment_id ON customer_payment_allocations(payment_id);
CREATE INDEX idx_customer_payment_allocations_ar_id ON customer_payment_allocations(accounts_receivable_id);

-- Create triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_accounts_receivable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_accounts_receivable_updated_at
    BEFORE UPDATE ON accounts_receivable
    FOR EACH ROW
    EXECUTE FUNCTION update_accounts_receivable_updated_at();

CREATE OR REPLACE FUNCTION update_customer_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customer_payments_updated_at
    BEFORE UPDATE ON customer_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_payments_updated_at();

-- Function to generate unique customer payment numbers
CREATE OR REPLACE FUNCTION generate_customer_payment_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_payment_number VARCHAR(50);
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 5) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM customer_payments
    WHERE payment_number LIKE 'CPAY' || year_part || '%';
    
    new_payment_number := 'CPAY' || year_part || LPAD(sequence_part::VARCHAR, 6, '0');
    
    RETURN new_payment_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate customer payment numbers
CREATE OR REPLACE FUNCTION auto_generate_customer_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
        NEW.payment_number := generate_customer_payment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_customer_payment_number
    BEFORE INSERT ON customer_payments
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_customer_payment_number();

-- Function to create accounts receivable record when sales invoice is approved
CREATE OR REPLACE FUNCTION create_accounts_receivable_on_sales_invoice_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create AR record for sales invoices when status changes to 'approved'
    IF NEW.invoice_type = 'sales' AND NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO accounts_receivable (
            invoice_id,
            customer_id,
            amount_due,
            balance_due,
            currency_id,
            due_date,
            terms,
            status
        ) VALUES (
            NEW.id,
            NEW.customer_id,
            NEW.total_amount,
            NEW.total_amount,
            NEW.currency_id,
            NEW.due_date,
            NEW.payment_terms,
            'open'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_accounts_receivable_on_sales_invoice_approval
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION create_accounts_receivable_on_sales_invoice_approval();

-- Function to update AR aging buckets
CREATE OR REPLACE FUNCTION update_ar_aging_bucket()
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
    
    -- Update status to overdue if balance_due > 0 and past due date
    IF NEW.balance_due > 0 AND days_overdue > 0 AND NEW.status = 'open' THEN
        NEW.status := 'overdue';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ar_aging_bucket
    BEFORE INSERT OR UPDATE ON accounts_receivable
    FOR EACH ROW
    EXECUTE FUNCTION update_ar_aging_bucket();

-- Function to update accounts receivable when customer payments are allocated
CREATE OR REPLACE FUNCTION update_ar_on_customer_payment_allocation()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(15,2);
    ar_record RECORD;
    invoice_total_paid DECIMAL(15,2);
BEGIN
    -- For insert/update operations
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Calculate total paid amount for the AR record
        SELECT COALESCE(SUM(allocated_amount), 0)
        INTO total_paid
        FROM customer_payment_allocations
        WHERE accounts_receivable_id = NEW.accounts_receivable_id;
        
        -- Get the AR record
        SELECT * INTO ar_record
        FROM accounts_receivable
        WHERE id = NEW.accounts_receivable_id;
        
        -- Update accounts receivable record
        UPDATE accounts_receivable
        SET balance_due = amount_due - total_paid,
            status = CASE
                WHEN total_paid = 0 THEN 'open'
                WHEN total_paid < amount_due THEN 'partially_paid'
                WHEN total_paid = amount_due THEN 'paid'
                ELSE 'overpaid'
            END
        WHERE id = NEW.accounts_receivable_id;
        
        -- Calculate total paid for the entire invoice (sum across all AR records for this invoice)
        SELECT COALESCE(SUM(amount_due - balance_due), 0)
        INTO invoice_total_paid
        FROM accounts_receivable
        WHERE invoice_id = ar_record.invoice_id;
        
        -- Update invoice status
        UPDATE invoices
        SET status = CASE
            WHEN invoice_total_paid = 0 THEN 'approved'
            WHEN invoice_total_paid < total_amount THEN 'partially_paid'
            WHEN invoice_total_paid = total_amount THEN 'paid'
            ELSE 'overpaid'
        END
        WHERE id = ar_record.invoice_id;
        
    -- For delete operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Calculate total paid amount for the AR record after deletion
        SELECT COALESCE(SUM(allocated_amount), 0)
        INTO total_paid
        FROM customer_payment_allocations
        WHERE accounts_receivable_id = OLD.accounts_receivable_id;
        
        -- Get the AR record
        SELECT * INTO ar_record
        FROM accounts_receivable
        WHERE id = OLD.accounts_receivable_id;
        
        -- Update accounts receivable record
        UPDATE accounts_receivable
        SET balance_due = amount_due - total_paid,
            status = CASE
                WHEN total_paid = 0 THEN 'open'
                WHEN total_paid < amount_due THEN 'partially_paid'
                WHEN total_paid = amount_due THEN 'paid'
                ELSE 'overpaid'
            END
        WHERE id = OLD.accounts_receivable_id;
        
        -- Calculate total paid for the entire invoice after deletion
        SELECT COALESCE(SUM(amount_due - balance_due), 0)
        INTO invoice_total_paid
        FROM accounts_receivable
        WHERE invoice_id = ar_record.invoice_id;
        
        -- Update invoice status
        UPDATE invoices
        SET status = CASE
            WHEN invoice_total_paid = 0 THEN 'approved'
            WHEN invoice_total_paid < total_amount THEN 'partially_paid'
            WHEN invoice_total_paid = total_amount THEN 'paid'
            ELSE 'overpaid'
        END
        WHERE id = ar_record.invoice_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ar_on_customer_payment_allocation
    AFTER INSERT OR UPDATE OR DELETE ON customer_payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_ar_on_customer_payment_allocation();

-- Function to update customer payment unapplied amount
CREATE OR REPLACE FUNCTION update_customer_payment_unapplied_amount()
RETURNS TRIGGER AS $$
DECLARE
    total_allocated DECIMAL(15,2);
    payment_amount DECIMAL(15,2);
    payment_id_val BIGINT;
BEGIN
    -- Get the payment ID
    IF TG_OP = 'DELETE' THEN
        payment_id_val := OLD.payment_id;
    ELSE
        payment_id_val := NEW.payment_id;
    END IF;
    
    -- Calculate total allocated amount for this payment
    SELECT COALESCE(SUM(allocated_amount), 0)
    INTO total_allocated
    FROM customer_payment_allocations
    WHERE payment_id = payment_id_val;
    
    -- Get payment amount
    SELECT amount INTO payment_amount
    FROM customer_payments
    WHERE id = payment_id_val;
    
    -- Update unapplied amount
    UPDATE customer_payments
    SET unapplied_amount = payment_amount - total_allocated
    WHERE id = payment_id_val;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_payment_unapplied_amount
    AFTER INSERT OR UPDATE OR DELETE ON customer_payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_payment_unapplied_amount();

-- Function to automatically generate sales invoices when sales orders are shipped
CREATE OR REPLACE FUNCTION auto_generate_sales_invoice_on_shipment()
RETURNS TRIGGER AS $$
DECLARE
    invoice_id BIGINT;
    so_item RECORD;
BEGIN
    -- Only create invoice when status changes to 'shipped' or 'completed'
    IF NEW.status IN ('shipped', 'completed') AND OLD.status NOT IN ('shipped', 'completed') THEN
        -- Create the sales invoice
        INSERT INTO invoices (
            invoice_type,
            customer_id,
            sales_order_id,
            invoice_date,
            due_date,
            currency_id,
            status,
            payment_terms,
            description,
            created_by_user_id
        ) VALUES (
            'sales',
            NEW.customer_id,
            NEW.id,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days', -- Default 30 days payment terms
            NEW.currency_id,
            'draft',
            '30 days',
            'Sales Invoice for Order ' || NEW.order_number,
            NEW.user_id
        ) RETURNING id INTO invoice_id;
        
        -- Copy sales order items to invoice items
        FOR so_item IN 
            SELECT product_id, quantity, unit_price, total_price
            FROM sales_order_items 
            WHERE sales_order_id = NEW.id
        LOOP
            INSERT INTO invoice_items (
                invoice_id,
                product_id,
                description,
                quantity,
                unit_price,
                line_total,
                tax_rate,
                tax_amount
            ) 
            SELECT 
                invoice_id,
                so_item.product_id,
                p.name,
                so_item.quantity,
                so_item.unit_price,
                so_item.total_price,
                0, -- Default tax rate, can be customized
                0  -- Will be calculated if tax rate is set
            FROM products p 
            WHERE p.id = so_item.product_id;
        END LOOP;
        
        -- Auto-approve the invoice (can be changed to require manual approval)
        UPDATE invoices 
        SET status = 'approved' 
        WHERE id = invoice_id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_sales_invoice_on_shipment
    AFTER UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_sales_invoice_on_shipment();