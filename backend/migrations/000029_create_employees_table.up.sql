-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE NOT NULL,
    termination_date DATE,
    salary DECIMAL(12,2),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave')),
    address TEXT,
    emergency_contact TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_employees_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- Duration in minutes
    status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'partial', 'on_leave')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_attendance_employee_id 
        FOREIGN KEY (employee_id) 
        REFERENCES employees(id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_employee_code ON employees(employee_code);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
CREATE INDEX idx_employees_deleted_at ON employees(deleted_at);

CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_clock_in ON attendance(clock_in);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_clock_in_employee ON attendance(employee_id, clock_in);

-- Note: Unique constraint for preventing duplicate clock-ins will be handled at application level
-- to avoid PostgreSQL immutable function requirement

-- Create function to automatically calculate duration when clock_out is updated
CREATE OR REPLACE FUNCTION calculate_attendance_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clock_out IS NOT NULL AND OLD.clock_out IS NULL THEN
        NEW.duration = EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60; -- Duration in minutes
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate duration
CREATE TRIGGER trigger_calculate_attendance_duration
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION calculate_attendance_duration();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();

CREATE TRIGGER trigger_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default employee statuses if they don't exist
-- This is mainly for documentation purposes as the CHECK constraint handles validation