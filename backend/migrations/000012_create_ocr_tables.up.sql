-- Create OCR documents table
CREATE TABLE IF NOT EXISTS ocr_documents (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('invoice', 'receipt', 'contract', 'menu', 'business_card', 'purchase_order', 'delivery_note', 'quotation', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'verified')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create OCR results table
CREATE TABLE IF NOT EXISTS ocr_results (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES ocr_documents(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    structured_data JSONB,
    confidence DECIMAL(5,4) NOT NULL DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
    language VARCHAR(10) NOT NULL DEFAULT 'zh-TW',
    processing_time BIGINT NOT NULL DEFAULT 0, -- in milliseconds
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(document_id) -- One result per document
);

-- Create OCR templates table
CREATE TABLE IF NOT EXISTS ocr_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('invoice', 'receipt', 'contract', 'menu', 'business_card', 'purchase_order', 'delivery_note', 'quotation', 'other')),
    description TEXT,
    fields JSONB, -- JSON configuration for field extraction
    rules JSONB,  -- JSON configuration for processing rules
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create OCR verification logs table for audit trail
CREATE TABLE IF NOT EXISTS ocr_verification_logs (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES ocr_documents(id) ON DELETE CASCADE,
    verified_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_data JSONB,
    verified_data JSONB,
    is_accurate BOOLEAN NOT NULL,
    correction_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ocr_documents_status ON ocr_documents(status);
CREATE INDEX IF NOT EXISTS idx_ocr_documents_document_type ON ocr_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_ocr_documents_created_by ON ocr_documents(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_documents_created_at ON ocr_documents(created_at);

CREATE INDEX IF NOT EXISTS idx_ocr_results_document_id ON ocr_results(document_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_confidence ON ocr_results(confidence);
CREATE INDEX IF NOT EXISTS idx_ocr_results_language ON ocr_results(language);

CREATE INDEX IF NOT EXISTS idx_ocr_templates_document_type ON ocr_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_ocr_templates_is_active ON ocr_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_ocr_templates_created_by ON ocr_templates(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_ocr_verification_logs_document_id ON ocr_verification_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_ocr_verification_logs_verified_by ON ocr_verification_logs(verified_by_user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_verification_logs_verified_at ON ocr_verification_logs(verified_at);

-- Add triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ocr_documents_updated_at BEFORE UPDATE ON ocr_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocr_results_updated_at BEFORE UPDATE ON ocr_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocr_templates_updated_at BEFORE UPDATE ON ocr_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default templates
INSERT INTO ocr_templates (name, document_type, description, fields, rules, created_by_user_id) VALUES
('Default Invoice Template', 'invoice', 'Standard invoice processing template', 
 '{"invoice_number": {"required": true, "type": "string"}, "invoice_date": {"required": true, "type": "date"}, "total_amount": {"required": true, "type": "number"}, "supplier_name": {"required": true, "type": "string"}}',
 '{"confidence_threshold": 0.8, "auto_verify": false}',
 1),
('Default Receipt Template', 'receipt', 'Standard receipt processing template',
 '{"receipt_number": {"required": false, "type": "string"}, "date": {"required": true, "type": "date"}, "total_amount": {"required": true, "type": "number"}, "store_name": {"required": false, "type": "string"}}',
 '{"confidence_threshold": 0.7, "auto_verify": false}',
 1),
('Default Business Card Template', 'business_card', 'Standard business card processing template',
 '{"name": {"required": true, "type": "string"}, "company": {"required": false, "type": "string"}, "email": {"required": false, "type": "email"}, "phone": {"required": false, "type": "phone"}}',
 '{"confidence_threshold": 0.6, "auto_verify": false}',
 1);