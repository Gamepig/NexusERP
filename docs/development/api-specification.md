# NexusERP API 規格文件
## Go/Gin 後端 API 完整規範

**版本**: 2.0  
**建立日期**: 2025-07-24  
**API 版本**: v1  
**基礎 URL**: http://127.0.0.1:8000/api

---

## 🎯 **API 設計原則**

### RESTful 設計規範
```yaml
HTTP 方法使用:
  GET: 取得資源
  POST: 建立資源
  PUT: 完整更新資源
  PATCH: 部分更新資源
  DELETE: 刪除資源

URL 命名規範:
  - 使用複數名詞: /api/products (不是 /api/product)
  - 使用小寫字母: /api/customers (不是 /api/Customers)
  - 使用連字符: /api/purchase-orders (不是 /api/purchaseOrders)
  - 層級結構: /api/products/{id}/inventory

回應格式:
  - 統一使用 JSON 格式
  - 成功回應包含 data 欄位
  - 錯誤回應包含 error 欄位
  - 列表回應包含分頁資訊
```

---

## 🔐 **認證與授權**

### JWT 認證流程
```yaml
認證端點:
  POST /api/auth/login     # 使用者登入
  POST /api/auth/logout    # 使用者登出
  POST /api/auth/refresh   # 刷新 Token
  GET  /api/auth/me        # 取得當前使用者資訊

Token 格式:
  Authorization: Bearer <JWT_TOKEN>

權限控制:
  - 使用 middleware 進行路由保護
  - 支援角色權限控制 (RBAC)
  - API 金鑰支援第三方整合
```

### 認證 API 端點

#### POST /api/auth/login
```json
// 請求
{
    "email": "user@example.com",
    "password": "password123"
}

// 回應 (成功)
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "Bearer",
        "expires_in": 3600,
        "user": {
            "id": 1,
            "name": "使用者名稱",
            "email": "user@example.com",
            "role": "admin"
        }
    }
}

// 回應 (失敗)
{
    "success": false,
    "error": {
        "code": "INVALID_CREDENTIALS",
        "message": "帳號或密碼錯誤"
    }
}
```

---

## 📦 **產品管理 API**

### 產品列表
#### GET /api/products
```yaml
查詢參數:
  page: 頁碼 (預設: 1)
  per_page: 每頁筆數 (預設: 20, 最大: 100)
  search: 搜尋關鍵字
  category_id: 分類 ID
  status: 狀態 (active, inactive)
  sort: 排序欄位 (name, price, created_at)
  order: 排序方向 (asc, desc)

權限要求: products.view
```

```json
// 回應
{
    "success": true,
    "data": {
        "products": [
            {
                "id": 1,
                "name": "商品名稱",
                "sku": "PRD-001",
                "description": "商品描述",
                "price": 1000,
                "cost": 800,
                "stock": 50,
                "category": {
                    "id": 1,
                    "name": "分類名稱"
                },
                "status": "active",
                "created_at": "2025-07-24T10:00:00Z",
                "updated_at": "2025-07-24T10:00:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 100,
            "last_page": 5,
            "from": 1,
            "to": 20
        }
    }
}
```

### 建立產品
#### POST /api/products
```json
// 請求
{
    "name": "新商品",
    "sku": "PRD-002",
    "description": "商品描述",
    "price": 1200,
    "cost": 900,
    "category_id": 1,
    "initial_stock": 100,
    "safety_stock": 10,
    "reorder_point": 20,
    "unit_id": 1,
    "supplier_ids": [1, 2],
    "attributes": {
        "color": "紅色",
        "size": "L"
    }
}

// 回應 (成功)
{
    "success": true,
    "data": {
        "id": 2,
        "name": "新商品",
        "sku": "PRD-002",
        // ... 其他欄位
    },
    "message": "商品建立成功"
}

// 回應 (驗證失敗)
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "資料驗證失敗",
        "details": {
            "name": ["商品名稱為必填欄位"],
            "price": ["價格必須大於 0"]
        }
    }
}
```

