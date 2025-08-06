# NexusERP 資料庫詳細規格 Database Specification

> 本文件彙整 NexusERP 全模組資料表設計，涵蓋欄位、型別、用途、關聯性、特殊設計，並標明跨模組資料流與業務邏輯關聯。所有表格皆以 PostgreSQL 為主，遵循 3NF，並適度使用 JSONB、RLS、軟刪除等現代設計。

---

## 設計原則補充

- **自動遞增主鍵**：所有主鍵建議使用 `GENERATED ALWAYS AS IDENTITY`（PostgreSQL 10+ 標準），取代舊式 `SERIAL`/`BIGSERIAL`，確保唯一且自動遞增。
- **Partial Index（部分索引）**：針對軟刪除（如 `deleted_at` 欄位）之表格，建議建立 partial index（如 `WHERE deleted_at IS NULL`），以提升常用查詢效能。

---

## 目錄

1. 用戶與權限管理
2. 組織架構（公司、業務單位、員工）
3. 商品與分類
4. 庫存與盤點
5. 採購管理
6. 銷售管理
7. 財務管理
8. HR（人力資源）
9. BI（商業智慧/報表）
10. IoT 裝置
11. API/日誌/審計
12. 區塊鏈
13. 附件/通知
14. 幣別

---

## 1. 用戶與權限管理

### 1.1 users
| 欄位                   | 型別         | 用途                         | 主鍵/外鍵/唯一/索引 | 備註           |
|------------------------|--------------|------------------------------|---------------------|----------------|
| id                     | BIGSERIAL    | 用戶ID                       | PK, 唯一            |                |
| username               | VARCHAR(64)  | 登入帳號                     | 唯一, 索引          |                |
| email                  | VARCHAR(128) | 電子郵件                     | 唯一, 索引          |                |
| password_hash          | VARCHAR(128) | 密碼雜湊                     |                     |                |
| first_name             | VARCHAR(64)  | 名                           |                     |                |
| last_name              | VARCHAR(64)  | 姓                           |                     |                |
| status                 | VARCHAR(16)  | 狀態(啟用/停用)              |                     |                |
| ai_classification_yaml | JSONB        | AI 註冊分類原始 YAML         |                     | 記錄 AI 決策過程|
| registration_method    | VARCHAR(32)  | 註冊來源（OAuth/AI/傳統）     |                     |                |
| created_at             | TIMESTAMP    | 建立時間                     |                     |                |
| updated_at             | TIMESTAMP    | 更新時間                     |                     |                |
| deleted_at             | TIMESTAMP    | 軟刪除                       |                     |                |

**主要功能/Function 對應：**
- 用戶註冊/登入/驗證（身份認證）
- 權限控管（RBAC，角色/權限分配）
- 操作審計（記錄異動人員，如庫存異動、採購、銷售、盤點等）
- 業務單位/公司成員管理
- 員工資料關聯（HR模組）
- 報表/分析（依用戶追蹤操作紀錄）
- Marketplace 會員/供應商/買家帳號
- AI 註冊分類追蹤（ai_classification_yaml）
- 註冊來源統計（registration_method）

**API 對應：**
- `POST /api/users`：建立新用戶（支援 ai_classification_yaml、registration_method 欄位）
- `GET /api/users`、`GET /api/users/{id}`：查詢用戶清單/明細
- `PUT /api/users/{id}`：更新用戶資料
- `DELETE /api/users/{id}`：軟刪除用戶
- `POST /api/auth/login`：用戶登入
- `POST /api/auth/logout`：用戶登出
- `POST /api/auth/verify`：驗證用戶身份
- `GET /api/audit/user-activity`：查詢用戶操作紀錄

**主鍵設計建議：**
- 建議主鍵 `id` 欄位使用 `GENERATED ALWAYS AS IDENTITY` 取代 `BIGSERIAL`，以符合 PostgreSQL 10+ 標準。

**Partial Index 建議：**
- 建議於 `deleted_at` 欄位建立 partial index：
  ```sql
  CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;
  ```
  以提升常用查詢（未刪除用戶）效能。

### 1.2 roles
| 欄位             | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|------------------|--------------|------------------|---------------------|----------------|
| id               | BIGSERIAL    | 角色ID           | PK, 唯一            |                |
| name             | VARCHAR(64)  | 角色名稱         | 唯一, 索引          |                |
| description      | VARCHAR(128) | 說明             |                     |                |
| created_at       | TIMESTAMP    | 建立時間         |                     |                |
| updated_at       | TIMESTAMP    | 更新時間         |                     |                |

### 1.3 permissions
| 欄位             | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|------------------|--------------|------------------|---------------------|----------------|
| id               | BIGSERIAL    | 權限ID           | PK, 唯一            |                |
| name             | VARCHAR(64)  | 權限名稱         | 唯一, 索引          |                |
| resource         | VARCHAR(64)  | 資源類型         |                     |                |
| action           | VARCHAR(32)  | 操作             |                     |                |
| description      | VARCHAR(128) | 說明             |                     |                |
| created_at       | TIMESTAMP    | 建立時間         |                     |                |
| updated_at       | TIMESTAMP    | 更新時間         |                     |                |

### 1.4 user_roles (多對多)
| 欄位             | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|------------------|--------------|------------------|---------------------|----------------|
| user_id          | BIGINT       | 用戶ID           | PK, FK(users.id)    |                |
| role_id          | BIGINT       | 角色ID           | PK, FK(roles.id)    |                |

### 1.5 role_permissions (多對多)
| 欄位             | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|------------------|--------------|------------------|---------------------|----------------|
| role_id          | BIGINT       | 角色ID           | PK, FK(roles.id)    |                |
| permission_id    | BIGINT       | 權限ID           | PK, FK(permissions.id)|                |

