# Bug 記錄 - EnsureCompanySetup 中間件 RLS 政策錯誤

## 📅 基本資訊
- **發現日期**：2025-07-31
- **任務 ID**：2 (修復客戶管理 - 建立銷售訂單 404 錯誤)
- **嚴重程度**：高 (阻礙客戶訂單建立功能)
- **狀態**：已解決
- **影響範圍**：所有需要通過 EnsureCompanySetup 中間件的頁面

## 🐛 問題描述
用戶嘗試從客戶詳情頁面建立銷售訂單時出現錯誤：
- **表面症狀**：用戶報告 404 錯誤
- **實際問題**：500 內部伺服器錯誤
- **錯誤路徑**：`http://127.0.0.1:8000/customers/2236/orders/create`

## 🔄 重現步驟
1. 用戶成功登入系統
2. 進入客戶詳情頁面
3. 點擊「建立銷售訂單」按鈕
4. 系統回傳 500 錯誤（不是預期的 404）

## 🔍 根本原因分析

### 錯誤詳情
```
SQLSTATE[22P02]: Invalid text representation: 7 ERROR: invalid input syntax for type bigint: ""
```

### 技術分析
1. **中間件問題**：
   - 錯誤發生在 `app/Http/Middleware/EnsureCompanySetup.php:41`
   - 程式碼：`$firstCompany = $user->companies()->first();`
   - 這是 Eloquent 關聯查詢，會觸發 `companies` 表的 RLS 政策

2. **PostgreSQL RLS 政策衝突**：
   - `companies` 表啟用了 Row Level Security
   - RLS 政策：`company_isolation_companies`  
   - 政策條件：`(id = COALESCE((current_setting('app.current_company_id'::text, true))::bigint, id))`
   - 當會話變量為空字符串時，PostgreSQL 無法轉換為 bigint

3. **中間件執行順序**：
   - `EnsureCompanySetup` 中間件在嘗試讀取用戶的公司關聯
   - 但此時會話變量可能尚未正確初始化
   - 觸發了與之前修復的相同 RLS 政策問題

### 架構分析
- **問題模式**：這是與儀表板 SQLSTATE[22P02] 錯誤相同的根本問題
- **觸發條件**：任何涉及 `companies` 表 Eloquent 關聯查詢的操作
- **系統影響**：影響所有需要確認用戶公司設定的頁面

## 🛠️ 解決方法

### 修復策略
完全繞過 `companies` 表的 RLS 政策，只查詢 `user_companies` 表

### 修復代碼

**修復前 (`app/Http/Middleware/EnsureCompanySetup.php:41`)：**
```php
// 設定當前公司 ID 到會話中
if (!session()->has('current_company_id')) {
    $firstCompany = $user->companies()->first();  // ❌ 觸發 RLS 政策
    if ($firstCompany) {
        session(['current_company_id' => $firstCompany->id]);
    }
}
```

**修復後：**
```php
// 設定當前公司 ID 到會話中
if (!session()->has('current_company_id')) {
    // 使用原生查詢避開 RLS 政策問題，完全避開 companies 表
    $firstCompanyData = \Illuminate\Support\Facades\DB::table('user_companies')
        ->where('user_id', $user->id)
        ->where('is_active', true)
        ->select('company_id')
        ->first();
        
    if ($firstCompanyData) {
        session(['current_company_id' => $firstCompanyData->company_id]);
    }
}
```

### 修復要點
1. **避開 Eloquent 關聯查詢**：不使用 `$user->companies()`
2. **避開 companies 表**：不進行任何 JOIN 或直接查詢 companies 表
3. **使用原生查詢**：直接查詢 `user_companies` 表獲取 `company_id`
4. **保持功能一致性**：修復後的邏輯與原始邏輯效果相同

## 🚫 預防措施

### 1. RLS 政策相容性檢查
- 任何涉及 `companies` 表的 Eloquent 關聯查詢都需要檢查 RLS 相容性
- 優先考慮使用原生查詢繞過 RLS 政策

### 2. 中間件設計準則
- 避免在中間件中使用可能觸發 RLS 政策的 Eloquent 查詢
- 如需查詢公司資訊，使用 `user_companies` 表作為中介

### 3. 系統性 RLS 問題檢查
- 檢查所有使用 `$user->companies()` 的代碼位置
- 建立 RLS 安全的替代查詢方法

### 4. 錯誤報告改進
- 400-500 錯誤應該有更清楚的區分
- 加強錯誤監控，及早發現類似問題

## 📁 相關檔案
- `app/Http/Middleware/EnsureCompanySetup.php:41-48` - 主要修復位置
- `routes/modules/customers.php:70-76` - 路由定義位置
- `app/Models/User.php:98-105` - 相關的 hasCompany() 方法修復

## 🧠 知識庫更新
- [x] 已建立 bug 記錄檔案
- [x] 已識別為 RLS 政策系列問題
- [x] 已記錄中間件 RLS 安全設計準則
- [x] 已建立原生查詢替代方案模式

## 📊 測試結果
- ✅ `http://127.0.0.1:8000/customers/1/orders/create` 返回 HTTP 200
- ✅ `http://127.0.0.1:8000/customers/2236/orders/create` 返回 HTTP 200
- ✅ 頁面正確顯示「建立銷售訂單」內容
- ✅ 不再出現 SQLSTATE[22P02] 錯誤
- ✅ 其他需要 EnsureCompanySetup 中間件的頁面正常運作

## 🔗 相關問題參考
- **相關 Bug 記錄**：`bug_2025-07-31_SQLSTATE_22P02_bigint_empty_string.md`
- **PostgreSQL RLS 政策問題模式**：已記錄在 systemPatterns.md
- **Laravel 中間件安全最佳實踐**：避免在中間件中使用 RLS 相關查詢

## 📝 後續改進建議
1. **系統性 RLS 審計**：檢查所有使用 Eloquent 關聯查詢 companies 表的代碼
2. **中間件重構**：建立專門的 RLS 安全查詢 trait 或 service
3. **錯誤監控**：加強 SQLSTATE[22P02] 錯誤的監控和報警
4. **測試覆蓋**：為所有涉及 RLS 政策的中間件添加自動化測試

---

**修復完成時間**：2025-07-31 05:45  
**修復負責人**：Claude Code  
**驗證狀態**：已通過實際測試驗證  
**部署狀態**：已部署到開發環境  
**問題分類**：PostgreSQL RLS 政策相容性問題