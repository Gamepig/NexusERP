# Active Context: NexusERP

**最後更新時間:** {{datetime}}

**當前焦點:**
完成任務列表的結構化拆分。**準備開始執行 Phase 0 的開發任務**，目標是建立本地 Docker 開發環境和核心基礎功能 (認證、授權、核心 Schema)。

**短期目標 (Next 1-2 Sprints / ~2-4 Weeks):**
1.  **完成 Phase 0: 本地基礎建設與環境設定:** (主要依賴 `documents/tasks/00_phase_0.md`)
    *   確保本地開發環境 (Go, Laravel, PG, Redis, Docker) 正常運作。
    *   設定 Git Repository 與分支策略。
    *   定義後端 (Go) 和前端 (Laravel) 專案結構。
    *   設計並實現核心資料庫 Schema (Users, Roles, Permissions, Companies, Business Units)。
    *   完成基礎認證 (註冊、登入) 與授權 (RBAC) 的後端 API 和前端介面。
    *   設定基礎本地設施 (MinIO for S3, Console Logging)。
2.  **啟動 Phase 1: 核心營運與基礎 - 庫存管理:** (主要依賴 `documents/tasks/01_phase_1.md` Task 1.1)
    *   實現 `products`, `warehouses`, `inventory_levels`, `inventory_transactions` 的資料庫 Schema 與遷移。
    *   開發商品 CRUD API 與庫存變動 (入庫、出庫、調整) 的核心業務邏輯與 API。
    *   建立基礎的商品管理和庫存查詢/操作前端 UI。

**關鍵待辦事項 (立即):**
1.  **環境確認:** 再次確認所有本地開發環境元件 (PHP/Composer, Go, Docker, PostgreSQL, Redis) 都已正確安裝並可運行。
2.  **資料庫連線:** 根據 `NexusERP-rules.mdc` 提供的 `.env` 範本，創建 `.env` 文件，並**特別注意**將資料庫設定修改為 PostgreSQL 的連線資訊 (替換掉 MongoDB 的設定)。
3.  **專案初始化:**
    *   初始化 Git Repository (`git init`)。
    *   創建 Go 後端專案目錄結構。
    *   創建 Laravel 前端專案 (`composer create-project laravel/laravel src` 或類似命令，放入 `src` 目錄)。
4.  **資料庫遷移工具:** 選擇並設定 Go 的資料庫遷移工具 (如 GORM 自帶或 `golang-migrate/migrate`)。
5.  **核心 Schema 設計與遷移:** 開始設計 `users`, `roles`, `permissions`, `companies`, `business_units` 的 GORM 模型和對應的初始資料庫遷移檔案。

**需要釐清/決策:**
*   **資料庫隔離機制:** 最終確定使用應用層 `business_unit_id` 過濾還是 RLS 進行數據隔離？(初步推薦應用層過濾)。
*   **認證機制:** 選擇 JWT 還是 Session-based 認證？(初步可能基於 Laravel 預設的 Session)。
*   **資料庫遷移工具選型:** 最終確定使用的 Go 資料庫遷移工具。

**上下文參考文件:**
*   `documents/NexusERP_MajorDevelopmentSteps.md`: 專案主要開發階段路線圖。
*   `documents/tasks/`: 包含各階段詳細任務列表的資料夾。
*   `documents/開發順序.md`: 行業模組的開發優先級。
*   `documents/nexus-erp-docker-deployment-guide-macos.md`: Docker 環境設定指南。
*   `.cursor/rules/nexuserp-rules.mdc`: 包含 `.env` 範本和開發規範。
*   `memory-bank/*`: 其他核心 Memory Bank 文件提供專案背景、產品定義、技術堆疊和系統模式。
*   `documents/reference/*`: 舊的參考文件。 