### 1.6 user_business_units (多對多)
| 欄位             | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|------------------|--------------|------------------|---------------------|----------------|
| user_id          | BIGINT       | 用戶ID           | PK, FK(users.id)    |                |
| business_unit_id | BIGINT       | 業務單位ID       | PK, FK(business_units.id)|             |

### 1.x user_oauth_accounts（第三方登入綁定）
| 欄位               | 型別         | 用途                         | 主鍵/外鍵/唯一/索引 | 備註           |
|--------------------|--------------|------------------------------|---------------------|----------------|
| id                 | BIGSERIAL    | 主鍵                         | PK, 唯一            |                |
| user_id            | BIGINT       | 對應 users.id                | FK(users.id), 索引  |                |
| provider           | VARCHAR(32)  | OAuth 來源（google/line/...）| 索引                |                |
| provider_user_id   | VARCHAR(128) | 第三方平台唯一ID             | 索引, 唯一(複合)    |                |
| access_token       | VARCHAR(256) | 存取權杖（可選）             |                     | 建議加密儲存    |
| refresh_token      | VARCHAR(256) | 更新權杖（可選）             |                     | 建議加密儲存    |
| token_expiry       | TIMESTAMP    | 權杖到期時間（可選）         |                     |                |
| status             | VARCHAR(16)  | 狀態（啟用/停用）            |                     |                |
| created_at         | TIMESTAMP    | 建立時間                     |                     |                |
| updated_at         | TIMESTAMP    | 更新時間                     |                     |                |

**用途/Function 對應：**
- 支援一用戶綁定多個第三方帳號（Google、LINE、Facebook...）
- 儲存第三方平台唯一ID、provider、token（可選）、狀態等
- 提供 OAuth 登入、帳號綁定/解除、第三方帳號查詢

**唯一索引建議：**
- (provider, provider_user_id) 應唯一，避免同一平台ID重複綁定

**API 對應：**
- `POST /api/oauth/link`：綁定第三方帳號
- `POST /api/oauth/unlink`：解除第三方帳號
- `GET /api/oauth/accounts`：查詢用戶所有綁定的第三方帳號

**ER 圖補充說明：**
- user_oauth_accounts.user_id → users.id（多對一）
- 一個 user 可有多個 user_oauth_accounts
- 每個 (provider, provider_user_id) 只對應一個 user

```mermaid
erDiagram
    USERS ||--o{ USER_OAUTH_ACCOUNTS : 擁有
    USER_OAUTH_ACCOUNTS {
        BIGINT user_id
        VARCHAR provider
        VARCHAR provider_user_id
        VARCHAR access_token
        VARCHAR refresh_token
        TIMESTAMP token_expiry
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    USERS {
        BIGSERIAL id
        VARCHAR username
        VARCHAR email
        // 其餘欄位略
    }
```

---

## 2. 組織架構

### 2.1 companies
| 欄位             | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|------------------|--------------|------------------|---------------------|----------------|
| id               | BIGSERIAL    | 公司ID           | PK, 唯一            |                |
| name             | VARCHAR(128) | 公司名稱         | 唯一, 索引          |                |
| registration_number | VARCHAR(64)| 統編/註冊號      | 唯一, 索引          |                |
| address          | VARCHAR(256) | 公司地址         |                     |                |
| contact_email    | VARCHAR(128) | 聯絡信箱         |                     |                |
| status           | VARCHAR(16)  | 狀態             |                     |                |
| created_at       | TIMESTAMP    | 建立時間         |                     |                |
| updated_at       | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 公司主檔管理（新增/編輯/查詢）
- 用戶/業務單位歸屬（多公司支援）
- 資料隔離（多公司資料分離）
- 採購、銷售、庫存、財務等所有業務資料的公司歸屬
- 報表/分析（依公司彙總）
- Marketplace 企業帳號

**API 對應：**
- `POST /api/companies`：建立公司
- `GET /api/companies`、`GET /api/companies/{id}`：查詢公司清單/明細
- `PUT /api/companies/{id}`：更新公司資料
- `DELETE /api/companies/{id}`：刪除公司
- `GET /api/companies/{id}/users`：查詢公司成員

### 2.2 business_units
| 欄位             | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|------------------|--------------|------------------|---------------------|----------------|
| id               | BIGSERIAL    | 業務單位ID       | PK, 唯一            |                |
| company_id       | BIGINT       | 所屬公司         | FK(companies.id)    |                |
| name             | VARCHAR(128) | 單位名稱         | 唯一(公司內),索引   |                |
| type             | VARCHAR(32)  | 行業類型         |                     |                |
| address          | VARCHAR(256) | 單位地址         |                     |                |
| status           | VARCHAR(16)  | 狀態             |                     |                |
| created_at       | TIMESTAMP    | 建立時間         |                     |                |
| updated_at       | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 業務單位管理（新增/編輯/查詢）
- 用戶/員工/倉庫/商品/採購/銷售等歸屬單位
- 資料隔離（多單位分權）
- 報表/分析（依單位彙總）
- 內部轉移/跨單位交易

**API 對應：**
- `POST /api/business-units`：建立業務單位
- `GET /api/business-units`、`GET /api/business-units/{id}`：查詢單位清單/明細
- `PUT /api/business-units/{id}`：更新單位資料
- `DELETE /api/business-units/{id}`：刪除單位
- `GET /api/business-units/{id}/users`：查詢單位成員

### 2.3 employees
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 員工ID           | PK, 唯一            |                |
| user_id        | BIGINT       | 用戶ID           | FK(users.id)        |                |
| company_id     | BIGINT       | 公司ID           | FK(companies.id)    |                |
| business_unit_id| BIGINT      | 業務單位ID       | FK(business_units.id)|               |
| employee_no    | VARCHAR(32)  | 員工編號         | 唯一, 索引          |                |
| name           | VARCHAR(64)  | 員工姓名         |                     |                |
| position       | VARCHAR(64)  | 職稱             |                     |                |
| hire_date      | DATE         | 到職日           |                     |                |
| status         | VARCHAR(16)  | 狀態             |                     | 在職/離職等    |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 員工管理（新增/查詢/異動）
- 人事資料維護
- 用戶關聯/權限控管

