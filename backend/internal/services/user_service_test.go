package services

import (
	"database/sql"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"nexus-erp/backend/internal/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestUserService_CreateUser(t *testing.T) {
	// Test for successful user creation
	t.Run("successful user creation", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		// Mock the existence check query
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

		// Mock the insert query
		expectedTime := time.Now()
		mock.ExpectQuery("INSERT INTO users").
			WithArgs("testuser", "test@example.com", sqlmock.AnyArg(), nil, nil, "active", nil, "traditional").
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "first_name", "last_name", "status", "ai_classification_yaml", "registration_method", "created_at", "updated_at"}).
				AddRow(1, "testuser", "test@example.com", nil, nil, "active", nil, "traditional", expectedTime, expectedTime))

		req := &models.CreateUserRequest{
			Name:     "testuser",
			Email:    "test@example.com",
			Password: "password123",
		}

		user, err := userService.CreateUser(req)

		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, int64(1), user.ID)
		assert.Equal(t, "testuser", user.Username)
		assert.Equal(t, "test@example.com", user.Email)
		assert.Equal(t, "active", user.Status)
		assert.Equal(t, "traditional", *user.RegistrationMethod)

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test for duplicate user error
	t.Run("duplicate user error", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		// Mock the existence check query to return true (user exists)
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

		req := &models.CreateUserRequest{
			Name:     "testuser",
			Email:    "test@example.com",
			Password: "password123",
		}

		user, err := userService.CreateUser(req)

		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Contains(t, err.Error(), "user with this email or username already exists")

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test for database error during existence check
	t.Run("database error during existence check", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		// Mock the existence check query to return an error
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnError(errors.New("database connection error"))

		req := &models.CreateUserRequest{
			Name:     "testuser",
			Email:    "test@example.com",
			Password: "password123",
		}

		user, err := userService.CreateUser(req)

		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Contains(t, err.Error(), "failed to check user existence")

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test for database error during user creation
	t.Run("database error during user creation", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		// Mock the existence check query
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

		// Mock the insert query to return an error
		mock.ExpectQuery("INSERT INTO users").
			WithArgs("testuser", "test@example.com", sqlmock.AnyArg(), nil, nil, "active", nil, "traditional").
			WillReturnError(errors.New("database insert error"))

		req := &models.CreateUserRequest{
			Name:     "testuser",
			Email:    "test@example.com",
			Password: "password123",
		}

		user, err := userService.CreateUser(req)

		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Contains(t, err.Error(), "failed to create user")

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test for user creation with AI classification
	t.Run("successful user creation with AI classification", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		// Mock the existence check query
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

		// Create test AI classification data
		classification := map[string]interface{}{
			"industry": "technology",
			"type":     "startup",
		}
		classificationJSON, _ := json.Marshal(classification)
		classificationRaw := json.RawMessage(classificationJSON)

		// Mock the insert query
		expectedTime := time.Now()
		mock.ExpectQuery("INSERT INTO users").
			WithArgs("testuser", "test@example.com", sqlmock.AnyArg(), "John", "Doe", "active", sqlmock.AnyArg(), "ai-guided").
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "first_name", "last_name", "status", "ai_classification_yaml", "registration_method", "created_at", "updated_at"}).
				AddRow(1, "testuser", "test@example.com", "John", "Doe", "active", classificationRaw, "ai-guided", expectedTime, expectedTime))

		firstName := "John"
		lastName := "Doe"
		registrationMethod := "ai-guided"

		req := &models.CreateUserRequest{
			Name:                 "testuser",
			Email:                "test@example.com",
			Password:             "password123",
			FirstName:            &firstName,
			LastName:             &lastName,
			AIClassificationYAML: &classificationRaw,
			RegistrationMethod:   &registrationMethod,
		}

		user, err := userService.CreateUser(req)

		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, int64(1), user.ID)
		assert.Equal(t, "testuser", user.Username)
		assert.Equal(t, "test@example.com", user.Email)
		assert.Equal(t, "John", *user.FirstName)
		assert.Equal(t, "Doe", *user.LastName)
		assert.Equal(t, "active", user.Status)
		assert.Equal(t, "ai-guided", *user.RegistrationMethod)
		assert.NotNil(t, user.AIClassificationYAML)

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestUserService_ValidatePassword(t *testing.T) {
	// Test password validation
	t.Run("valid password", func(t *testing.T) {
		password := "password123"
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		require.NoError(t, err)

		user := &models.User{
			PasswordHash: string(hashedPassword),
		}

		db, _, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		err = userService.ValidatePassword(user, password)
		assert.NoError(t, err)
	})

	t.Run("invalid password", func(t *testing.T) {
		password := "password123"
		wrongPassword := "wrongpassword"
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		require.NoError(t, err)

		user := &models.User{
			PasswordHash: string(hashedPassword),
		}

		db, _, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		err = userService.ValidatePassword(user, wrongPassword)
		assert.Error(t, err)
		assert.Equal(t, bcrypt.ErrMismatchedHashAndPassword, err)
	})
}

func TestUserService_UserExists(t *testing.T) {
	// Test user existence check
	t.Run("user exists", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

		exists := userService.UserExists("test@example.com", "testuser")
		assert.True(t, exists)

		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("user does not exist", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

		exists := userService.UserExists("test@example.com", "testuser")
		assert.False(t, exists)

		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("database error during existence check", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnError(errors.New("database error"))

		exists := userService.UserExists("test@example.com", "testuser")
		assert.False(t, exists) // Should return false on error

		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestUserService_GetUserByEmail(t *testing.T) {
	// Test getting user by email
	t.Run("user found", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		expectedTime := time.Now()
		mock.ExpectQuery("SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at FROM users WHERE email = .* AND deleted_at IS NULL").
			WithArgs("test@example.com").
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "password", "first_name", "last_name", "status", "ai_classification_yaml", "registration_method", "created_at", "updated_at", "deleted_at"}).
				AddRow(1, "testuser", "test@example.com", "hashedpassword", nil, nil, "active", nil, "traditional", expectedTime, expectedTime, nil))

		user, err := userService.GetUserByEmail("test@example.com")

		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, int64(1), user.ID)
		assert.Equal(t, "testuser", user.Username)
		assert.Equal(t, "test@example.com", user.Email)
		assert.Equal(t, "hashedpassword", user.PasswordHash)

		require.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("user not found", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		userService := NewUserService(db)

		mock.ExpectQuery("SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at FROM users WHERE email = .* AND deleted_at IS NULL").
			WithArgs("nonexistent@example.com").
			WillReturnError(sql.ErrNoRows)

		user, err := userService.GetUserByEmail("nonexistent@example.com")

		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Contains(t, err.Error(), "user not found")

		require.NoError(t, mock.ExpectationsWereMet())
	})
}