# PostgreSQL RLS 修正執行計劃

**執行日期**: 2025-08-02  
**預估完成時間**: 3-5 天  
**優先級**: 🚨 最高優先級 (安全關鍵)

---

## 🚨 **立即執行項目 (第1天)**

### **階段 1: 安全漏洞修復**
```bash
# 1. 執行SQL安全修正
psql -d nexus_erp -f database/migrations/2025_08_02_100000_fix_rls_security_issues.sql

# 2. 驗證修正結果
psql -d nexus_erp -f tests/rls_security_comprehensive_test.sql
```

**檢查點**:
- [ ] 所有RLS策略已更新為安全版本
- [ ] 核心索引已創建
- [ ] 安全函數運作正常
- [ ] 測試通過率 100%

---

## 🔧 **Backend整合 (第2天)**

### **階段 2: Go中間件部署**
```bash
# 1. 更新中間件
cp backend/internal/middleware/secure_rls_middleware.go $GOPATH/src/nexus-erp/

# 2. 更新main.go中的中間件配置
```

**修改 `backend/cmd/main.go`**:
```go
// 替換現有的RLS中間件
rlsMiddleware := middleware.NewSecureRLSMiddleware(db, &middleware.RLSConfig{
    MaxContextSetupTime: 5 * time.Second,
    EnableAuditLogging:  true,
    StrictValidation:    true,
    EmergencyMode:       false,
})

// 應用到所有需要認證的路由
authGroup := r.Group("/api/v1")
authGroup.Use(authMiddleware.ValidateJWT())
authGroup.Use(rlsMiddleware.SetSecureRLSContext())
```

**檢查點**:
- [ ] 新中間件編譯無錯誤
- [ ] API請求正常處理
- [ ] 安全日誌正常記錄
- [ ] 效能影響在可接受範圍內

---

## 📊 **效能優化 (第3天)**

### **階段 3: 索引和查詢優化**
```sql
-- 執行效能優化SQL
-- 檔案: database/migrations/2025_08_03_100000_performance_optimization.sql

-- 1. 分析當前查詢效能
ANALYZE;

-- 2. 創建統計資訊
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('products', 'customers', 'sales_orders')
AND attname = 'company_id';

-- 3. 優化慢查詢
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM products WHERE company_id = 1 AND status = 'active';
```

**效能基準**:
- [ ] 基本查詢 < 50ms
- [ ] 複雜關聯查詢 < 200ms
- [ ] 索引使用率 > 90%
- [ ] RLS開銷 < 15%

---

## 🧪 **完整測試驗證 (第4天)**

### **階段 4: 綜合測試**
```bash
# 1. 單元測試
go test ./internal/middleware/...

# 2. 整合測試  
go test ./tests/integration/...

# 3. 安全測試
psql -d nexus_erp -f tests/rls_security_comprehensive_test.sql

# 4. 效能測試
pgbench -c 10 -T 60 -f tests/performance/rls_benchmark.sql nexus_erp

# 5. 滲透測試
python tests/security/rls_penetration_test.py
```

**測試覆蓋率目標**:
- [ ] 單元測試覆蓋率 > 90%
- [ ] 整合測試通過率 100%
- [ ] 安全測試通過所有檢查點
- [ ] 效能測試符合基準

---

## 📋 **部署檢查清單 (第5天)**

### **階段 5: 生產部署準備**

#### **預部署檢查**
- [ ] 資料庫備份完成
- [ ] 回滾方案準備就緒
- [ ] 監控告警已配置
- [ ] 團隊成員已通知

#### **部署步驟**
```bash
# 1. 維護模式 (可選)
# 如果需要短暫停機
docker-compose exec backend curl -X POST /admin/maintenance/enable

# 2. 資料庫遷移
docker-compose exec postgres psql -U nexus_user -d nexus_erp \
  -f /migrations/2025_08_02_100000_fix_rls_security_issues.sql

# 3. 應用程式重啟
docker-compose restart backend

# 4. 健康檢查
curl http://localhost:8082/health

# 5. 取消維護模式
docker-compose exec backend curl -X POST /admin/maintenance/disable
```

#### **部署後驗證**
- [ ] 所有API端點回應正常
- [ ] 用戶登入和權限正常
- [ ] 多租戶隔離有效
- [ ] 監控數據正常
- [ ] 錯誤日誌無異常

---

## 🚨 **風險管控**

### **已識別風險與應對**

| 風險 | 影響程度 | 發生機率 | 應對措施 |
|------|----------|----------|----------|
| 效能下降超過預期 | 高 | 中 | 準備索引回滾方案 |
| 現有功能受影響 | 高 | 低 | 完整回歸測試 |
| 資料庫鎖定時間過長 | 中 | 低 | 分批執行CONCURRENTLY索引 |
| 中間件記憶體洩漏 | 中 | 低 | 監控內存使用 |

### **回滾方案**
```sql
-- 緊急回滾SQL (如需要)
-- 檔案: database/rollback/rollback_rls_changes.sql

-- 1. 恢復原始RLS策略
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN VALUES ('products'), ('customers'), ('sales_orders') LOOP
        EXECUTE format('DROP POLICY IF EXISTS company_isolation_%I ON %I', table_name, table_name);
        EXECUTE format('
            CREATE POLICY company_isolation_%I ON %I
                FOR ALL TO nexus_app
                USING (company_id = current_setting(''app.current_company_id'', true)::int)
        ', table_name, table_name, table_name);
    END LOOP;
END;
$$;

-- 2. 移除新創建的函數和索引
DROP FUNCTION IF EXISTS validate_rls_context();
DROP FUNCTION IF EXISTS is_company_active(INTEGER);
DROP FUNCTION IF EXISTS user_belongs_to_company(INTEGER, INTEGER);
```

---

## 📈 **成功指標**

### **技術指標**
- **安全性**: 100% RLS覆蓋率，0個安全漏洞
- **效能**: 查詢回應時間改善或維持現狀
- **穩定性**: 24小時內無系統異常
- **合規性**: 通過所有安全測試

### **業務指標**  
- **用戶體驗**: API回應時間無明顯變化
- **系統可用性**: 99.9% 正常運行時間
- **資料完整性**: 0個資料洩漏事件
- **團隊信心**: 開發團隊對系統安全性的信心提升

---

## 👥 **執行團隊與責任**

| 角色 | 責任 | 負責人 |
|------|------|--------|
| **資料庫工程師** | SQL修正、索引優化、效能調校 | 待分配 |
| **後端工程師** | Go中間件整合、API測試 | 待分配 |
| **QA工程師** | 測試執行、品質驗證 | 待分配 |
| **DevOps工程師** | 部署、監控、回滾支援 | 待分配 |
| **專案經理** | 進度協調、風險管控 | 待分配 |

---

## 📞 **緊急聯絡流程**

### **部署期間緊急聯絡**
1. **發現問題** → 立即通知專案經理
2. **評估影響** → 決定是否啟動回滾
3. **執行回滾** → 通知所有相關人員
4. **事後檢討** → 48小時內完成問題分析

### **監控告警設定**
- API回應時間 > 2秒
- 資料庫CPU使用率 > 80%
- 記憶體使用率 > 85%
- 錯誤率 > 1%

---

**執行開始時間**: 2025-08-02 09:00  
**預計完成時間**: 2025-08-06 18:00  
**下一次檢討**: 2025-08-09 (部署後72小時)