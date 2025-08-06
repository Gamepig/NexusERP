# NexusERP 開發模式與最佳實踐
## 經過驗證的開發模式和程式碼範例

**建立日期**: 2025-07-24  
**適用範圍**: 全體開發人員和 AI 助手  
**維護狀態**: 持續更新

---

## 🏗️ **架構模式**

### 模式 1: Repository Pattern (資料存取層)
**適用場景**: 資料庫操作抽象化，便於測試和維護

**Go 實作範例**:
```go
// 介面定義
type UserRepository interface {
    Create(user *User) error
    GetByID(id int) (*User, error)
    GetByEmail(email string) (*User, error)
    Update(user *User) error
    Delete(id int) error
    List(filters UserFilters) ([]*User, error)
}

// 實作結構
type userRepository struct {
    db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
    return &userRepository{db: db}
}

// 具體實作
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
    
    if err == sql.ErrNoRows {
        return nil, ErrUserNotFound
    }
    
    return &user, err
}
```

**使用場景**:
- 所有資料庫實體都應該有 Repository
- Repository 只處理資料存取，不包含業務邏輯
- 便於單元測試時使用 Mock

---

### 模式 2: Service Layer Pattern (業務邏輯層)
**適用場景**: 複雜業務邏輯封裝，協調多個 Repository

**Go 實作範例**:
```go
type UserService struct {
    userRepo UserRepository
    emailService EmailService
    logger   Logger
}

func NewUserService(userRepo UserRepository, emailService EmailService, logger Logger) *UserService {
    return &UserService{
        userRepo:     userRepo,
        emailService: emailService,
        logger:       logger,
    }
}

// 業務邏輯方法
func (s *UserService) CreateUser(req CreateUserRequest) (*User, error) {
    // 1. 驗證業務規則
    if err := s.validateCreateUser(req); err != nil {
        return nil, err
    }
    
    // 2. 檢查重複
    if exists, err := s.userRepo.GetByEmail(req.Email); err == nil && exists != nil {
        return nil, ErrUserEmailExists
    }
    
    // 3. 建立使用者
    user := &User{
        Name:      req.Name,
        Email:     req.Email,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    
    if err := user.SetPassword(req.Password); err != nil {
        return nil, err
    }
    
    if err := s.userRepo.Create(user); err != nil {
        s.logger.Error("Failed to create user", "error", err)
        return nil, err
    }
    
    // 4. 後續處理
    go func() {
        if err := s.emailService.SendWelcomeEmail(user.Email); err != nil {
            s.logger.Warn("Failed to send welcome email", "error", err)
        }
    }()
    
    return user, nil
}

func (s *UserService) validateCreateUser(req CreateUserRequest) error {
    if req.Name == "" {
        return NewValidationError("name", "Name is required")
    }
    
    if !isValidEmail(req.Email) {
        return NewValidationError("email", "Invalid email format")
    }
    
    if len(req.Password) < 8 {
        return NewValidationError("password", "Password must be at least 8 characters")
    }
    
    return nil
}
```

**設計原則**:
- Service 負責業務邏輯和流程控制
- 協調多個 Repository 和外部服務
- 包含複雜的驗證和業務規則
- 處理事務性操作

---

### 模式 3: Handler Pattern (HTTP 處理器)
**適用場景**: HTTP 請求處理，格式轉換和錯誤處理

**Go 實作範例**:
```go
type UserHandler struct {
    userService *UserService
    validator   *Validator
}

func NewUserHandler(userService *UserService, validator *Validator) *UserHandler {
    return &UserHandler{
        userService: userService,
        validator:   validator,
    }
}

// 標準 HTTP 處理器
func (h *UserHandler) CreateUser(c *gin.Context) {
    var req CreateUserRequest
    
    // 1. 綁定請求資料
    if err := c.ShouldBindJSON(&req); err != nil {
        h.respondError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request format", err)
        return
    }
    
    // 2. 額外驗證
    if err := h.validator.ValidateStruct(req); err != nil {
        h.respondValidationError(c, err)
        return
    }
    
    // 3. 呼叫業務邏輯
    user, err := h.userService.CreateUser(req)
    if err != nil {
        h.handleServiceError(c, err)
        return
    }
    
    // 4. 回應成功結果
    h.respondSuccess(c, http.StatusCreated, user, "User created successfully")
}

// 標準錯誤處理
func (h *UserHandler) handleServiceError(c *gin.Context, err error) {
    switch {
    case errors.Is(err, ErrUserEmailExists):
        h.respondError(c, http.StatusConflict, "EMAIL_EXISTS", "Email already exists", nil)
    case errors.Is(err, ErrUserNotFound):
        h.respondError(c, http.StatusNotFound, "USER_NOT_FOUND", "User not found", nil)
    default:
        h.respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
    }
}

// 標準回應格式
func (h *UserHandler) respondSuccess(c *gin.Context, status int, data interface{}, message string) {
    c.JSON(status, gin.H{
        "success": true,
        "data":    data,
        "message": message,
    })
}

func (h *UserHandler) respondError(c *gin.Context, status int, code, message string, details interface{}) {
    c.JSON(status, gin.H{
        "success": false,
        "error": gin.H{
            "code":    code,
            "message": message,
            "details": details,
        },
    })
}
```

