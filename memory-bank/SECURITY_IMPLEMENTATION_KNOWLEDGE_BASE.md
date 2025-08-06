# NexusERP 安全實施知識庫

## 📚 知識庫目的
本文件記錄 NexusERP 系統完整的安全設計與實施細節，作為團隊知識庫和未來維護參考。

## 🏗️ 安全架構總覽

### 多層安全防護模型
```
┌─────────────────────────────────────────────────────────┐
│                   用戶介面層                              │
│  ┌─ CSP 防護 ─┐ ┌─ XSS 防護 ─┐ ┌─ 輸入驗證 ─┐          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   網路傳輸層                              │
│  ┌─ TLS 1.3 ─┐ ┌─ HSTS ─┐ ┌─ 安全標頭 ─┐              │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   應用程式層                              │
│  ┌─ JWT 認證 ─┐ ┌─ RBAC ─┐ ┌─ 速率限制 ─┐             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   資料存取層                              │
│  ┌─ SQL 防護 ─┐ ┌─ 資料加密 ─┐ ┌─ 審計日誌 ─┐          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   基礎設施層                              │
│  ┌─ 防火牆 ─┐ ┌─ Fail2Ban ─┐ ┌─ 監控系統 ─┐           │
└─────────────────────────────────────────────────────────┘
```

## 🔐 核心安全組件實施

### 1. 認證與授權系統

#### 1.1 JWT 認證實施
**檔案位置**: `backend/internal/middleware/auth_middleware.go`

**核心功能**:
- Token 有效性驗證
- 自動續期機制
- 安全標頭設定
- 速率限制整合

**關鍵實施細節**:
```go
// 認證中介軟體核心邏輯
func (m *AuthMiddleware) ValidateToken(tokenString string) (*jwt.Claims, error) {
    // 1. Token 格式驗證
    // 2. 簽名驗證
    // 3. 到期時間檢查
    // 4. 黑名單檢查
}
```

**安全特性**:
- 使用 HMAC-SHA256 簽名
- 15 分鐘 Token 有效期
- 自動黑名單管理
- 時間攻擊防護

#### 1.2 角色基礎存取控制 (RBAC)
**檔案位置**: `backend/internal/middleware/rbac_middleware.go`

**權限模型**:
```
超級管理員 (admin) 
├── 系統管理員 (system_admin)
├── 業務經理 (business_manager)
├── 操作員 (operator)
└── 只讀用戶 (viewer)
```

**實施策略**:
- 最小權限原則
- 動態權限檢查
- 權限繼承機制
- 審計記錄

### 2. 資料保護系統

#### 2.1 資料加密服務
**檔案位置**: `backend/internal/services/encryption_service.go`

**加密規格**:
- **演算法**: AES-256-GCM
- **金鑰衍生**: PBKDF2 (10,000 迭代)
- **初始向量**: 每次加密隨機生成
- **完整性**: 內建認證標籤

**實施模式**:
```go
type EncryptionService struct {
    masterKey    []byte
    keyCache     map[string][]byte
    searchHasher *SearchHasher
}

func (es *EncryptionService) Encrypt(plaintext string) (string, error) {
    // 1. 生成隨機 salt 和 IV
    // 2. 衍生加密金鑰
    // 3. AES-GCM 加密
    // 4. Base64 編碼結果
}
```

**搜索雜湊機制**:
- **目的**: 支援加密資料搜尋
- **演算法**: HMAC-SHA256
- **金鑰**: 獨立的搜尋金鑰
- **防護**: 防範頻率分析攻擊

#### 2.2 敏感資料識別與加密
**檔案位置**: `backend/cmd/encrypt_data.go`

**敏感資料類別**:
1. **個人識別資訊 (PII)**:
   - 姓名、電子郵件、電話
   - 地址、身份證字號
   
2. **財務資訊**:
   - 銀行帳號、稅務編號
   - 薪資、財務報表

3. **業務機密**:
   - 供應商資訊、合約條款
   - 定價策略、客戶清單

