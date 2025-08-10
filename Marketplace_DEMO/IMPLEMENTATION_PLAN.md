# Marketplace DEMO 詳細開發步驟

> 進度更新：2025-08-09
> - 完成商品列表/詳情/推薦、供應商註冊（DEMO 流程）、Dashboard Marketplace Banner
> - 完成 `/api/marketplace/products`、`/api/marketplace/products/{id}`、`/api/marketplace/products/suggestions`（大量資料＋picsum 圖片，避免破圖）
> - 前端 `ProductBrowser.js` 對齊 API、分頁容錯、圖片 fallback、詳情模態含「猜你喜歡」

> 開發原則：以最小可視 DEMO 為目標，優先 UI 展示與穩定導覽，不改動既有後端核心流程。

## 0) 參考基線（現有資源）
- 路由：`frontend/routes/web.php`（`/marketplace` 群組）、`frontend/routes/api.php`（`/api/marketplace/categories`）
- DEMO 線路：`frontend/routes/modules/demo.php`、`frontend/app/Http/Controllers/DemoController.php`、`frontend/app/Services/DemoDataService.php`
- 視圖：`frontend/resources/views/marketplace/...`、`frontend/resources/views/demo/...`
- 前端：`frontend/public/js/components/marketplace/ProductBrowser.js`
- 任務/文件：`tasks/marketplace_demo.md`、`documents/marketplace_planning.md`、`documents/marketplace_development_plan.md`

## 1) 頁面骨架確認與修補
- 檢查並補齊以下頁面（缺則建立最小骨架視圖）：
  - [x] `/marketplace` 入口（可直接導向 `/marketplace/products`）
  - [x] `/marketplace/products` 商品列表（含篩選列、搜尋框、排序控制）
  - [x] `/marketplace/products/{id}` 商品詳情（基本資訊 + DEMO 提示按鈕）
  - [x] `/marketplace/supplier/register` 供應商註冊（多步驟展示、送出跳成功頁）
  - [x] `/marketplace/supplier/register/success` 成功頁
  - [x] `/marketplace/suppliers/{id}` 商家首頁（商家資料 + 所有商品列表）

## 2) DEMO API（靜態 JSON）
- 既有：`/api/marketplace/categories`（`frontend/routes/api.php`）
- 新增（靜態回應即可）：
  - [x] `GET /api/marketplace/products`：回傳分頁/篩選後的大量靜態清單（80 筆，picsum 圖片）
  - [x] `GET /api/marketplace/products/{id}`：回傳單一商品詳情（與列表 seed 一致）
  - [x] （可選）`GET /api/marketplace/products/suggestions`：同類別推薦（picsum 圖片、隨機取 4 筆）
- 回應格式：提供 `data/total/per_page/current_page/last_page`，前端已兼容（亦可擴充 meta）

## 3) 前端元件接線與行為
- [x] 檢查 `frontend/public/js/components/marketplace/ProductBrowser.js` 的 `apiBaseUrl` 並對齊上述 API
- 商品列表：
  - [x] 請求 `/api/marketplace/categories`、`/api/marketplace/products`
  - [x] 前端狀態含：關鍵字、類別、多選篩選、排序、分頁（含分頁容錯）
- 商品詳情：
  - [x] 請求 `/api/marketplace/products/{id}`
  - [x] 「加入購物車/下單」改為顯示 DEMO 提示（不做後續流程）
  - [x] 詳情模態加入「猜你喜歡」清單

## 4) DEMO 假資料擴充
- [x] 方案 A（簡易）：在 API 路由檔中大量生成並回傳（含穩定圖片來源 picsum）
- 方案 B（較佳）：比照 `DemoDataService` 新增 `marketplace/products.json`、`marketplace/categories.json` 等檔案，由服務統一讀取與回傳
  - [x] 在 `DemoDataService` 中新增 `sampleMarketplaceProducts()`、`sampleMarketplaceCategories()` 並於 `ensureDemoData()/reset()` 內掛載
  - [x] 新增 Artisan 指令 `php artisan marketplace:seed [--reset] [--count=80]`
  - [ ] 於 `/demo` 頁面保留「重置 DEMO 假資料（本機）」功能

## 5) 視覺與可近用
- [x] Tailwind 響應式：列表用網格、手機改單欄
- [x] 卡片與按鈕加上 `hover:`、`focus:` 狀態
- [x] 明確顯示「DEMO」徽章與限制提示（列表/詳情/供應商註冊）
- [x] 鍵盤可達性：主要互動 Tab 操作、Enter/Space 觸發、ESC 關閉模態、焦點還原
  - 備註：已在 Dashboard 加入 Marketplace Banner（CTA）

## 6) 安全與限制
- [x] 停用寫入操作（供應商註冊送出導向成功頁；詢價/下單按鈕改 DEMO 提示）
- [ ] 沿用 DEMO 帳號限制（管理端既有規則）
- [ ] `app()->environment('local')` 下才開放 `/demo/reset`

## 7) 驗收清單（最小）
- [x] `/marketplace/products` 可正常顯示 20 筆以上商品，篩選/搜尋/排序生效
- [x] `/marketplace/products/{id}` 詳情正常，行動按鈕顯示 DEMO 提示
- [x] `/marketplace/supplier/register` 可切換步驟並導向成功頁
- [x] `/api/marketplace/categories`、`/api/marketplace/products`、`/api/marketplace/products/{id}`、`/api/marketplace/products/suggestions` 皆能成功回應

## 8) 後續可選強化（不在本次 DEMO 範圍）
- [x] 最近瀏覽 UI 塊（列表頁）
- [x] 猜你喜歡（已於詳情模態完成）
- [ ] 導入快取層（Redis）與更大測試資料集
- [ ] 打通真實訂單/付款/物流流程

---

### 執行指引（本機）
```bash
# 啟動後端（Go）
cd backend && go run cmd/main.go

# 啟動前端（Laravel）
cd frontend && php artisan serve

# （選用）載入/重置 DEMO 資料
php artisan demo:seed --reset --orders=15 --products=30 --quotes=10 --with-inventory --warehouses=2 --low=20
```

### 相關檔案參考
- 路由：`frontend/routes/web.php`、`frontend/routes/api.php`、`frontend/routes/modules/demo.php`
- 控制器/服務：`frontend/app/Http/Controllers/DemoController.php`、`frontend/app/Services/DemoDataService.php`
- 視圖：`frontend/resources/views/marketplace/*`、`frontend/resources/views/demo/*`
- 任務/說明：`tasks/marketplace_demo.md`、`documents/marketplace_planning.md`、`documents/marketplace_development_plan.md`
