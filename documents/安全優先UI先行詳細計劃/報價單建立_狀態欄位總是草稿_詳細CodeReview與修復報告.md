## 報價單建立時「狀態」總是變成草稿（draft）- 詳細 Code Review 與修復方案

### 摘要
- **症狀**: 在建立報價單時，前端選擇任何狀態（例如：已發送、已接受），資料庫最終皆為 `draft`。
- **根因（關鍵）**:
  1) 後端 Go API 的 `CreateQuoteRequest` 沒有 `status` 欄位，Service 在 INSERT 時硬寫入 `draft`。
  2) 前端（Laravel）允許的狀態值與資料庫/Go 枚舉不完全對齊（`sent`、`accepted` 與 DB/Go 的 `pending`、`approved` 不一致）。
- **結論**: 無論前端傳什麼，Go 後端建立報價時都設定為 `draft`，因此結果必然是草稿。

---

### 一、實際流程（瀏覽器 → Laravel → Go API → PostgreSQL）
1) 使用者於 `quotes/form.blade.php` 或 `quotes/multi-step-form.blade.php` 選擇狀態並送出表單。
2) Laravel `QuoteController@store` 驗證並組合 payload，發送到 Go `POST /api/quotes`。
3) Go `QuoteHandler.CreateQuote` 將 JSON 綁定到 `CreateQuoteRequest` → `QuoteService.CreateQuote` 執行 INSERT。
4) DB `quotes.status` 欄位有 CHECK 限制與預設 `draft`（但即使如此，Service 已直接塞 `draft`）。

---

### 二、逐段程式審視（關鍵片段）

- Laravel Controller 組 payload（可傳 `status`）

```354:369:frontend/app/Http/Controllers/Web/QuoteController.php
// 準備報價單資料 - 使用正確的Currency ID映射
$quoteData = [
    'customer_id' => (int)$validated['customer_id'],
    'quote_date'  => \Carbon\Carbon::parse($validated['quote_date'])->toISOString(),
    'expiry_date' => \Carbon\Carbon::parse($validated['valid_until'])->toISOString(),
    'notes'       => $validated['notes'] ?? '',
    'status'      => $validated['status'] ?? 'draft',
    'currency_id' => $currencyMapping[$validated['currency'] ?? 'TWD'] ?? 1,
    'items'       => array_map(function($item) { ... }, $validated['items'])
];
```

- Go 後端請求模型（沒有 `Status` 欄位）

```40:50:backend/internal/models/quote.go
// CreateQuoteRequest represents the request body for creating a quote
type CreateQuoteRequest struct {
    CustomerID   int64     `json:"customer_id" binding:"required"`
    BusinessUnitID *int64  `json:"business_unit_id,omitempty"`
    QuoteDate    time.Time `json:"quote_date" binding:"required"`
    ExpiryDate   *time.Time `json:"expiry_date,omitempty"`
    CurrencyID   *int64    `json:"currency_id,omitempty"`
    Notes        string    `json:"notes"`
    TermsAndConditions string `json:"terms_and_conditions"`
    Items        []CreateQuoteItemRequest `json:"items" binding:"required,min=1"`
}
```

- Go Service 在 INSERT 時硬塞 `draft`

```116:135:backend/internal/services/quote_service.go
query := `
    INSERT INTO quotes (
        customer_id, business_unit_id, quote_date, expiry_date, total_amount, currency_id, 
        user_id, notes, terms_and_conditions, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, quote_number, customer_id, business_unit_id, status, user_id, quote_date, 
              expiry_date, total_amount, currency_id, notes, terms_and_conditions, created_at, updated_at`
...
err = tx.QueryRowx(query, ..., models.QuoteStatusDraft).StructScan(quote)
```

- 資料庫 `quotes.status` 可接受的值（確認合法枚舉）

```1:9:backend/migrations/000017_create_quotes_table.up.sql
CREATE TABLE quotes (
  ...
  status VARCHAR(16) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'expired', 'converted')),
  ...
)
```

---

### 三、問題列表（對照）
- **P1（根因）**: CreateQuoteRequest 無 `status`，Service 建立固定 `draft`。
- **P2（字典不一致）**: 前端選單值含 `sent`、`accepted`，而 DB/Go 為 `pending`、`approved`。
- **P3（表單差異）**: 多步驟與單頁表單的選單值不完全一致（單頁含 `approved`，多步驟無）。

---

### 四、修復方案

#### A. 後端（權威來源）
1) 模型擴充 `CreateQuoteRequest`：