**處理流程**:
1. 請求資料綁定和初步驗證
2. 業務驗證和規則檢查
3. 呼叫 Service 層處理業務邏輯
4. 統一的錯誤處理和回應格式

---

## 🎨 **前端開發模式**

### 模式 4: Blade Component Pattern
**適用場景**: 可重用的 UI 組件，保持一致性

**Laravel Blade 實作範例**:
```php
{{-- resources/views/components/data-table.blade.php --}}
@props([
    'headers' => [],
    'data' => collect(),
    'actions' => [],
    'searchable' => true,
    'sortable' => true,
    'pageable' => true,
    'apiUrl' => null,
    'emptyMessage' => '暫無資料',
    'tableId' => 'dataTable'
])

<div {{ $attributes->merge(['class' => 'table-container']) }}>
    @if($searchable)
    <div class="row mb-3">
        <div class="col-md-6">
            <input type="text" 
                   class="form-control" 
                   id="{{ $tableId }}Search" 
                   placeholder="搜尋...">
        </div>
        <div class="col-md-6 text-end">
            {{ $toolbar ?? '' }}
        </div>
    </div>
    @endif
    
    <div class="table-responsive">
        <table class="table table-striped table-hover" 
               id="{{ $tableId }}"
               @if($apiUrl) data-api-url="{{ $apiUrl }}" @endif
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
                @if($data->isEmpty())
                <tr>
                    <td colspan="{{ count($headers) + (count($actions) > 0 ? 1 : 0) }}" 
                        class="text-center text-muted">
                        {{ $emptyMessage }}
                    </td>
                </tr>
                @else
                {{ $slot }}
                @endif
            </tbody>
        </table>
    </div>
    
    @if($pageable && method_exists($data, 'links'))
    <div class="mt-3">
        {{ $data->links() }}
    </div>
    @endif
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('{{ $tableId }}');
    if (table && table.dataset.apiUrl) {
        // 初始化 DataTables
        $('#{{ $tableId }}').DataTable({
            processing: true,
            serverSide: true,
            ajax: table.dataset.apiUrl,
            // ... 其他配置
        });
    }
});
</script>
@endpush
```

**使用方式**:
```php
{{-- 在頁面中使用 --}}
<x-data-table 
    :headers="['名稱', '郵箱', '建立時間']"
    :data="$users"
    :actions="['edit' => '編輯', 'delete' => '刪除']"
    api-url="{{ route('api.users.index') }}"
    table-id="usersTable">
    
    @foreach($users as $user)
    <tr>
        <td>{{ $user->name }}</td>
        <td>{{ $user->email }}</td>
        <td>{{ $user->created_at->format('Y-m-d H:i') }}</td>
        <td>
            <button class="btn btn-sm btn-primary" data-action="edit" data-id="{{ $user->id }}">
                編輯
            </button>
            <button class="btn btn-sm btn-danger" data-action="delete" data-id="{{ $user->id }}">
                刪除
            </button>
        </td>
    </tr>
    @endforeach
</x-data-table>
```

---

### 模式 5: Alpine.js Reactive Pattern
**適用場景**: 輕量級前端互動，避免複雜的 JavaScript 框架

