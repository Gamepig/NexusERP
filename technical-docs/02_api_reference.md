## API 與函數/變數（契約導向）

本文件彙總主要 API、關鍵服務函數與欄位契約。細節以 Go 後端為主，前端 Laravel 服務層與之對應。

### 1) 認證（Auth）
- 基底：JWT（Bearer），`/api/auth/login|logout|refresh|me`
- 回應格式：`{ success, data | error }` 統一
- 重要物件：`user { id, name, email, role }`、`token { token, token_type, expires_in }`

### 2) 產品/庫存（Products & Inventory）
- 端點：
  - `GET /api/products`（查詢/分頁/篩選/排序）
  - `POST /api/products`、`PUT|PATCH /api/products/{id}`、`DELETE /api/products/{id}`
  - `GET /api/inventory/levels`、`GET /api/inventory/transactions`
- 欄位契約（部分）：
  - Product：`{ id, name, sku, price, cost, category{id,name}, unit{id,name}, attributes{}, images[] }`
  - InventoryLevel：`{ product{id,name,sku}, warehouse{id,name}, current_stock, safety_stock, reorder_point }`
- 欄位映射標準：`selling_price → unit_price`（前端期望名稱統一）

### 3) 銷售/採購/報表（Sales/Purchase/Reports）
- Sales:
  - `GET /api/sales-orders`、`POST /api/sales-orders`
  - 物件：`order{ id, order_number, customer{id,name}, status, totals... items[] }`
- Purchase:
  - `POST /api/purchase-orders`（規劃）
- Reports:
  - `GET /api/reports/sales`（分組、期間、圖表資料）

### 4) 前端服務層（Laravel）
- `app/Services/ApiService.php`：統一後端呼叫/Token 注入/錯誤處理
- `app/Services/ReportApiService.php`：報表資料匯入與映射
- `routes/api.php`：短期聚合（待回遷 Go API）

### 5) 搜尋欄位標準（Go 後端）
- 客戶：`name | email | phone | address`
- 供應商：`name | email | phone | address | contact_person`

更多詳細樣例與完整回應，請參考：`docs/development/api-specification.md`。