**API 對應：**
- `POST /api/employees`：新增員工
- `GET /api/employees`、`GET /api/employees/{id}`：查詢員工清單/明細
- `PUT /api/employees/{id}`：更新員工
- `DELETE /api/employees/{id}`：刪除員工

---

## 3. 商品與分類

### 3.1 products
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 商品ID                 | PK, 唯一            |                              |
| sku                 | VARCHAR(64)    | 產品編號               | 唯一, 索引          |                              |
| name                | VARCHAR(128)   | 產品名稱               | 索引                |                              |
| description         | TEXT           | 產品描述               |                     |                              |
| category_id         | BIGINT         | 分類ID                 | FK(product_categories.id) |                    |
| unit_of_measure_id  | BIGINT         | 計量單位ID             | FK(units_of_measure.id) |                    |
| weight              | NUMERIC(10,3)  | 重量                   |                     | 公斤/克                      |
| dimensions          | VARCHAR(64)    | 尺寸                   |                     | 例如: 10x20x5cm               |
| supplier_id         | BIGINT         | 主要供應商ID           | FK(suppliers.id)     | 可選                          |
| cost_price          | NUMERIC(12,2)  | 進貨成本               |                     |                              |
| selling_price       | NUMERIC(12,2)  | 建議售價               |                     |                              |
| barcode             | VARCHAR(64)    | 條碼                   | 唯一, 索引          |                              |
| image_url           | VARCHAR(256)   | 產品圖片               |                     |                              |
| is_active           | BOOLEAN        | 啟用狀態               |                     |                              |
| attributes          | JSONB          | 自訂屬性               |                     | 彈性欄位（如規格、顏色等）    |
| created_at          | TIMESTAMP      | 建立時間               |                     |                              |
| updated_at          | TIMESTAMP      | 更新時間               |                     |                              |

**主要功能/Function 對應：**
- 商品主檔管理（新增/編輯/刪除/查詢）
- 採購單建立（選擇商品）
- 庫存查詢（依商品查詢庫存）
- 庫存異動（入庫、出庫、調整、轉移）
- 盤點作業（盤點商品）
- Marketplace 商品上架
- 報表/分析（商品銷售、庫存週轉等）

**API 對應：**
- `POST /api/products`：建立商品
- `GET /api/products`、`GET /api/products/{id}`：查詢商品清單/明細
- `PUT /api/products/{id}`：更新商品資料
- `DELETE /api/products/{id}`：軟刪除商品
- `GET /api/products/{id}/inventory`：查詢商品庫存

### 3.2 product_categories
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 分類ID                 | PK, 唯一            |                              |
| name                | VARCHAR(64)    | 分類名稱               | 唯一, 索引          |                              |
| parent_category_id  | BIGINT         | 上層分類ID             | FK(self.id)         | 可為 null，支援多層分類       |
| description         | VARCHAR(128)   | 分類說明               |                     |                              |

**主要功能/Function 對應：**
- 商品分類管理（新增/編輯/刪除/查詢）
- 商品主檔管理（分類選擇）
- 商品篩選/報表

**API 對應：**
- `POST /api/product-categories`：建立分類
- `GET /api/product-categories`、`GET /api/product-categories/{id}`：查詢分類清單/明細
- `PUT /api/product-categories/{id}`：更新分類資料
- `DELETE /api/product-categories/{id}`：刪除分類

### 3.3 units_of_measure
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 單位ID                 | PK, 唯一            |                              |
| name                | VARCHAR(32)    | 單位名稱               | 唯一, 索引          | 例如: 公斤、包、隻           |
| symbol              | VARCHAR(8)     | 單位符號               |                     | 例如: kg, pcs                |

**主要功能/Function 對應：**
- 計量單位管理（新增/編輯/刪除/查詢）
- 商品主檔管理（單位選擇）
- 採購單、庫存異動單位顯示

**API 對應：**
- `POST /api/units-of-measure`：建立單位
- `GET /api/units-of-measure`、`GET /api/units-of-measure/{id}`：查詢單位清單/明細
- `PUT /api/units-of-measure/{id}`：更新單位資料
- `DELETE /api/units-of-measure/{id}`：刪除單位

---

## 4. 庫存與盤點

### 4.1 warehouses
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 倉庫ID                 | PK, 唯一            |                              |
| name                | VARCHAR(64)    | 倉庫名稱               | 唯一, 索引          |                              |
| code                | VARCHAR(32)    | 倉庫代碼               | 唯一, 索引          |                              |
| address             | VARCHAR(256)   | 倉庫地址               |                     |                              |
| business_unit_id    | BIGINT         | 所屬業務單位           | FK(business_units.id)|                             |
| is_active           | BOOLEAN        | 啟用狀態               |                     |                              |
| created_at          | TIMESTAMP      | 建立時間               |                     |                              |
| updated_at          | TIMESTAMP      | 更新時間               |                     |                              |

**主要功能/Function 對應：**
- 倉庫管理（新增/編輯/刪除/查詢）
- 庫存查詢（依倉庫篩選）
- 庫存異動（指定倉庫）
- 盤點作業
- 採購收貨/出貨作業

**API 對應：**
- `POST /api/warehouses`：建立倉庫
- `GET /api/warehouses`、`GET /api/warehouses/{id}`：查詢倉庫清單/明細
- `PUT /api/warehouses/{id}`：更新倉庫資料
- `DELETE /api/warehouses/{id}`：刪除倉庫
- `GET /api/warehouses/{id}/inventory`：查詢倉庫庫存

