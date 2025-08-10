# Bug 記錄 - NexusERP 報價系統綜合修復

## 📅 基本資訊
- **發現日期**：2025-08-08
- **任務 ID**：TodoList Task 1-10
- **嚴重程度**：高（系統核心功能失效）
- **狀態**：✅ 已解決
- **修復方法**：Super Thinking 四階段除錯法
- **測試工具**：Playwright MCP 自動化測試

## 🐛 問題描述

### 核心問題 1：報價列表搜尋功能完全失效
- **表現症狀**：用戶在報價列表頁面進行搜尋時，無論輸入任何關鍵字都無法得到預期結果
- **影響範圍**：所有搜尋、排序、篩選功能
- **業務影響**：用戶無法快速找到特定報價，嚴重影響工作效率

### 核心問題 2：報價建立狀態固定為"草稿"
- **表現症狀**：用戶在建立報價時選擇任何狀態，最終保存的狀態都是"草稿"
- **影響範圍**：報價工作流程管理
- **業務影響**：無法建立"已發送"、"已批准"等狀態的報價，影響業務流程

## 🔄 重現步驟

### 搜尋功能問題重現
1. 登入系統 (test@example.com / password123)
2. 導航至報價列表頁面 (/quotes)
3. 在搜尋欄輸入任意關鍵字
4. 按 Enter 或點擊搜尋
5. **結果**：搜尋結果與預期不符，功能無效

### 狀態選擇問題重現
1. 登入系統並進入報價建立頁面 (/quotes/create)
2. 填寫必要資訊（客戶、日期等）
3. 在狀態欄位選擇"已發送"或其他非草稿狀態
4. 提交表單
5. **結果**：保存後的報價狀態仍為"草稿"

## 🔍 根本原因分析

### 搜尋功能失效原因
```
❌ 前後端參數名稱不匹配：
   Laravel Frontend: per_page, sort_field, sort_direction
   Go Backend API:   page_size, sort_by, sort_order

❌ API 請求失敗，後端無法正確解析前端參數
❌ 搜尋查詢未包含客戶名稱 JOIN 邏輯
❌ 多租戶過濾不完整
```

### 狀態固定問題原因
```
❌ Go 後端 CreateQuoteRequest 結構體缺少 Status 欄位
❌ 服務層狀態處理邏輯硬編碼為 models.QuoteStatusDraft
❌ 前端狀態選擇無法傳遞到後端 API
```

## 🛠️ 解決方法

### Phase 1: 後端 Go API 修復

#### 檔案：`/backend/internal/models/quote.go`
```go
// ✅ 新增搜尋與多租戶支援
type QuoteQueryParams struct {
    Page           int    `form:"page" binding:"min=1"`
    PageSize       int    `form:"page_size" binding:"min=1,max=100"`
    SortBy         string `form:"sort_by"`
    SortOrder      string `form:"sort_order" binding:"oneof=asc desc"`
    Status         string `form:"status"`
    Search         string `form:"search"`      // ✅ 新增搜尋支援
    CompanyID      *int64 `form:"company_id"`  // ✅ 多租戶支援
}

// ✅ 新增狀態欄位支援
type CreateQuoteRequest struct {
    CustomerID         int64                   `json:"customer_id" binding:"required,min=1"`
    QuoteDate          string                  `json:"quote_date" binding:"required"`
    ValidUntil         *string                 `json:"valid_until,omitempty"`
    Status             *string                 `json:"status,omitempty"`        // ✅ 新增
    Notes              *string                 `json:"notes,omitempty"`
    Items              []CreateQuoteItemRequest `json:"items" binding:"required,dive"`
}
```

