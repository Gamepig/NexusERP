## 報價單列表搜尋 功能 Code Review 與修復報告

### 摘要
- **症狀**: 報價清單頁面「搜尋」與部份篩選/排序無效。
- **根因（關鍵）**:
  - 前端送到後端 Go API 的查詢參數名稱與後端實際支援不一致（`search_fields`、`sort_field`、`sort_direction`、`per_page`）。
  - Go 後端 `QuoteQueryParams` 與 `ListQuotes` 完全未實作 `search` 過濾，也未支援 `company_id` 多租戶參數。
  - 結果為：搜尋/排序/每頁筆數多數被忽略，回傳幾乎固定（預設排序、預設 page size）。

---

### 一、實際使用流程（請求→處理→回應）
1) 使用者在 `quotes/index.blade.php` 輸入關鍵字並提交 GET 表單，路由對應 `quotes.index` → `QuoteController@index`（Laravel）。
2) `QuoteController@index` 組合查詢參數並呼叫 Go API: `GET {GO_API}/api/quotes?{query}`。
3) Go 後端 `QuoteHandler.ListQuotes` 解析 Query → 呼叫 `QuoteService.ListQuotes` → 查 DB → 回傳 JSON。
4) Laravel 將回傳資料標準化後渲染 `quotes/index.blade.php` 列表。

流程關鍵檔案/片段：

```1:206:/Users/gamepig/projects/NexusERP/frontend/app/Http/Controllers/Web/QuoteController.php
...    public function index(Request $request)
...    $queryParams = array_filter([
        'company_id' => $currentCompanyId,
        'page' => $request->get('page', 1),
        'per_page' => $request->get('per_page', 20),
        'search' => $request->get('search'),
        'status' => $request->get('status'),
        'customer_id' => $request->get('customer_id'),
        'date_from' => $request->get('date_from'),
        'date_to' => $request->get('date_to'),
        'sort' => $request->get('sort', 'created_at_desc'),
    ]);
...    if (!empty($queryParams['search'])) {
        $queryParams['search_fields'] = 'quote_number,customer_name,notes';
    }
...    $response = $this->callGoAPI('/api/quotes?' . http_build_query($queryParams));
```

```244:282:/Users/gamepig/projects/NexusERP/backend/internal/handlers/quote_handler.go
func (h *QuoteHandler) ListQuotes(c *gin.Context) {
    var params models.QuoteQueryParams
    if err := c.ShouldBindQuery(&params); err != nil { ... }
    // 預設值...
    result, err := h.quoteService.ListQuotes(&params)
}
```

```113:126:/Users/gamepig/projects/NexusERP/backend/internal/models/quote.go
// QuoteQueryParams represents query parameters for quote search
type QuoteQueryParams struct {
    CustomerID     *int64 `form:"customer_id"`
    Status         string `form:"status"`
    BusinessUnitID *int64 `form:"business_unit_id"`
    DateFrom       string `form:"date_from"`
    DateTo         string `form:"date_to"`
    ExpiryFrom     string `form:"expiry_from"`
    ExpiryTo       string `form:"expiry_to"`
    Page           int    `form:"page,default=1"`
    PageSize       int    `form:"page_size,default=20"`
    SortBy         string `form:"sort_by,default=created_at"`
    SortOrder      string `form:"sort_order,default=desc"`
}
```

```396:511:/Users/gamepig/projects/NexusERP/backend/internal/services/quote_service.go
// ListQuotes lists quotes with pagination and filtering
func (s *QuoteService) ListQuotes(params *models.QuoteQueryParams) (*models.QuoteListResponse, error) {
    // 僅依 CustomerID/Status/BusinessUnitID/Date/Expiry 組 WHERE
    // 沒有任何 search 搜尋，也沒有 company_id 過濾
    // 排序僅支援 params.SortBy/SortOrder
}
```

---

### 二、逐行關鍵分析（與「搜尋」直接相關）
- 前端 View（搜尋表單與自動提交）

```161:181:/Users/gamepig/projects/NexusERP/frontend/resources/views/quotes/index.blade.php
<form method="GET" action="{{ route('quotes.index') }}" id="searchForm">
    <input id="search" name="search" value="{{ request('search') }}" ...>
</form>
...
// 800ms debounce 自動提交
searchInput.addEventListener('input', () => { if (len==0 || len>=2) searchForm.submit() })
```