### 4.2 storage_locations
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 儲位ID                 | PK, 唯一            |                              |
| warehouse_id        | BIGINT         | 所屬倉庫               | FK(warehouses.id)   |                              |
| name                | VARCHAR(64)    | 儲位名稱               | 索引                |                              |
| code                | VARCHAR(32)    | 儲位代碼               | 唯一(倉庫內),索引   |                              |
| type                | VARCHAR(16)    | 類型                   |                     | shelf/bin/zone等             |
| capacity            | NUMERIC(12,2)  | 容量                   |                     |                              |
| created_at          | TIMESTAMP      | 建立時間               |                     |                              |
| updated_at          | TIMESTAMP      | 更新時間               |                     |                              |

**主要功能/Function 對應：**
- 儲位管理（新增/編輯/刪除/查詢）
- 庫存查詢（依儲位篩選）
- 庫存異動（指定儲位）
- 盤點作業

**API 對應：**
- `POST /api/storage-locations`：建立儲位
- `GET /api/storage-locations`、`GET /api/storage-locations/{id}`：查詢儲位清單/明細
- `PUT /api/storage-locations/{id}`：更新儲位資料
- `DELETE /api/storage-locations/{id}`：刪除儲位
- `GET /api/storage-locations/{id}/inventory`：查詢儲位庫存

### 4.3 inventory_levels
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| product_id          | BIGINT         | 產品ID                 | PK, FK(products.id) |                              |
| warehouse_id        | BIGINT         | 倉庫ID                 | PK, FK(warehouses.id)|                             |
| storage_location_id | BIGINT         | 儲位ID                 | PK, FK(storage_locations.id), 可為null | 唯一組合索引 (product_id, warehouse_id, storage_location_id) |
| quantity_on_hand    | NUMERIC(12,2)  | 現有庫存               |                     |                              |
| quantity_available  | NUMERIC(12,2)  | 可用庫存               |                     |                              |
| quantity_reserved   | NUMERIC(12,2)  | 已預留庫存             |                     |                              |
| quantity_on_order   | NUMERIC(12,2)  | 在途庫存               |                     |                              |
| reorder_point       | NUMERIC(12,2)  | 補貨點                 |                     |                              |
| last_updated_at     | TIMESTAMP      | 最後更新時間           |                     |                              |

**主要功能/Function 對應：**
- 庫存查詢（即時查詢各商品/倉庫/儲位庫存）
- 庫存異動（自動更新庫存水平）
- 盤點作業（盤點時比對理論與實際庫存）
- 補貨預警（依補貨點觸發）
- 報表/分析（庫存週轉、庫存預測）

**API 對應：**
- `GET /api/inventory-levels`：查詢所有庫存水平
- `GET /api/inventory-levels/{product_id}/{warehouse_id}/{storage_location_id}`：查詢特定儲位庫存
- `PUT /api/inventory-levels/{product_id}/{warehouse_id}/{storage_location_id}`：更新庫存水平

### 4.4 inventory_transactions
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 交易ID                 | PK, 唯一            |                              |
| transaction_type_id | BIGINT         | 交易類型ID             | FK(inventory_transaction_types.id)|         |
| product_id          | BIGINT         | 產品ID                 | FK(products.id)     |                              |
| warehouse_id        | BIGINT         | 倉庫ID                 | FK(warehouses.id)   |                              |
| storage_location_id | BIGINT         | 儲位ID                 | FK(storage_locations.id), 可為null |         |
| quantity_changed    | NUMERIC(12,2)  | 變動數量               |                     |                              |
| new_quantity_on_hand| NUMERIC(12,2)  | 異動後庫存             |                     |                              |
| transaction_date    | TIMESTAMP      | 交易日期               |                     |                              |
| reference_document_type | VARCHAR(32) | 參考單據類型           |                     | 如 PO, SO, Invoice           |
| reference_document_id   | BIGINT      | 參考單據ID             |                     |                              |
| user_id             | BIGINT         | 操作人員ID             | FK(users.id)        |                              |
| notes               | TEXT           | 備註                   |                     |                              |
| created_at          | TIMESTAMP      | 建立時間               |                     |                              |

**主要功能/Function 對應：**
- 庫存異動記錄（入庫、出庫、調整、轉移、盤點）
- 採購收貨（自動產生入庫異動）
- 銷售出貨（自動產生出庫異動）
- 盤點作業（產生調整異動）
- 報表/分析（異動歷史、追蹤）

**API 對應：**
- `POST /api/inventory-transactions`：建立庫存異動
- `GET /api/inventory-transactions`：查詢所有異動
- `GET /api/inventory-transactions/{id}`：查詢特定異動
- `PUT /api/inventory-transactions/{id}`：更新異動
- `DELETE /api/inventory-transactions/{id}`：刪除異動
- `GET /api/inventory-transactions/product/{product_id}`：查詢商品異動歷史
- `GET /api/inventory-transactions/warehouse/{warehouse_id}`：查詢倉庫異動歷史

### 4.5 inventory_transaction_types
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 類型ID                 | PK, 唯一            |                              |
| name                | VARCHAR(32)    | 類型名稱               | 唯一, 索引          | 如入庫、出庫、調整、轉移等   |
| description         | VARCHAR(128)   | 說明                   |                     |                              |

**主要功能/Function 對應：**
- 庫存異動記錄（標記異動類型）
- 異動類型管理（新增/編輯/查詢）
- 報表/分析（依異動類型統計）

**API 對應：**
- `POST /api/inventory-transaction-types`：建立異動類型
- `GET /api/inventory-transaction-types`、`GET /api/inventory-transaction-types/{id}`：查詢異動類型清單/明細
- `PUT /api/inventory-transaction-types/{id}`：更新異動類型
- `DELETE /api/inventory-transaction-types/{id}`：刪除異動類型

