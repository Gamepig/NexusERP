-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_calculate_attendance_duration ON attendance;
DROP TRIGGER IF EXISTS trigger_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS trigger_attendance_updated_at ON attendance;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_attendance_duration();
DROP FUNCTION IF EXISTS update_employees_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_employees_user_id;
DROP INDEX IF EXISTS idx_employees_employee_code;
DROP INDEX IF EXISTS idx_employees_status;
DROP INDEX IF EXISTS idx_employees_department;
DROP INDEX IF EXISTS idx_employees_hire_date;
DROP INDEX IF EXISTS idx_employees_deleted_at;

DROP INDEX IF EXISTS idx_attendance_employee_id;
DROP INDEX IF EXISTS idx_attendance_clock_in;
DROP INDEX IF EXISTS idx_attendance_status;
DROP INDEX IF EXISTS idx_attendance_clock_in_employee;
-- No unique index to drop as it was handled at application level

-- Drop tables (attendance first due to foreign key)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS employees;