#### 檔案：`/backend/internal/services/quote_service.go`
```go
// ✅ 搜尋功能實作（支援報價單號、客戶名稱、備註搜尋）
func (s *QuoteService) GetQuotes(params models.QuoteQueryParams) (*models.QuoteListResponse, error) {
    var quotes []models.Quote
    var totalCount int64
    
    // 構建基本查詢
    query := s.db.Model(&models.Quote{})
    
    // 多租戶過濾
    if params.CompanyID != nil {
        query = query.Where("company_id = ?", *params.CompanyID)
    }
    
    // ✅ 搜尋功能實作
    if params.Search != "" {
        searchPattern := "%" + strings.ToLower(params.Search) + "%"
        query = query.Joins("LEFT JOIN customers c ON quotes.customer_id = c.id").
                     Where("(LOWER(quotes.quote_number) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(quotes.notes) LIKE ?)",
                           searchPattern, searchPattern, searchPattern)
    }
    
    // 狀態篩選
    if params.Status != "" {
        query = query.Where("status = ?", params.Status)
    }
    
    // ✅ 排序支援
    if params.SortBy != "" && params.SortOrder != "" {
        orderClause := fmt.Sprintf("%s %s", params.SortBy, params.SortOrder)
        query = query.Order(orderClause)
    }
    
    // 分頁
    offset := (params.Page - 1) * params.PageSize
    query = query.Offset(offset).Limit(params.PageSize)
    
    // 執行查詢
    if err := query.Find(&quotes).Error; err != nil {
        return nil, fmt.Errorf("查詢報價失敗: %v", err)
    }
    
    // 總數統計
    countQuery := s.db.Model(&models.Quote{})
    if params.CompanyID != nil {
        countQuery = countQuery.Where("company_id = ?", *params.CompanyID)
    }
    if params.Search != "" {
        searchPattern := "%" + strings.ToLower(params.Search) + "%"
        countQuery = countQuery.Joins("LEFT JOIN customers c ON quotes.customer_id = c.id").
                                Where("(LOWER(quotes.quote_number) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(quotes.notes) LIKE ?)",
                                      searchPattern, searchPattern, searchPattern)
    }
    if params.Status != "" {
        countQuery = countQuery.Where("status = ?", params.Status)
    }
    countQuery.Count(&totalCount)
    
    return &models.QuoteListResponse{
        Quotes:      quotes,
        Total:       int(totalCount),
        Page:        params.Page,
        PageSize:    params.PageSize,
        TotalPages:  int(math.Ceil(float64(totalCount) / float64(params.PageSize))),
    }, nil
}

// ✅ 狀態選擇邏輯實作
func (s *QuoteService) CreateQuote(req models.CreateQuoteRequest) (*models.Quote, error) {
    // 狀態選擇與映射邏輯
    statusToUse := models.QuoteStatusDraft // 預設值
    if req.Status != nil {
        switch *req.Status {
        case models.QuoteStatusDraft, models.QuoteStatusPending, models.QuoteStatusApproved, 
             models.QuoteStatusRejected, models.QuoteStatusExpired:
            statusToUse = *req.Status
        case "sent":
            statusToUse = models.QuoteStatusPending
        case "accepted":
            statusToUse = models.QuoteStatusApproved
        default:
            // 無效狀態使用預設值
            statusToUse = models.QuoteStatusDraft
        }
    }
    
    quote := &models.Quote{
        CustomerID:     req.CustomerID,
        QuoteNumber:    s.generateQuoteNumber(),
        QuoteDate:      parsedQuoteDate,
        ValidUntil:     parsedValidUntil,
        Status:         statusToUse,  // ✅ 使用選擇的狀態
        Notes:          req.Notes,
        CompanyID:      userCompanyID,
        CreatedBy:      userID,
        TotalAmount:    totalAmount,
    }
    
    // 保存報價...
}
```

### Phase 2: 前端 Laravel 修復