**加密實施**:
```sql
-- 加密欄位結構範例
ALTER TABLE users ADD COLUMN first_name_encrypted TEXT;
ALTER TABLE users ADD COLUMN first_name_search_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN first_name_is_encrypted BOOLEAN DEFAULT FALSE;
```

### 3. 威脅防護系統

#### 3.1 OWASP Top 10 防護實施
**參考文件**: `documents/OWASP_TOP_10_SECURITY_AUDIT_REPORT.md`

**A01: 注入攻擊防護**:
- **實施位置**: 所有資料庫操作
- **防護機制**: 參數化查詢、ORM 使用
- **驗證方式**: 靜態代碼分析

```go
// 安全的資料庫查詢範例
func (s *UserService) GetUserByEmail(email string) (*User, error) {
    query := "SELECT * FROM users WHERE email = $1"
    return s.db.QueryRow(query, email)
}
```

**A02: 認證失效防護**:
- **密碼政策**: 複雜度要求、歷史記錄
- **會話管理**: 安全 Cookie、自動過期
- **MFA 支援**: TOTP、SMS 驗證

**A03: 敏感資料暴露防護**:
- **傳輸加密**: 強制 HTTPS
- **靜態加密**: AES-256-GCM
- **存取控制**: 最小權限原則

#### 3.2 速率限制與 DDoS 防護
**檔案位置**: `backend/internal/services/rate_limit_service.go`

**多層防護策略**:
```
第一層: Nginx 速率限制 (每秒 5 請求)
第二層: Redis 應用層限制 (每分鐘 60 請求)
第三層: 智慧防護 (異常模式檢測)
```

**實施機制**:
```go
// Redis Lua 腳本實現原子性操作
func (r *RateLimitService) IsAllowed(clientID string, limit int, window time.Duration) (bool, error) {
    script := `
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local current = redis.call('incr', key)
        if current == 1 then
            redis.call('expire', key, window)
        end
        return current <= limit
    `
}
```

#### 3.3 入侵檢測與防護
**檔案位置**: `/etc/fail2ban/jail.d/nexus-erp.conf`

**Fail2Ban 配置策略**:
```ini
[nexus-erp-auth]
enabled = true
filter = nexus-erp-auth
port = http,https
logpath = /var/log/nginx/nexus_security.log
maxretry = 5
bantime = 7200
findtime = 600
```

**監控模式**:
- SSH 暴力破解
- HTTP 認證失敗
- 應用層異常請求
- 自動 IP 封鎖

### 4. 網路安全配置

#### 4.1 SSL/TLS 強化配置
**檔案位置**: `nginx/conf.d/ssl-security.conf`

**安全配置要點**:
```nginx
# 僅允許現代 TLS 版本
ssl_protocols TLSv1.2 TLSv1.3;

# 強加密套件
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384...';

# 安全標頭
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
```

**HSTS 實施**:
- **最大年齡**: 2 年
- **包含子域**: 啟用
- **預載**: 啟用

#### 4.2 內容安全政策 (CSP)
**實施位置**: `nginx/conf.d/ssl-security.conf`

**CSP 政策**:
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.bunny.net;
font-src 'self' https://fonts.bunny.net;
img-src 'self' data: https:;
connect-src 'self';
frame-ancestors 'none';
```

**防護目標**:
- XSS 攻擊防護
- 點擊劫持防護
- 資源載入控制
- 資料外洩防護

### 5. 監控與審計系統

#### 5.1 安全審計服務
**檔案位置**: `backend/internal/services/audit_service.go`

**審計內容**:
```go
type AuditEvent struct {
    UserID      int64                  `json:"user_id"`
    IP          string                 `json:"ip_address"`
    UserAgent   string                 `json:"user_agent"`
    Action      string                 `json:"action"`
    Resource    string                 `json:"resource"`
    Timestamp   time.Time              `json:"timestamp"`
    Metadata    map[string]interface{} `json:"metadata"`
    Result      string                 `json:"result"`
}
```

**記錄事件類型**:
- 認證與授權事件
- 資料存取與修改
- 系統配置變更
- 安全策略觸發

#### 5.2 自動化監控系統
**檔案位置**: `/usr/local/bin/nexus-security-monitor.sh`

**監控項目**:
- 系統資源使用率
- 異常連接模式
- 安全事件頻率
- SSL 憑證狀態

**告警機制**:
```bash
# 磁碟使用率檢查
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "[$DATE] CRITICAL: Disk usage is $DISK_USAGE%" >> $LOG_FILE
fi
```

## 🔧 安全工具與自動化

### 1. 安全掃描工具
**檔案位置**: `scripts/security_scan.sh`

**掃描範圍**:
- Go 代碼安全掃描 (gosec)
- 前端依賴漏洞檢查 (npm audit)
- 靜態代碼分析 (semgrep)
- 配置安全檢查
- 權限驗證

**使用方式**:
```bash
# 執行完整安全掃描
./scripts/security_scan.sh

