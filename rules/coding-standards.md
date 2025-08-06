# NexusERP 程式碼規範
## 統一的開發標準與最佳實踐

**版本**: 2.0  
**建立日期**: 2025-07-24  
**適用範圍**: 所有開發人員和 AI 助手

---

## 🎯 **總體原則**

### 程式碼品質核心原則
```yaml
可讀性: 程式碼應該清晰易懂，如同文檔
一致性: 整個專案使用統一的風格和模式
簡潔性: 避免不必要的複雜性和過度設計
可維護性: 程式碼應該易於修改和擴展
可測試性: 程式碼應該易於測試和驗證
安全性: 始終考慮安全威脅和防護措施
```

### 開發哲學
```
1. 優先使用現有的成熟解決方案，避免重複造輪子
2. 遵循約定優於配置的原則
3. 保持技術棧簡單和統一
4. 優先考慮長期維護性而非短期便利
5. 每次提交都應該讓程式碼變得更好
```

---

## 🔧 **Go 後端程式碼規範**

### 1. 檔案與套件結構
```go
// ✅ 正確的檔案結構
cmd/
├── api/
│   └── main.go                    // 應用程式入口
internal/
├── api/
│   ├── handlers/                  // HTTP 處理器
│   ├── middleware/                // 中介軟體
│   └── routes/                    // 路由定義
├── domain/
│   ├── models/                    // 領域模型
│   ├── services/                  // 業務邏輯
│   └── repositories/              // 資料存取層
├── infrastructure/
│   ├── database/                  // 資料庫配置
│   ├── cache/                     // 快取配置
│   └── config/                    // 系統配置
└── utils/                         // 工具函式

// 套件命名規範
package handlers  // ✅ 小寫，複數形式
package models    // ✅ 小寫，複數形式
package Handler   // ❌ 避免大寫
package model     // ❌ 避免單數形式
```

### 2. 命名規範
```go
// ✅ 變數命名 - 使用駝峰式
var userID int
var productList []Product
var httpClient *http.Client

// ❌ 錯誤命名
var user_id int           // 避免底線
var UserList []Product    // 私有變數不要大寫開頭
var HTTP_Client *http.Client // 避免全大寫

// ✅ 函式命名
func GetUserByID(id int) (*User, error) {}
func validateEmail(email string) bool {}
func (u *User) IsActive() bool {}

// ✅ 常數命名
const (
    DefaultPageSize = 20
    MaxRetryCount   = 3
    APIVersion      = "v1"
)

// ✅ 錯誤定義
var (
    ErrUserNotFound     = errors.New("user not found")
    ErrInvalidEmail     = errors.New("invalid email format")
    ErrInsufficientStock = errors.New("insufficient stock")
)
```

### 3. 結構體定義
```go
// ✅ 正確的結構體定義
type User struct {
    ID        int       `json:"id" db:"id"`
    Name      string    `json:"name" db:"name" validate:"required,min=2,max=50"`
    Email     string    `json:"email" db:"email" validate:"required,email"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
    UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// ✅ 建構子模式
func NewUser(name, email string) (*User, error) {
    if err := validateEmail(email); err != nil {
        return nil, err
    }
    
    return &User{
        Name:      name,
        Email:     email,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }, nil
}

// ✅ 方法定義
func (u *User) UpdateEmail(email string) error {
    if err := validateEmail(email); err != nil {
        return err
    }
    
    u.Email = email
    u.UpdatedAt = time.Now()
    return nil
}
```

### 4. 錯誤處理規範
```go
// ✅ 標準錯誤處理
func GetUser(id int) (*User, error) {
    user, err := userRepo.FindByID(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrUserNotFound
        }
        return nil, fmt.Errorf("failed to get user: %w", err)
    }
    
    return user, nil
}

// ✅ HTTP 錯誤回應
func (h *UserHandler) GetUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "success": false,
            "error": gin.H{
                "code":    "INVALID_ID",
                "message": "Invalid user ID format",
            },
        })
        return
    }
    
    user, err := h.userService.GetUser(id)
    if err != nil {
        if errors.Is(err, ErrUserNotFound) {
            c.JSON(http.StatusNotFound, gin.H{
                "success": false,
                "error": gin.H{
                    "code":    "USER_NOT_FOUND",
                    "message": "User not found",
                },
            })
            return
        }
        
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error": gin.H{
                "code":    "INTERNAL_ERROR",
                "message": "Internal server error",
            },
        })
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    user,
    })
}
```

### 5. 資料庫操作規範
```go
// ✅ Repository 模式
type UserRepository interface {
    Create(user *User) error
    GetByID(id int) (*User, error)
    GetByEmail(email string) (*User, error)
    Update(user *User) error
    Delete(id int) error
    List(offset, limit int) ([]*User, error)
}

