# NexusERP 雲端部署指南（Docker Compose）- 2024 更新版

## 🎯 專案概況與需求分析

**專案特性**：
- **部署週期**：約 1 個月測試使用
- **用戶規模**：每日最多 20 組測試者
- **流量需求**：極低（< 1GB/月）
- **技術棧**：PostgreSQL + Redis + MinIO + Go Backend + Laravel Frontend + Nginx

**資源需求評估**：
- **記憶體需求**：最少 2.5GB RAM（建議 4GB）
- **CPU 需求**：2 vCPU（處理並發請求）
- **儲存需求**：20-30GB（包含容器映像檔和資料）
- **網路需求**：< 100GB/月流量

---

## 🏆 三大雲端平台免費額度分析

### AWS 免費層（12個月）
**核心額度**：
- **EC2**：750小時 t2.micro (1 vCPU, 1GB RAM)
- **RDS**：750小時 db.t2.micro + 20GB 儲存
- **S3**：5GB 儲存 + 20,000 GET + 2,000 PUT
- **資料傳輸**：100GB 出站流量/月
- **⚠️ 限制**：記憶體僅 1GB，無法運行完整 NexusERP 服務

### Google Cloud Platform 免費方案
**核心額度**：
- **免費試用**：$300 額度，90天期限
- **Always Free**：e2-micro (1 vCPU, 1GB RAM) 永久免費
- **Cloud Storage**：5GB 永久免費
- **資料傳輸**：100GB/月 出站流量
- **⚠️ 限制**：Always Free 記憶體不足，需消費試用額度

### Azure 免費帳戶
**核心額度**：
- **免費試用**：$200 額度，30天期限
- **12個月免費**：B1s VM (1 vCPU, 1GB RAM) + 多項服務
- **永久免費**：65+ 服務的基本額度
- **SQL Database**：100,000 vCore 秒/月
- **⚠️ 限制**：$200 額度期限較短

---

## 🥇 **推薦方案：GCP 免費試用 + 合適付費升級**

### 為什麼選擇 GCP？

**1. 最佳的試用額度**
- **$300 免費額度**：足夠支撐 2-3 個月運行
- **90天期限**：比 Azure 的 30天 更充裕
- **操作簡單**：介面友善，中文支援完整

**2. 價格透明且合理**
- **e2-standard-2** (2 vCPU, 8GB RAM)：約 $60/月
- **使用 $300 額度可運行 4-5 個月**
- **自動停止保護**：避免意外超支

**3. 升級路徑清晰**
- 從免費試用無縫升級到付費服務
- 靈活的資源配置選項
- 優秀的容器和 Kubernetes 整合

### GCP 具體部署方案

#### 🚀 **方案 A：試用期內運行（推薦）**
**VM 配置**：e2-standard-2 (2 vCPU, 8GB RAM, 20GB SSD)
**預估成本**：約 $60-70/月（使用免費 $300 額度）
**運行時間**：可運行 4-5 個月

#### 💡 **方案 B：混合式部署（最經濟）**
**VM 配置**：e2-medium (1 vCPU, 4GB RAM) + Cloud SQL for PostgreSQL
**預估成本**：約 $35-45/月
**優點**：資料庫託管，更穩定可靠

---

## 🥈 **次選方案：Azure 免費試用 + 快速驗證**

### Azure 適用場景
- **30天內完成驗證**：適合快速 POC
- **企業環境偏好**：與 Office 365 整合佳
- **中文資源豐富**：微軟台灣支援完整

### Azure 具體部署方案

#### 🏃 **快速驗證方案**
**VM 配置**：Standard_B2s (2 vCPU, 4GB RAM)
**預估成本**：約 $30-40/月（使用免費 $200 額度）
**運行時間**：可運行約 1.5-2 個月

**優點**：
- 30天內可充分測試所有功能
- $200 額度在小規模使用下足夠
- 操作介面直觀，部署快速

---

## 🥉 **第三選：AWS 分散式部署**

### AWS 適用場景
- **最豐富的生態**：第三方整合選擇最多
- **全球網路優勢**：CDN 和邊緣計算強大
- **企業級支援**：最完整的文檔和社群

### AWS 解決記憶體限制方案

#### 🔧 **分散式部署策略**
由於 t2.micro 記憶體限制，採用多實例分散部署：

**實例 1**：資料庫層 (t2.micro)
- PostgreSQL + Redis
- 最大化記憶體使用效率

**實例 2**：應用層 (t2.micro) 
- Go Backend + Laravel Frontend + Nginx
- 通過內部網路連接資料庫

**預估成本**：使用免費額度，超出部分約 $10-15/月

---

## 📊 成本對比分析（一個月運行）

| 平台 | 配置 | 月成本 | 免費額度抵扣後 | 實際成本 |
|------|------|---------|----------------|----------|
| **GCP** | e2-standard-2 | $60 | $300 額度 | $0 (4-5個月) |
| **Azure** | Standard_B2s | $35 | $200 額度 | $0 (約2個月) |
| **AWS** | 2x t2.micro | $15 | 免費層 | $0 (12個月) |