# 生成安全報告
# 報告位置: reports/security-scan-report-YYYYMMDD-HHMMSS.md
```

### 2. SSL/TLS 自動化配置
**檔案位置**: `scripts/setup_ssl_security.sh`

**自動化功能**:
- 系統依賴安裝
- SSL 憑證生成/配置
- 防火牆規則設定
- Fail2Ban 配置
- 安全監控設定

**執行條件**:
```bash
# 需要 root 權限執行
sudo ./scripts/setup_ssl_security.sh

# 支援 Let's Encrypt 自動配置
# 支援自簽憑證（開發環境）
```

### 3. 資料加密工具
**檔案位置**: `backend/cmd/encrypt_data.go`

**功能特性**:
- 批次資料加密/解密
- 乾運行模式（測試）
- 進度追蹤顯示
- 錯誤恢復機制

**使用範例**:
```bash
# 加密所有敏感資料
go run backend/cmd/encrypt_data.go

# 僅加密特定表
go run backend/cmd/encrypt_data.go --table=users

# 乾運行模式
go run backend/cmd/encrypt_data.go --dry-run

# 解密資料（緊急維護）
go run backend/cmd/encrypt_data.go --decrypt
```

## 🧪 安全測試框架

### 1. 自動化安全測試
**檔案位置**: `backend/tests/security_test.go`

**測試覆蓋範圍**:
- SQL 注入攻擊測試
- XSS 攻擊防護測試
- 認證繞過測試
- 授權檢查測試
- 速率限制測試
- 檔案上傳安全測試

**測試執行**:
```bash
# 執行安全測試套件
cd backend && go test ./tests/security_test.go -v

# 併發安全測試
go test -race ./tests/security_test.go
```

### 2. 滲透測試模擬
**實施位置**: `scripts/security_scan.sh` 中的 `run_penetration_test()` 函數

**測試項目**:
- 未授權 API 存取
- SQL 注入嘗試
- 暴力破解防護
- 會話劫持測試

**自動化執行**:
```bash
# 檢查 API 安全性
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/users