**Alpine.js 實作範例**:
```html
<div x-data="productManager()" x-init="init()">
    <!-- 產品列表 -->
    <div class="card">
        <div class="card-header d-flex justify-content-between">
            <h5>產品管理</h5>
            <button @click="openCreateModal()" class="btn btn-primary">
                新增產品
            </button>
        </div>
        <div class="card-body">
            <!-- 搜尋功能 -->
            <div class="mb-3">
                <input x-model="searchQuery" 
                       @input.debounce.300ms="search()"
                       type="text" 
                       class="form-control" 
                       placeholder="搜尋產品...">
            </div>
            
            <!-- 產品表格 -->
            <div x-show="loading" class="text-center">
                <div class="spinner-border" role="status"></div>
            </div>
            
            <table x-show="!loading" class="table table-striped">
                <thead>
                    <tr>
                        <th @click="sort('name')" class="sortable">
                            產品名稱
                            <i :class="getSortIcon('name')"></i>
                        </th>
                        <th @click="sort('price')" class="sortable">
                            價格
                            <i :class="getSortIcon('price')"></i>
                        </th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="product in products" :key="product.id">
                        <tr>
                            <td x-text="product.name"></td>
                            <td x-text="formatPrice(product.price)"></td>
                            <td>
                                <button @click="editProduct(product)" class="btn btn-sm btn-primary">
                                    編輯
                                </button>
                                <button @click="deleteProduct(product.id)" class="btn btn-sm btn-danger">
                                    刪除
                                </button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- 產品彈窗 -->
    <div x-show="showModal" 
         x-transition
         class="modal d-block" 
         style="background-color: rgba(0,0,0,0.5)">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 x-text="modalTitle"></h5>
                    <button @click="closeModal()" class="btn-close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="saveProduct()">
                        <div class="mb-3">
                            <label class="form-label">產品名稱</label>
                            <input x-model="form.name" 
                                   type="text" 
                                   class="form-control"
                                   :class="{ 'is-invalid': errors.name }"
                                   required>
                            <div x-show="errors.name" 
                                 x-text="errors.name" 
                                 class="invalid-feedback"></div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">價格</label>
                            <input x-model="form.price" 
                                   type="number" 
                                   class="form-control"
                                   :class="{ 'is-invalid': errors.price }"
                                   step="0.01"
                                   required>
                            <div x-show="errors.price" 
                                 x-text="errors.price" 
                                 class="invalid-feedback"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button @click="closeModal()" class="btn btn-secondary">取消</button>
                    <button @click="saveProduct()" 
                            :disabled="saving" 
                            class="btn btn-primary">
                        <span x-show="saving">儲存中...</span>
                        <span x-show="!saving">儲存</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function productManager() {
    return {
        // 狀態管理
        products: [],
        loading: false,
        saving: false,
        showModal: false,
        searchQuery: '',
        sortField: 'name',
        sortDirection: 'asc',
        
        // 表單資料
        form: {
            id: null,
            name: '',
            price: ''
        },
        errors: {},
        
        // 初始化
        async init() {
            await this.loadProducts();
        },
        
        // 載入產品資料
        async loadProducts() {
            this.loading = true;
            try {
                const response = await fetch('/api/products?' + new URLSearchParams({
                    search: this.searchQuery,
                    sort: this.sortField,
                    direction: this.sortDirection
                }));
                const data = await response.json();
                this.products = data.data;
            } catch (error) {
                this.showError('載入產品失敗');
            } finally {
                this.loading = false;
            }
        },
        
        // 搜尋功能
        async search() {
            await this.loadProducts();
        },
        
        // 排序功能
        async sort(field) {
            if (this.sortField === field) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortField = field;
                this.sortDirection = 'asc';
            }
            await this.loadProducts();
        },
        
        // 彈窗管理
        openCreateModal() {
            this.form = { id: null, name: '', price: '' };
            this.errors = {};
            this.showModal = true;
        },
        
        editProduct(product) {
            this.form = { ...product };
            this.errors = {};
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.form = { id: null, name: '', price: '' };
            this.errors = {};
        },
        
        // 儲存產品
        async saveProduct() {
            this.saving = true;
            this.errors = {};
            
            try {
                const url = this.form.id ? `/api/products/${this.form.id}` : '/api/products';
                const method = this.form.id ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': this.getCSRFToken()
                    },
                    body: JSON.stringify(this.form)
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    this.closeModal();
                    await this.loadProducts();
                    this.showSuccess(data.message || '操作成功');
                } else {
                    this.handleValidationErrors(data.error);
                }
            } catch (error) {
                this.showError('操作失敗，請稍後再試');
            } finally {
                this.saving = false;
            }
        },
        
        // 刪除產品
        async deleteProduct(productId) {
            if (!confirm('確定要刪除此產品嗎？')) return;
            
            try {
                const response = await fetch(`/api/products/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': this.getCSRFToken()
                    }
                });
                
                if (response.ok) {
                    await this.loadProducts();
                    this.showSuccess('產品已刪除');
                } else {
                    this.showError('刪除失敗');
                }
            } catch (error) {
                this.showError('刪除失敗，請稍後再試');
            }
        },
        
        // 輔助方法
        get modalTitle() {
            return this.form.id ? '編輯產品' : '新增產品';
        },
        
        getSortIcon(field) {
            if (this.sortField !== field) return 'fas fa-sort';
            return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        },
        
        formatPrice(price) {
            return new Intl.NumberFormat('zh-TW', {
                style: 'currency',
                currency: 'TWD'
            }).format(price);
        },
        
        getCSRFToken() {
            return document.querySelector('meta[name="csrf-token"]')?.content || '';
        },
        
        handleValidationErrors(error) {
            if (error && error.details) {
                this.errors = error.details;
            } else {
                this.showError(error?.message || '驗證失敗');
            }
        },
        
        showSuccess(message) {
            // 實作成功通知
            console.log('Success:', message);
        },
        
        showError(message) {
            // 實作錯誤通知
            console.error('Error:', message);
        }
    }
}
</script>
```

**Alpine.js 設計原則**:
- 狀態集中管理在 data 函式中
- 使用 async/await 處理 API 呼叫
- 統一的錯誤處理和使用者回饋
- 響應式的 UI 更新

---

## 🧪 **測試模式**

### 模式 6: Unit Test Pattern (Go)
**適用場景**: Go 服務層和資料層的單元測試

**Go 測試實作範例**:
```go
// user_service_test.go
package services

