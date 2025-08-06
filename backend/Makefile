.PHONY: migrate-up migrate-down migrate-force migrate-version migrate-create migrate-status

# Database configuration
DB_URL=postgres://nexus:securepassword@localhost:5432/nexus_erp?sslmode=disable
MIGRATIONS_PATH=./migrations

# Run all pending migrations
migrate-up:
	migrate -path $(MIGRATIONS_PATH) -database $(DB_URL) up

# Rollback last migration
migrate-down:
	migrate -path $(MIGRATIONS_PATH) -database $(DB_URL) down 1

# Force migration to specific version (use with caution)
migrate-force:
	@if [ -z "$(VERSION)" ]; then \
		echo "Usage: make migrate-force VERSION=<version_number>"; \
		exit 1; \
	fi
	migrate -path $(MIGRATIONS_PATH) -database $(DB_URL) force $(VERSION)

# Show current migration version
migrate-version:
	migrate -path $(MIGRATIONS_PATH) -database $(DB_URL) version

# Create new migration files
migrate-create:
	@if [ -z "$(NAME)" ]; then \
		echo "Usage: make migrate-create NAME=<migration_name>"; \
		exit 1; \
	fi
	migrate create -ext sql -dir $(MIGRATIONS_PATH) -seq $(NAME)

# Check migration status
migrate-status:
	@echo "Current migration version:"
	@make migrate-version
	@echo "\nPending migrations:"
	@ls -1 $(MIGRATIONS_PATH)/*.up.sql | grep -E '[0-9]+_' | sort -V | tail -5

# Test database connection
test-db:
	@echo "Testing database connection..."
	@psql $(DB_URL) -c "SELECT version();" > /dev/null 2>&1 && echo "✅ Database connection successful" || echo "❌ Database connection failed"

# Show help
help:
	@echo "Available commands:"
	@echo "  migrate-up      - Run all pending migrations"
	@echo "  migrate-down    - Rollback last migration"
	@echo "  migrate-force   - Force migration to specific version"
	@echo "  migrate-version - Show current migration version"
	@echo "  migrate-create  - Create new migration files"
	@echo "  migrate-status  - Show migration status"
	@echo "  test-db         - Test database connection"
	@echo ""
	@echo "Examples:"
	@echo "  make migrate-up"
	@echo "  make migrate-create NAME=add_user_preferences"
	@echo "  make migrate-force VERSION=14"

# Development shortcuts
dev-reset:
	@echo "⚠️  This will reset the database! Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	make migrate-down
	make migrate-up

dev-fresh:
	@echo "⚠️  This will completely reset the database! Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	migrate -path $(MIGRATIONS_PATH) -database $(DB_URL) drop -f
	make migrate-up