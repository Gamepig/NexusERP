# CLAUDE CODE 開發規則 - NexusERP Frontend

## 🚨 強制性規則 (MANDATORY RULES)

### 🧠 超級思考調試方法論

#### 1. 系統性調試準則 (Systematic Debugging Protocol)

**核心原則**: 實際測試優於程式碼推測 (Testing over Code Speculation)

當面對系統問題時，**必須**遵循以下調試步驟：

1. **問題識別階段** (Problem Identification)
   ```
   ✅ 必做: 建立具體測試案例，使用非預設值數據
   ✅ 必做: 記錄預期行為 vs 實際行為
   ❌ 禁止: 僅憑程式碼推測問題原因
   ❌ 禁止: 跳過實際功能測試
   ```

2. **數據流追蹤階段** (Data Flow Tracking)
   ```
   追蹤路徑: Frontend → Controller → API → Database → Display
   
   必須驗證每個環節：
   - Frontend: 表單提交的數據格式
   - Controller: 接收和處理的數據
   - API: 發送和接收的JSON
   - Database: 實際儲存的數據
   - Display: 最終顯示給用戶的數據
   ```

3. **斷點識別階段** (Break Point Identification)  
   ```
   系統性檢查：
   - 是輸入問題 (Creation Issue) 還是輸出問題 (Display Issue)?
   - 數據在哪個環節遺失或損壞？
   - 前端期望的數據格式 vs 後端提供的格式是否匹配？
   ```

4. **知識庫記錄階段** (Knowledge Base Documentation)
   ```
   ✅ 必做: 將調試過程和發現記錄到 memory-bank/
   ✅ 必做: 更新 systemPatterns.md 和 techContext.md
   ✅ 必做: 建立 bug 記錄檔案
   ❌ 禁止: 解決問題後不記錄調試方法和發現
   ```

#### 2. Playwright MCP 測試規範

**強制使用 Playwright 進行實際功能驗證**

```javascript
// ✅ 正確的測試方法
test('系統性功能驗證', async ({ page }) => {
    // 1. 使用具體非預設數據
    const testData = {
        customer: 'Tech Solutions Ltd', // 非第一個選項
        status: 'sent',                 // 非預設 draft
        currency: 'USD',                // 非預設 TWD
        date: '2025-08-10'             // 非今天日期
    };
    
    // 2. 監控網路請求和回應
    let apiRequest = null;
    let apiResponse = null;
    
    page.on('request', req => {
        if (req.url().includes('/quotes')) apiRequest = req;
    });
    
    page.on('response', res => {
        if (res.url().includes('/quotes')) apiResponse = res;
    });
    
    // 3. 執行實際操作
    // ... 填寫表單 ...
    await page.click('button[type="submit"]');
    
    // 4. 驗證數據流
    console.log('發送數據:', apiRequest?.postData());
    console.log('接收數據:', await apiResponse?.json());
    
    // 5. 記錄發現
    // 記錄到 memory-bank 知識庫
});
```

```javascript
// ❌ 錯誤的測試方法
test('簡單檢查', async ({ page }) => {
    await page.goto('/quotes');
    // 只檢查頁面是否載入，沒有驗證功能
    await expect(page).toHaveTitle(/Quotes/);
    // 沒有追蹤數據流，無法識別問題根因
});
```

### 📋 TaskMaster 狀態管理規範

#### TaskMaster 狀態更新強制規範
```bash
# ✅ 每完成一個子任務都必須立即更新狀態
task-master set-status --id=<subtask-id> --status=done

# ✅ 記錄實作過程 (建議)
task-master update-subtask --id=<subtask-id> --prompt="實作詳情、遇到的問題、解決方案"
```

**違反此規則的後果:**
- 專案進度追蹤不準確
- 團隊協作出現混亂  
- 任務依賴關係錯誤

#### 任務完成記錄強制規範
**每完成一個主要任務都必須將完成細節記錄於 `tasks/Task-Update.md`**

**完成記錄必要內容:**
- 原始規劃比對
- 實際完成規格  
- 規劃符合度分析
- 相關文件更新
- 後續任務準備
- 完成度評估
- 技術債務與改進建議
- 修復記錄和問題解決詳情

### 🐛 Bug 記錄與知識管理強制規範

**當開發過程發生問題時，需要將問題發生的細節與解決方法記錄到專案知識庫**

#### Bug 記錄規格
- **檔案位置**: `memory-bank/bug_records/bug_<日期>_<簡要描述>.md`
- **知識庫更新**: 手動更新到 `memory-bank/` 目錄中的相關文件

#### Bug 記錄模板
```markdown
# Bug 記錄 - <簡要描述>

## 📅 基本資訊
- **發現日期**: <日期>
- **任務 ID**: <相關任務>
- **嚴重程度**: <低/中/高/緊急>
- **狀態**: <發現/進行中/已解決>

## 🐛 問題描述
詳細描述問題的表現症狀

## 🔄 重現步驟  
1. 步驟一
2. 步驟二
3. ...

## 🔍 根本原因分析
分析問題的真正原因

## 🛠️ 解決方法
詳細記錄解決步驟和修改內容

## 🚫 預防措施
如何避免類似問題再次發生

## 📁 相關檔案
- 檔案路徑：行號
- 相關任務 ID

## 🧠 知識庫更新
記錄是否已加入 memory-bank 知識庫
- [ ] 已建立 bug 記錄檔案
- [ ] 已更新 systemPatterns.md
- [ ] 已更新 techContext.md  
- [ ] 已更新 progress.md
- [ ] 已建立交叉引用
```

## 🚫 禁止行為 (PROHIBITED ACTIONS)