### 4.6 stocktaking_orders
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 盤點單ID         | PK, 唯一            |                |
| order_number   | VARCHAR(32)  | 盤點單號         | 唯一, 索引          |                |
| warehouse_id   | BIGINT       | 倉庫ID           | FK(warehouses.id)   |                |
| business_unit_id| BIGINT      | 業務單位ID       | FK(business_units.id)|               |
| status         | VARCHAR(16)  | 狀態             | 索引                | 草稿/已盤點等  |
| user_id        | BIGINT       | 建立人員ID       | FK(users.id)        |                |
| started_at     | TIMESTAMP    | 盤點開始時間     |                     |                |
| completed_at   | TIMESTAMP    | 盤點完成時間     |                     |                |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 盤點單管理（建立/查詢/結案）
- 盤點流程（啟動/完成/審核）
- 庫存異動（盤點調整）

**API 對應：**
- `POST /api/stocktaking-orders`：建立盤點單
- `GET /api/stocktaking-orders`、`GET /api/stocktaking-orders/{id}`：查詢盤點單清單/明細
- `PUT /api/stocktaking-orders/{id}`：更新盤點單
- `DELETE /api/stocktaking-orders/{id}`：刪除盤點單
- `POST /api/stocktaking-orders/{id}/complete`：完成盤點

### 4.7 stocktaking_items
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 明細ID           | PK, 唯一            |                |
| stocktaking_order_id | BIGINT  | 盤點單ID         | FK(stocktaking_orders.id)|             |
| product_id     | BIGINT       | 產品ID           | FK(products.id)     |                |
| warehouse_id   | BIGINT       | 倉庫ID           | FK(warehouses.id)   |                |
| storage_location_id | BIGINT   | 儲位ID           | FK(storage_locations.id)| 可為null     |
| quantity_system| NUMERIC(12,2)| 系統數量         |                     | 理論庫存       |
| quantity_counted| NUMERIC(12,2)| 盤點數量         |                     | 實際盤點       |
| quantity_diff  | NUMERIC(12,2)| 差異數量         |                     |                |
| status         | VARCHAR(16)  | 狀態             |                     | 草稿/已盤點等  |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 盤點明細管理（新增/查詢/盤點/結案）
- 盤點流程（記錄盤點數量、差異）
- 庫存異動（依盤點差異自動產生調整）

**API 對應：**
- `POST /api/stocktaking-items`：建立盤點明細
- `GET /api/stocktaking-items`、`GET /api/stocktaking-items/{id}`：查詢明細清單/明細
- `PUT /api/stocktaking-items/{id}`：更新明細
- `DELETE /api/stocktaking-items/{id}`：刪除明細

---

## 5. 採購管理

### 5.1 suppliers
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 供應商ID               | PK, 唯一            |                              |
| name                | VARCHAR(128)   | 供應商名稱             | 唯一, 索引          |                              |
| contact_person      | VARCHAR(64)    | 聯絡人                 |                     |                              |
| email               | VARCHAR(128)   | 聯絡信箱               |                     |                              |
| phone               | VARCHAR(32)    | 聯絡電話               |                     |                              |
| address             | VARCHAR(256)   | 地址                   |                     |                              |
| payment_terms_id    | BIGINT         | 付款條件ID             | FK(payment_terms.id)|                              |
| tax_id              | VARCHAR(32)    | 統一編號               |                     |                              |
| currency_id         | BIGINT         | 幣別ID                 | FK(currencies.id)   |                              |
| is_active           | BOOLEAN        | 啟用狀態               |                     |                              |
| created_at          | TIMESTAMP      | 建立時間               |                     |                              |
| updated_at          | TIMESTAMP      | 更新時間               |                     |                              |

**主要功能/Function 對應：**
- 供應商管理（新增/編輯/刪除/查詢）
- 採購單建立（選擇供應商）
- 採購分析/報表
- Marketplace 供應商推薦

**API 對應：**
- `POST /api/suppliers`：建立供應商
- `GET /api/suppliers`、`GET /api/suppliers/{id}`：查詢供應商清單/明細
- `PUT /api/suppliers/{id}`：更新供應商資料
- `DELETE /api/suppliers/{id}`：刪除供應商
- `GET /api/suppliers/{id}/purchase-orders`：查詢供應商採購單

### 5.2 payment_terms
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 條件ID                 | PK, 唯一            |                              |
| name                | VARCHAR(64)    | 條件名稱               | 唯一, 索引          |                              |
| description         | VARCHAR(128)   | 說明                   |                     |                              |
| days_due            | INTEGER        | 到期天數               |                     | 例如: 30, 60, 90             |

**主要功能/Function 對應：**
- 付款條件管理（新增/編輯/查詢）
- 供應商管理（指定付款條件）
- 採購單建立（指定付款條件）

**API 對應：**
- `POST /api/payment-terms`：建立付款條件
- `GET /api/payment-terms`、`GET /api/payment-terms/{id}`：查詢付款條件清單/明細
- `PUT /api/payment-terms/{id}`：更新付款條件
- `DELETE /api/payment-terms/{id}`：刪除付款條件

### 5.3 purchase_orders
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 採購單ID               | PK, 唯一            |                              |
| supplier_id         | BIGINT         | 供應商ID               | FK(suppliers.id)    |                              |
| order_number        | VARCHAR(32)    | 採購單號               | 唯一, 索引          |                              |
| order_date          | DATE           | 採購日期               |                     |                              |
| status              | VARCHAR(16)    | 狀態                   | 索引                | 草稿/已送出/已收貨/已結案等  |
| total_amount        | NUMERIC(14,2)  | 總金額                 |                     |                              |
| currency_id         | BIGINT         | 幣別ID                 | FK(currencies.id)   |                              |
| payment_terms_id    | BIGINT         | 付款條件ID             | FK(payment_terms.id)|                              |
| business_unit_id    | BIGINT         | 所屬業務單位           | FK(business_units.id)|                             |
| created_at          | TIMESTAMP      | 建立時間               |                     |                              |
| updated_at          | TIMESTAMP      | 更新時間               |                     |                              |