import (
    "testing"
    "time"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/stretchr/testify/suite"
)

// Mock Repository
type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) Create(user *User) error {
    args := m.Called(user)
    return args.Error(0)
}

func (m *MockUserRepository) GetByID(id int) (*User, error) {
    args := m.Called(id)
    return args.Get(0).(*User), args.Error(1)
}

func (m *MockUserRepository) GetByEmail(email string) (*User, error) {
    args := m.Called(email)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*User), args.Error(1)
}

// Test Suite
type UserServiceTestSuite struct {
    suite.Suite
    service    *UserService
    mockRepo   *MockUserRepository
    mockEmail  *MockEmailService
    mockLogger *MockLogger
}

func (suite *UserServiceTestSuite) SetupTest() {
    suite.mockRepo = new(MockUserRepository)
    suite.mockEmail = new(MockEmailService)
    suite.mockLogger = new(MockLogger)
    
    suite.service = NewUserService(
        suite.mockRepo,
        suite.mockEmail,
        suite.mockLogger,
    )
}

func (suite *UserServiceTestSuite) TestCreateUser_Success() {
    // Arrange
    req := CreateUserRequest{
        Name:     "測試使用者",
        Email:    "test@example.com",
        Password: "password123",
    }
    
    // Mock 設定
    suite.mockRepo.On("GetByEmail", req.Email).Return(nil, ErrUserNotFound)
    suite.mockRepo.On("Create", mock.AnythingOfType("*User")).Return(nil)
    suite.mockEmail.On("SendWelcomeEmail", req.Email).Return(nil)
    
    // Act
    user, err := suite.service.CreateUser(req)
    
    // Assert
    assert.NoError(suite.T(), err)
    assert.NotNil(suite.T(), user)
    assert.Equal(suite.T(), req.Name, user.Name)
    assert.Equal(suite.T(), req.Email, user.Email)
    assert.NotEmpty(suite.T(), user.PasswordHash)
    assert.NotZero(suite.T(), user.CreatedAt)
    
    // 驗證 Mock 呼叫
    suite.mockRepo.AssertExpectations(suite.T())
    suite.mockEmail.AssertExpectations(suite.T())
}

func (suite *UserServiceTestSuite) TestCreateUser_EmailExists() {
    // Arrange
    req := CreateUserRequest{
        Name:     "測試使用者",
        Email:    "test@example.com",
        Password: "password123",
    }
    
    existingUser := &User{
        ID:    1,
        Email: req.Email,
    }
    
    suite.mockRepo.On("GetByEmail", req.Email).Return(existingUser, nil)
    
    // Act
    user, err := suite.service.CreateUser(req)
    
    // Assert
    assert.Error(suite.T(), err)
    assert.Equal(suite.T(), ErrUserEmailExists, err)
    assert.Nil(suite.T(), user)
    
    suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *UserServiceTestSuite) TestCreateUser_ValidationError() {
    // Arrange
    req := CreateUserRequest{
        Name:     "", // 空白名稱
        Email:    "invalid-email",
        Password: "123", // 密碼太短
    }
    
    // Act
    user, err := suite.service.CreateUser(req)
    
    // Assert
    assert.Error(suite.T(), err)
    assert.Nil(suite.T(), user)
    
    var validationErr *ValidationError
    assert.True(suite.T(), errors.As(err, &validationErr))
}