# SQL 注入測試
curl -s "http://localhost:8080/api/users?id=1'OR'1'='1"
```

## 📋 合規性與政策

### 1. 安全政策框架
**檔案位置**: `documents/SECURITY_POLICIES_AND_PROCEDURES.md`

**政策類別**:
- 身份認證與授權政策
- 資料保護與隱私政策
- 網路安全政策
- 事件回應程序
- 合規性要求

### 2. 法規遵循
**適用法規**:
- 個人資料保護法 (PDPA)
- 資通安全管理法
- ISO 27001 資安標準
- SOX 法案（如適用）

**遵循措施**:
- 定期安全評估
- 第三方安全審計
- 持續監控機制
- 員工安全培訓

## 🔄 維護與更新程序

### 1. 安全更新流程
1. **威脅情報收集**: 每週監控安全公告
2. **漏洞評估**: 評估對系統的影響
3. **修補規劃**: 制定更新計劃
4. **測試驗證**: 在測試環境驗證
5. **生產部署**: 計劃維護時間部署
6. **效果確認**: 驗證修補效果

### 2. 定期安全檢查
**每月任務**:
- 執行安全掃描
- 檢查存取權限
- 更新安全配置
- 審查安全日誌

**每季任務**:
- 全面滲透測試
- 政策有效性評估
- 員工安全培訓
- 災難恢復演練

**每年任務**:
- 完整安全審計
- 風險評估更新
- 合規性檢查
- 架構安全評估

## 🚨 事件回應手冊

### 1. 事件分類與等級
**P0 - 緊急**:
- 系統入侵
- 資料外洩
- 服務完全中斷

**P1 - 高**:
- 權限濫用
- 部分服務中斷
- 安全配置被破壞

**P2 - 中**:
- 異常存取模式
- 輕微配置錯誤
- 可疑活動

**P3 - 低**:
- 政策違規
- 日常安全告警
- 預防性警告

### 2. 標準回應程序
1. **事件確認** (15 分鐘內)
2. **初步隔離** (30 分鐘內)
3. **影響評估** (1 小時內)
4. **通報程序** (按等級要求)
5. **詳細調查** (24 小時內)
6. **修復實施** (按影響程度)
7. **事後檢討** (一週內)

### 3. 聯絡與通報機制
**內部聯絡**:
- 技術團隊: tech-support@nexus-erp.com
- 安全團隊: security@nexus-erp.com
- 管理層: management@nexus-erp.com

**外部通報**:
- 監管機關: 法規要求時間內
- 客戶通知: 24 小時內（如涉及客戶資料）
- 第三方服務: 必要時立即

## 📊 安全指標與 KPI

### 1. 技術指標
- **認證成功率**: > 98%
- **API 回應時間**: < 200ms（含安全檢查）
- **SSL 憑證更新**: 自動化率 100%
- **安全掃描覆蓋率**: > 95%

### 2. 安全事件指標
- **錯誤警報率**: < 10%
- **平均修復時間**: < 24 小時
- **安全培訓完成率**: > 90%
- **政策遵循率**: > 95%

### 3. 合規性指標
- **審計通過率**: 100%
- **漏洞修補時間**: 高危 24 小時，中危 7 天
- **存取權限審查**: 季度 100% 完成
- **備份恢復測試**: 月度成功率 100%

## 🔗 相關資源與工具

### 1. 安全工具清單
**代碼掃描**:
- Gosec (Go 安全掃描)
- Semgrep (多語言靜態分析)
- Nancy (Go 依賴漏洞掃描)
- npm audit (Node.js 依賴掃描)

**網路安全**:
- Nginx (反向代理與安全標頭)
- Fail2Ban (入侵防護)
- Let's Encrypt (SSL 憑證)
- UFW/firewalld (防火牆)

**監控與日誌**:
- 自定義監控腳本
- PostgreSQL 審計擴展
- Redis 效能監控
- 系統資源監控

### 2. 學習資源
**安全標準**:
- OWASP Top 10
- NIST Cybersecurity Framework
- ISO 27001/27002
- CIS Controls

**技術文件**:
- Go 安全開發指南
- Nginx 安全配置
- PostgreSQL 安全最佳實踐
- Redis 安全配置

### 3. 緊急聯絡資訊
**24/7 支援**:
- 安全事件熱線: +886-xxx-xxx-xxx
- 緊急郵箱: emergency@nexus-erp.com
- 值班工程師: oncall@nexus-erp.com

**第三方支援**:
- SSL 憑證支援: Let's Encrypt Support
- 雲端服務支援: 依據部署環境
- 安全顧問: security-consultant@company.com

---

## 📝 知識庫維護記錄

**建立日期**: 2025-01-21  
**最後更新**: 2025-01-21  
**負責人**: NexusERP 安全團隊  
**下次審查**: 2025-04-21

**版本歷史**:
- v1.0 (2025-01-21): 初始版本，包含完整安全實施記錄
- 未來版本將記錄重大安全更新和架構變更

**使用說明**:
本知識庫應作為團隊參考資料，定期更新以反映最新的安全實施狀況。所有安全相關變更都應該同步更新到此文件中。