type userRepository struct {
    db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) GetByID(id int) (*User, error) {
    query := `
        SELECT id, name, email, created_at, updated_at 
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL
    `
    
    var user User
    err := r.db.QueryRow(query, id).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}
```

### 6. 配置管理規範
```go
// ✅ 配置結構
type Config struct {
    Server   ServerConfig   `mapstructure:"server"`
    Database DatabaseConfig `mapstructure:"database"`
    Redis    RedisConfig    `mapstructure:"redis"`
    JWT      JWTConfig      `mapstructure:"jwt"`
}

type ServerConfig struct {
    Host string `mapstructure:"host" default:"127.0.0.1"`
    Port int    `mapstructure:"port" default:"8000"`
}

type DatabaseConfig struct {
    Host     string `mapstructure:"host" default:"localhost"`
    Port     int    `mapstructure:"port" default:"5432"`
    Database string `mapstructure:"database"`
    Username string `mapstructure:"username"`
    Password string `mapstructure:"password"`
    SSLMode  string `mapstructure:"sslmode" default:"disable"`
}

// ✅ 配置載入
func LoadConfig(path string) (*Config, error) {
    viper.SetConfigFile(path)
    viper.SetEnvPrefix("NEXUS")
    viper.AutomaticEnv()
    viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
    
    if err := viper.ReadInConfig(); err != nil {
        return nil, fmt.Errorf("failed to read config: %w", err)
    }
    
    var config Config
    if err := viper.Unmarshal(&config); err != nil {
        return nil, fmt.Errorf("failed to unmarshal config: %w", err)
    }
    
    return &config, nil
}
```

---

## 🎨 **Laravel 前端程式碼規範**

### 1. Blade 模板規範
```php
{{-- ✅ 正確的模板結構 --}}
@extends('layouts.app')

@section('title', '頁面標題')

@section('content')
<div class="container-fluid px-4">
    {{-- 頁面標題區 --}}
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3 text-gray-800">{{ $pageTitle }}</h1>
        <div class="btn-group">
            <button type="button" class="btn btn-primary">
                <i class="fas fa-plus"></i> 新增
            </button>
        </div>
    </div>
    
    {{-- 主要內容區 --}}
    <div class="card shadow">
        <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">資料列表</h6>
        </div>
        <div class="card-body">
            {{-- 使用組件 --}}
            <x-data-table 
                :headers="$headers"
                :data="$data"
                :actions="$actions"
            />
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('js/modules/users.js') }}"></script>
@endpush

@push('styles')
<link href="{{ asset('css/modules/users.css') }}" rel="stylesheet">
@endpush
```

### 2. Blade 組件規範
```php
{{-- resources/views/components/data-table.blade.php --}}
@props([
    'headers' => [],
    'data' => [],
    'actions' => [],
    'searchable' => true,
    'sortable' => true,
    'pageable' => true,
    'class' => 'table-striped table-hover'
])

<div {{ $attributes->merge(['class' => 'table-responsive']) }}>
    @if($searchable)
    <div class="mb-3">
        <div class="row">
            <div class="col-md-6">
                <input type="text" 
                       class="form-control" 
                       id="tableSearch" 
                       placeholder="搜尋...">
            </div>
            <div class="col-md-6 text-end">
                {{ $toolbar ?? '' }}
            </div>
        </div>
    </div>
    @endif
    
    <table class="table {{ $class }}"
           @if($searchable) data-search="true" @endif
           @if($sortable) data-sortable="true" @endif
           @if($pageable) data-pagination="true" @endif>
        <thead class="table-dark">
            <tr>
                @foreach($headers as $header)
                <th @if($sortable) data-sortable="true" @endif>
                    {{ $header }}
                </th>
                @endforeach
                @if(count($actions) > 0)
                <th width="150">操作</th>
                @endif
            </tr>
        </thead>
        <tbody>
            {{ $slot }}
        </tbody>
    </table>
    
    @if($pageable && isset($data) && method_exists($data, 'links'))
    <div class="mt-3">
        {{ $data->links() }}
    </div>
    @endif