#### 檔案：`/frontend/app/Http/Controllers/Web/QuoteController.php`
```php
public function index(Request $request)
{
    // 取得排序參數
    $sort = $request->get('sort', 'created_at_desc');
    $sortMapping = [
        'created_at_desc' => ['field' => 'created_at', 'direction' => 'desc'],
        'created_at_asc' => ['field' => 'created_at', 'direction' => 'asc'],
        'total_amount_desc' => ['field' => 'total_amount', 'direction' => 'desc'],
        'total_amount_asc' => ['field' => 'total_amount', 'direction' => 'asc'],
        'quote_date_desc' => ['field' => 'quote_date', 'direction' => 'desc'],
        'quote_date_asc' => ['field' => 'quote_date', 'direction' => 'asc'],
        'customer_name_asc' => ['field' => 'customer_name', 'direction' => 'asc'],
        'customer_name_desc' => ['field' => 'customer_name', 'direction' => 'desc'],
    ];
    $sortKey = array_key_exists($sort, $sortMapping) ? $sort : 'created_at_desc';
    
    // ✅ 修正 API 參數名稱對齊
    $params = [
        'page' => $request->get('page', 1),
        'page_size' => $request->get('per_page', 20),           // ✅ 修正參數名稱
        'sort_by' => $sortMapping[$sortKey]['field'],           // ✅ 修正參數名稱
        'sort_order' => $sortMapping[$sortKey]['direction'],    // ✅ 修正參數名稱
        'search' => $request->get('search', ''),
        'status' => $request->get('status', ''),
    ];
    
    // 呼叫 API
    $response = Http::timeout(30)->get(config('services.api.base_url') . '/quotes', $params);
    
    if ($response->successful()) {
        $data = $response->json();
        return view('quotes.index', [
            'quotes' => $data['quotes'] ?? [],
            'pagination' => [
                'current_page' => $data['page'] ?? 1,
                'total' => $data['total'] ?? 0,
                'per_page' => $data['page_size'] ?? 20,
                'last_page' => $data['total_pages'] ?? 1,
            ],
            'search' => $params['search'],
            'status' => $params['status'],
            'sort' => $sort,
        ]);
    }
    
    return view('quotes.index')->with('error', '無法載入報價資料');
}

public function store(Request $request)
{
    // ✅ 狀態映射邏輯
    $statusMapping = [
        'sent' => 'pending',         // 前端顯示"已發送" → 後端 pending
        'accepted' => 'approved',    // 前端顯示"已接受" → 後端 approved  
    ];
    
    $requestData = [
        'customer_id' => $request->customer_id,
        'quote_date' => $request->quote_date,
        'valid_until' => $request->valid_until,
        'notes' => $request->notes,
        'items' => $request->items ?? [],
    ];
    
    // ✅ 處理狀態參數
    if ($request->has('status') && $request->status !== '') {
        $status = $request->status;
        // 使用映射表轉換前端狀態到後端格式
        $requestData['status'] = $statusMapping[$status] ?? $status;
    }
    
    // 發送 API 請求
    $response = Http::timeout(30)->post(config('services.api.base_url') . '/quotes', $requestData);
    
    if ($response->successful()) {
        return redirect()->route('quotes.index')
                        ->with('success', '報價單建立成功！');
    }
    
    return back()->with('error', '建立報價單失敗，請重試。');
}
```

## 🚫 預防措施

### 1. API 參數標準化
- **建立統一參數命名規範**：前後端開發團隊共同遵循
- **API 文件同步更新**：每次參數變更必須同步更新文件
- **自動化測試覆蓋**：確保參數對齊的 E2E 測試

### 2. 狀態管理規範化
- **狀態枚舉集中管理**：避免硬編碼狀態值
- **狀態轉換邏輯**：定義明確的狀態機轉換規則
- **前後端狀態映射表**：維護一致性映射關係

### 3. 開發流程改進
- **Code Review 強制檢查**：重點檢查前後端介面一致性
- **整合測試自動化**：每次部署前執行完整的整合測試
- **監控和告警**：生產環境 API 異常自動告警

## 📁 相關檔案

### 修復檔案
- 後端：`/backend/internal/models/quote.go:15-45, 78-95`
- 後端：`/backend/internal/services/quote_service.go:156-280, 45-120`
- 前端：`/frontend/app/Http/Controllers/Web/QuoteController.php:34-78, 156-195`

### 測試檔案
- `/tests/quote-search-functionality-test.spec.js`
- `/tests/quote-creation-status-test.spec.js`  
- `/tests/quote-status-final-verification.spec.js`

### 文件記錄
- `/debug/quote-system-fixes/修復完成總結報告.md`
- TaskMaster Task #75

## 🧠 知識庫更新

### 已更新記錄
- [x] 已建立 bug 記錄檔案：`/frontend/memory-bank/bug_records/bug_2025-08-08_quote_system_comprehensive_fix.md`
- [x] 已更新 TaskMaster：Task #75 記錄完成
- [x] 已建立綜合修復報告：`/debug/quote-system-fixes/修復完成總結報告.md`
- [x] 已記錄 Super Thinking 四階段除錯成功案例

### 關鍵經驗教訓
1. **前後端參數不一致** 是導致功能完全失效的常見原因
2. **Super Thinking 四階段方法** 對複雜系統問題修復很有效
3. **Playwright MCP 自動化測試** 能有效驗證修復結果  
4. **詳細文件記錄** 有助於未來類似問題的快速定位
5. **多租戶系統** 的安全性必須在每個 API 層面考慮

### 交叉引用
- 相關 TaskMaster 任務：Task #69-75 (報價系統相關)
- 相關技術文件：`CLAUDE_CODE_RULES.md`
- 相關測試策略：Playwright MCP 整合測試方案

---

**修復確認**: ✅ 完全成功  
**記錄狀態**: ✅ 已完整記錄到專案知識庫  
**經驗教訓**: ✅ 已加入系統模式庫供未來參考