**主要功能/Function 對應：**
- 採購單管理（建立/查詢/審核/收貨/結案）
- 採購流程（下單、收貨、結案）
- 採購分析/報表
- 庫存異動（收貨時自動產生入庫異動）

**API 對應：**
- `POST /api/purchase-orders`：建立採購單
- `GET /api/purchase-orders`：查詢採購單清單
- `GET /api/purchase-orders/{id}`：查詢特定採購單
- `PUT /api/purchase-orders/{id}`：更新採購單
- `DELETE /api/purchase-orders/{id}`：刪除採購單
- `GET /api/purchase-orders/{id}/items`：查詢採購單明細
- `POST /api/purchase-orders/{id}/receive`：收貨採購單
- `PUT /api/purchase-orders/{id}/approve`：審核採購單
- `PUT /api/purchase-orders/{id}/complete`：結案採購單

### 5.4 purchase_order_items
| 欄位                | 型別           | 用途                   | 主鍵/外鍵/唯一/索引 | 備註                         |
|---------------------|----------------|------------------------|---------------------|------------------------------|
| id                  | BIGSERIAL      | 明細ID                 | PK, 唯一            |                              |
| purchase_order_id   | BIGINT         | 採購單ID               | FK(purchase_orders.id)|                            |
| product_id          | BIGINT         | 產品ID                 | FK(products.id)     |                              |
| quantity            | NUMERIC(12,2)  | 採購數量               |                     |                              |
| unit_price          | NUMERIC(12,2)  | 單價                   |                     |                              |
| total_price         | NUMERIC(14,2)  | 小計                   |                     |                              |
| received_quantity   | NUMERIC(12,2)  | 已收貨數量             |                     |                              |
| status              | VARCHAR(16)    | 狀態                   |                     | 草稿/已送出/已收貨/已結案等  |

**主要功能/Function 對應：**
- 採購單明細管理（新增/查詢/收貨/結案）
- 採購流程（收貨時更新明細狀態與收貨數量）
- 庫存異動（收貨時依明細產生入庫異動）
- 採購分析/報表

**API 對應：**
- `POST /api/purchase-order-items`：建立採購單明細
- `GET /api/purchase-order-items`：查詢採購單明細清單
- `GET /api/purchase-order-items/{id}`：查詢特定採購單明細
- `PUT /api/purchase-order-items/{id}`：更新採購單明細
- `DELETE /api/purchase-order-items/{id}`：刪除採購單明細
- `PUT /api/purchase-order-items/{id}/receive`：收貨採購單明細

---

## 6. 銷售管理

### 6.1 sales_orders
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 銷售單ID         | PK, 唯一            |                |
| order_number   | VARCHAR(32)  | 銷售單號         | 唯一, 索引          |                |
| customer_id    | BIGINT       | 客戶ID           | FK(customers.id)    |                |
| business_unit_id| BIGINT      | 業務單位ID       | FK(business_units.id)|               |
| status         | VARCHAR(16)  | 狀態             | 索引                | 草稿/已出貨等  |
| user_id        | BIGINT       | 建立人員ID       | FK(users.id)        |                |
| order_date     | DATE         | 銷售日期         |                     |                |
| total_amount   | NUMERIC(14,2)| 總金額           |                     |                |
| currency_id    | BIGINT       | 幣別ID           | FK(currencies.id)   |                |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 銷售單管理（建立/查詢/結案）
- 銷售流程（下單/出貨/結案）
- 報表/分析（銷售統計）

**API 對應：**
- `POST /api/sales-orders`：建立銷售單
- `GET /api/sales-orders`、`GET /api/sales-orders/{id}`：查詢銷售單清單/明細
- `PUT /api/sales-orders/{id}`：更新銷售單
- `DELETE /api/sales-orders/{id}`：刪除銷售單
- `GET /api/sales-orders/{id}/items`：查詢銷售單明細
- `POST /api/sales-orders/{id}/ship`：出貨銷售單
- `PUT /api/sales-orders/{id}/complete`：結案銷售單

### 6.2 sales_order_items
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 明細ID           | PK, 唯一            |                |
| sales_order_id | BIGINT       | 銷售單ID         | FK(sales_orders.id) |                |
| product_id     | BIGINT       | 產品ID           | FK(products.id)     |                |
| quantity       | NUMERIC(12,2)| 銷售數量         |                     |                |
| unit_price     | NUMERIC(12,2)| 單價             |                     |                |
| total_price    | NUMERIC(14,2)| 小計             |                     |                |
| status         | VARCHAR(16)  | 狀態             |                     | 草稿/已出貨等  |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 銷售單明細管理（新增/查詢/出貨/結案）
- 銷售流程（記錄出貨數量、單價）
- 報表/分析（商品銷售統計）

**API 對應：**
- `POST /api/sales-order-items`：建立銷售單明細
- `GET /api/sales-order-items`、`GET /api/sales-order-items/{id}`：查詢明細清單/明細
- `PUT /api/sales-order-items/{id}`：更新明細
- `DELETE /api/sales-order-items/{id}`：刪除明細

---

## 7. 財務管理

### 7.1 invoices
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 發票ID           | PK, 唯一            |                |
| invoice_number | VARCHAR(32)  | 發票號碼         | 唯一, 索引          |                |
| sales_order_id | BIGINT       | 銷售單ID         | FK(sales_orders.id) |                |
| customer_id    | BIGINT       | 客戶ID           | FK(customers.id)    |                |
| issue_date     | DATE         | 開立日期         |                     |                |
| total_amount   | NUMERIC(14,2)| 發票金額         |                     |                |
| currency_id    | BIGINT       | 幣別ID           | FK(currencies.id)   |                |
| status         | VARCHAR(16)  | 狀態             | 索引                | 已開立/作廢等  |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 發票管理（開立/查詢/作廢）
- 財務結算/對帳
- 報表/分析（發票統計）