</div>
```

### 3. JavaScript 模組規範
```javascript
// resources/js/modules/users.js
(function() {
    'use strict';
    
    // 模組變數
    const MODULE_NAME = 'UsersModule';
    const API_BASE = '/api/users';
    
    // 私有變數
    let dataTable;
    let currentUser = null;
    
    // DOM 元素快取
    const elements = {
        table: null,
        modal: null,
        form: null
    };
    
    // 初始化函式
    function init() {
        cacheElements();
        initDataTable();
        bindEvents();
        console.log(`${MODULE_NAME} initialized`);
    }
    
    // 快取 DOM 元素
    function cacheElements() {
        elements.table = document.getElementById('usersTable');
        elements.modal = document.getElementById('userModal');
        elements.form = document.getElementById('userForm');
    }
    
    // 初始化資料表格
    function initDataTable() {
        if (!elements.table) return;
        
        dataTable = $(elements.table).DataTable({
            processing: true,
            serverSide: true,
            ajax: {
                url: API_BASE,
                type: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            },
            columns: [
                { data: 'id', name: 'id', width: '80px' },
                { data: 'name', name: 'name' },
                { data: 'email', name: 'email' },
                { data: 'created_at', name: 'created_at', width: '150px' },
                { data: 'actions', name: 'actions', orderable: false, width: '120px' }
            ],
            language: {
                url: '/js/datatable-zh-TW.json'
            },
            order: [[3, 'desc']]
        });
    }
    
    // 綁定事件
    function bindEvents() {
        // 新增按鈕
        $(document).on('click', '.btn-create-user', handleCreateUser);
        
        // 編輯按鈕
        $(document).on('click', '.btn-edit-user', handleEditUser);
        
        // 刪除按鈕
        $(document).on('click', '.btn-delete-user', handleDeleteUser);
        
        // 表單提交
        if (elements.form) {
            elements.form.addEventListener('submit', handleFormSubmit);
        }
    }
    
    // 事件處理函式
    function handleCreateUser(event) {
        event.preventDefault();
        currentUser = null;
        resetForm();
        showModal('新增使用者');
    }
    
    function handleEditUser(event) {
        event.preventDefault();
        const userId = event.currentTarget.dataset.id;
        loadUser(userId);
    }
    
    function handleDeleteUser(event) {
        event.preventDefault();
        const userId = event.currentTarget.dataset.id;
        const userName = event.currentTarget.dataset.name;
        
        if (confirm(`確定要刪除使用者「${userName}」嗎？`)) {
            deleteUser(userId);
        }
    }
    
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(elements.form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            showLoading(true);
            
            const response = await fetch(
                currentUser ? `${API_BASE}/${currentUser.id}` : API_BASE,
                {
                    method: currentUser ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCSRFToken(),
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                }
            );
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                hideModal();
                dataTable.ajax.reload();
                showNotification(
                    currentUser ? '使用者更新成功' : '使用者建立成功',
                    'success'
                );
            } else {
                showValidationErrors(result.error?.details || {});
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showNotification('操作失敗，請稍後再試', 'error');
        } finally {
            showLoading(false);
        }
    }
    
    // 工具函式
    function getCSRFToken() {
        return document.querySelector('meta[name="csrf-token"]')?.content || '';
    }
    
    function showNotification(message, type = 'info') {
        // 實作通知顯示邏輯
        console.log(`${type.toUpperCase()}: ${message}`);
    }
    
    function showLoading(show) {
        const submitBtn = elements.form?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = show;
            submitBtn.innerHTML = show ? '處理中...' : '儲存';
        }
    }
    
    // 模組對外介面
    window.UsersModule = {
        init,
        handleCreateUser,
        handleEditUser,
        handleDeleteUser
    };
    
    // 自動初始化
    document.addEventListener('DOMContentLoaded', init);
})();
```

### 4. CSS/Tailwind 規範
```css
/* resources/css/components/data-table.css */
.nx-data-table {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
}

.nx-data-table thead {
    @apply bg-gray-50;
}

.nx-data-table th {
    @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.nx-data-table td {
    @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200;
}

.nx-data-table tbody tr:hover {
    @apply bg-gray-50 transition-colors duration-150;
}

/* 按鈕樣式 */
.btn-primary-custom {
    @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200;
}

.btn-secondary-custom {
    @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200;
}
```

---

## 🧪 **測試規範**

### 1. Go 單元測試
```go
// internal/services/user_service_test.go
package services

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

// Mock Repository
type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) GetByID(id int) (*User, error) {
    args := m.Called(id)
    return args.Get(0).(*User), args.Error(1)
}

// 測試用例
func TestUserService_GetUser(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    service := NewUserService(mockRepo)
    
    expectedUser := &User{
        ID:    1,
        Name:  "測試使用者",
        Email: "test@example.com",
    }
    
    mockRepo.On("GetByID", 1).Return(expectedUser, nil)
    
    // Act
    user, err := service.GetUser(1)
    
    // Assert
    assert.NoError(t, err)
    assert.Equal(t, expectedUser.ID, user.ID)
    assert.Equal(t, expectedUser.Name, user.Name)
    assert.Equal(t, expectedUser.Email, user.Email)
    
    mockRepo.AssertExpectations(t)
}

