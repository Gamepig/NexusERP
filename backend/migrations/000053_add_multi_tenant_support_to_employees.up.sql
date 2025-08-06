-- Add multi-tenant support to employees and attendance tables
-- 業務重要性：⭐⭐⭐⭐⭐
-- 影響範圍：人事管理、薪資、出勤、報表
-- 風險等級：HIGH

-- 添加多租戶隔離欄位到 employees 表
ALTER TABLE employees 
ADD COLUMN company_id bigint,
ADD COLUMN business_unit_id bigint,
ADD COLUMN created_by_user_id bigint;

-- 添加多租戶隔離欄位到 attendance 表
ALTER TABLE attendance 
ADD COLUMN company_id bigint,
ADD COLUMN created_by_user_id bigint;

-- 添加外鍵約束到 employees 表
ALTER TABLE employees 
ADD CONSTRAINT fk_employees_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE employees 
ADD CONSTRAINT fk_employees_business_unit 
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL;

ALTER TABLE employees 
ADD CONSTRAINT fk_employees_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 添加外鍵約束到 attendance 表
ALTER TABLE attendance 
ADD CONSTRAINT fk_attendance_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE attendance 
ADD CONSTRAINT fk_attendance_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 建立索引 - employees 表
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_business_unit ON employees(business_unit_id);
CREATE INDEX idx_employees_created_by_user ON employees(created_by_user_id);
CREATE INDEX idx_employees_company_status ON employees(company_id, status) 
    WHERE status IN ('active', 'on_leave');
CREATE INDEX idx_employees_company_department ON employees(company_id, department);

-- 建立索引 - attendance 表
CREATE INDEX idx_attendance_company ON attendance(company_id);
CREATE INDEX idx_attendance_created_by_user ON attendance(created_by_user_id);
CREATE INDEX idx_attendance_company_date ON attendance(company_id, clock_in);
CREATE INDEX idx_attendance_employee_company ON attendance(employee_id, company_id);

-- 數據遷移：為現有員工分配到第一個可用的公司
UPDATE employees SET 
    company_id = (
        SELECT id FROM companies 
        WHERE is_active = true 
        ORDER BY id 
        LIMIT 1
    ),
    business_unit_id = (
        SELECT id FROM business_units 
        WHERE company_id = (
            SELECT id FROM companies 
            WHERE is_active = true 
            ORDER BY id 
            LIMIT 1
        )
        ORDER BY id 
        LIMIT 1
    ),
    created_by_user_id = (
        SELECT id FROM users 
        WHERE email = 'gamepig1976@gmail.com' 
        LIMIT 1
    )
WHERE company_id IS NULL;

-- 數據遷移：為現有出勤記錄分配公司ID（根據員工的公司）
UPDATE attendance SET 
    company_id = (
        SELECT e.company_id 
        FROM employees e 
        WHERE e.id = attendance.employee_id
    ),
    created_by_user_id = (
        SELECT id FROM users 
        WHERE email = 'gamepig1976@gmail.com' 
        LIMIT 1
    )
WHERE company_id IS NULL;

-- 確保數據一致性：檢查員工與出勤記錄的公司ID匹配
-- 如果發現不匹配，更新出勤記錄以匹配員工的公司
UPDATE attendance 
SET company_id = employees.company_id
FROM employees
WHERE attendance.employee_id = employees.id 
    AND attendance.company_id != employees.company_id;