### 1. 程式碼推測調試
```javascript
// ❌ 絕對禁止：僅憑程式碼推測問題
function debugByGuessing() {
    console.log("我覺得可能是這個欄位的問題...");
    // 沒有實際測試，純粹推測
}
```

### 2. 跳過實際功能測試  
```javascript
// ❌ 絕對禁止：只檢查程式碼存在，不驗證功能
test('lazy test', async ({ page }) => {
    await page.goto('/quotes');
    // 只檢查頁面是否載入，沒有測試實際功能
});
```

### 3. 不記錄調試過程
```javascript
// ❌ 絕對禁止：解決問題後不記錄
async function fixBugWithoutDocumentation() {
    // 修復了問題但沒有記錄到 memory-bank
    // 下次遇到相同問題會重複調試
}
```

### 4. 忽略數據流追蹤
```javascript
// ❌ 絕對禁止：不監控數據傳遞過程
test('incomplete test', async ({ page }) => {
    await page.fill('input[name="amount"]', '100');
    await page.click('submit');
    // 沒有檢查發送的數據是什麼
    // 沒有檢查接收的回應是什麼
    // 無法識別問題發生在哪個環節
});
```

## 💡 最佳實踐 (BEST PRACTICES)

### 1. 超級思考調試模式
```javascript
// ✅ 推薦：系統性調試方法
class SuperThinkingDebugger {
    async systematicDebug(problemDescription) {
        // Phase 1: 建立測試案例
        const testCase = this.createSpecificTestCase();
        
        // Phase 2: 追蹤數據流
        const dataFlow = await this.trackDataFlow(testCase);
        
        // Phase 3: 識別斷點
        const breakPoint = this.identifyBreakPoint(dataFlow);
        
        // Phase 4: 記錄發現
        await this.documentFindings(breakPoint);
        
        return breakPoint;
    }
}
```

### 2. MCP 工具善用
```javascript
// ✅ 推薦：充分利用現有 MCP 工具
// 使用 Playwright MCP 進行自動化測試
// 使用 Task Master MCP 管理任務進度
// 使用 Serena MCP 管理知識庫
```

### 3. 證據驅動分析
```javascript
// ✅ 推薦：基於實際證據的分析
test('evidence-based analysis', async ({ page }) => {
    // 收集證據
    const evidence = {
        userInput: testData,
        networkRequests: [],
        networkResponses: [],
        displayedData: {},
        databaseState: {}
    };
    
    // 基於證據得出結論
    const conclusion = this.analyzeEvidence(evidence);
    
    // 記錄證據和結論
    await this.recordToKnowledgeBase(evidence, conclusion);
});
```

## 🔧 工具使用規範

### Playwright MCP 使用準則
1. **必須**為每個重要功能建立端到端測試
2. **必須**使用非預設值進行測試
3. **必須**監控網路請求和回應
4. **必須**截圖記錄測試過程
5. **必須**記錄測試發現

### TaskMaster MCP 使用準則
1. **必須**即時更新任務狀態
2. **必須**記錄實作細節到子任務
3. **必須**更新完成記錄到 Task-Update.md
4. **必須**標記任務依賴關係

### Serena MCP 使用準則  
1. **必須**將 bug 記錄儲存到 memory-bank
2. **必須**更新系統模式文件
3. **必須**建立交叉引用和知識連結
4. **必須**定期整理和歸納知識

## 🏗️ 程式碼品質標準

### 錯誤預防準則
1. **屬性檢查**: 檢查所有物件屬性是否真實存在
2. **方法驗證**: 驗證所有方法調用和變數引用是否正確
3. **路徑驗證**: 確認路徑計算和檔案操作的邏輯無誤
4. **分支測試**: 測試所有分支條件和例外處理
5. **結構理解**: 修改現有程式碼前，先了解現有的類別結構和屬性定義

### CSS 類別管理規範
```css
/* ✅ 正確：命名一致性檢查 */
.nexus-user-avatar {
    /* 確保 HTML 中使用相同類別名稱 */
}

/* ❌ 錯誤：定義與使用不匹配 */
.nexus-user-avatar-modern {
    /* HTML 中使用 .nexus-user-avatar 會找不到 */
}
```

### 資源編譯流程
```bash
# ✅ 標準資源更新流程 (必須按順序執行)
npm run build                 # Vite 編譯 CSS/JS 資源
php artisan view:clear       # 清除 Blade 模板快取
php artisan config:clear     # 清除應用配置快取  
php artisan cache:clear      # 清除應用快取
```

## 📊 調試成效評估

### 成功調試的標準
- [x] 問題根因明確識別
- [x] 解決方案有具體證據支持
- [x] 修復效果可重複驗證
- [x] 調試過程完整記錄
- [x] 預防措施已建立

### 失敗調試的特徵
- [ ] 僅憑猜測修改程式碼
- [ ] 沒有實際功能測試
- [ ] 解決方案缺乏證據
- [ ] 沒有記錄調試過程
- [ ] 無法預防問題重現

## 🎯 調試目標

**終極目標**: 建立可重複、可驗證、可記錄的系統性調試方法，避免重複犯錯，提升開發效率和程式碼品質。

**成功指標**:
1. 每個 bug 都有完整的調試記錄
2. 解決方案都有實際測試驗證
3. 知識庫持續累積和更新
4. 團隊開發效率持續提升
5. 相同問題不會重複發生

---

**⚠️ 重要提醒**: 這些規則是強制性的，違反將導致程式碼品質問題、專案進度延遲、重複犯錯等嚴重後果。每次開發時都必須嚴格遵循。

---

*最後更新: 2025-08-07*  
*版本: v1.0.0*