```diff
 type CreateQuoteRequest struct {
   CustomerID   int64     `json:"customer_id" binding:"required"`
   ...
+  Status       *string   `json:"status,omitempty"`
   Items        []CreateQuoteItemRequest `json:"items" binding:"required,min=1"`
 }
```

2) Handler 驗證/標準化（列舉允許的值，並做對齊）：
   - 允許輸入：`draft|pending|approved|rejected|expired`
   - 兼容舊值：`sent` → `pending`，`accepted` → `approved`

3) Service 建立時套用請求狀態（預設 `draft`）：

```diff
// 取決於 req.Status 是否提供與合法
- statusToUse := models.QuoteStatusDraft
+ statusToUse := models.QuoteStatusDraft
+ if req.Status != nil {
+     switch *req.Status {
+     case models.QuoteStatusDraft, models.QuoteStatusPending, models.QuoteStatusApproved, models.QuoteStatusRejected, models.QuoteStatusExpired:
+         statusToUse = *req.Status
+     case "sent":     statusToUse = models.QuoteStatusPending
+     case "accepted": statusToUse = models.QuoteStatusApproved
+     }
+ }
...
- err = tx.QueryRowx(query, ..., models.QuoteStatusDraft).StructScan(quote)
+ err = tx.QueryRowx(query, ..., statusToUse).StructScan(quote)
```

4) Update API 已支援 `UpdateQuoteRequest.Status` 無需調整。

#### B. 前端（Laravel）
1) 統一選單值，顯示中文/舊字樣但值用後端枚舉：
   - `value="pending"` 顯示「已發送」
   - `value="approved"` 顯示「已接受/已批准」

2) 送出前（可選）作映射，確保 JSON 內值符合後端：

```php
$status = $validated['status'] ?? 'draft';
$map = ['sent' => 'pending', 'accepted' => 'approved'];
$quoteData['status'] = $map[$status] ?? $status;
```

3) 多步驟與單頁表單的選項一致化。

---

### 五、驗證計劃（最小覆蓋）
- Go 單元測試：
  - 建立 quote 時傳 `status=pending/approved/rejected/expired` → DB 寫入對應值。
  - 傳 `sent/accepted` → 寫入 `pending/approved`。
  - 未傳 `status` → 寫入 `draft`。
- E2E：
  - 表單選「已發送」建立 → 列表顯示 `pending`（中文顯示「已發送」）。
  - 表單選「已接受」建立 → 列表顯示 `approved`（中文顯示「已批准」）。

---

### 六、風險與注意
- 權限/流程：避免在建立時直接允許 `converted`。
- 一致性：所有前端選單值需與後端枚舉對齊，避免再次出現字典不一致。

---

### 七、建議的最小編修清單
- 後端：
  - `backend/internal/models/quote.go` 新增 `Status *string`。
  - `backend/internal/handlers/quote_handler.go` 的 `CreateQuote` 無需變更（`ShouldBindJSON` 會帶入），可在 Service 做合法化。
  - `backend/internal/services/quote_service.go` 新增 `statusToUse` 合法化與映射，INSERT 使用該值。
- 前端：
  - `frontend/resources/views/quotes/multi-step-form.blade.php` 與 `quotes/form.blade.php` 的 `<select name="status">` 將 value 統一為 `draft|pending|approved|rejected|expired`（文字可保持）。
  - `QuoteController@store` 送出前做一次映射（`sent→pending`、`accepted→approved`）。

完成上述調整後，建立報價時的狀態將與使用者選擇一致寫入資料庫。