func TestUserService_GetUser_NotFound(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    service := NewUserService(mockRepo)
    
    mockRepo.On("GetByID", 999).Return((*User)(nil), ErrUserNotFound)
    
    // Act
    user, err := service.GetUser(999)
    
    // Assert
    assert.Error(t, err)
    assert.Equal(t, ErrUserNotFound, err)
    assert.Nil(t, user)
    
    mockRepo.AssertExpectations(t)
}
```

### 2. Laravel 功能測試
```php
<?php
// tests/Feature/UserManagementTest.php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_user_can_view_user_list()
    {
        // Arrange
        $admin = User::factory()->admin()->create();
        User::factory()->count(5)->create();
        
        // Act
        $response = $this->actingAs($admin)->get('/users');
        
        // Assert
        $response->assertStatus(200);
        $response->assertViewIs('users.index');
        $response->assertViewHas('users');
    }
    
    public function test_user_can_create_new_user()
    {
        // Arrange
        $admin = User::factory()->admin()->create();
        $userData = [
            'name' => '新使用者',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];
        
        // Act
        $response = $this->actingAs($admin)
                         ->post('/users', $userData);
        
        // Assert
        $response->assertRedirect('/users');
        $this->assertDatabaseHas('users', [
            'name' => '新使用者',
            'email' => 'newuser@example.com',
        ]);
    }
    
    public function test_user_creation_requires_valid_data()
    {
        // Arrange
        $admin = User::factory()->admin()->create();
        $invalidData = [
            'name' => '', // 空白名稱
            'email' => 'invalid-email', // 無效email
            'password' => '123', // 密碼太短
        ];
        
        // Act
        $response = $this->actingAs($admin)
                         ->post('/users', $invalidData);
        
        // Assert
        $response->assertSessionHasErrors(['name', 'email', 'password']);
        $this->assertDatabaseMissing('users', [
            'email' => 'invalid-email',
        ]);
    }
}
```

---

## 📚 **文件規範**

### 1. API 文件註解
```go
// GetUser retrieves a user by ID.
//
// @Summary Get user by ID
// @Description Get user details by user ID
// @Tags users
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/{id} [get]
// @Security BearerAuth
func (h *UserHandler) GetUser(c *gin.Context) {
    // 實作邏輯...
}
```

### 2. 程式碼註解規範
```go
// ✅ 好的註解
type UserService struct {
    repo UserRepository
    cache CacheService
}

// NewUserService creates a new user service instance with the given dependencies.
// It initializes the service with a repository for data access and a cache service
// for performance optimization.
func NewUserService(repo UserRepository, cache CacheService) *UserService {
    return &UserService{
        repo:  repo,
        cache: cache,
    }
}

// ValidateUser performs comprehensive user data validation including
// email format, password strength, and business rules.
// Returns ValidationError if any validation fails.
func (s *UserService) ValidateUser(user *User) error {
    // Email format validation
    if !isValidEmail(user.Email) {
        return NewValidationError("email", "Invalid email format")
    }
    
    // Password strength validation
    if !isStrongPassword(user.Password) {
        return NewValidationError("password", "Password too weak")
    }
    
    return nil
}

// ❌ 不好的註解
// get user
func GetUser() {} 

// this function does stuff
func ProcessData() {}
```

---

## 🔒 **安全規範**

### 1. 輸入驗證
```go
// ✅ 正確的輸入驗證
func (h *UserHandler) CreateUser(c *gin.Context) {
    var req CreateUserRequest
    
    // 綁定和驗證請求資料
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "success": false,
            "error": gin.H{
                "code": "VALIDATION_ERROR",
                "message": "Invalid request data",
                "details": err.Error(),
            },
        })
        return
    }
    
    // 額外的業務驗證
    if err := h.validator.ValidateCreateUser(&req); err != nil {
        c.JSON(http.StatusUnprocessableEntity, gin.H{
            "success": false,
            "error": gin.H{
                "code": "BUSINESS_VALIDATION_ERROR",
                "message": "Business validation failed",
                "details": err.Error(),
            },
        })
        return
    }
    
    // 清理和處理資料
    req.Email = strings.TrimSpace(strings.ToLower(req.Email))
    req.Name = strings.TrimSpace(req.Name)
    
    // 繼續處理...
}