### 🎯 **最終推薦：GCP e2-standard-2**

**選擇理由**：
1. **最充足的資源**：8GB RAM 完全滿足需求
2. **最長的免費期**：可支撐整個測試週期
3. **最佳的性價比**：$300 額度 vs 一個月測試需求
4. **操作最簡單**：符合你偏好的簡單部署要求

---

## 🚀 GCP 詳細部署指南

### 步驟 1：申請 GCP 免費試用
```bash
# 前往 https://cloud.google.com/free
# 使用信用卡驗證身份（不會收費）
# 獲得 $300 免費額度
```

### 步驟 2：建立 Compute Engine 實例
```bash
# 控制台設定
實例名稱: nexus-erp-demo
區域: us-central1-a (或離台灣較近的 asia-east1-a)
機器類型: e2-standard-2 (2 vCPU, 8GB RAM)
開機磁碟: Ubuntu 22.04 LTS, 30GB SSD
防火牆: 允許 HTTP/HTTPS 流量

# 網路設定
建立防火牆規則，開放端口：
- 22 (SSH)
- 80 (HTTP) 
- 443 (HTTPS)
- 8082 (Go Backend)
- 8083 (Laravel Frontend)
```

### 步驟 3：安裝 Docker 和 Docker Compose
```bash
# SSH 連線到實例後執行
# 更新系統
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# 安裝 Docker 官方 GPG 金鑰
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 新增 Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安裝 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 設定使用者權限
sudo usermod -aG docker $USER
newgrp docker

# 驗證安裝
docker --version
docker compose version
```

### 步驟 4：部署 NexusERP 專案
```bash
# 克隆專案
git clone <your-repo-url> NexusERP
cd NexusERP

# 設定生產環境變數
cp backend/.env.example backend/.env
nano backend/.env

# 修改以下設定：
# APP_ENV=production
# GIN_MODE=release
# JWT_SECRET=your-secure-jwt-secret-key
# DB_HOST=postgres
# REDIS_HOST=redis
# MINIO_ENDPOINT=minio:9000

# 確保 docker-compose.yml 已暴露必要端口
# 檢查 go-backend 和 laravel-web 的 ports 設定

# 啟動所有服務
docker compose up -d

# 檢查服務狀態
docker compose ps
docker compose logs go-backend
docker compose logs laravel-frontend
```

### 步驟 5：設定網域和 SSL（可選）
```bash
# 如果有網域，設定 A 記錄指向實例外部 IP
# 使用 Certbot 取得 Let's Encrypt 憑證

# 安裝 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 取得憑證
sudo certbot --nginx -d yourdomain.com

# 設定自動更新
sudo crontab -e
# 加入：0 12 * * * /usr/bin/certbot renew --quiet
```

### 步驟 6：效能監控和最佳化
```bash
# 監控資源使用
docker stats --no-stream

# 檢查記憶體使用
free -h

# 設定日誌輪轉（避免磁碟空間不足）
sudo nano /etc/logrotate.d/docker
# 內容：
# /var/lib/docker/containers/*/*.log {
#   daily
#   rotate 7
#   compress
#   delaycompress
#   copytruncate
# }

# 設定基本防火牆
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8082
sudo ufw allow 8083
```

---

## 🔧 容器最佳化配置

### 針對 8GB RAM 環境優化的 docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: nexus-postgres
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    environment:
      - POSTGRES_DB=nexus_erp
      - POSTGRES_USER=nexus
      - POSTGRES_PASSWORD=securepassword
    command:
      - postgres
      - -c
      - max_connections=100
      - -c
      - shared_buffers=512MB
      - -c
      - effective_cache_size=1GB
    # ... 其他設定保持不變

  redis:
    image: redis:7-alpine
    container_name: nexus-redis
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    command: redis-server --requirepass redispassword --maxmemory 400mb --maxmemory-policy allkeys-lru
    # ... 其他設定保持不變

  minio:
    image: minio/minio:latest
    container_name: nexus-minio
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    # ... 其他設定保持不變

  go-backend:
    # ... 現有設定
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    environment:
      - GOGC=100  # 調整 GC 頻率
      # ... 其他現有環境變數

  laravel-frontend:
    # ... 現有設定
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  nginx:
    # ... 現有設定
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  laravel-web:
    # ... 現有設定
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## 📈 監控和維護

### 自動化監控腳本
```bash
#!/bin/bash
# /home/user/monitor.sh

echo "=== NexusERP System Status ===" 
date

echo "Memory Usage:"
free -h

echo "Disk Usage:"
df -h

echo "Docker Container Status:"
docker compose ps

echo "Container Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo "Recent Logs (Last 50 lines):"
docker compose logs --tail=50 go-backend | grep ERROR
```

### 設定每日監控
```bash
# 加入 crontab
crontab -e

# 每天上午 8 點執行監控
0 8 * * * /home/user/monitor.sh >> /home/user/daily-status.log
```

---

## 🆘 故障排除指南

### 常見問題與解決方案

