# NexusERP 專案 - 主要開發步驟 (階段)

**版本:** 1.3
**最後更新時間:** {{datetime}}
**來源文件:** `documents/NexusERP_Planning_Document.md` (參考 5.3 節)

本文件概述了 NexusERP 專案的主要開發階段及其核心目標，提供一個宏觀的開發路線圖。各階段的詳細子任務請參考 `documents/tasks/` 目錄下對應的檔案。

## 主要開發階段

1.  **Phase 0: 本地基礎建設與 Docker 開發環境 (Local Infrastructure & Docker Dev Environment)**
    *   核心目標：建立**基於 Docker** 的穩定本地開發環境，設定版本控制，定義專案結構，完成核心資料庫模型（用戶、權限、公司、業務單位），實現基礎的身份驗證與授權機制，並配置必要的本地工具（如 MinIO）。
    *   **新增：AI 引導式註冊/Onboarding（最高優先）**
        *   實作 Google/LINE OAuth 註冊，註冊後自動進入 AI 導引式註冊頁。
        *   用戶以自然語言描述經營內容，AI NLP 分析自動分類行業、業務單位，YAML 格式回覆。
        *   用戶互動補全缺漏資料，最終結構化存入資料庫。
        *   前端註冊頁整合 AI 對話 UI，後端新增 AI 註冊 API，串接 LLM。
        *   測試：E2E 驗證註冊流程、AI 分類正確性、互動體驗。
    *   **詳細任務列表:** [documents/tasks/00_phase_0.md](tasks/00_phase_0.md)
    *   **主要任務:**
        *   Task 0.1: 建立 Docker 化開發環境
        *   Task 0.2: 專案架構
        *   Task 0.3: 資料庫設計
        *   Task 0.4: 認證與授權
        *   Task 0.5: 本地基礎設施 (如 MinIO)
        *   Task 0.6: 版本控制與 CI/CD (Git/GitHub & CI/CD)
            *   初始化 Git 儲存庫，設定 `.gitignore`。
            *   建立 GitHub 儲存庫並推送初始程式碼。
            *   定義分支策略 (例如 Gitflow)。
            *   設定基礎 GitHub Actions CI 流程 (例如：程式碼風格檢查、單元測試、Docker 映像檔建置)。

2.  **Phase 1: 核心營運與基礎 (Core Operations & Foundation)**
    *   核心目標：開發核心的庫存、採購、基礎製造/營運管理功能，實現初步的財務管理（應付帳款）、多點管理基礎，建立 Marketplace 的基本框架（會員/供應商），整合基礎 OCR 功能（進貨單/發票），並提供基本的匯出、語音、圖表功能。
    *   **延伸：AI 註冊流程與 Onboarding 持續優化**
        *   持續優化 AI 註冊互動體驗，根據用戶回饋調整 NLP 問答、資料結構、UI 流程。
        *   與會員中心、業務單位管理等模組串接，確保資料一致性。
    *   **詳細任務列表:** [documents/tasks/01_phase_1.md](tasks/01_phase_1.md)
    *   **主要任務:**
        *   Task 1.1: 庫存管理
        *   Task 1.2: 採購管理
        *   Task 1.3: 製造與營運
        *   Task 1.4: 生產計畫
        *   Task 1.5: 自動化品質管理
        *   Task 1.6: 財務管理 (基礎)
        *   Task 1.7: 分店管理 (基礎)
        *   Task 1.8: Marketplace 與供應鏈串連 (基礎)
        *   Task 1.9: 圖片辨識管理 (採購)
        *   Task 1.10: 基礎功能