**API 對應：**
- `POST /api/invoices`：開立發票
- `GET /api/invoices`、`GET /api/invoices/{id}`：查詢發票清單/明細
- `PUT /api/invoices/{id}`：更新發票
- `DELETE /api/invoices/{id}`：作廢發票

---

## 8. HR（人力資源）

### 8.1 employees
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 員工ID           | PK, 唯一            |                |
| user_id        | BIGINT       | 用戶ID           | FK(users.id)        |                |
| company_id     | BIGINT       | 公司ID           | FK(companies.id)    |                |
| business_unit_id| BIGINT      | 業務單位ID       | FK(business_units.id)|               |
| employee_no    | VARCHAR(32)  | 員工編號         | 唯一, 索引          |                |
| name           | VARCHAR(64)  | 員工姓名         |                     |                |
| position       | VARCHAR(64)  | 職稱             |                     |                |
| hire_date      | DATE         | 到職日           |                     |                |
| status         | VARCHAR(16)  | 狀態             |                     | 在職/離職等    |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 員工管理（新增/查詢/異動）
- 人事資料維護
- 用戶關聯/權限控管

**API 對應：**
- `POST /api/employees`：新增員工
- `GET /api/employees`、`GET /api/employees/{id}`：查詢員工清單/明細
- `PUT /api/employees/{id}`：更新員工
- `DELETE /api/employees/{id}`：刪除員工

---

## 9. BI（商業智慧/報表）

### 9.1 bi_reports
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 報表ID           | PK, 唯一            |                |
| name           | VARCHAR(64)  | 報表名稱         | 唯一, 索引          |                |
| description    | TEXT         | 報表說明         |                     |                |
| config         | JSONB        | 報表設定         |                     | 儀表板/圖表等  |
| owner_user_id  | BIGINT       | 擁有者ID         | FK(users.id)        |                |
| is_public      | BOOLEAN      | 是否公開         |                     |                |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- BI 報表管理（建立/查詢/分享）
- 儀表板/自訂分析

**API 對應：**
- `POST /api/bi-reports`：建立報表
- `GET /api/bi-reports`、`GET /api/bi-reports/{id}`：查詢報表清單/明細
- `PUT /api/bi-reports/{id}`：更新報表
- `DELETE /api/bi-reports/{id}`：刪除報表

---

## 10. IoT 裝置

### 10.1 iot_devices
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 裝置ID           | PK, 唯一            |                |
| device_code    | VARCHAR(64)  | 裝置代碼         | 唯一, 索引          |                |
| name           | VARCHAR(64)  | 裝置名稱         |                     |                |
| type           | VARCHAR(32)  | 裝置類型         |                     | 感測器/閘道等  |
| status         | VARCHAR(16)  | 狀態             |                     | 啟用/停用等    |
| config         | JSONB        | 裝置設定         |                     |                |
| last_active_at | TIMESTAMP    | 最後活躍時間     |                     |                |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- IoT 裝置管理（新增/查詢/設定）
- 裝置資料收集/監控

**API 對應：**
- `POST /api/iot-devices`：新增裝置
- `GET /api/iot-devices`、`GET /api/iot-devices/{id}`：查詢裝置清單/明細
- `PUT /api/iot-devices/{id}`：更新裝置
- `DELETE /api/iot-devices/{id}`：刪除裝置

---

## 11. API/日誌/審計

### 11.1 api_logs
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 日誌ID           | PK, 唯一            |                |
| user_id        | BIGINT       | 用戶ID           | FK(users.id)        |                |
| endpoint       | VARCHAR(128) | API 路徑         | 索引                |                |
| method         | VARCHAR(8)   | HTTP 方法        |                     | GET/POST等     |
| status_code    | INTEGER      | 回應狀態碼       |                     |                |
| request_body   | JSONB        | 請求內容         |                     |                |
| response_body  | JSONB        | 回應內容         |                     |                |
| ip_address     | VARCHAR(64)  | IP位址           |                     |                |
| created_at     | TIMESTAMP    | 請求時間         | 索引                |                |

**主要功能/Function 對應：**
- API 請求/回應日誌查詢
- 稽核/除錯/效能分析

**API 對應：**
- `GET /api/api-logs`：查詢日誌清單
- `GET /api/api-logs/{id}`：查詢特定日誌

### 11.2 audit_logs
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 日誌ID           | PK, 唯一            |                |
| user_id        | BIGINT       | 操作人員ID       | FK(users.id)        |                |
| action         | VARCHAR(64)  | 操作類型         | 索引                | 登入、修改等   |
| resource_type  | VARCHAR(64)  | 資源類型         |                     | 如 product     |
| resource_id    | BIGINT       | 資源ID           |                     |                |
| description    | TEXT         | 操作說明         |                     |                |
| ip_address     | VARCHAR(64)  | IP位址           |                     |                |
| created_at     | TIMESTAMP    | 操作時間         | 索引                |                |

**主要功能/Function 對應：**
- 審計/操作紀錄查詢
- 用戶行為追蹤
- 稽核/安全分析

**API 對應：**
- `GET /api/audit-logs`：查詢日誌清單
- `GET /api/audit-logs/{id}`：查詢特定日誌
- `GET /api/audit-logs/user/{user_id}`：查詢用戶日誌

---

## 12. 區塊鏈

### 12.1 blockchain_tx
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 交易ID           | PK, 唯一            |                |
| tx_hash        | VARCHAR(128) | 區塊鏈交易雜湊   | 唯一, 索引          |                |
| type           | VARCHAR(32)  | 交易類型         |                     |                |
| status         | VARCHAR(16)  | 狀態             |                     | 成功/失敗等    |
| payload        | JSONB        | 交易內容         |                     |                |
| created_at     | TIMESTAMP    | 建立時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 區塊鏈交易紀錄查詢
- 供應鏈溯源/智能合約