type CreateUserRequest struct {
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
}
```

### 2. SQL 注入防護
```go
// ✅ 使用參數化查詢
func (r *userRepository) GetByEmail(email string) (*User, error) {
    query := `
        SELECT id, name, email, password_hash, created_at, updated_at 
        FROM users 
        WHERE email = $1 AND deleted_at IS NULL
    `
    
    var user User
    err := r.db.QueryRow(query, email).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.PasswordHash,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    
    return &user, err
}

// ❌ 避免字串拼接
func (r *userRepository) GetByEmailBad(email string) (*User, error) {
    query := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)
    // 這樣會有 SQL 注入風險！
}
```

### 3. 敏感資料處理
```go
// ✅ 正確的密碼處理
type User struct {
    ID           int       `json:"id" db:"id"`
    Name         string    `json:"name" db:"name"`
    Email        string    `json:"email" db:"email"`
    PasswordHash string    `json:"-" db:"password_hash"` // 不要序列化密碼
    CreatedAt    time.Time `json:"created_at" db:"created_at"`
    UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// SetPassword hashes and sets the user password
func (u *User) SetPassword(password string) error {
    hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    
    u.PasswordHash = string(hash)
    return nil
}

// CheckPassword verifies the provided password against the stored hash
func (u *User) CheckPassword(password string) error {
    return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
}
```

---

## 📊 **效能規範**

### 1. 資料庫查詢優化
```go
// ✅ 使用索引和限制結果
func (r *productRepository) GetProductsByCategory(categoryID int, limit, offset int) ([]*Product, error) {
    query := `
        SELECT p.id, p.name, p.price, p.stock, c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = $1 
        AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
    `
    
    rows, err := r.db.Query(query, categoryID, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var products []*Product
    for rows.Next() {
        var p Product
        err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.CategoryName)
        if err != nil {
            return nil, err
        }
        products = append(products, &p)
    }
    
    return products, nil
}

// ✅ 使用快取
func (s *productService) GetPopularProducts(limit int) ([]*Product, error) {
    cacheKey := fmt.Sprintf("popular_products:%d", limit)
    
    // 嘗試從快取取得
    if cached, err := s.cache.Get(cacheKey); err == nil {
        var products []*Product
        if err := json.Unmarshal(cached, &products); err == nil {
            return products, nil
        }
    }
    
    // 從資料庫取得
    products, err := s.repo.GetPopularProducts(limit)
    if err != nil {
        return nil, err
    }
    
    // 存入快取
    if data, err := json.Marshal(products); err == nil {
        s.cache.Set(cacheKey, data, 10*time.Minute)
    }
    
    return products, nil
}
```

### 2. 前端效能優化
```javascript
// ✅ 使用防抖處理搜尋
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 搜尋功能使用防抖
const searchInput = document.getElementById('searchInput');
const debouncedSearch = debounce(performSearch, 300);

searchInput.addEventListener('input', (event) => {
    debouncedSearch(event.target.value);
});

// ✅ 使用 Web Workers 處理重負載
function processLargeDataset(data) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('/js/workers/data-processor.js');
        
        worker.postMessage(data);
        
        worker.onmessage = (event) => {
            resolve(event.data);
            worker.terminate();
        };
        
        worker.onerror = (error) => {
            reject(error);
            worker.terminate();
        };
    });
}
```

---

## ✅ **提交前檢查清單**

### 程式碼品質檢查
```markdown
- [ ] 程式碼符合命名規範
- [ ] 所有函式都有適當的註解
- [ ] 錯誤處理完整且一致
- [ ] 沒有硬編碼的魔術數字或字串
- [ ] 移除了所有 console.log 和除錯程式碼
- [ ] 程式碼經過格式化工具處理
- [ ] 沒有重複的程式碼
- [ ] 遵循 DRY 原則
```

### 安全檢查
```markdown
- [ ] 所有使用者輸入都經過驗證
- [ ] 敏感資料不會在日誌中出現
- [ ] 使用參數化查詢防止 SQL 注入
- [ ] API 端點有適當的權限檢查
- [ ] 密碼經過適當加密
- [ ] CSRF 保護已實作
```

### 測試檢查
```markdown
- [ ] 新功能有對應的單元測試
- [ ] 測試覆蓋率符合要求
- [ ] 所有測試都能通過
- [ ] 邊界條件已經測試
- [ ] 錯誤情況已經測試
```

### 效能檢查
```markdown
- [ ] 資料庫查詢已優化
- [ ] 適當使用索引
- [ ] 大量資料有分頁處理
- [ ] 重複查詢使用快取
- [ ] 前端資源已優化和壓縮
```

---

**文件維護**: 本規範隨專案發展持續更新  
**執行要求**: 所有開發人員和 AI 助手必須遵循  
**最後更新**: 2025-07-24