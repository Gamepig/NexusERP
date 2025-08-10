### GitHub 排除清單（不適合/不需要上傳）

- `/.env` — 含環境變數與金鑰（機密資訊）
- `/node_modules/` — 依賴套件（可由 lock 檔重建）
- `/playwright_env/` — 測試用 Python 虛擬環境（本機環境產物）
- `/logs/` — 本機執行日誌（可能含敏感資訊）

後端（Go）
- `/backend/build/nexus-erp` — 編譯產物（可重建）
- `/backend/bin/` — 可執行檔/編譯產物（可重建）
- `/backend/main` — 可執行檔（可重建）
- `/backend/nexus-erp` — 可執行檔（可重建）
- `/backend/nexus-erp-backend` — 可執行檔（可重建）
- `/backend/tmp/` — 臨時檔/執行產物（不需版控）
- `/backend/backend.log` — 後端日誌（可能含敏感資訊）
- `/backend/server.log` — 後端日誌（可能含敏感資訊）
- `/backend/migrations_backup/` — 舊遷移備份（避免混淆正式遷移）
- `/backend/test_customer_integration` — 臨時測試資源（不需版控）

前端（Laravel）
- `/frontend/bootstrap/cache/` — Laravel 快取（可重建）
- `/frontend/storage/framework/` — Laravel 快取/Session/Views（可能含敏感資訊，可重建）
- `/frontend/storage/app/private/` — 私有檔案（如 `demo/*.json`，可能含敏感或環境相依資料）
- `/frontend/storage/app/public/` — 公開儲存連結檔（可重建）
- `/frontend/storage/logs/` — Laravel 日誌（可能含敏感資訊）
- `/frontend/storage/logs/laravel.log` — 大型日誌（可能含敏感資訊）
- `/frontend/storage/logs/audit/` — 審計輸出（可能含敏感營運資料）
- `/frontend/playwright-report/` — 測試報告產物（webm/zip/png，大檔）
- `/frontend/frontend/test-results/` — 測試截圖與結果（大檔，不需版控）
- `/frontend/resources/views/*/*.backup` — 視圖備份檔（歷史備份，不需版控）
- `/frontend/routes/web.php.backup` — 路由備份檔（歷史備份，不需版控）
- `/frontend/public/dashboard-test.html` — 本機測試頁（不需版控）
- `/frontend/public/dropdown-diagnosis.html` — 本機測試頁（不需版控）

測試報告/截圖（全域）
- `/playwright-report/` — 自動化測試報告（webm/zip/png，大檔）
- `/tests/screenshots/` — 測試截圖（大檔，不需版控）
- `/test-results/` — 測試截圖與結果（大檔，不需版控）

偵錯/暫存/備份資料
- `/debug/` — 偵錯腳本、報告與大量截圖（不需版控，可能含敏感資訊）
- `/screenshots/` — 偵錯/展示用截圖（大檔，不需版控）
- `/style/CleanShot*.png` — 螢幕截圖（大檔，不需版控）
- `/archive/` — 歷史備份、暫存與重複資源（避免與現行檔混淆）
- `/archive/tools/composer.phar` — 可執行工具檔（由官方來源取得即可）
- `/backend_binary` — 二進位產物（可重建）

文件中含機密或不宜公開內容
- `/documents/AI_Guided_Registration_Flow.md` — 內含 OpenRouter API Key（機密資訊，請移除或改以環境變數管理）
- `/documents/memory.json` — 暫存/占位檔（空檔，不需版控）
- `/project_info/URL.txt` — 本機/環境連線資訊（不宜公開）

## **🔍 2025-08-10 檢視結果與補充項目**

### **❌ 實際發現需要排除的檔案**

**大型編譯產物（總計約175MB）**
- `/backend/main` — 35MB Go 編譯產物（可重建）
- `/backend/nexus-erp` — 35MB Go 編譯產物（可重建）
- `/backend/nexus-erp-backend` — 35MB Go 編譯產物（可重建）
- `/backend/bin/nexus-erp` — 35MB Go 編譯產物（可重建）
- `/backend/build/nexus-erp` — 29MB Go 編譯產物（可重建）
- `/backend/tmp/` — 臨時編譯檔（不需版控）

**大型日誌檔案**
- `/frontend/storage/logs/laravel.log` — 9.0MB Laravel 日誌（可能含敏感資訊）
- `/backend/server.log` — 24KB 後端日誌（可能含敏感資訊）
- `/backend/backend.log` — 24KB 後端日誌（可能含敏感資訊）

**大量測試截圖（601個檔案，約15MB）**
- `/tests/e2e/frontend/screenshots/` — 15MB 測試截圖目錄（大檔，不需版控）
- `/frontend/*.png` — 前端根目錄測試截圖（大檔，不需版控）
- `/frontend/*.jpg` — 前端根目錄測試截圖（大檔，不需版控）
- `/frontend/*.webm` — 前端根目錄測試影片（大檔，不需版控）

**機密與 Session 檔案**
- `/frontend/cookies.txt` — 瀏覽器 cookies（機密資訊）
- `/frontend/cookie.jar` — 瀏覽器 cookies（機密資訊）
- `/frontend/cookie_jar` — 瀏覽器 cookies（機密資訊）

**快取與備份檔案**
- `.phpunit.result.cache` — PHPUnit 測試快取（可重建）
- `*.backup` — 備份檔案（歷史備份，不需版控）
- `/playwright_env/` — Python 虛擬環境（本機環境產物）

### **📊 檔案大小統計**
- **node_modules**: 164MB（前端）+ 12MB（根目錄）
- **測試截圖**: 15MB（601個檔案）
- **編譯產物**: 175MB（5個大型執行檔）
- **日誌檔案**: 9MB（Laravel）+ 48KB（後端）

### **🎯 優先處理建議**
1. **立即排除**: 大型編譯產物（175MB）
2. **安全風險**: 機密檔案（cookies, session）
3. **空間優化**: 測試截圖改存雲端儲存
4. **日誌管理**: 設定日誌輪轉，避免檔案過大

備註
- 建議上述路徑加入 `.gitignore`，並將金鑰/密碼一律改用環境變數或 Secret Manager 管理。
- 若需保留測試證據，請改以壓縮檔上傳至雲端（例如發佈頁或物件儲存），避免將大型二進位與截圖長期留在 repo。
- **重要**: 現有大型檔案需要從 Git 歷史中移除，使用 `git filter-branch` 或 `git-filter-repo` 工具。

