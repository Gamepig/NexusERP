-- Drop triggers
DROP TRIGGER IF EXISTS update_ocr_templates_updated_at ON ocr_templates;
DROP TRIGGER IF EXISTS update_ocr_results_updated_at ON ocr_results;
DROP TRIGGER IF EXISTS update_ocr_documents_updated_at ON ocr_documents;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_ocr_verification_logs_verified_at;
DROP INDEX IF EXISTS idx_ocr_verification_logs_verified_by;
DROP INDEX IF EXISTS idx_ocr_verification_logs_document_id;

DROP INDEX IF EXISTS idx_ocr_templates_created_by;
DROP INDEX IF EXISTS idx_ocr_templates_is_active;
DROP INDEX IF EXISTS idx_ocr_templates_document_type;

DROP INDEX IF EXISTS idx_ocr_results_language;
DROP INDEX IF EXISTS idx_ocr_results_confidence;
DROP INDEX IF EXISTS idx_ocr_results_document_id;

DROP INDEX IF EXISTS idx_ocr_documents_created_at;
DROP INDEX IF EXISTS idx_ocr_documents_created_by;
DROP INDEX IF EXISTS idx_ocr_documents_document_type;
DROP INDEX IF EXISTS idx_ocr_documents_status;

-- Drop tables in reverse order
DROP TABLE IF EXISTS ocr_verification_logs;
DROP TABLE IF EXISTS ocr_templates;
DROP TABLE IF EXISTS ocr_results;
DROP TABLE IF EXISTS ocr_documents;