**API 對應：**
- `POST /api/blockchain-tx`：新增交易紀錄
- `GET /api/blockchain-tx`、`GET /api/blockchain-tx/{id}`：查詢交易清單/明細

---

## 13. 附件/通知

### 13.1 attachments
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 附件ID           | PK, 唯一            |                |
| file_name      | VARCHAR(128) | 檔案名稱         |                     |                |
| file_path      | VARCHAR(256) | 檔案路徑         |                     |                |
| file_type      | VARCHAR(32)  | 檔案類型         |                     |                |
| file_size      | INTEGER      | 檔案大小(Byte)   |                     |                |
| owner_type     | VARCHAR(32)  | 所屬模組         |                     | 單據/商品等    |
| owner_id       | BIGINT       | 所屬資料ID       |                     |                |
| uploaded_by    | BIGINT       | 上傳人員ID       | FK(users.id)        |                |
| uploaded_at    | TIMESTAMP    | 上傳時間         |                     |                |

**主要功能/Function 對應：**
- 檔案附件管理（上傳/查詢/刪除）
- 單據/商品/用戶等多模組檔案關聯

**API 對應：**
- `POST /api/attachments`：上傳附件
- `GET /api/attachments`、`GET /api/attachments/{id}`：查詢附件清單/明細
- `DELETE /api/attachments/{id}`：刪除附件

### 13.2 notifications
| 欄位           | 型別         | 用途             | 主鍵/外鍵/唯一/索引 | 備註           |
|----------------|--------------|------------------|---------------------|----------------|
| id             | BIGSERIAL    | 通知ID           | PK, 唯一            |                |
| user_id        | BIGINT       | 用戶ID           | FK(users.id)        |                |
| type           | VARCHAR(32)  | 通知類型         |                     | 系統/任務等    |
| title          | VARCHAR(128) | 標題             |                     |                |
| content        | TEXT         | 內容             |                     |                |
| is_read        | BOOLEAN      | 已讀狀態         |                     |                |
| created_at     | TIMESTAMP    | 發送時間         |                     |                |
| updated_at     | TIMESTAMP    | 更新時間         |                     |                |

**主要功能/Function 對應：**
- 系統通知/推播管理
- 任務提醒/訊息中心

**API 對應：**
- `POST /api/notifications`：發送通知
- `GET /api/notifications`、`GET /api/notifications/{id}`：查詢通知清單/明細
- `PUT /api/notifications/{id}`：標記已讀/更新
- `DELETE /api/notifications/{id}`：刪除通知

---

## 14. 幣別

### 14.1 currencies
| 欄位         | 型別         | 用途         | 主鍵/外鍵/唯一/索引 | 備註           |
|--------------|--------------|--------------|---------------------|----------------|
| id           | BIGSERIAL    | 幣別ID       | PK, 唯一            |                |
| code         | VARCHAR(8)   | 幣別代碼     | 唯一, 索引          | 如 TWD, USD    |
| name         | VARCHAR(32)  | 幣別名稱     |                     |                |
| symbol       | VARCHAR(8)   | 幣別符號     |                     | $、¥、€等      |
| precision    | INTEGER      | 小數位數     |                     | 2、4等         |
| is_active    | BOOLEAN      | 啟用狀態     |                     |                |
| created_at   | TIMESTAMP    | 建立時間     |                     |                |
| updated_at   | TIMESTAMP    | 更新時間     |                     |                |

**主要功能/Function 對應：**
- 幣別管理（新增/編輯/查詢）
- 供應商、採購、銷售、財務等多幣別設定
- 報表/分析（依幣別彙總）

**API 對應：**
- `POST /api/currencies`：建立幣別
- `GET /api/currencies`、`GET /api/currencies/{id}`：查詢幣別清單/明細
- `PUT /api/currencies/{id}`：更新幣別
- `DELETE /api/currencies/{id}`：刪除幣別

---

## 尚未建制但有需求的資料表清單（已全部完成）

> 下表所有資料表皆已於本文件詳細建制，無未完成項目。

| 資料表名稱           | 來源/用途簡述                                                                 |
|----------------------|------------------------------------------------------------------------------|
| ~~currencies~~           | 文件多處提及多幣別需求，供應商、採購、銷售、財務等皆需幣別設定               |
| ~~audit_logs~~           | 審計/操作紀錄，追蹤所有異動（如登入、資料異動、審核、刪除等）                |
| ~~stocktaking_orders~~   | 盤點單主檔，支援盤點作業流程                                                  |
| ~~stocktaking_items~~    | 盤點單明細，記錄盤點商品、數量、差異等                                        |
| ~~sales_orders~~         | 銷售單主檔，支援銷售流程                                                      |
| ~~sales_order_items~~    | 銷售單明細，記錄銷售商品、數量、單價等                                        |
| ~~invoices~~             | 發票主檔，支援開立發票、對帳、財務結算                                        |
| ~~employees~~            | HR 員工主檔，支援人事管理、用戶關聯                                           |
| ~~bi_reports~~           | BI 分析報表主檔，支援自訂報表、儀表板                                         |
| ~~iot_devices~~          | IoT 裝置主檔，支援設備管理、資料收集                                          |
| ~~api_logs~~             | API 請求/回應日誌，支援稽核、除錯、效能分析                                   |
| ~~blockchain_tx~~        | 區塊鏈交易紀錄，支援供應鏈溯源、智能合約等                                     |
| ~~notifications~~        | 系統通知主檔，支援訊息推播、任務提醒                                          |
| ~~attachments~~          | 檔案附件主檔，支援單據、商品、用戶等多模組檔案上傳                             |

---

（如需進一步細化銷售、財務、HR、品質、Marketplace、BI、IoT、API、區塊鏈等模組，請告知優先順序） 