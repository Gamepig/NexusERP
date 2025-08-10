## 資料庫設計（表與欄位）

重點原則：命名小寫底線、強制 `company_id` 行級隔離、時間戳欄位、必要索引與外鍵、RLS 啟用與上下文注入。

### 1) 企業與組織
- `companies`
  - id (bigint, PK)
  - name (text, not null)
  - status (text: active/inactive)
  - created_at / updated_at / deleted_at
- `business_units`
  - id, company_id (FK companies.id, index (company_id))
  - name, industry_tag
  - created_at / updated_at / deleted_at
- `user_companies`
  - id, user_id, company_id, is_active
  - unique (user_id, company_id)

### 2) 主檔與庫存
- `products`
  - id, company_id, name, sku, description, price, cost, category_id, unit_id
  - attributes (jsonb), status (text)
  - indexes: (company_id), (company_id, status)
- `warehouses`
  - id, company_id, name, location
- `inventory_levels`
  - id, company_id, product_id, warehouse_id, quantity_on_hand, reserved_quantity, reorder_level
  - indexes: (company_id, product_id), (company_id, warehouse_id)
- `inventory_transactions`
  - id, company_id, product_id, warehouse_id, transaction_type, quantity, unit_cost, reference_type, reference_id, transaction_date
  - indexes: (company_id, product_id), (company_id, transaction_date)

### 3) 客戶/供應商與交易
- `customers`
  - id, company_id, name, tax_id, phone, email, address (jsonb), status
- `suppliers`
  - id, company_id, name, tax_id, contact_person, phone, email, address (jsonb), status
- `sales_orders`
  - id, company_id, order_number, customer_id, order_date, delivery_date, status, total_amount, tax_amount, grand_total
- `sales_order_items`
  - id, company_id, sales_order_id, product_id, quantity, unit_price, discount_percent, line_total

### 4) 財務（摘錄）
- `accounts_receivable`, `accounts_payable`, `invoices`, `invoice_items`, `financial_transactions`
  - 一律含 `company_id` 與必要外鍵，並建立 `(company_id, frequently_used_field)` 複合索引

### 5) 多租戶安全（RLS）
- 所有業務表：ENABLE RLS；策略以 `company_id = current_setting('app.current_company_id')::bigint` 為核心
- 驗證函數：`validate_rls_context()`、`user_belongs_to_company()`
- 觸發器：`emergency_security_check_*` 於關鍵表 INSERT/UPDATE/DELETE 前檢查

參考：`database/migrations/2025_08_02_100000_fix_rls_security_issues.sql`、`memory-bank/systemPatterns.md`。


