# Docker容器化ERP系統部署方案（2025）

## 1. 為什麼用Docker部署ERP？
- 快速安裝、升級、移植
- 隔離環境、易於測試與回滾
- 支援多ERP並存、橫向擴展
- 易於自動化（CI/CD）

## 2. 主流ERP Docker部署範例

### ERPNext（Frappe）
- 官方映像：[frappe/erpnext](https://hub.docker.com/r/frappe/erpnext)
- 參考教學：[How to Install ERPNext on Your Synology NAS](https://mariushosting.com/how-to-install-erpnext-on-your-synology-nas/)
- [Setup erpnext15 dockerized - Ubuntu 22.04/24.04 LTS](https://redmine.omb-automation.com/projects/dw_os_ub2204/wiki/Setup_erpnext15_dockerized_)
- 主要服務：backend、frontend、db（MariaDB）、redis、queue、scheduler、websocket
- docker-compose.yml範例（精簡）：
```yaml
version: "3"
services:
  backend:
    image: frappe/erpnext:v15.45.4
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs
  db:
    image: mariadb:10.6
    environment:
      MYSQL_ROOT_PASSWORD: admin
    volumes:
      - db-data:/var/lib/mysql
  frontend:
    image: frappe/erpnext:v15.45.4
    ports:
      - "80:8080"
    depends_on:
      - backend
      - websocket
  redis-queue:
    image: redis:6.2-alpine
    volumes:
      - redis-queue-data:/data
  websocket:
    image: frappe/erpnext:v15.45.4
    command: ["node", "/home/frappe/frappe-bench/apps/frappe/socketio.js"]
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs
volumes:
  sites:
  logs:
  db-data:
  redis-queue-data:
```
- 完整compose請參考官方或上述教學

### Odoo
- 官方映像：[odoo/odoo](https://hub.docker.com/_/odoo)
- 支援PostgreSQL、可自訂addons
- 參考：[Pigsty+JuiceFS+Odoo一鍵部署](https://pigsty.io/blog/pg/pgfs/)

### Dolibarr
- 官方映像：[dolibarr/dolibarr](https://hub.docker.com/r/dolibarr/dolibarr)
- 參考：[Installing Dolibarr on a Dockerized LEMP Stack](https://medium.solvytech.com/installing-dolibarr-on-a-dockerized-lemp-stack-linux-nginx-mysql-php-967c24fb710e)

## 3. 資料備份與升級
- 定期備份資料庫（pg_dump、mysqldump、docker cp）
- 備份volume（docker volume、rsync、tar）
- 升級流程：
  1. 停止服務
  2. 備份資料
  3. 更新映像（docker pull）
  4. 修改compose檔
  5. docker-compose up -d
  6. 執行資料遷移（如bench migrate）

## 4. 常見問題與解決
- 權限問題：確認volume目錄權限與UID/GID
- 端口衝突：調整compose對應端口
- 升級失敗：回滾至舊映像與備份
- 性能瓶頸：調整資源限制、啟用連線池

## 5. 參考文件
- [ERPNext官方Docker文件](https://github.com/frappe/frappe_docker)
- [Odoo官方Docker文件](https://github.com/odoo/docker)
- [Dolibarr官方Docker文件](https://github.com/Dolibarr/dolibarr-docker) 