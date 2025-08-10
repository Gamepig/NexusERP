# Bug 記錄 - 報價單產品 product_id 缺失問題

## 📅 基本資訊
- **發現日期**: 2025-08-07
- **任務 ID**: 報價功能開發
- **嚴重程度**: 高
- **狀態**: 已分析，待修復

## 🐛 問題描述
在報價單建立流程中，雖然產品搜尋 API 正常運作並返回完整的產品數據（包含 id, name, unit_price），但在保存草稿時，產品的 product_id 欄位為 null，導致數據完整性問題。

## 🔄 重現步驟
1. 登入系統 (test@example.com / password123)
2. 前往 `/quotes/create/multi-step`
3. 填寫客戶資訊並進入步驟2（產品選擇）
4. 在產品名稱輸入框中輸入「測試」
5. 觀察到產品搜尋 API 正常返回產品列表
6. 選擇第一個產品
7. 檢查保存的草稿數據，發現 product_id 為 null

## 🔍 根本原因分析

### 數據流追蹤結果
1. **產品搜尋 API 正常**: 
   - API 端點: `GET /api/products/search?q=測試`
   - 響應: 正常返回包含 id, name, unit_price 的產品陣列
   - 樣本數據: `{"id":832,"name":"測試商品 A","unit_price":1299.99,...}`

2. **草稿保存時 product_id 遺失**:
   - API 端點: `POST /api/quotations/draft`
   - 提交數據: `"product_id":null` (應該是 832)
   - 其他欄位: name 正確填入，但 unit_price 為 0

### 推測的技術原因
1. **前端 JavaScript 數據綁定問題**: 產品選擇後，JavaScript 沒有正確更新 Alpine.js 的數據模型中的 product_id
2. **事件處理問題**: 產品下拉選單的選擇事件可能沒有正確觸發數據更新
3. **數據映射問題**: 從搜尋結果到表單數據的映射邏輯可能有缺陷

## 🛠️ 解決方法

### 立即修復建議
1. **檢查前端 JavaScript 程式碼**:
   - 檢查產品選擇的事件處理函數
   - 確保選擇產品時正確更新 Alpine.js 數據模型
   - 驗證 product_id 的數據綁定

2. **檢查 Alpine.js 數據結構**:
   ```javascript
   // 確保產品選擇時正確更新所有欄位
   selectProduct(product) {
       this.item.product_id = product.id;        // ← 關鍵修復
       this.item.name = product.name;
       this.item.unit_price = product.unit_price;
   }
   ```

3. **API 端點驗證**:
   - 確認後端正確接收和處理 product_id
   - 驗證數據庫儲存邏輯

### 驗證方法
1. 修復後執行相同的測試流程
2. 監控草稿保存請求中的 product_id 欄位
3. 確認資料庫中正確儲存 product_id

## 🚫 預防措施
1. **前端數據驗證**: 在提交前檢查必要欄位是否完整
2. **單元測試**: 為產品選擇功能添加專門的測試
3. **E2E 測試**: 建立完整的報價建立流程測試，驗證數據完整性

## 📁 相關檔案
- 前端表單: `/resources/views/quotes/create-multi-step.blade.php`
- JavaScript 邏輯: `/resources/js/quote-form.js` (推測)
- API 控制器: `/app/Http/Controllers/QuoteController.php`
- 測試檔案: `/frontend/manual-quote-flow-test.spec.cjs`

## 🔬 測試數據證據

### 產品搜尋 API 響應 (正常)
```json
{
  "success": true,
  "data": [
    {
      "id": 832,
      "name": "測試商品 A",
      "sku": "PROD-A-001",
      "unit_price": 1299.99,
      "stock_quantity": 92
    }
  ]
}
```

### 草稿保存請求 (問題)
```json
{
  "customer_id": "2244",
  "quote_date": "2025-08-10",
  "currency": "USD",
  "items": [
    {
      "id": 1,
      "name": "",
      "quantity": 1,
      "unit_price": 0,
      "product_id": null  // ← 問題所在
    }
  ]
}
```

## 🧠 知識庫更新
- [x] 已建立 bug 記錄檔案
- [ ] 需更新 systemPatterns.md (產品選擇模式)
- [ ] 需更新 techContext.md (Alpine.js 數據綁定)  
- [ ] 需更新 progress.md (報價功能開發進度)
- [ ] 需建立修復後的驗證測試

## 📊 影響評估
- **用戶體驗**: 中等影響 - 表面功能正常，但數據不完整
- **數據完整性**: 高影響 - 缺少關鍵的產品關聯
- **系統穩定性**: 低影響 - 不會造成系統崩潰
- **業務邏輯**: 高影響 - 影響報價單的產品追蹤和統計

---
*記錄時間: 2025-08-07 17:46*
*測試方法: Playwright MCP 真實數據流監控*