### 取得單一產品
#### GET /api/products/{id}
```json
// 回應
{
    "success": true,
    "data": {
        "id": 1,
        "name": "商品名稱",
        "sku": "PRD-001",
        "description": "詳細商品描述",
        "price": 1000,
        "cost": 800,
        "stock": 50,
        "category": {
            "id": 1,
            "name": "分類名稱",
            "parent_id": null
        },
        "unit": {
            "id": 1,
            "name": "個",
            "symbol": "pcs"
        },
        "suppliers": [
            {
                "id": 1,
                "name": "供應商A",
                "contact_person": "聯絡人"
            }
        ],
        "inventory_levels": [
            {
                "warehouse_id": 1,
                "warehouse_name": "主倉庫",
                "quantity": 30
            }
        ],
        "images": [
            {
                "id": 1,
                "url": "https://example.com/images/product1.jpg",
                "is_primary": true
            }
        ],
        "attributes": {
            "color": "紅色",
            "size": "L",
            "weight": "1.5kg"
        },
        "created_at": "2025-07-24T10:00:00Z",
        "updated_at": "2025-07-24T10:00:00Z"
    }
}
```

### 更新產品
#### PUT /api/products/{id}
```json
// 請求 (完整更新)
{
    "name": "更新的商品名稱",
    "sku": "PRD-001-UPD",
    "description": "更新的描述",
    "price": 1100,
    "cost": 850,
    "category_id": 1,
    "unit_id": 1,
    "safety_stock": 15,
    "reorder_point": 25
}

// 回應
{
    "success": true,
    "data": {
        // 更新後的完整商品資料
    },
    "message": "商品更新成功"
}
```

#### PATCH /api/products/{id}
```json
// 請求 (部分更新)
{
    "price": 1150,
    "stock": 45
}

// 回應
{
    "success": true,
    "data": {
        // 更新後的完整商品資料
    },
    "message": "商品更新成功"
}
```

### 刪除產品
#### DELETE /api/products/{id}
```json
// 回應
{
    "success": true,
    "message": "商品刪除成功"
}

// 回應 (無法刪除)
{
    "success": false,
    "error": {
        "code": "CANNOT_DELETE",
        "message": "此商品有相關訂單記錄，無法刪除"
    }
}
```

---

## 👥 **供應商管理 API**

### 供應商列表
#### GET /api/suppliers
```json
// 回應
{
    "success": true,
    "data": {
        "suppliers": [
            {
                "id": 1,
                "name": "供應商公司名稱",
                "tax_id": "12345678",
                "contact_person": "聯絡人姓名",
                "phone": "02-12345678",
                "email": "supplier@example.com",
                "address": "台北市信義區xxx路xxx號",
                "status": "active",
                "credit_limit": 1000000,
                "payment_terms": "30天",
                "created_at": "2025-07-24T10:00:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 50,
            "last_page": 3
        }
    }
}
```

### 建立供應商
#### POST /api/suppliers
```json
// 請求
{
    "name": "新供應商公司",
    "tax_id": "87654321",
    "contact_person": "李小明",
    "phone": "02-87654321",
    "email": "contact@newsupplier.com",
    "address": "新北市板橋區xxx路xxx號",
    "credit_limit": 500000,
    "payment_terms": "60天",
    "bank_account": {
        "bank_name": "第一銀行",
        "account_number": "123-456-789",
        "account_name": "新供應商公司"
    },
    "contacts": [
        {
            "name": "李小明",
            "title": "業務經理",
            "phone": "0912-345-678",
            "email": "ming.lee@newsupplier.com"
        }
    ]
}

// 回應
{
    "success": true,
    "data": {
        "id": 2,
        "name": "新供應商公司",
        // ... 完整供應商資料
    },
    "message": "供應商建立成功"
}
```

---

## 👤 **客戶管理 API**

### 客戶列表
#### GET /api/customers
```json
// 查詢參數
{
    "type": "individual|corporate",  // 個人或企業客戶
    "status": "active|inactive",
    "region": "台北|新北|台中",
    "credit_status": "good|warning|overdue"
}

// 回應
{
    "success": true,
    "data": {
        "customers": [
            {
                "id": 1,
                "type": "corporate",
                "name": "客戶公司名稱",
                "tax_id": "12345678",
                "contact_person": "王大明",
                "phone": "02-12345678",
                "email": "contact@customer.com",
                "credit_limit": 500000,
                "credit_used": 150000,
                "credit_available": 350000,
                "payment_terms": "30天",
                "sales_rep": {
                    "id": 1,
                    "name": "業務代表"
                },
                "status": "active",
                "created_at": "2025-07-24T10:00:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 80,
            "last_page": 4
        }
    }
}
```