// 執行測試套件
func TestUserServiceSuite(t *testing.T) {
    suite.Run(t, new(UserServiceTestSuite))
}

// 基準測試
func BenchmarkUserService_CreateUser(b *testing.B) {
    mockRepo := new(MockUserRepository)
    mockEmail := new(MockEmailService)
    mockLogger := new(MockLogger)
    
    service := NewUserService(mockRepo, mockEmail, mockLogger)
    
    req := CreateUserRequest{
        Name:     "測試使用者",
        Email:    "test@example.com",
        Password: "password123",
    }
    
    mockRepo.On("GetByEmail", req.Email).Return(nil, ErrUserNotFound)
    mockRepo.On("Create", mock.AnythingOfType("*User")).Return(nil)
    mockEmail.On("SendWelcomeEmail", req.Email).Return(nil)
    
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        service.CreateUser(req)
    }
}
```

**測試組織原則**:
- 使用 TestSuite 組織相關測試
- 每個測試遵循 AAA 模式 (Arrange, Act, Assert)
- 使用 Mock 隔離外部依賴
- 包含正常流程和錯誤情況測試
- 使用基準測試驗證效能

---

### 模式 7: E2E Test Pattern (Playwright)
**適用場景**: 完整業務流程的端到端測試

**Playwright 測試實作範例**:
```javascript
// tests/e2e/user-management.spec.js
const { test, expect } = require('@playwright/test');

