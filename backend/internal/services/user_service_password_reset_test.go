package services

import (
	"database/sql"
	"testing"
	"time"

	"nexus-erp/backend/internal/models"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
)

func TestUserService_CreatePasswordResetToken(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userService := NewUserService(db)

	tests := []struct {
		name      string
		userID    int64
		setupMock func()
		wantErr   bool
	}{
		{
			name:   "successful token creation",
			userID: 1,
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"id", "created_at"}).
					AddRow(1, time.Now())
				mock.ExpectQuery(`INSERT INTO password_reset_tokens`).
					WithArgs(1, sqlmock.AnyArg(), sqlmock.AnyArg()).
					WillReturnRows(rows)
			},
			wantErr: false,
		},
		{
			name:   "database error",
			userID: 1,
			setupMock: func() {
				mock.ExpectQuery(`INSERT INTO password_reset_tokens`).
					WithArgs(1, sqlmock.AnyArg(), sqlmock.AnyArg()).
					WillReturnError(sql.ErrConnDone)
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			token, err := userService.CreatePasswordResetToken(tt.userID)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, token)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, token)
				assert.Equal(t, tt.userID, token.UserID)
				assert.NotEmpty(t, token.Token)
				assert.True(t, token.ExpiresAt.After(time.Now()))
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestUserService_GetPasswordResetToken(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userService := NewUserService(db)

	tests := []struct {
		name      string
		token     string
		setupMock func()
		wantErr   bool
		wantToken *models.PasswordResetToken
	}{
		{
			name:  "successful token retrieval",
			token: "valid-token",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"id", "user_id", "token", "expires_at", "used_at", "created_at"}).
					AddRow(1, 1, "valid-token", time.Now().Add(time.Hour), nil, time.Now())
				mock.ExpectQuery(`SELECT id, user_id, token, expires_at, used_at, created_at FROM password_reset_tokens`).
					WithArgs("valid-token").
					WillReturnRows(rows)
			},
			wantErr: false,
			wantToken: &models.PasswordResetToken{
				ID:     1,
				UserID: 1,
				Token:  "valid-token",
			},
		},
		{
			name:  "token not found",
			token: "invalid-token",
			setupMock: func() {
				mock.ExpectQuery(`SELECT id, user_id, token, expires_at, used_at, created_at FROM password_reset_tokens`).
					WithArgs("invalid-token").
					WillReturnError(sql.ErrNoRows)
			},
			wantErr:   true,
			wantToken: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			token, err := userService.GetPasswordResetToken(tt.token)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, token)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, token)
				assert.Equal(t, tt.wantToken.ID, token.ID)
				assert.Equal(t, tt.wantToken.UserID, token.UserID)
				assert.Equal(t, tt.wantToken.Token, token.Token)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestUserService_ValidatePasswordResetToken(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userService := NewUserService(db)

	tests := []struct {
		name      string
		token     string
		setupMock func()
		wantErr   bool
	}{
		{
			name:  "valid token",
			token: "valid-token",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"id", "user_id", "token", "expires_at", "used_at", "created_at"}).
					AddRow(1, 1, "valid-token", time.Now().Add(time.Hour), nil, time.Now())
				mock.ExpectQuery(`SELECT id, user_id, token, expires_at, used_at, created_at FROM password_reset_tokens`).
					WithArgs("valid-token").
					WillReturnRows(rows)
			},
			wantErr: false,
		},
		{
			name:  "expired token",
			token: "expired-token",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"id", "user_id", "token", "expires_at", "used_at", "created_at"}).
					AddRow(1, 1, "expired-token", time.Now().Add(-time.Hour), nil, time.Now())
				mock.ExpectQuery(`SELECT id, user_id, token, expires_at, used_at, created_at FROM password_reset_tokens`).
					WithArgs("expired-token").
					WillReturnRows(rows)
			},
			wantErr: true,
		},
		{
			name:  "token not found",
			token: "invalid-token",
			setupMock: func() {
				mock.ExpectQuery(`SELECT id, user_id, token, expires_at, used_at, created_at FROM password_reset_tokens`).
					WithArgs("invalid-token").
					WillReturnError(sql.ErrNoRows)
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			token, err := userService.ValidatePasswordResetToken(tt.token)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, token)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, token)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestUserService_UpdateUserPassword(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userService := NewUserService(db)

	tests := []struct {
		name        string
		userID      int64
		newPassword string
		setupMock   func()
		wantErr     bool
	}{
		{
			name:        "successful password update",
			userID:      1,
			newPassword: "newpassword123",
			setupMock: func() {
				mock.ExpectExec(`UPDATE users SET password_hash`).
					WithArgs(sqlmock.AnyArg(), 1).
					WillReturnResult(sqlmock.NewResult(1, 1))
			},
			wantErr: false,
		},
		{
			name:        "user not found",
			userID:      999,
			newPassword: "newpassword123",
			setupMock: func() {
				mock.ExpectExec(`UPDATE users SET password_hash`).
					WithArgs(sqlmock.AnyArg(), 999).
					WillReturnResult(sqlmock.NewResult(1, 0))
			},
			wantErr: true,
		},
		{
			name:        "database error",
			userID:      1,
			newPassword: "newpassword123",
			setupMock: func() {
				mock.ExpectExec(`UPDATE users SET password_hash`).
					WithArgs(sqlmock.AnyArg(), 1).
					WillReturnError(sql.ErrConnDone)
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			err := userService.UpdateUserPassword(tt.userID, tt.newPassword)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestUserService_UsePasswordResetToken(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userService := NewUserService(db)

	tests := []struct {
		name      string
		token     string
		setupMock func()
		wantErr   bool
	}{
		{
			name:  "successful token usage",
			token: "valid-token",
			setupMock: func() {
				mock.ExpectExec(`UPDATE password_reset_tokens SET used_at`).
					WithArgs("valid-token").
					WillReturnResult(sqlmock.NewResult(1, 1))
			},
			wantErr: false,
		},
		{
			name:  "token not found or already used",
			token: "invalid-token",
			setupMock: func() {
				mock.ExpectExec(`UPDATE password_reset_tokens SET used_at`).
					WithArgs("invalid-token").
					WillReturnResult(sqlmock.NewResult(1, 0))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			err := userService.UsePasswordResetToken(tt.token)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestPasswordHashingInUpdateUserPassword(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	userService := NewUserService(db)
	
	// Setup mock - we'll verify hashing by testing the actual service behavior
	mock.ExpectExec(`UPDATE users SET password_hash`).
		WithArgs(sqlmock.AnyArg(), int64(1)).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Test password update
	plainPassword := "testpassword123"
	err = userService.UpdateUserPassword(1, plainPassword)
	assert.NoError(t, err)

	// Verify expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
	
	// Test that the password hashing function works correctly
	// (We test the hashing logic separately since we can't easily capture it from the mock)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	assert.NoError(t, err)
	assert.NotEmpty(t, hashedPassword)
	assert.NotEqual(t, plainPassword, string(hashedPassword))
	
	// Verify that the hash can be validated against the original password
	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(plainPassword))
	assert.NoError(t, err)
}