---

## 📋 **訂單管理 API**

### 銷售訂單列表
#### GET /api/sales-orders
```json
// 查詢參數
{
    "status": "draft|confirmed|shipped|delivered|cancelled",
    "customer_id": 1,
    "date_from": "2025-07-01",
    "date_to": "2025-07-31"
}

// 回應
{
    "success": true,
    "data": {
        "orders": [
            {
                "id": 1,
                "order_number": "SO-2025-001",
                "customer": {
                    "id": 1,
                    "name": "客戶名稱"
                },
                "order_date": "2025-07-24",
                "delivery_date": "2025-07-30",
                "status": "confirmed",
                "total_amount": 15000,
                "tax_amount": 750,
                "grand_total": 15750,
                "items_count": 3,
                "created_at": "2025-07-24T10:00:00Z"
            }
        ],
        "summary": {
            "total_orders": 25,
            "total_amount": 375000,
            "by_status": {
                "draft": 5,
                "confirmed": 15,
                "shipped": 3,
                "delivered": 2
            }
        },
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 25,
            "last_page": 2
        }
    }
}
```

### 建立銷售訂單
#### POST /api/sales-orders
```json
// 請求
{
    "customer_id": 1,
    "order_date": "2025-07-24",
    "delivery_date": "2025-07-30",
    "reference": "客戶採購單號",
    "notes": "訂單備註",
    "items": [
        {
            "product_id": 1,
            "quantity": 10,
            "unit_price": 1000,
            "discount_percent": 5
        },
        {
            "product_id": 2,
            "quantity": 5,
            "unit_price": 2000,
            "discount_percent": 0
        }
    ],
    "shipping_address": {
        "contact_name": "收貨人",
        "phone": "02-12345678",
        "address": "配送地址"
    }
}

// 回應
{
    "success": true,
    "data": {
        "id": 2,
        "order_number": "SO-2025-002",
        "customer": {
            "id": 1,
            "name": "客戶名稱"
        },
        "status": "draft",
        "total_amount": 19500,
        "tax_amount": 975,
        "grand_total": 20475,
        "items": [
            {
                "id": 1,
                "product": {
                    "id": 1,
                    "name": "商品A",
                    "sku": "PRD-001"
                },
                "quantity": 10,
                "unit_price": 1000,
                "discount_percent": 5,
                "discount_amount": 500,
                "line_total": 9500
            }
        ],
        "created_at": "2025-07-24T10:00:00Z"
    },
    "message": "銷售訂單建立成功"
}
```

---

## 📊 **庫存管理 API**

### 庫存水準查詢
#### GET /api/inventory/levels
```json
// 查詢參數
{
    "warehouse_id": 1,
    "product_id": 1,
    "low_stock": true  // 只顯示低庫存商品
}

// 回應
{
    "success": true,
    "data": {
        "inventory_levels": [
            {
                "product": {
                    "id": 1,
                    "name": "商品A",
                    "sku": "PRD-001"
                },
                "warehouse": {
                    "id": 1,
                    "name": "主倉庫"
                },
                "current_stock": 25,
                "safety_stock": 10,
                "reorder_point": 20,
                "status": "low_stock",
                "last_transaction_date": "2025-07-23T15:30:00Z"
            }
        ],
        "summary": {
            "total_products": 100,
            "low_stock_count": 15,
            "out_of_stock_count": 3,
            "total_value": 2500000
        }
    }
}
```