test.describe('使用者管理', () => {
    test.beforeEach(async ({ page }) => {
        // 登入管理員帳號
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // 等待登入完成
        await expect(page).toHaveURL('/dashboard');
    });
    
    test('應該能夠查看使用者列表', async ({ page }) => {
        // 前往使用者管理頁面
        await page.goto('/users');
        
        // 驗證頁面標題
        await expect(page.locator('h1')).toContainText('使用者管理');
        
        // 驗證表格存在
        await expect(page.locator('table')).toBeVisible();
        
        // 驗證表格標題
        const headers = page.locator('table thead th');
        await expect(headers).toContainText(['姓名', '郵箱', '建立時間', '操作']);
        
        // 驗證至少有一行資料
        const rows = page.locator('table tbody tr');
        await expect(rows).toHaveCountGreaterThan(0);
    });
    
    test('應該能夠新增使用者', async ({ page }) => {
        await page.goto('/users');
        
        // 點擊新增按鈕
        await page.click('button:has-text("新增使用者")');
        
        // 等待彈窗出現
        const modal = page.locator('.modal');
        await expect(modal).toBeVisible();
        
        // 填寫使用者資料
        const timestamp = Date.now();
        const userData = {
            name: `測試使用者${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: 'password123'
        };
        
        await page.fill('input[name="name"]', userData.name);
        await page.fill('input[name="email"]', userData.email);
        await page.fill('input[name="password"]', userData.password);
        
        // 提交表單
        await page.click('button:has-text("儲存")');
        
        // 等待儲存完成
        await expect(modal).not.toBeVisible();
        
        // 驗證成功訊息
        await expect(page.locator('.alert-success')).toContainText('使用者建立成功');
        
        // 驗證新使用者出現在列表中
        await expect(page.locator('table tbody')).toContainText(userData.name);
        await expect(page.locator('table tbody')).toContainText(userData.email);
    });
    
    test('應該能夠編輯使用者', async ({ page }) => {
        await page.goto('/users');
        
        // 點擊第一個使用者的編輯按鈕
        await page.click('table tbody tr:first-child .btn-edit');
        
        // 等待編輯彈窗出現
        const modal = page.locator('.modal');
        await expect(modal).toBeVisible();
        
        // 修改使用者姓名
        const newName = `更新的使用者${Date.now()}`;
        await page.fill('input[name="name"]', newName);
        
        // 提交更新
        await page.click('button:has-text("儲存")');
        
        // 等待更新完成
        await expect(modal).not.toBeVisible();
        
        // 驗證更新成功
        await expect(page.locator('.alert-success')).toContainText('使用者更新成功');
        
        // 驗證姓名已更新
        await expect(page.locator('table tbody tr:first-child')).toContainText(newName);
    });
    
    test('應該能夠搜尋使用者', async ({ page }) => {
        await page.goto('/users');
        
        // 在搜尋框輸入關鍵字
        await page.fill('input[placeholder*="搜尋"]', 'admin');
        
        // 等待搜尋結果載入
        await page.waitForTimeout(500);
        
        // 驗證搜尋結果
        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        
        if (rowCount > 0) {
            // 驗證所有結果都包含搜尋關鍵字
            for (let i = 0; i < rowCount; i++) {
                const rowText = await rows.nth(i).textContent();
                expect(rowText.toLowerCase()).toContain('admin');
            }
        }
    });
    
    test('應該能夠刪除使用者', async ({ page }) => {
        await page.goto('/users');
        
        // 記錄刪除前的使用者數量
        const initialRowCount = await page.locator('table tbody tr').count();
        
        // 點擊第一個使用者的刪除按鈕
        await page.click('table tbody tr:first-child .btn-delete');
        
        // 確認刪除
        page.on('dialog', dialog => dialog.accept());
        
        // 等待刪除完成
        await expect(page.locator('.alert-success')).toContainText('使用者已刪除');
        
        // 驗證使用者數量減少
        const finalRowCount = await page.locator('table tbody tr').count();
        expect(finalRowCount).toBe(initialRowCount - 1);
    });
    
    test('表單驗證應該正常運作', async ({ page }) => {
        await page.goto('/users');
        
        // 點擊新增按鈕
        await page.click('button:has-text("新增使用者")');
        
        const modal = page.locator('.modal');
        await expect(modal).toBeVisible();
        
        // 提交空表單
        await page.click('button:has-text("儲存")');
        
        // 驗證必填欄位錯誤訊息
        await expect(page.locator('.invalid-feedback')).toContainText('姓名為必填欄位');
        
        // 輸入無效郵箱
        await page.fill('input[name="name"]', '測試使用者');
        await page.fill('input[name="email"]', 'invalid-email');
        await page.fill('input[name="password"]', '123'); // 密碼太短
        
        await page.click('button:has-text("儲存")');
        
        // 驗證格式錯誤訊息
        await expect(page.locator('.invalid-feedback')).toContainText('郵箱格式不正確');
        await expect(page.locator('.invalid-feedback')).toContainText('密碼至少需要8個字元');
    });
});

// 效能測試
test.describe('使用者管理效能測試', () => {
    test('頁面載入效能', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto('/users');
        
        // 等待頁面完全載入
        await expect(page.locator('table')).toBeVisible();
        
        const loadTime = Date.now() - startTime;
        
        // 驗證載入時間小於 2 秒
        expect(loadTime).toBeLessThan(2000);
        
        console.log(`使用者頁面載入時間: ${loadTime}ms`);
    });
    
    test('大量資料載入測試', async ({ page }) => {
        // 先建立大量測試資料
        await page.goto('/users');
        
        // 測試分頁功能
        const paginationLinks = page.locator('.pagination a');
        if (await paginationLinks.count() > 0) {
            // 點擊最後一頁
            await paginationLinks.last().click();
            
            // 驗證資料正常載入
            await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
        }
    });
});
```

**E2E 測試設計原則**:
- 模擬真實使用者操作流程
- 測試關鍵業務路徑
- 包含正常流程和錯誤處理
- 驗證使用者介面和資料一致性
- 包含效能基準測試

---

## 🔄 **最佳實踐總結**

### 程式碼組織原則
```yaml
分層架構:
  Handler: 處理 HTTP 請求和回應
  Service: 實作業務邏輯和流程控制
  Repository: 處理資料存取和持久化
  Model: 定義資料結構和業務規則

依賴注入:
  - 使用建構子注入依賴
  - 依賴介面而非具體實作
  - 便於測試和維護

錯誤處理:
  - 定義明確的錯誤類型
  - 統一的錯誤處理機制
  - 適當的錯誤日誌記錄
```

### 測試策略
```yaml
測試金字塔:
  70% 單元測試: 快速回饋，專注邏輯
  20% 整合測試: 驗證組件協作
  10% E2E 測試: 驗證使用者場景

測試原則:
  - 測試行為而非實作
  - 保持測試獨立性
  - 使用有意義的測試名稱
  - 適當的測試資料管理
```

### 效能考量
```yaml
資料庫優化:
  - 適當的索引設計
  - 避免 N+1 查詢問題
  - 使用連線池管理
  - 分頁查詢大量資料

快取策略:
  - 多層次快取架構
  - 適當的過期時間設定
  - 快取失效策略
  - 監控快取效果

前端優化:
  - 懶載入和分頁
  - 防抖處理使用者輸入
  - 適當的載入狀態提示
  - 響應式設計優化
```

---

## 🧠 **Sequential Thinking 開發整合模式** (2025-07-25 新增)

### 模式 8: Sequential Thinking Driven Development (STDD)
**適用場景**: 複雜問題分析、系統設計、架構決策、問題診斷

**開發流程整合範例**:
```javascript
// Sequential Thinking 在開發流程中的應用
const developmentWithSequentialThinking = {
    // 階段 1: 需求分析
    requirementAnalysis: {
        tool: 'mcp__sequential-thinking__sequentialthinking',
        process: [
            'thought: 理解需求的核心目標和限制條件',
            'thought: 分析相關的技術和業務限制',
            'thought: 評估不同實作方式的優缺點',
            'thought: 確定最適合的技術方案',
            'thought: 識別潛在的風險和挑戰'
        ],
        outcome: '明確的技術實作策略和風險評估'
    },
    
    // 階段 2: 架構設計
    architectureDesign: {
        tool: 'mcp__sequential-thinking__sequentialthinking',
        process: [
            'thought: 分析系統邊界和核心職責',
            'thought: 設計模組間的介面和依賴關係',  
            'thought: 評估資料流和控制流',
            'thought: 考慮擴充性和維護性',
            'thought: 驗證設計是否滿足需求'
        ],
        outcome: '完整的系統架構設計和實作計劃'
    },
    
    // 階段 3: 問題診斷
    problemDiagnosis: {
        tool: 'mcp__sequential-thinking__sequentialthinking',
        process: [
            'thought: 描述問題的具體症狀和影響範圍',
            'thought: 分析問題可能的根本原因',
            'thought: 收集和分析相關的系統資訊',
            'thought: 驗證假設並確定真正的原因',
            'thought: 設計解決方案和預防措施'
        ],
        outcome: '根本原因分析和系統性解決方案'
    }
};
```

### STDD 最佳實踐模式

#### 模式 8.1: 任務分析模式
```yaml
使用時機: 開始複雜任務前的深度分析
思考步驟:
  1. 問題界定: 明確要解決的核心問題
  2. 現況分析: 分析當前系統狀態和限制
  3. 方案生成: 產生多個可能的解決方案
  4. 方案評估: 比較不同方案的優缺點
  5. 決策制定: 選擇最適合的方案
  6. 風險評估: 識別和評估實施風險
  7. 實施規劃: 制定詳細的執行計劃

整合工具:
  - TaskMaster: 記錄思考結果到任務詳情
  - Memory Bank: 儲存重要的思考模式
  - Code: 根據分析結果進行實作
```

#### 模式 8.2: 除錯分析模式
```yaml
使用時機: 遇到複雜問題或系統性錯誤
思考步驟:
  1. 症狀收集: 詳細記錄問題的表現
  2. 環境分析: 分析問題發生的環境條件
  3. 假設生成: 提出可能的原因假設
  4. 假設驗證: 逐一驗證每個假設
  5. 根因分析: 找出問題的根本原因
  6. 解決方案: 設計針對性的解決方案
  7. 預防措施: 制定避免重複發生的措施

記錄機制:
  - Bug Records: 建立詳細的問題分析記錄
  - System Patterns: 更新已知問題模式
  - Tech Context: 更新技術解決方案
```

#### 模式 8.3: 架構決策模式
```yaml
使用時機: 重要的技術選型或架構變更
思考步驟:
  1. 決策背景: 說明為什麼需要這個決策
  2. 選項分析: 列出所有可能的選項
  3. 評估標準: 定義評估的標準和權重
  4. 深度評估: 對每個選項進行詳細分析
  5. 權衡比較: 比較不同選項的優劣
  6. 決策確認: 選擇最適合的方案
  7. 實施計劃: 制定具體的實施策略

決策文檔:
  - Technical Decisions: 記錄重要的技術決策
  - Architecture Patterns: 更新架構設計模式
  - Lessons Learned: 累積決策經驗
```

### 整合開發工作流程

#### Go 後端開發整合
```go
// 使用 Sequential Thinking 指導的 Go 開發模式
type SequentialThinkingDrivenService struct {
    // 透過 Sequential Thinking 分析設計的結構
    repository UserRepository
    validator  Validator
    logger     Logger
    cache      CacheService
}

// 複雜業務邏輯實作前使用 Sequential Thinking 分析
func (s *SequentialThinkingDrivenService) ComplexBusinessLogic(req ComplexRequest) (*Result, error) {
    /*
    Sequential Thinking 分析記錄:
    1. thought: 分析請求的業務邏輯複雜度和依賴關係
    2. thought: 識別需要的資料驗證和業務規則
    3. thought: 設計錯誤處理和事務管理策略
    4. thought: 評估效能影響和最佳化機會
    5. thought: 確定實作順序和測試策略
    */
    
    // 基於思考分析的實作
    if err := s.validateComplexRequest(req); err != nil {
        return nil, err
    }
    
    // 複雜邏輯處理...
    result, err := s.processComplexLogic(req)
    if err != nil {
        s.logger.Error("Complex logic failed", "error", err)
        return nil, err
    }
    
    return result, nil
}
```

#### Laravel 前端開發整合
```php
<?php
// 使用 Sequential Thinking 指導的 Laravel 開發模式

class SequentialThinkingDrivenController extends Controller
{
    /*
    Sequential Thinking 設計分析:
    1. thought: 分析用戶介面需求和互動流程
    2. thought: 設計表單驗證和錯誤處理
    3. thought: 評估前後端資料交互方式
    4. thought: 考慮使用者體驗和效能最佳化
    5. thought: 規劃測試覆蓋和錯誤場景
    */
    
    public function complexFormHandler(ComplexFormRequest $request)
    {
        // 基於 Sequential Thinking 分析的實作
        
        // 1. 資料驗證 (基於思考步驟 2)
        $validatedData = $request->validated();
        
        // 2. 業務邏輯處理 (基於思考步驟 3)
        try {
            $result = $this->processComplexForm($validatedData);
            
            // 3. 回應處理 (基於思考步驟 4)
            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => '處理成功'
            ]);
            
        } catch (Exception $e) {
            // 4. 錯誤處理 (基於思考步驟 5)
            Log::error('Complex form processing failed', [
                'error' => $e->getMessage(),
                'data' => $validatedData
            ]);
            
            return response()->json([
                'success' => false,
                'message' => '處理失敗，請稍後再試'
            ], 500);
        }
    }
}
```

### Sequential Thinking 記錄和知識管理

#### 思考過程記錄模式
```markdown
## Sequential Thinking 記錄: [任務/問題標題]

**日期**: 2025-07-25
**複雜度**: 高 (8-10 思考步驟)
**場景**: 系統架構設計

### 思考過程
1. **thought**: 分析需求的核心目標...
   - **結論**: 確定了三個主要目標
   - **影響**: 影響了後續的技術選型

2. **thought**: 評估現有系統的限制...
   - **結論**: 識別了兩個主要瓶頸
   - **影響**: 需要重構部分架構

3. **thought**: 比較不同技術方案...
   - **結論**: 方案 B 最符合需求
   - **影響**: 決定使用 microservices 架構

[... 更多思考步驟]

### 最終決策
- **選擇的方案**: Microservices 架構
- **主要理由**: 擴充性和維護性最佳
- **實施計劃**: 分三個階段實施

### 學習收穫
- **模式識別**: 這是典型的擴充性挑戰
- **可重用經驗**: 類似場景可參考此分析
- **改進建議**: 下次應更早考慮效能影響
```

#### 知識庫整合策略
```yaml
Sequential Thinking 知識積累:
  問題模式庫:
    - 常見的架構設計問題
    - 典型的效能瓶頸分析
    - 安全問題的系統性分析
    
  解決方案模板:
    - 微服務架構決策框架
    - 資料庫最佳化分析模式
    - 前端效能問題診斷流程
    
  決策樹模型:
    - 技術選型決策樹
    - 架構演進決策樹
    - 問題診斷決策樹

整合工具:
  TaskMaster: 任務分析結果記錄
  Memory Bank: 重要思考模式儲存
  Bug Records: 問題診斷過程記錄
  Tech Context: 技術決策背景記錄
```

### 效能和品質影響

#### 開發效率提升
```yaml
時間節省:
  - 減少返工: 深入分析避免錯誤方向
  - 減少除錯: 系統性分析找出根本原因
  - 減少重複: 模式積累避免重複思考

品質提升:
  - 決策品質: 全面考慮各種因素
  - 程式碼品質: 基於深入分析的設計
  - 系統穩定性: 充分的風險評估
```

#### 團隊學習效應
```yaml
知識傳承:
  - 思考過程透明化
  - 決策理由可追溯
  - 經驗模式可複製

協作改善:
  - 統一的分析框架
  - 清晰的決策邏輯
  - 有效的知識分享
```

**Sequential Thinking Driven Development (STDD) 為 NexusERP 專案建立了系統性的開發方法論，確保在面對複雜技術挑戰時能夠進行深入、全面的分析，提升開發效率和程式碼品質。**

---

**維護說明**: 每個新的開發模式都應該記錄於此，包含完整的程式碼範例  
**使用指引**: 開發時應該優先參考這些已驗證的模式  
**更新機制**: 發現更好的實踐方式時應該及時更新對應模式