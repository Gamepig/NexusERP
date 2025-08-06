# NexusERP API 規劃文件

**版本：** 1.0
**最後更新時間：** 2025/7/15 22:20

---

## 目錄
1. [API 設計總則](#api-設計總則)
2. [API 分類與詳細說明](#api-分類與詳細說明)
3. [常用變數與資料結構](#常用變數與資料結構)
4. [API 安全與授權機制](#api-安全與授權機制)
5. [API 文件與開發者門戶規範](#api-文件與開發者門戶規範)
6. [外部整合 API 概述](#外部整合-api-概述)
7. [OpenAPI/Swagger 文件規範建議](#openapiswagger-文件規範建議)
8. [命名慣例與版本控制建議](#命名慣例與版本控制建議)

---

## 1. API 設計總則
- 採用 RESTful 風格，端點以資源為中心，動詞用於 HTTP 方法
- 資料格式統一為 JSON
- 所有 API 皆需版本化（如 `/api/v1/`）
- 採用標準 HTTP 狀態碼
- 錯誤回應格式統一（建議：`{ code, message, details }`）
- 支援分頁、排序、篩選查詢
- 端點、參數、回傳欄位皆需有明確說明
- 認證：JWT、Session、API Key、OAuth2（依用途）
- 授權：RBAC（角色型存取控制）
- 速率限制與日誌審計
- OpenAPI/Swagger 文件自動生成

---

## 2. API 分類與詳細說明

### 2.1 用戶與權限管理
- `POST /api/users`：建立新用戶
- `GET /api/users`、`GET /api/users/{id}`：查詢用戶清單/明細
- `PUT /api/users/{id}`：更新用戶資料
- `DELETE /api/users/{id}`：軟刪除用戶
- `POST /api/auth/login`：用戶登入
- `POST /api/auth/logout`：用戶登出
- `POST /api/auth/verify`：驗證用戶身份
- `GET /api/audit/user-activity`：查詢用戶操作紀錄

### 2.2 組織架構（公司、業務單位、員工）
- `POST /api/companies`、`GET /api/companies`、`PUT /api/companies/{id}`、`DELETE /api/companies/{id}`
- `POST /api/business-units`、`GET /api/business-units`、`PUT /api/business-units/{id}`、`DELETE /api/business-units/{id}`
- `POST /api/employees`、`GET /api/employees`、`PUT /api/employees/{id}`、`DELETE /api/employees/{id}`

### 2.3 商品與分類
- `POST /api/products`、`GET /api/products`、`PUT /api/products/{id}`、`DELETE /api/products/{id}`
- `GET /api/products/{id}/inventory`：查詢商品庫存
- `POST /api/product-categories`、`GET /api/product-categories`、`PUT /api/product-categories/{id}`、`DELETE /api/product-categories/{id}`
- `POST /api/units-of-measure`、`GET /api/units-of-measure`、`PUT /api/units-of-measure/{id}`、`DELETE /api/units-of-measure/{id}`

### 2.4 庫存與盤點
- `POST /api/warehouses`、`GET /api/warehouses`、`PUT /api/warehouses/{id}`、`DELETE /api/warehouses/{id}`
- `GET /api/warehouses/{id}/inventory`：查詢倉庫庫存
- `POST /api/inventory-transactions`、`GET /api/inventory-transactions`、`PUT /api/inventory-transactions/{id}`、`DELETE /api/inventory-transactions/{id}`
- `GET /api/inventory-levels`、`GET /api/inventory-levels/{product_id}/{warehouse_id}/{storage_location_id}`、`PUT /api/inventory-levels/{product_id}/{warehouse_id}/{storage_location_id}`
- `POST /api/stocktaking-orders`、`GET /api/stocktaking-orders`、`PUT /api/stocktaking-orders/{id}`、`DELETE /api/stocktaking-orders/{id}`
- `POST /api/stocktaking-orders/{id}/complete`：完成盤點

### 2.5 採購管理
- `POST /api/suppliers`、`GET /api/suppliers`、`PUT /api/suppliers/{id}`、`DELETE /api/suppliers/{id}`
- `POST /api/purchase-orders`、`GET /api/purchase-orders`、`PUT /api/purchase-orders/{id}`、`DELETE /api/purchase-orders/{id}`
- `POST /api/purchase-orders/{id}/receive`、`PUT /api/purchase-orders/{id}/approve`、`PUT /api/purchase-orders/{id}/complete`
- `POST /api/purchase-order-items`、`GET /api/purchase-order-items`、`PUT /api/purchase-order-items/{id}`、`DELETE /api/purchase-order-items/{id}`

### 2.6 銷售管理
- `POST /api/sales-orders`、`GET /api/sales-orders`、`PUT /api/sales-orders/{id}`、`DELETE /api/sales-orders/{id}`
- `POST /api/sales-orders/{id}/ship`、`PUT /api/sales-orders/{id}/complete`
- `POST /api/sales-order-items`、`GET /api/sales-order-items`、`PUT /api/sales-order-items/{id}`、`DELETE /api/sales-order-items/{id}`

### 2.7 財務管理
- `POST /api/invoices`、`GET /api/invoices`、`PUT /api/invoices/{id}`、`DELETE /api/invoices/{id}`

### 2.8 HR、人力資源
- `POST /api/employees`、`GET /api/employees`、`PUT /api/employees/{id}`、`DELETE /api/employees/{id}`

### 2.9 BI/報表
- `POST /api/bi-reports`、`GET /api/bi-reports`、`PUT /api/bi-reports/{id}`、`DELETE /api/bi-reports/{id}`

### 2.10 IoT 裝置
- `POST /api/iot-devices`、`GET /api/iot-devices`、`PUT /api/iot-devices/{id}`、`DELETE /api/iot-devices/{id}`

### 2.11 API 日誌/審計
- `GET /api/api-logs`、`GET /api/api-logs/{id}`
- `GET /api/audit-logs`、`GET /api/audit-logs/{id}`、`GET /api/audit-logs/user/{user_id}`

### 2.12 區塊鏈
- `POST /api/blockchain-tx`、`GET /api/blockchain-tx`、`GET /api/blockchain-tx/{id}`

### 2.13 附件/通知
- `POST /api/attachments`、`GET /api/attachments`、`DELETE /api/attachments/{id}`
- `POST /api/notifications`、`GET /api/notifications`、`PUT /api/notifications/{id}`、`DELETE /api/notifications/{id}`

### 2.14 幣別
- `POST /api/currencies`、`GET /api/currencies`、`PUT /api/currencies/{id}`、`DELETE /api/currencies/{id}`

---

## 3. 常用變數與資料結構
- 分頁：`page`, `page_size`，回傳 `total`, `items`
- 排序：`sort_by`, `order`
- 篩選：依資源欄位設計查詢參數
- 通用欄位：`id`, `created_at`, `updated_at`, `deleted_at`, `status`
- 錯誤格式：`{ code, message, details }`

---

## 4. API 安全與授權機制
- 認證：JWT（推薦）、Session、API Key（對外開放）、OAuth2（第三方整合）
- 授權：RBAC（角色型存取控制），依資源與操作權限控管
- 速率限制：依 API Key 或用戶設置
- 日誌與審計：所有敏感操作與API請求皆記錄於`api_logs`、`audit_logs`

---

## 5. API 文件與開發者門戶規範
- 所有 API 需有 OpenAPI/Swagger 文件
- 提供互動式 API 文檔（如 Swagger UI）
- 支援 API Key 申請、管理、註銷
- 提供 API 使用說明、範例程式碼
- 開發者門戶需有：API 文件、金鑰管理、流量統計、錯誤查詢

---

## 6. 外部整合 API 概述
- MCP SERVER TOOLS API：外部數據、法規、新聞、天氣、供應商等
- OCR 服務 API：發票、進貨單、物流單等影像辨識
- RAG/CAG 模型 API：知識庫檢索、AI 問答
- 會計系統 API：QuickBooks, Xero
- 支付閘道 API：Stripe, PayPal
- 物流追蹤 API：FedEx, DHL
- 電商平台 API：Shopify, Amazon
- B2B 平台 API：公開供應商資料庫

---

## 7. OpenAPI/Swagger 文件規範建議
- 每個端點需有：方法、路徑、參數、回傳格式、錯誤範例、授權需求
- 建議自動生成並與程式碼同步
- 支援多語言註解（建議中文為主）
- 範例請參考 [OpenAPI 3.0 規範](https://swagger.io/specification/)

---

## 8. 命名慣例與版本控制建議
- 路徑小寫、單數/複數依資源語意
- 動詞僅用於非標準操作（如 `/api/products/{id}/activate`）
- 版本號於路徑前綴（如 `/api/v1/`）
- 參數、欄位命名採用 snake_case

---

> 本文件為 NexusERP API 設計與開發唯一依據，所有新開發、維護、AI 生成程式碼皆需遵循本規範。若有異動，請同步更新本文件與 OpenAPI 文件。 