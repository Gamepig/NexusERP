# Marketplace DEMO 功能清單

> 目的：提供可展示的市集（Marketplace）最小可視 DEMO，聚焦「可瀏覽、可搜尋/篩選、可查看詳情、供應商註冊流程展示」，不實作交易/支付/後端複雜邏輯。

## 範圍與定位
- **僅 DEMO**：不涉及真實交易、付款、物流，所有寫入操作停用或以提示替代
- **資料來源**：前端 DEMO 假資料與 Laravel `/api/marketplace/*` 輕量 API（可回傳靜態 JSON）
- **頁面導覽**：
  - `/marketplace`（首頁/入口，可導向商品瀏覽）
  - `/marketplace/products`（商品瀏覽與篩選）
  - `/marketplace/products/{id}`（商品詳情）
  - `/marketplace/supplier/register`（供應商註冊多步驟流程 DEMO）

## 主要功能
- **導覽與入口**
  - 市集主入口與導覽列連結
  - 首屏推薦區塊（可用靜態假資料）

- **商品瀏覽（列表）**
  - 類別篩選（使用 `/api/marketplace/categories` 靜態回應）
  - 關鍵字搜尋（前端過濾或簡單查詢參數交由靜態 API 處理）
  - 排序（價格、上架時間：前端排序即可）
  - 商品卡片：縮圖、名稱、價格、標籤（DEMO 標章）

- **商品詳情**
  - 基本資訊：名稱、圖片、價格、規格、描述
  - 行動按鈕：加入購物車/下單按鈕以 DEMO 提示替代（停用真實流程）
  - 相關推薦（可用同類別靜態資料）

- **供應商註冊 DEMO**
  - 多步驟表單視覺展示（步驟切換、欄位）
  - 送出行為改為 DEMO 成功畫面與提示，無資料寫入

- **DEMO 管理與重置**
  - 於 `/demo` 頁面提供「重置 DEMO 假資料（本機）」按鈕（POST `/demo/reset` 僅本機啟用）
  - CLI 範例：`php artisan demo:seed --reset --orders=15 --products=30 --quotes=10 --with-inventory --warehouses=2 --low=20`

## 非目標（本階段不做）
- 訂單實單流程、付款、物流、後台審核
- 真實供應商資料上鏈/驗證、信用評級演算法
- 即時通訊、訊息通知、推薦模型上線

## 既有實作與檔案參考
- **任務與規劃**
  - `tasks/marketplace_demo.md`（DEMO 清單）
  - `documents/marketplace_planning.md`（市集規劃書）
  - `documents/marketplace_development_plan.md`（開發步驟規劃）
  - `documents/安全優先UI先行詳細計劃/未完成項目_比對現況與修復計劃報告.md`（P2.2 DEMO 場景與重置教學）
- **路由與控制器（前端 Laravel）**
  - `frontend/routes/web.php`（`/marketplace` 相關頁面路由）
  - `frontend/routes/api.php`（`/api/marketplace/categories` 靜態回應）
  - `frontend/routes/modules/demo.php`、`frontend/app/Http/Controllers/DemoController.php`（DEMO 線路與重置）
- **前端資產**
  - `frontend/public/js/components/marketplace/ProductBrowser.js`（商品瀏覽邏輯，呼叫 API）
  - 視圖：`frontend/resources/views/marketplace/...`（瀏覽、詳情、註冊等）
- **DEMO 假資料服務**
  - `frontend/app/Services/DemoDataService.php`（inquiry/vip/inventory/finance 假資料；可比照擴充 marketplace 所需）

## 顯示與可近用（UX/無障礙）
- Tailwind 響應式排版、清晰層級、對比符合 WCAG AA
- 清楚的 DEMO 標章與功能限制提示
- 鍵盤可導覽與焦點樣式

## 安全標準（DEMO）
- 所有寫入/敏感行為一律停用或以提示替代
- DEMO 帳號限制沿用現有管理端策略（僅展示）

---

最後更新：{{datetime}}
