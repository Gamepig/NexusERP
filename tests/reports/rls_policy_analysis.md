# Row Level Security (RLS) Policy Analysis Report

## Database Configuration
- **Database**: nexus_erp (PostgreSQL 16)
- **Host**: localhost:5432 (Docker container: nexus-postgres)
- **RLS Global Setting**: ENABLED (row_security = on)

## RLS Status Summary

### Tables with RLS Enabled (17 tables)
**✅ Tables with RLS + Policies (17 tables):**
1. `accounts_payable` - Company isolation policy
2. `accounts_receivable` - Company isolation policy  
3. `attendance` - Company isolation policy
4. `customer_payment_allocations` - Company isolation policy
5. `customer_payments` - Company isolation policy
6. `customers` - Company isolation + Superuser bypass policies
7. `employees` - Company isolation policy
8. `invoice_items` - Company isolation policy
9. `invoices` - Company isolation policy
10. `payment_allocations` - Company isolation policy
11. `payments` - Company isolation policy
12. `product_categories` - Company isolation policy
13. `products` - Company isolation + Superuser bypass policies
14. `purchase_orders` - Company isolation + Superuser bypass policies
15. `sales_orders` - Company isolation + Superuser bypass policies
16. `suppliers` - Company isolation + Superuser bypass policies
17. `warehouses` - Company isolation policy

**⚠️  Tables with RLS but NO Policies (1 table):**
1. `companies` - **SECURITY RISK**: RLS enabled but no policies defined

### Tables without RLS (57 tables)
These tables have no row-level security restrictions:
- System tables: `cache`, `cache_locks`, `failed_jobs`, `jobs`, `migrations`, etc.
- User management: `users`, `roles`, `permissions`, `user_roles`, etc.
- Configuration: `currencies`, `units_of_measure`, `payment_terms`, etc.
- Business logic: `inventory_*`, `marketplace_*`, `ocr_*`, `prediction_*`, etc.

## Security Analysis

### ✅ Strengths
1. **Comprehensive Coverage**: Most business-critical tables have RLS enabled
2. **Consistent Policy Pattern**: Company isolation using `app.current_company_id` setting
3. **Superuser Bypass**: Proper administrative access for key tables
4. **Multi-tenant Architecture**: Strong separation between companies

### ⚠️  Security Concerns
1. **Companies Table**: Has RLS enabled but no policies - potential data leak
2. **User Management**: `users` table has no RLS - could expose user data across companies
3. **Role System**: Role/permission tables lack company isolation
4. **Configuration Tables**: Global access to currencies, units, etc.

### 🔧 Policy Patterns Used

#### 1. Company Isolation (Standard Pattern)
```sql
(company_id = COALESCE((current_setting('app.current_company_id'::text, true))::bigint, company_id))
```
- Used by: Most business tables
- Role: `public` (all database users)

#### 2. Company Isolation + Superuser Bypass (Enhanced Pattern)  
```sql
-- Company Isolation
(company_id = (current_setting('app.current_company_id'::text, true))::integer)

-- Superuser Bypass
((current_setting('app.superuser_mode'::text, true))::boolean = true)
```
- Used by: `customers`, `products`, `purchase_orders`, `sales_orders`, `suppliers`
- Role: `nexus_app_user`

## Recommendations

### 🚨 Critical Actions Required
1. **Fix Companies Table**: Add RLS policy or disable RLS
   ```sql
   -- Option 1: Add company isolation policy
   CREATE POLICY company_isolation_companies ON companies
   FOR ALL TO public
   USING (id = (current_setting('app.current_company_id'::text, true))::integer);
   
   -- Option 2: Disable RLS if global access needed
   ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
   ```

### 🔍 Security Improvements
1. **User Table**: Consider adding company-based RLS
2. **Role System**: Implement company isolation for roles/permissions
3. **Audit Logging**: Enable RLS on `audit_logs` table
4. **Session Management**: Verify `app.current_company_id` is properly set

### 📊 Monitoring Commands

#### Check Current Session Context
```sql
SELECT current_setting('app.current_company_id', true) as company_id,
       current_setting('app.superuser_mode', true) as superuser_mode;
```

#### Test Policy Effectiveness
```sql
-- Set company context
SELECT set_config('app.current_company_id', '1', false);

-- Query should only return company 1 data
SELECT company_id, count(*) FROM customers GROUP BY company_id;
```

#### Monitor RLS Policy Usage
```sql
-- Check which policies are being used
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
ORDER BY tablename;
```

## MCP Database Server Setup

Your MCP database server is configured at:
- **Config File**: `/Users/gamepig/projects/NexusERP/.mcp-database-config.json`
- **Database**: nexus_erp (PostgreSQL)
- **Connection**: localhost:5432

### Available MCP Commands
Once properly configured, you can use these MCP tools:
- `database_query` - Execute SQL queries
- `database_schema` - Get table schema information  
- `database_list_tables` - List all tables
- `database_describe_table` - Get table details

---
*Report generated on: $(date)*
*Database: nexus_erp (PostgreSQL 16)*