### 庫存異動記錄
#### GET /api/inventory/transactions
```json
// 查詢參數
{
    "product_id": 1,
    "warehouse_id": 1,
    "transaction_type": "in|out|adjustment|transfer",
    "date_from": "2025-07-01",
    "date_to": "2025-07-31"
}

// 回應
{
    "success": true,
    "data": {
        "transactions": [
            {
                "id": 1,
                "product": {
                    "id": 1,
                    "name": "商品A",
                    "sku": "PRD-001"
                },
                "warehouse": {
                    "id": 1,
                    "name": "主倉庫"
                },
                "transaction_type": "in",
                "quantity": 50,
                "unit_cost": 800,
                "reference_type": "purchase_order",
                "reference_id": "PO-2025-001",
                "notes": "採購入庫",
                "transaction_date": "2025-07-24T10:00:00Z",
                "created_by": {
                    "id": 1,
                    "name": "操作人員"
                }
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 50,
            "total": 200,
            "last_page": 4
        }
    }
}
```

---

## 📈 **報表 API**

### 銷售報表
#### GET /api/reports/sales
```json
// 查詢參數
{
    "period": "daily|weekly|monthly|yearly",
    "date_from": "2025-07-01",
    "date_to": "2025-07-31",
    "customer_id": 1,
    "product_id": 1,
    "group_by": "customer|product|category"
}

// 回應
{
    "success": true,
    "data": {
        "summary": {
            "total_sales": 1500000,
            "total_orders": 45,
            "average_order_value": 33333,
            "growth_rate": 12.5
        },
        "chart_data": {
            "labels": ["2025-07-01", "2025-07-02", "2025-07-03"],
            "datasets": [
                {
                    "label": "銷售金額",
                    "data": [50000, 65000, 80000]
                }
            ]
        },
        "top_products": [
            {
                "product_id": 1,
                "product_name": "商品A",
                "quantity_sold": 100,
                "total_sales": 150000
            }
        ],
        "top_customers": [
            {
                "customer_id": 1,
                "customer_name": "客戶A",
                "order_count": 5,
                "total_sales": 200000
            }
        ]
    }
}
```

---

## ❌ **錯誤處理規範**

### 標準錯誤格式
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "使用者友善的錯誤訊息",
        "details": {
            // 詳細錯誤資訊 (開發用)
        },
        "timestamp": "2025-07-24T10:00:00Z",
        "request_id": "uuid-string"
    }
}
```

### HTTP 狀態碼使用
```yaml
200 OK: 成功
201 Created: 資源建立成功
400 Bad Request: 請求參數錯誤
401 Unauthorized: 未認證
403 Forbidden: 權限不足
404 Not Found: 資源不存在
422 Unprocessable Entity: 資料驗證失敗
429 Too Many Requests: 請求頻率超限
500 Internal Server Error: 伺服器內部錯誤
503 Service Unavailable: 服務暫不可用
```

### 常見錯誤代碼
```yaml
認證相關:
  INVALID_CREDENTIALS: 帳號或密碼錯誤
  TOKEN_EXPIRED: Token 已過期
  TOKEN_INVALID: Token 無效
  INSUFFICIENT_PERMISSIONS: 權限不足

資料驗證:
  VALIDATION_ERROR: 資料驗證失敗
  DUPLICATE_ENTRY: 重複資料
  FOREIGN_KEY_CONSTRAINT: 外鍵約束錯誤

業務邏輯:
  INSUFFICIENT_STOCK: 庫存不足
  ORDER_CANNOT_CANCEL: 訂單無法取消
  CUSTOMER_CREDIT_EXCEEDED: 超過信用額度

系統錯誤:
  DATABASE_ERROR: 資料庫錯誤
  SERVICE_UNAVAILABLE: 服務不可用
  RATE_LIMIT_EXCEEDED: 請求頻率超限
```

---

## 🚀 **API 版本控制**

### 版本策略
```yaml
URL 版本控制: /api/v1/products (當前)
Header 版本控制: Accept: application/vnd.nexuserp.v1+json

版本生命週期:
  v1: 當前版本 (穩定)
  v2: 開發中 (新功能)
  
向後相容性:
  - 新增欄位: 相容
  - 修改欄位類型: 不相容
  - 刪除欄位: 不相容
  - 新增端點: 相容
```

---

**文件維護**: 本文件隨 API 發展持續更新  
**測試工具**: Postman Collection 提供  
**最後更新**: 2025-07-24