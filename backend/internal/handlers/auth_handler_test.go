package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuthHandler_Register(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Test successful registration
	t.Run("successful registration", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

		expectedTime := time.Now()
		mock.ExpectQuery("INSERT INTO users").
			WithArgs("testuser", "test@example.com", sqlmock.AnyArg(), nil, nil, "active", nil, "traditional").
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "first_name", "last_name", "status", "ai_classification_yaml", "registration_method", "created_at", "updated_at"}).
				AddRow(1, "testuser", "test@example.com", nil, nil, "active", nil, "traditional", expectedTime, expectedTime))

		// Create request
		reqBody := models.CreateUserRequest{
			Name:     "testuser",
			Email:    "test@example.com",
			Password: "password123",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Register(c)

		// Verify response
		assert.Equal(t, http.StatusCreated, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "User created successfully", response["message"])
		assert.Contains(t, response, "user")

		// Verify user data
		user := response["user"].(map[string]interface{})
		assert.Equal(t, "testuser", user["name"])
		assert.Equal(t, "test@example.com", user["email"])
		assert.Equal(t, "active", user["status"])
		assert.NotContains(t, user, "password") // Password should not be included

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test registration with invalid JSON
	t.Run("invalid JSON", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Create invalid JSON request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Register(c)

		// Verify response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid request body", response["error"])
		assert.Contains(t, response, "details")

		// Verify no expectations were set
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test registration with missing required fields
	t.Run("missing required fields", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Create request with missing fields
		reqBody := map[string]interface{}{
			"name": "testuser",
			// Missing email and password
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Register(c)

		// Verify response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid request body", response["error"])
		assert.Contains(t, response, "details")

		// Verify no expectations were set
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test registration with invalid email format
	t.Run("invalid email format", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Create request with invalid email
		reqBody := models.CreateUserRequest{
			Name:     "testuser",
			Email:    "invalid-email-format",
			Password: "password123",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Register(c)

		// Verify response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid request body", response["error"])
		assert.Contains(t, response, "details")

		// Verify no expectations were set
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test registration with password too short
	t.Run("password too short", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Create request with short password
		reqBody := models.CreateUserRequest{
			Name:     "testuser",
			Email:    "test@example.com",
			Password: "123", // Too short
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Register(c)

		// Verify response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid request body", response["error"])
		assert.Contains(t, response, "details")

		// Verify no expectations were set
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test registration with duplicate user
	t.Run("duplicate user", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls - user already exists
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

		// Create request
		reqBody := models.CreateUserRequest{
			Name:     "testuser",
			Email:    "test@example.com",
			Password: "password123",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Register(c)

		// Verify response
		assert.Equal(t, http.StatusConflict, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "user with this email or username already exists", response["error"])

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test registration with database error
	t.Run("database error", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls - existence check passes, but insert fails
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

		mock.ExpectQuery("INSERT INTO users").
			WithArgs("testuser", "test@example.com", sqlmock.AnyArg(), nil, nil, "active", nil, "traditional").
			WillReturnError(sqlmock.ErrCancelled)

		// Create request
		reqBody := models.CreateUserRequest{
			Name:     "testuser",
			Email:    "test@example.com",
			Password: "password123",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Register(c)

		// Verify response
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Failed to create user", response["error"])

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test registration with complete user information
	t.Run("successful registration with complete info", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("test@example.com", "testuser").
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

		expectedTime := time.Now()
		mock.ExpectQuery("INSERT INTO users").
			WithArgs("testuser", "test@example.com", sqlmock.AnyArg(), "John", "Doe", "active", nil, "traditional").
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "first_name", "last_name", "status", "ai_classification_yaml", "registration_method", "created_at", "updated_at"}).
				AddRow(1, "testuser", "test@example.com", "John", "Doe", "active", nil, "traditional", expectedTime, expectedTime))

		// Create request with complete information
		firstName := "John"
		lastName := "Doe"
		reqBody := models.CreateUserRequest{
			Name:      "testuser",
			Email:     "test@example.com",
			Password:  "password123",
			FirstName: &firstName,
			LastName:  &lastName,
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Register(c)

		// Verify response
		assert.Equal(t, http.StatusCreated, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "User created successfully", response["message"])
		assert.Contains(t, response, "user")

		// Verify user data
		user := response["user"].(map[string]interface{})
		assert.Equal(t, "testuser", user["name"])
		assert.Equal(t, "test@example.com", user["email"])
		assert.Equal(t, "John", user["first_name"])
		assert.Equal(t, "Doe", user["last_name"])
		assert.Equal(t, "active", user["status"])

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestAuthHandler_Login(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Test successful login
	t.Run("successful login", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls for GetUserByUsername
		expectedTime := time.Now()
		hashedPassword := "$2a$10$XRqURL3yt584KAGXLarQweb.6ISlxmf3gmlr2c8IOp8VVr6s7VeBW" // bcrypt hash of "password123"
		mock.ExpectQuery("SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at").
			WithArgs("testuser").
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "password", "first_name", "last_name", "status", "ai_classification_yaml", "registration_method", "created_at", "updated_at", "deleted_at"}).
				AddRow(1, "testuser", "test@example.com", hashedPassword, "John", "Doe", "active", nil, "traditional", expectedTime, expectedTime, nil))

		// Mock database calls for CreateRefreshToken
		mock.ExpectQuery("INSERT INTO refresh_tokens").
			WithArgs(1, sqlmock.AnyArg(), sqlmock.AnyArg()).
			WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).
				AddRow(1, expectedTime))

		// Create request
		reqBody := models.LoginRequest{
			Name:     "testuser",
			Password: "password123",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Login(c)

		// Verify response
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Login successful", response["message"])
		assert.Contains(t, response, "token")
		assert.Contains(t, response, "refresh_token")
		assert.Contains(t, response, "user")

		// Verify token is not empty
		token := response["token"].(string)
		assert.NotEmpty(t, token)

		// Verify refresh token is not empty
		refreshToken := response["refresh_token"].(string)
		assert.NotEmpty(t, refreshToken)

		// Verify user data
		user := response["user"].(map[string]interface{})
		assert.Equal(t, "testuser", user["name"])
		assert.Equal(t, "test@example.com", user["email"])
		assert.NotContains(t, user, "password") // Password should not be included

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test login with invalid credentials - wrong password
	t.Run("invalid credentials - wrong password", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls for GetUserByUsername
		expectedTime := time.Now()
		hashedPassword := "$2a$10$XRqURL3yt584KAGXLarQweb.6ISlxmf3gmlr2c8IOp8VVr6s7VeBW" // bcrypt hash of "password123"
		mock.ExpectQuery("SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at").
			WithArgs("testuser").
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "password", "first_name", "last_name", "status", "ai_classification_yaml", "registration_method", "created_at", "updated_at", "deleted_at"}).
				AddRow(1, "testuser", "test@example.com", hashedPassword, "John", "Doe", "active", nil, "traditional", expectedTime, expectedTime, nil))

		// Create request with wrong password
		reqBody := models.LoginRequest{
			Name:     "testuser",
			Password: "wrongpassword",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Login(c)

		// Verify response
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid credentials", response["error"])
		assert.NotContains(t, response, "token")
		assert.NotContains(t, response, "user")

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test login with non-existent user
	t.Run("invalid credentials - non-existent user", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls for GetUserByUsername - user not found
		mock.ExpectQuery("SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at").
			WithArgs("nonexistent").
			WillReturnError(sql.ErrNoRows)

		// Create request
		reqBody := models.LoginRequest{
			Name:     "nonexistent",
			Password: "password123",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Login(c)

		// Verify response
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid credentials", response["error"])
		assert.NotContains(t, response, "token")
		assert.NotContains(t, response, "user")

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test login with invalid JSON
	t.Run("invalid JSON", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Create invalid JSON request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Login(c)

		// Verify response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid request body", response["error"])
		assert.Contains(t, response, "details")

		// Verify no expectations were set
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test login with missing required fields
	t.Run("missing required fields", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Create request with missing fields
		reqBody := map[string]interface{}{
			"name": "testuser",
			// Missing password
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.Login(c)

		// Verify response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid request body", response["error"])
		assert.Contains(t, response, "details")

		// Verify no expectations were set
		require.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestAuthHandler_LoginByEmail(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Test successful login by email
	t.Run("successful login by email", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls for GetUserByEmail
		expectedTime := time.Now()
		hashedPassword := "$2a$10$XRqURL3yt584KAGXLarQweb.6ISlxmf3gmlr2c8IOp8VVr6s7VeBW" // bcrypt hash of "password123"
		mock.ExpectQuery("SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at").
			WithArgs("test@example.com").
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "password", "first_name", "last_name", "status", "ai_classification_yaml", "registration_method", "created_at", "updated_at", "deleted_at"}).
				AddRow(1, "testuser", "test@example.com", hashedPassword, "John", "Doe", "active", nil, "traditional", expectedTime, expectedTime, nil))

		// Create request
		reqBody := models.LoginByEmailRequest{
			Email:    "test@example.com",
			Password: "password123",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login-email", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.LoginByEmail(c)

		// Verify response
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Login successful", response["message"])
		assert.Contains(t, response, "token")
		assert.Contains(t, response, "user")

		// Verify token is not empty
		token := response["token"].(string)
		assert.NotEmpty(t, token)

		// Verify user data
		user := response["user"].(map[string]interface{})
		assert.Equal(t, "testuser", user["name"])
		assert.Equal(t, "test@example.com", user["email"])
		assert.NotContains(t, user, "password") // Password should not be included

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test login by email with invalid credentials - wrong password
	t.Run("invalid credentials - wrong password", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls for GetUserByEmail
		expectedTime := time.Now()
		hashedPassword := "$2a$10$XRqURL3yt584KAGXLarQweb.6ISlxmf3gmlr2c8IOp8VVr6s7VeBW" // bcrypt hash of "password123"
		mock.ExpectQuery("SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at").
			WithArgs("test@example.com").
			WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email", "password", "first_name", "last_name", "status", "ai_classification_yaml", "registration_method", "created_at", "updated_at", "deleted_at"}).
				AddRow(1, "testuser", "test@example.com", hashedPassword, "John", "Doe", "active", nil, "traditional", expectedTime, expectedTime, nil))

		// Create request with wrong password
		reqBody := models.LoginByEmailRequest{
			Email:    "test@example.com",
			Password: "wrongpassword",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login-email", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.LoginByEmail(c)

		// Verify response
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid credentials", response["error"])
		assert.NotContains(t, response, "token")
		assert.NotContains(t, response, "user")

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test login by email with non-existent user
	t.Run("invalid credentials - non-existent user", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Mock database calls for GetUserByEmail - user not found
		mock.ExpectQuery("SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at").
			WithArgs("nonexistent@example.com").
			WillReturnError(sql.ErrNoRows)

		// Create request
		reqBody := models.LoginByEmailRequest{
			Email:    "nonexistent@example.com",
			Password: "password123",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login-email", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.LoginByEmail(c)

		// Verify response
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid credentials", response["error"])
		assert.NotContains(t, response, "token")
		assert.NotContains(t, response, "user")

		// Verify all expectations were met
		require.NoError(t, mock.ExpectationsWereMet())
	})

	// Test login by email with invalid email format
	t.Run("invalid email format", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Create services
		userService := services.NewUserService(db)
		aiService := services.NewMockAIService()
		cfg := &config.Config{
			JWT: config.JWTConfig{
				Secret: "test-secret",
			},
		}

		// Create handler
		authHandler := NewAuthHandler(userService, aiService, cfg)

		// Create request with invalid email format
		reqBody := models.LoginByEmailRequest{
			Email:    "invalid-email-format",
			Password: "password123",
		}
		reqJSON, _ := json.Marshal(reqBody)

		// Create HTTP request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login-email", bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = req

		// Call handler
		authHandler.LoginByEmail(c)

		// Verify response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Invalid request body", response["error"])
		assert.Contains(t, response, "details")

		// Verify no expectations were set
		require.NoError(t, mock.ExpectationsWereMet())
	})
}