- Laravel Controller 組參數（問題起點）
  - 送 `per_page`（後端期望 `page_size`）→ 後端忽略
  - 送 `sort` + 轉 `sort_field/sort_direction`（後端期望 `sort_by/sort_order`）→ 後端忽略自訂排序
  - 送 `search`（後端參數沒有定義 Search）→ 後端忽略
  - 送 `search_fields`（後端完全不支援）→ 後端忽略

```68:95:/Users/gamepig/projects/NexusERP/frontend/app/Http/Controllers/Web/QuoteController.php
// sortMapping → 設定 sort_field/sort_direction，並且 unset($queryParams['sort'])
// 但後端僅識別 sort_by / sort_order
```

- Go 模型/服務（缺少 Search 與 Company 過濾）

```113:126:/Users/gamepig/projects/NexusERP/backend/internal/models/quote.go
// 沒有 Search、沒有 CompanyID
```

```402:449:/Users/gamepig/projects/NexusERP/backend/internal/services/quote_service.go
// 僅 where customer_id/status/business_unit_id/date/expiry
// 沒有 LIKE/ILIKE 搜尋，也沒有 join customers 以支援 customer_name 搜尋
```

---

### 三、問題清單（根因對照）
- **P1 搜尋無效**: 後端沒有 `search` 參數與實作；前端傳 `search`/`search_fields` 無人接手。
- **P1 排序無效（自訂）**: 前端傳 `sort_field`/`sort_direction`，後端只吃 `sort_by`/`sort_order`。
- **P2 每頁筆數無效**: 前端傳 `per_page`，後端只吃 `page_size`。
- **P1 多租戶過濾缺失**: 前端傳 `company_id`，後端 `QuoteQueryParams`/`ListQuotes` 均未處理；若無資料庫 RLS，可能露出跨租戶資料風險。

---

### 四、復現方式（最短路徑）
1) 進入 `/quotes`，輸入 `search=Vic` 提交。
2) 觀察 Network：請求 query string 包含 `search=Vic&per_page=...&sort=...` → 回應列表數量不變或排序無改變。
3) 後端日誌或本地打印可見 `params` 未含 `search`，排序採用預設 `created_at desc`，`page_size`=20。

---

### 五、修復方案（兩階段）

#### A. 短期修正（零後端變更，立即改善可用性）
- 前端 `QuoteController@index` 參數改名映射：
  - `per_page` → `page_size`
  - `sort`（`created_at_desc` 等）→ 拆為 `sort_by` + `sort_order`
  - 移除未支援的 `search_fields`
- 影響：排序與每頁筆數立即生效；搜尋仍需後端支援，否則可在 Laravel 收到回傳後臨時在記憶體過濾（僅做緊急 fallback，不建議長期使用）。

範例（建議 diff 摘要）：

```diff
// frontend/app/Http/Controllers/Web/QuoteController.php
- 'per_page' => $request->get('per_page', 20),
+ 'page_size' => $request->get('per_page', 20),
...
- $queryParams['sort_field'] = ...; $queryParams['sort_direction'] = ...;
- unset($queryParams['sort']);
+ $queryParams['sort_by'] = $sortMapping[$sortKey]['field'];
+ $queryParams['sort_order'] = $sortMapping[$sortKey]['direction'];
+ unset($queryParams['sort']);
...
- if (!empty($queryParams['search'])) { $queryParams['search_fields'] = ... }
+ // 後端尚未支援 search_fields，先移除避免混淆
```

（可選緊急 fallback）

```php
// 於成功回傳後在 PHP 過濾（僅當有 search 且後端尚未支援時）
if (!empty($request->get('search')) && isset($quotes['quotes'])) {
    $kw = mb_strtolower($request->get('search'));
    $quotes['quotes'] = array_values(array_filter($quotes['quotes'], function($q) use ($kw){
        $hay = mb_strtolower(($q['quote_number'] ?? '') . ' ' . ($q['customer']['name'] ?? '') . ' ' . ($q['notes'] ?? ''));
        return mb_strpos($hay, $kw) !== false;
    }));
    $quotes['total'] = count($quotes['quotes']);
}
```

#### B. 正式修復（後端支援 Search + 多租戶 + 排序一致）
1) 模型擴充：

