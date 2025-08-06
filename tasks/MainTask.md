# NexusERP 主要開發大項目總覽

| 勾選 | 大項目名稱                | 狀態     | 進度   | 中項目連結                | 備註/PRD/規格來源                |
|------|---------------------------|----------|--------|---------------------------|----------------------------------|
| [ ]  | AI 引導式註冊/Onboarding  | 最高優先 | 0%     |                           | NexusERP_Planning_Document.md Phase 0 |
| [ ]  | 前端架構                  | 進行中   | 0%     | [frontend_core.md](frontend_core.md) | frontend_file_structure_spec.md  |
| [ ]  | 後端 API                  | 進行中   | 0%     | [backend_api.md](backend_api.md)     | backend_file_structure_spec.md, API_Planning_Document.md |
| [ ]  | 資料庫設計                | 進行中   | 0%     | [database_core.md](database_core.md) | database_spec.md                |
| [ ]  | 業務功能模組              | 進行中   | 0%     | [business_modules.md](business_modules.md) | PRD/各規格文件                  |
| [ ]  | 基本資料流/整合           | 進行中   | 0%     | [integration_flow.md](integration_flow.md) | 各規格文件                      |
| [ ]  | AI 模組（DEMO）           | DEMO     | 0%     | [ai_demo.md](ai_demo.md)             | NexusERP_AI_Features_Detailed_Planning.md |
| [ ]  | Marketplace（DEMO）       | DEMO     | 0%     | [marketplace_demo.md](marketplace_demo.md) | NexusERP_Planning_Document.md   |

> 除 AI/Marketplace 僅需 DEMO 以外，其他所有功能必須實際可運作，支援真實資料流與完整業務流程。 

---

## OAuth/帳號設定細化進度紀錄（2025-07-17）

### 已完成
1. 資料庫 schema 補充：user_oauth_accounts 表設計、ER 圖、唯一索引、API 對應
2. backend_api.md：OAuth 綁定/查詢/解除 API 規格、mock、流程圖
3. frontend_core.md：帳號設定頁 wireframe、元件結構、交互流程、UI/UX 細節（依 style/）
4. React/Vue/HTML/PHP+JS 元件範例、互動流程、UI 畫面細化（PHP+JS 實作為主）
5. Go 後端 API 測試範例（單元/整合）、API 路由設計

### 待辦/後續細化步驟
1. Go 後端
   - 完成 OAuth API handler 實作（link/unlink/list）
   - 增加單元/整合測試覆蓋異常/權限/邊界
   - OAuth 授權流程與第三方平台串接（Google/LINE）
2. 前端 PHP/JS
   - 帳號設定頁 UI 實作（nx-card、nx-btn、nx-badge 樣式）
   - OAuth 綁定流程（跳轉/彈窗、授權 callback 處理）
   - AJAX/Fetch API 對接後端，錯誤/成功提示
   - 響應式設計與無障礙優化
3. E2E/自動化測試
   - 前端端到端測試腳本（如 Playwright/Cypress，或 JS 測試）
   - 測試 OAuth 綁定/解除/異常流程
4. 文件同步
   - 完善用戶手冊/開發文件，補充 OAuth 綁定教學、API 說明
   - Mermaid 流程圖/ER 圖同步更新
5. 其他模組
   - 依主線規劃，逐步細化 HR、BI、IoT 等模組的前後端/資料庫/測試

--- 