#### 1. 記憶體不足導致容器重啟
```bash
# 檢查記憶體使用
free -h
docker stats --no-stream

# 解決方案：
# a) 增加 swap 空間
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# b) 調整容器記憶體限制
# 在 docker-compose.yml 中減少記憶體分配
```

#### 2. 容器無法啟動
```bash
# 檢查容器日誌
docker compose logs <service-name>

# 檢查端口衝突
sudo netstat -tlnp | grep :8080

# 重置並重新啟動
docker compose down
docker compose up -d
```

#### 3. 外部無法訪問服務
```bash
# 檢查防火牆設定
sudo ufw status

# 檢查 GCP 防火牆規則
gcloud compute firewall-rules list

# 檢查服務綁定位址
docker compose exec go-backend netstat -tlnp
```

#### 4. 資料庫連線問題
```bash
# 測試資料庫連線
docker compose exec postgres psql -U nexus -d nexus_erp -c "SELECT version();"

# 檢查網路連通性
docker compose exec go-backend ping postgres

# 重建資料庫（如果資料不重要）
docker compose down -v
docker compose up -d
```

---

## 📋 部署檢查清單

### 部署前檢查
- [ ] GCP 帳號已建立並完成信用卡驗證
- [ ] $300 免費額度已啟用
- [ ] 專案程式碼已準備且經過本地測試
- [ ] 環境變數文件已正確配置
- [ ] SSL 憑證方案已規劃（如使用自訂網域）

### 部署過程檢查
- [ ] Compute Engine 實例已建立並運行
- [ ] Docker 和 Docker Compose 已成功安裝
- [ ] 專案程式碼已克隆到伺服器
- [ ] 所有服務容器已成功啟動
- [ ] 資料庫初始化完成且可連線
- [ ] API 端點回應正常
- [ ] 前端頁面可正常載入

### 部署後檢查
- [ ] 外部網路可正常訪問服務
- [ ] 所有核心功能測試通過
- [ ] 監控腳本已設定並運行
- [ ] 備份策略已規劃（如有需要）
- [ ] 資源使用量在合理範圍內
- [ ] SSL 憑證已設定（如適用）

---

## 💰 成本控制建議

### GCP 費用監控
```bash
# 設定預算警示
# 在 GCP 控制台 -> Billing -> Budgets & alerts
# 設定 $50, $100, $200 的警示點

# 監控當日使用量
gcloud billing accounts list
gcloud billing budgets list
```

### 自動關機設定（節省成本）
```bash
# 建立關機排程（例如：每晚 11 點關機）
crontab -e
0 23 * * * sudo shutdown -h now

# 建立開機排程（GCP 控制台設定）
# Compute Engine -> Instance schedules
```

### 資源清理
```bash
# 定期清理 Docker 資源
docker system prune -af --volumes

# 清理 apt 快取
sudo apt-get clean
sudo apt-get autoremove

# 監控磁碟使用量
du -sh /var/lib/docker/
```

---

## 🎉 部署完成後的驗證

### 功能驗證清單
1. **資料庫功能**
   - [ ] 可正常連線 PostgreSQL
   - [ ] 資料庫表已正確建立
   - [ ] 基本 CRUD 操作正常

2. **快取功能**
   - [ ] Redis 服務正常運行
   - [ ] 快取讀寫功能正常

3. **檔案儲存**
   - [ ] MinIO 服務可訪問
   - [ ] 檔案上傳/下載功能正常

4. **API 服務**
   - [ ] Go Backend API 回應正常
   - [ ] 身份驗證功能正常
   - [ ] 業務邏輯 API 正常

5. **前端服務**
   - [ ] Laravel 前端可正常載入
   - [ ] 使用者介面互動正常
   - [ ] 前後端整合正常

### 效能基準測試
```bash
# 使用 ab (Apache Bench) 進行基本壓力測試
sudo apt-get install apache2-utils

# 測試 API 回應時間 (20 個並發用戶)
ab -n 100 -c 20 http://YOUR_EXTERNAL_IP:8082/api/v1/health

# 測試前端頁面載入
ab -n 50 -c 10 http://YOUR_EXTERNAL_IP:8083/

# 監控系統資源在測試期間的使用情況
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

## 📚 相關資源連結

### 官方文檔
- [Google Cloud 免費方案](https://cloud.google.com/free)
- [Docker 官方安裝指南](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose 文檔](https://docs.docker.com/compose/)
- [Nginx 反向代理配置](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

### 社群資源
- [GCP 台灣社群](https://gcptw.kktix.cc/)
- [Docker 台灣](https://www.facebook.com/groups/docker.taipei/)
- [DevOps Taiwan](https://www.facebook.com/groups/DevOpsTaiwan/)

### 工具推薦
- [GCP 價格計算器](https://cloud.google.com/products/calculator)
- [Docker Hub](https://hub.docker.com/) - 容器映像檔庫
- [Let's Encrypt](https://letsencrypt.org/) - 免費 SSL 憑證

---

**📝 文件版本**：2024年8月更新 | **推薦平台**：Google Cloud Platform | **預估費用**：使用 $300 免費額度，約可運行 4-5 個月 | **適用對象**：1個月測試週期，20組測試用戶的 NexusERP 專案