```diff
// backend/internal/models/quote.go
 type QuoteQueryParams struct {
+   Search        string `form:"search"`
+   CompanyID     *int64 `form:"company_id"`
    CustomerID    *int64 `form:"customer_id"`
    ...
 }
```

2) 清單查詢支援 Search 與 Company 過濾；同時支援 `customer_name` 搜尋需 join `customers`：

```diff
// backend/internal/services/quote_service.go
 func (s *QuoteService) ListQuotes(params *models.QuoteQueryParams) (...){
   where := []string{}
   args := []interface{}{}
   i := 1
 
+  // 當需要 company 或 customer_name/search 時，join customers
+  joinCustomers := false
+  if params.CompanyID != nil || params.Search != "" || strings.HasPrefix(params.SortBy, "customer_") {
+      joinCustomers = true
+  }
 
   if params.CustomerID != nil { where = append(where, fmt.Sprintf("q.customer_id = $%d", i)); args = append(args, *params.CustomerID); i++ }
   if params.Status != "" { where = append(where, fmt.Sprintf("q.status = $%d", i)); args = append(args, params.Status); i++ }
   if params.BusinessUnitID != nil { ... }
   if params.DateFrom != "" { ... }
   if params.DateTo != "" { ... }
 
+  if params.CompanyID != nil {
+      where = append(where, fmt.Sprintf("c.company_id = $%d", i))
+      args = append(args, *params.CompanyID); i++
+  }
 
+  if params.Search != "" {
+      sTerm := strings.ToLower(params.Search)
+      where = append(where, fmt.Sprintf("(LOWER(q.quote_number) LIKE $%d OR LOWER(q.notes) LIKE $%d OR LOWER(c.name) LIKE $%d)", i, i+1, i+2))
+      like := "%" + sTerm + "%"
+      args = append(args, like, like, like); i += 3
+  }
 
   whereClause := ""
   if len(where) > 0 { whereClause = "WHERE " + strings.Join(where, " AND ") }
 
   orderBy := "q.created_at DESC"
   if params.SortBy != "" { ... }
 
+  baseSelect := "SELECT q.* FROM quotes q"
+  if joinCustomers { baseSelect = "SELECT q.* FROM quotes q JOIN customers c ON c.id = q.customer_id" }
 
   query := fmt.Sprintf("%s %s ORDER BY %s LIMIT $%d OFFSET $%d", baseSelect, whereClause, orderBy, i, i+1)
   args = append(args, params.PageSize, (params.Page-1)*params.PageSize)
   ...
 }
```

3) 排序鍵對齊：前端傳 `sort_by`（允許：`created_at`/`quote_date`/`total_amount`/`quote_number`/`customer_name`），`sort_order`=`asc|desc`。

4) 計數查詢 `COUNT(*)` 同步加上 join 條件與 where。

5) 安全性：若專案依賴 PostgreSQL RLS，多租戶仍應在 DB 層保護；但 API 層加上 `company_id` 過濾可雙重保護並利於測試。

---

### 六、測試與驗證計劃
- 單元測試（Go）
  - `ListQuotes`：有 `search=foo` 時產生 `ILIKE` 條件；`company_id` 時加入 join 與 where。
  - 排序鍵覆蓋：`sort_by=quote_date&sort_order=asc` 產生對應 ORDER BY。
  - 分頁：`page_size` 正確生效。
- 整合測試（前端→後端）
  - E2E：輸入 `search` 後，列表筆數下降或內容變動；更換排序選項可觀察到順序變更。
  - 驗證多租戶：切換不同公司帳號時，不出現其他公司報價。

---

### 七、風險與回滾
- 加入 join 可能影響查詢效能：需在 `customers(company_id)`、`customers(name)`、`quotes(customer_id)` 上確認索引；已有 `000057_add_multi_tenant_support_to_customers.up.sql` 部分索引可利用。
- 若短期先做前端 fallback 過濾，僅影響當頁結果（伺服器仍回傳未過濾資料）；正式修復完成後請移除 fallback。

---

### 八、結論
- 目前搜尋無效源於「參數名稱不對齊」與「後端缺少實作」。
- 先改前端參數鍵（排序/每頁）可立即改善體感；正式修復需在 Go 後端補上 `search` 與 `company_id` 過濾、必要時 join `customers`。
- 完成後以單元與 E2E 全面驗證，確保跨租戶安全與使用者體驗。