3.  **Phase 2: 核心銷售與財務擴展 (Core Sales & Finance Expansion)**
    *   核心目標：開發核心銷售流程（報價、訂單、出貨），擴展財務管理（應收帳款、基本總帳），深化庫存管理（批號/序號追蹤、庫存轉移），建立基礎 CRM（客戶、聯絡人、活動），擴展 Marketplace（商品列表、訂單），並完善基礎報表與儀表板。
    *   **詳細任務列表:** [documents/tasks/02_phase_2.md](tasks/02_phase_2.md)
    *   **主要任務:**
        *   Task 2.1: 銷售管理
        *   Task 2.2: 進階庫存管理
        *   Task 2.3: 財務管理擴展
        *   Task 2.4: 人力資源管理 (基礎)
        *   Task 2.5: Marketplace 擴展
        *   Task 2.6: 報表與儀表板 (基礎)
        *   Task 2.7: 客戶關係管理 (基礎)

4.  **Phase 3: 進階製造、供應鏈與智能分析 (Advanced Manufacturing, SCM & Analytics)**
    *   核心目標：深化製造與營運管理（MRP、產能規劃、排程），擴展品質管理，完善 HRM（薪資、休假），強化 CRM（銷售管道、機會），擴展 Marketplace（賣家入駐、評價、支付），建立供應鏈協同（供應商門戶、詢價），引入進階 BI 分析，並增強 OCR 能力。
    *   **詳細任務列表:** [documents/tasks/03_phase_3.md](tasks/03_phase_3.md)
    *   **主要任務:**
        *   Task 3.1: 進階製造與營運
        *   Task 3.2: 進階品質管理
        *   Task 3.3: 人力資源管理擴展
        *   Task 3.4: 客戶關係管理擴展
        *   Task 3.5: Marketplace 擴展 (營運)
        *   Task 3.6: 供應鏈協同擴展
        *   Task 3.7: BI 與分析
        *   Task 3.8: 進階圖片辨識管理

5.  **Phase 4: AI 整合、進階分析與平台強化 (AI Integration, Advanced Analytics & Platform Enhancement)**
    *   核心目標：整合 AI 功能（RAG/CAG、智慧預測、自動化建議），實現更進階的 BI 與數據分析，強化分店管理與協同，完善財務管理（預算、成本核算），擴展供應鏈金融，並提升平台效能與安全性。
    *   **詳細任務列表:** [documents/tasks/04_phase_4.md](tasks/04_phase_4.md)
    *   **主要任務:**
        *   Task 4.1: AI 功能整合
        *   Task 4.2: 進階 BI 與數據分析
        *   Task 4.3: 分店管理強化
        *   Task 4.4: 財務管理深化
        *   Task 4.5: 供應鏈金融 (基礎)
        *   Task 4.6: 平台效能與安全性強化

6.  **Phase 5: 生態系擴展與外部整合 (Ecosystem Expansion & External Integration)**
    *   核心目標：擴展 NexusERP 生態系，整合第三方服務（會計軟體、物流平台、電商平台），開發 API 供外部夥伴使用，探索 IoT 整合，並持續優化與完善現有功能。
    *   **詳細任務列表:** [documents/tasks/05_phase_5.md](tasks/05_phase_5.md)
    *   **主要任務:**
        *   Task 5.1: 第三方服務整合
        *   Task 5.2: 開放 API 平台
        *   Task 5.3: 物聯網整合探索
        *   Task 5.4: 持續優化與完善
        *   Task 5.5: 部署與監控 (生產)

7.  **Phase 6: 行動化、進階 AI 與未來展望 (Mobilization, Advanced AI & Future Outlook)**
    *   核心目標：提供行動裝置存取能力 (Mobile Access)，探索更進階的 AI 應用（流程自動化、預測性維護），增強系統的可客製化性與擴展性，並為未來的技術演進和市場需求做好準備。
    *   **詳細任務列表:** [documents/tasks/06_phase_6.md](tasks/06_phase_6.md)
    *   **主要任務:**
        *   Task 6.1: 行動應用開發
        *   Task 6.2: 進階 AI 應用探索
        *   Task 6.3: 系統客製化與擴展性
        *   Task 6.4: 未來技術演進準備
        *   Task 6.5: 最終測試、文檔與交接 