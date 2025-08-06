package database

import (
	"fmt"
	"log"
	"time"

	"nexus-erp-fiber/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB wraps gorm.DB with additional functionality
type DB struct {
	*gorm.DB
}

// New creates a new database connection
func New(cfg *config.Config) (*DB, error) {
	// Configure GORM logger
	logLevel := logger.Silent
	if cfg.App.Debug {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.Database.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
		DisableForeignKeyConstraintWhenMigrating: false,
		SkipDefaultTransaction:                   true, // For better performance
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying sql.DB
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	// Connection pool settings for high performance
	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.Database.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.Database.ConnMaxIdleTime)

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Enable RLS for multi-tenant security
	if err := enableRLS(db); err != nil {
		log.Printf("Warning: Failed to enable RLS: %v", err)
	}

	log.Println("📊 Database connection established successfully")
	log.Printf("🔐 PostgreSQL RLS enabled for multi-tenant security")
	
	return &DB{DB: db}, nil
}

// enableRLS enables Row Level Security for multi-tenant architecture
func enableRLS(db *gorm.DB) error {
	// Set up RLS context function for multi-tenant isolation
	queries := []string{
		// Create function to get current tenant ID from session
		`CREATE OR REPLACE FUNCTION get_current_tenant_id() 
		 RETURNS integer AS $$
		 BEGIN
		   RETURN COALESCE(current_setting('app.current_tenant_id', true)::integer, 0);
		 END;
		 $$ LANGUAGE plpgsql STABLE;`,

		// Create function to set tenant context
		`CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id integer) 
		 RETURNS void AS $$
		 BEGIN
		   PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
		 END;
		 $$ LANGUAGE plpgsql;`,

		// Create bypass function for superuser operations
		`CREATE OR REPLACE FUNCTION bypass_rls() 
		 RETURNS boolean AS $$
		 BEGIN
		   RETURN COALESCE(current_setting('app.bypass_rls', true)::boolean, false);
		 END;
		 $$ LANGUAGE plpgsql STABLE;`,
	}

	for _, query := range queries {
		if err := db.Exec(query).Error; err != nil {
			return fmt.Errorf("failed to execute RLS setup query: %w", err)
		}
	}

	return nil
}

// SetTenantContext sets the current tenant context for RLS
func (db *DB) SetTenantContext(tenantID int) error {
	return db.Exec("SELECT set_tenant_context(?)", tenantID).Error
}

// BypassRLS temporarily bypasses RLS for superuser operations
func (db *DB) BypassRLS() *gorm.DB {
	return db.Exec("SET LOCAL app.bypass_rls = true").Session(&gorm.Session{})
}

// WithTenant returns a new DB session with tenant context set
func (db *DB) WithTenant(tenantID int) *gorm.DB {
	return db.Session(&gorm.Session{}).Exec("SELECT set_tenant_context(?)", tenantID)
}

// Close closes the database connection
func (db *DB) Close() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// HealthCheck performs a basic health check on the database
func (db *DB) HealthCheck() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

// GetStats returns database connection statistics
func (db *DB) GetStats() map[string]interface{} {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return map[string]interface{}{"error": err.Error()}
	}

	stats := sqlDB.Stats()
	return map[string]interface{}{
		"max_open_connections": stats.MaxOpenConnections,
		"open_connections":     stats.OpenConnections,
		"in_use":              stats.InUse,
		"idle":                stats.Idle,
		"wait_count":          stats.WaitCount,
		"wait_duration":       stats.WaitDuration.String(),
		"max_idle_closed":     stats.MaxIdleClosed,
		"max_idle_time_closed": stats.MaxIdleTimeClosed,
		"max_lifetime_closed":  stats.MaxLifetimeClosed,
	}
}