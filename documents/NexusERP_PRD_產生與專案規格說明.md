# NexusERP PRD 產生與專案規格說明

**文件位置**：/documents/NexusERP_PRD_產生與專案規格說明.md  
**最後更新**：2025-07-15

---

## 一、TaskMasterAI / claude-task-master PRD 產生規範與步驟

### 1. 官方 PRD 產生規則與檔案結構
- PRD（Product Requirements Document, 產品需求文件）是 TaskMasterAI/claude-task-master 產生任務與規劃的唯一依據。
- PRD 檔案建議放置於 `.taskmaster/docs/prd.txt`（新專案）或 `scripts/prd.txt`（舊專案），亦可自訂路徑。
- PRD 檔案需以純文字（txt/markdown）格式撰寫，內容越詳盡越好。
- PRD 內容應包含：
  - 專案目標與背景
  - 功能模組與需求細節
  - 技術架構與規格
  - 參考文件與資料來源
  - 任務分解與優先順序
  - 驗收標準與交付物
- 官方建議：**始終以詳細 PRD 開始，PRD 越完整，AI 產生的任務越精準。**

### 2. PRD 產生與初始化步驟
1. **初始化 TaskMasterAI/claude-task-master**
   - 於專案根目錄執行：
     ```
     npx -y --package=task-master-ai task-master-ai
     ```
   - 或安裝後執行：
     ```
     npm install -g task-master-ai
     task-master init
     ```
2. **建立 PRD 檔案**
   - 新專案：於 `.taskmaster/docs/prd.txt` 撰寫
   - 舊專案：可用 `scripts/prd.txt` 或自訂路徑
   - 參考官方 PRD 範本：`.taskmaster/templates/example_prd.txt`
3. **PRD 內容撰寫**
   - 依據專案實際需求，詳列所有功能、規格、流程、驗收標準
   - 明確引用所有參考文件（見下方範例）
4. **啟動 TaskMasterAI 任務規劃**
   - 於 AI 對話視窗輸入：
     - `Parse my PRD at .taskmaster/docs/prd.txt`
     - `Initialize taskmaster-ai in my project`
   - 產生任務後可用：
     - `Show all tasks`、`Expand task 3`、`Help me implement task 2` 等

### 3. 常用指令與最佳實踐
- `task-master parse-prd <prd.txt>`：解析 PRD 並產生任務
- `task-master list`：列出所有任務
- `task-master next`：顯示下一個建議任務
- `task-master show 1,3,5`：顯示指定任務
- `task-master research "..."`：AI 研究指定主題
- **最佳實踐**：
  - PRD 內容務必詳盡，涵蓋所有需求與規格
  - 明確標註所有參考文件路徑與名稱
  - 每次需求異動，務必同步更新 PRD 與參考文件

---

## 二、NexusERP PRD 產生流程與參考文件

### 1. PRD 產生流程
1. **閱讀並理解所有核心規劃文件**（見下表）
2. **依據下列檔案內容，撰寫專案 PRD**，內容需涵蓋：
   - 專案目標、背景、核心功能
   - 前端/後端/資料庫/API 詳細規格
   - 參考文件明細（名稱與路徑）
   - 任務分解與優先順序
   - 驗收標準
3. **PRD 範例結構**：
   - 1. 專案簡介與目標
   - 2. 功能模組與需求細節
   - 3. 技術架構與規格
   - 4. 參考文件一覽（見下表）
   - 5. 任務分解與開發階段
   - 6. 驗收標準與交付物

### 2. 參考文件明細
| 文件名稱 | 路徑 | 用途說明 |
|----------|------|----------|
| NexusERP_Project_Overview.md | /docs/NexusERP_Project_Overview.md | 專案完整解說、技術架構、核心功能、開發階段、行業支援、操作流程、技術指標 |
| frontend_file_structure_spec.md | /documents/frontend_file_structure_spec.md | 前端檔案結構、Blade/JS/Tailwind 規範、元件設計、協作細節 |
| backend_file_structure_spec.md | /documents/backend_file_structure_spec.md | 後端檔案結構、Golang/Gin API、分層設計、主要功能檔案說明 |
| database_spec.md | /documents/database_spec.md | 資料庫表格設計、欄位、關聯、API 對應、業務邏輯 |
| API_Planning_Document.md | /documents/API_Planning_Document.md | API 設計總則、端點規劃、資料結構、安全、OpenAPI 規範 |
| tasks/00_phase_0_detailed.md ~ 06_phase_6_detailed.md | /documents/tasks/ | 原始開發步驟規劃、各階段任務分解 |
| reference/CS_TW_CN_TERMS.md, CS_TW_CN_TERMS_2.md | /documents/reference/ | 技術名詞、用詞規範、台灣用語對照 |

### 3. 各參考檔案用途與關聯
- **NexusERP_Project_Overview.md**：專案全貌、技術堆疊、核心功能、開發階段、行業支援、操作流程
- **frontend_file_structure_spec.md**：前端檔案結構、Blade/JS/Tailwind 規範、元件設計、協作細節
- **backend_file_structure_spec.md**：後端檔案結構、Golang/Gin API、分層設計、主要功能檔案說明
- **database_spec.md**：資料庫表格設計、欄位、關聯、API 對應、業務邏輯
- **API_Planning_Document.md**：API 設計總則、端點規劃、資料結構、安全、OpenAPI 規範
- **tasks/00_phase_0_detailed.md ~ 06_phase_6_detailed.md**：原始開發步驟規劃、各階段任務分解
- **reference/CS_TW_CN_TERMS.md, CS_TW_CN_TERMS_2.md**：技術名詞、用詞規範、台灣用語對照

---

## 三、如何根據參考檔案撰寫高品質 PRD

1. **明確引用所有參考文件**：於 PRD 開頭列出所有參考文件名稱與路徑，並於需求細節中標註對應來源。
2. **需求細節必須對應規格文件**：每一項功能、API、資料表、前後端元件，皆需對應上述規格文件內容。
3. **技術規格需明確**：前端、後端、資料庫、API 規格需分段詳列，並標註來源檔案。
4. **任務分解需同步原始規劃**：PRD 內任務分解應參考 /documents/tasks/ 內各階段規劃，並依最新規格調整。
5. **用詞統一**：所有技術名詞、用詞需依 /documents/reference/CS_TW_CN_TERMS.md、CS_TW_CN_TERMS_2.md。
6. **每次需求異動，務必同步更新 PRD 與所有參考文件**。

---

## 四、PRD 產生後的任務規劃與同步原則

1. **PRD 解析後，TaskMasterAI 會自動產生任務清單**，每個任務需對應 PRD 內容與參考文件。
2. **任務執行時，需同步檢查 PRD 與規格文件是否一致**，如有異動需同步修正。
3. **每次需求/規格異動，需同步更新 PRD、規格文件、任務規劃**，確保所有人員與 AI 工具皆依最新規格執行。
4. **PRD、規格文件、任務清單三者需保持一致，避免規格落差。**

---

> 本文件為 NexusERP 專案依 claude-task-master 官方規範產生 PRD 與專案規格說明之唯一依據。所有新開發、維護、AI 生成程式碼皆需遵循本規範。若有異動，請同步更新本文件與所有參考文件。 