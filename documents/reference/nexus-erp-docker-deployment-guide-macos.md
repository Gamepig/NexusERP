# NexusERP Docker 部署指南 (macOS 環境)

本指南說明如何在 macOS 環境下，使用單一 Docker 映像部署包含 PostgreSQL, Laravel/PHP, Golang, 和 Nginx 的 NexusERP 應用程式。

## 1. 環境要求

*   **作業系統**: macOS Ventura 13.x 或更新版本。
*   **工具**:
    *   Docker Desktop (最新版本，啟用檔案共享)。
    *   Git (可選，用於程式碼管理)。
    *   文字編輯器 (用於修改配置文件)。
*   **專案結構 (假設)**:
    ```
    /Users/vichuang/Projects/NexusERP/
    ├── Dockerfile            # 定義單一映像 (使用多階段構建)
    ├── docker-compose.yml    # 定義容器和網路
    ├── supervisor.conf       # Supervisord 配置
    ├── nginx.conf            # Nginx 配置
    ├── init-db.sh            # PostgreSQL 初始化腳本
    ├── src/                  # Laravel 程式碼
    │   └── .env              # Laravel 環境變數 (重要！)
    ├── go-src/               # Golang 程式碼
    └── postgres-data/        # PostgreSQL 資料 (持久化)
    ```

## 2. 前置設定

### 2.1 安裝 Docker Desktop
*   從 [Docker 官網](https://www.docker.com/products/docker-desktop/) 下載並安裝。
*   啟動 Docker Desktop。

### 2.2 準備專案目錄和檔案
*   創建必要的目錄：
    ```bash
    mkdir -p /Users/vichuang/Projects/NexusERP/src
    mkdir -p /Users/vichuang/Projects/NexusERP/go-src
    mkdir -p /Users/vichuang/Projects/NexusERP/postgres-data
    ```
*   **重要**: 確保你的 Laravel 專案位於 `src/` 目錄下，並且有一個有效的 `.env` 文件，特別是 `APP_KEY`。你可以從 `.env.example` 複製並執行 `php artisan key:generate` (如果本地有 PHP 環境) 或在容器首次運行後進入容器執行。
*   將 Golang 專案放在 `go-src/` 目錄下。
*   將 `Dockerfile`, `docker-compose.yml`, `supervisor.conf`, `nginx.conf` 放置在專案根目錄 `/Users/vichuang/Projects/NexusERP/`。
*   創建 `init-db.sh` 腳本 (見下方範例) 並賦予執行權限：
    ```bash
    touch /Users/vichuang/Projects/NexusERP/init-db.sh
    chmod +x /Users/vichuang/Projects/NexusERP/init-db.sh
    ```

### 2.3 配置 Docker Desktop 檔案共享
*   開啟 Docker Desktop，進入 `Preferences > Resources > File Sharing`。
*   添加專案路徑: `/Users/vichuang/Projects/NexusERP`。

### 2.4 檢查端口衝突
*   檢查 80, 8080, 5432 (如果你打算從主機訪問) 端口是否被佔用：
    ```bash
    lsof -i :80
    lsof -i :8080
    lsof -i :5432
    ```
*   若有衝突，停止佔用進程或修改 `docker-compose.yml` 中的主機端口映射 (例如 `8081:80`)。

## 3. 核心配置文件範例

### 3.1 Dockerfile (多階段構建)

```dockerfile
# ---- Builder Stage ----
FROM alpine:3.18 AS builder

RUN apk --no-cache add \
    go \
    musl-dev \
    gcc \
    php82 \
    php82-dev \ # for gd build deps
    php82-gd \
    php82-zip \
    php82-pdo \
    php82-pgsql \ # needed for pdo_pgsql build
    php82-tokenizer \
    php82-xml \
    php82-ctype \
    php82-fileinfo \
    php82-session \
    php82-pecl-redis \ # Example: if you need redis
    curl \
    git \
    make \
    libzip-dev \
    libpng-dev \
    postgresql16-dev # for pgsql client dev headers

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /build

# Build Go App
COPY go-src /build/go-src
RUN cd /build/go-src \
    && go mod download \
    && CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -a -o /build/nexus-go .

# Build Laravel App
COPY src /build/laravel
RUN cd /build/laravel \
    # Optionally remove dev files if not needed in final image
    # && rm -rf .git tests
    && composer install --optimize-autoloader --no-dev --no-interaction --no-progress --prefer-dist \
    # Example: Build frontend assets if needed
    # && npm install && npm run build \
    && rm -rf node_modules # clean up if npm was used

# ---- Final Stage ----
FROM alpine:3.18

# Install Runtime Dependencies
RUN apk --no-cache add \
    php82 \
    php82-fpm \
    php82-pdo_pgsql \
    php82-gd \
    php82-zip \
    php82-redis \ # Runtime for pecl-redis
    php82-ctype \
    php82-tokenizer \
    php82-xml \
    php82-fileinfo \
    php82-session \
    postgresql16 \
    postgresql16-client \
    nginx \
    supervisor \
    libzip \
    libpng \
    bash \ # Needed for init-db.sh <() syntax or complex scripts
    su-exec # Needed for init-db.sh

WORKDIR /app

# Copy built Go app from builder
COPY --from=builder /build/nexus-go /app/go/nexus-go

# Copy built Laravel app from builder
COPY --from=builder /build/laravel /app/laravel

# Copy configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisor.conf /etc/supervisor.conf
# Ensure php-fpm config is appropriate or copy yours
# COPY php-fpm-pool.conf /etc/php82/php-fpm.d/www.conf

# Copy init script
COPY init-db.sh /usr/local/bin/init-db.sh
RUN chmod +x /usr/local/bin/init-db.sh

# Create directories and set permissions
RUN mkdir -p /app/postgres-data /run/postgresql /run/php \
    && chown -R postgres:postgres /app/postgres-data /run/postgresql \
    && chmod -R 700 /app/postgres-data \
    && mkdir -p /app/laravel/storage/framework/sessions \
                /app/laravel/storage/framework/views \
                /app/laravel/storage/framework/cache \
                /app/laravel/storage/logs \
                /app/laravel/bootstrap/cache \
    # Adjust user 'nobody' if your nginx/php-fpm runs as a different user (e.g., nginx, www-data)
    && chown -R nobody:nobody /app/laravel/storage /app/laravel/bootstrap/cache /run/php

# Expose ports
EXPOSE 80 8080

# Run init script then supervisord
CMD ["sh", "-c", "/usr/local/bin/init-db.sh && /usr/bin/supervisord -n -c /etc/supervisor.conf"]
```

### 3.2 init-db.sh (PostgreSQL 自動初始化)

```bash
#!/bin/bash
# Use bash for <() syntax
set -e

# Check if initialization is needed
if [ -s "$PGDATA/PG_VERSION" ]; then
    echo "PostgreSQL data directory already initialized. Skipping."
    exit 0
fi

# Ensure the directory exists and has correct ownership (belt and suspenders)
mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

echo "Initializing PostgreSQL database..."

# Initialize DB Directory
# Use --pwfile to avoid password prompt/logging issues
echo "$POSTGRES_PASSWORD" > /tmp/pgpass
chmod 600 /tmp/pgpass
chown postgres:postgres /tmp/pgpass

su-exec postgres initdb -D "$PGDATA" --username="$POSTGRES_USER" --pwfile=/tmp/pgpass --encoding=UTF8 --locale=C.UTF-8
rm /tmp/pgpass

# Modify pg_hba.conf to allow connections from the user during setup
# This allows psql to connect without complex auth during the init phase
# WARNING: Adjust this based on your security needs. 'trust' is convenient for init.
echo "host all $POSTGRES_USER all trust" >> "$PGDATA/pg_hba.conf"

# Start temporary server
echo "Starting temporary PostgreSQL server for setup..."
su-exec postgres pg_ctl -D "$PGDATA" -o "-c listen_addresses='*'" -w start

# Create the database
echo "Creating database '$POSTGRES_DB' for user '$POSTGRES_USER'..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    CREATE DATABASE "$POSTGRES_DB";
    GRANT ALL PRIVILEGES ON DATABASE "$POSTGRES_DB" TO "$POSTGRES_USER";
EOSQL
echo "Database '$POSTGRES_DB' created."

# Optional: Run initial SQL scripts here if needed
# Example: psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" < /path/to/init.sql

# Stop temporary server
echo "Stopping temporary PostgreSQL server..."
su-exec postgres pg_ctl -D "$PGDATA" -m fast -w stop

# Optional: Revert pg_hba.conf changes if needed, e.g., back to md5
# sed -i 's/host all '$POSTGRES_USER' all trust/host all '$POSTGRES_USER' all md5/' "$PGDATA/pg_hba.conf"

echo "PostgreSQL initialization complete."

exit 0
```

### 3.3 supervisor.conf

```ini
[supervisord]
nodaemon=true ; Run in the foreground
logfile=/var/log/supervisord.log
pidfile=/var/run/supervisord.pid
loglevel=info ; Adjust as needed

[program:php-fpm]
command=/usr/sbin/php-fpm82 --nodaemonize --fpm-config /etc/php82/php-fpm.conf
autostart=true
autorestart=true
priority=10
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
user=root ; PHP-FPM master process runs as root, workers as specified in pool conf (e.g., nobody)

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
priority=20
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:postgres]
command=/usr/lib/postgresql16/bin/postgres -D /app/postgres-data
user=postgres
autostart=true
autorestart=true
priority=5 # Start PG first
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
# Environment variables needed by init-db.sh and postgres itself
# Ensure these match your docker-compose.yml and Laravel .env
environment=PGDATA=/app/postgres-data,POSTGRES_USER=nexus,POSTGRES_PASSWORD=securepassword,POSTGRES_DB=nexus_erp

[program:go]
command=/app/go/nexus-go
directory=/app/go # Set working directory if needed
autostart=true
autorestart=true
priority=30
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
# Pass environment variables to Go app if needed
# environment=GO_API_PORT=8080,OTHER_VAR=value
```
*   **Logging**: Redirected logs to stdout/stderr for `docker logs` integration.
*   **Priority**: Set startup order (PG first).
*   **User**: Note `php-fpm` master runs as root.

### 3.4 nginx.conf

```nginx
user nobody; # Match PHP-FPM pool user and Dockerfile permissions
worker_processes auto;
error_log /dev/stderr warn; # Log errors to stderr
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    access_log /dev/stdout; # Log access to stdout

    server {
        listen 80 default_server;
        server_name _; # Listen for any hostname
        root /app/laravel/public;
        index index.php index.html;

        location / {
            try_files $uri $uri/ /index.php?$query_string;
        }

        location ~ \.php$ {
            try_files $uri =404;
            # Use Unix socket (recommended) - ensure php-fpm pool listens on this socket
            fastcgi_pass unix:/run/php/php8.2-fpm.sock;
            # Or use TCP (ensure php-fpm pool listens on 127.0.0.1:9000)
            # fastcgi_pass 127.0.0.1:9000;

            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param PATH_INFO $fastcgi_path_info;
        }

        # Deny access to .htaccess files
        location ~ /\.ht {
            deny all;
        }
    }
}
```
*   **User**: Ensure `user` matches the PHP-FPM pool user (e.g., `nobody` in Alpine default).
*   **Logging**: Redirected logs to stdout/stderr.
*   **`fastcgi_pass`**: Choose **either** Unix socket (default for Alpine PHP-FPM) or TCP. Ensure it matches your PHP-FPM pool configuration (`/etc/php82/php-fpm.d/www.conf`).

### 3.5 docker-compose.yml

```yaml
version: '3.8'
services:
  nexus-erp:
    build:
      context: .
      dockerfile: Dockerfile
      # Pass build-time arguments if needed
      # args:
      #   SOME_ARG: value
    container_name: nexus-erp
    ports:
      - "80:80"      # Nginx (Laravel)
      - "8080:8080"  # Go service API
      # - "5432:5432"  # PostgreSQL (Only uncomment if direct access from HOST macOS is needed)
    volumes:
      # Persist PostgreSQL data
      - ./postgres-data:/app/postgres-data # Use relative path for portability
      # Development Only: Mount source code for hot-reloading. Comment out for production.
      # - ./src:/app/laravel:cached # 'cached' improves macOS performance
      # - ./go-src:/app/go:cached
      # Mount Laravel .env file explicitly (alternative to baking into image)
      # - ./src/.env:/app/laravel/.env
    networks:
      - nexus-network
    # Use env_file for non-sensitive defaults, override sensitive with environment or secrets
    # env_file:
    #   - .env # Load variables from .env file at the root
    environment:
      # These override env_file and baked-in values
      # Laravel Environment
      - APP_ENV=production # Or development
      - APP_DEBUG=false # Or true
      - APP_KEY=base64:YourLaravelAppKey= # IMPORTANT: Set your actual APP_KEY
      - APP_URL=http://localhost # Set your app URL
      # Database Connection (for Laravel)
      - DB_CONNECTION=pgsql
      - DB_HOST=127.0.0.1 # Connect to PG within the same container
      - DB_PORT=5432
      - DB_DATABASE=nexus_erp # Must match POSTGRES_DB
      - DB_USERNAME=nexus # Must match POSTGRES_USER
      - DB_PASSWORD=securepassword # Must match POSTGRES_PASSWORD (Use Docker secrets in production!)
      # PostgreSQL Init Script Variables
      - PGDATA=/app/postgres-data
      - POSTGRES_DB=nexus_erp
      - POSTGRES_USER=nexus
      - POSTGRES_PASSWORD=securepassword # Use Docker secrets in production!
      # Other variables for PHP, Go, etc.
      # - SESSION_DRIVER=redis
      # - REDIS_HOST=cache # If using a separate redis container
      # - GO_API_PORT=8080
    # For Production: Use Docker Secrets for sensitive data like passwords & API keys
    # secrets:
    #   db_password
    #   - app_key_secret
    restart: unless-stopped
    mem_limit: 1g # Adjust based on needs
    cpus: 1.0 # Adjust based on needs
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB -h 127.0.0.1 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s # Give PG time to start/initialize

networks:
  nexus-network:
    driver: bridge
    name: nexus-network # Use a consistent network name

# For Production: Define Docker Secrets
# secrets:
#   db_password:
#     file: ./secrets/db_password.txt
#   app_key_secret:
#     file: ./secrets/app_key.txt

# Optional: Define a volume for postgres data explicitly
# volumes:
#   postgres_data:
#     driver: local
```
*   **Volumes**: Changed to relative path `./postgres-data` for better portability. Explicitly mentioned `cached` for macOS performance on mounted volumes. Added example for mounting `.env`.
*   **Environment Variables**: Emphasized setting `APP_KEY`. Highlighted that `DB_*` must match `POSTGRES_*` for Laravel and the init script to work together. Recommended Docker Secrets for production passwords.
*   **PostgreSQL Port**: Clarified when to expose `5432`.
*   **Healthcheck**: Added a basic healthcheck for PostgreSQL.
*   **Secrets**: Added commented-out example for using Docker Secrets.

## 4. 構建與運行

### 4.1 構建 Docker 映像
```bash
cd /Users/vichuang/Projects/NexusERP
docker build -t yourname/nexus-erp:latest .
```
*   將 `yourname` 替換為你的 Docker Hub 用戶名或私有倉庫地址 (如果需要推送)。

### 4.2 運行容器
```bash
cd /Users/vichuang/Projects/NexusERP
docker-compose up -d
```
*   首次運行時，`init-db.sh` 腳本會自動初始化 PostgreSQL 資料庫和用戶。
*   使用 `-d` 在後台運行。

### 4.3 檢查服務狀態
*   查看容器是否正在運行：
    ```bash
    docker ps
    ```
    應該能看到 `nexus-erp` 容器。
*   查看容器日誌 (包含所有服務的 stdout/stderr)：
    ```bash
    docker logs nexus-erp -f
    ```
    觀察是否有錯誤訊息。按 `Ctrl+C` 停止追蹤。

### 4.4 執行 Laravel 命令 (例如 Migrate)
*   進入正在運行的容器：
    ```bash
    docker exec -it nexus-erp sh
    ```
*   在容器內執行 artisan 命令：
    ```bash
    # cd /app/laravel # May already be in /app
    php artisan migrate --force # Use --force for non-interactive environments
    php artisan cache:clear
    php artisan config:clear
    # 其他命令...
    exit
    ```

### 4.5 驗證訪問
*   **Laravel 應用**: 打開瀏覽器訪問 `http://localhost`。
*   **Go API**: 訪問 `http://localhost:8080` (或你在 Go 應用中定義的端點，例如 `http://localhost:8080/api`)。
*   **PostgreSQL (從主機，如果 5432 端口已映射)**:
    ```bash
    psql -h localhost -p 5432 -U nexus -d nexus_erp
    ```
    輸入密碼 `securepassword`。

## 5. 連接 NexusERP (從其他 Docker 容器)

如果你的其他 Docker 專案需要連接到 NexusERP 的服務 (例如 PostgreSQL 或 Go API)，它們需要加入同一個 Docker 網路 (`nexus-network`)。

### 5.1 將其他容器加入網路
在其他專案的 `docker-compose.yml` 中：
1.  **聲明外部網路**:
    ```yaml
    networks:
      nexus-network:
        external: true
    ```
2.  **將服務連接到該網路**:
    ```yaml
    services:
      other-service:
        # ... service config ...
        networks:
          - default # Keep its default network if needed
          - nexus-network
    ```

### 5.2 連接方式
*   **連接 PostgreSQL**:
    *   主機名: `nexus-erp`
    *   端口: `5432`
    *   用戶名: `nexus`
    *   密碼: `securepassword`
    *   資料庫: `nexus_erp`
    *   **示例 (psql)**: `psql -h nexus-erp -p 5432 -U nexus -d nexus_erp`
*   **訪問 Go API**: `http://nexus-erp:8080` (例如 `curl http://nexus-erp:8080/api`)
*   **訪問 Laravel**: `http://nexus-erp` (例如 `curl http://nexus-erp`)

## 6. 問題排查

*   **容器無法啟動 / 持續重啟**:
    *   `docker logs nexus-erp`: 檢查是否有明顯錯誤 (權限、配置錯誤、端口衝突)。
    *   `docker exec -it nexus-erp sh`: 進入容器手動檢查配置文件、日誌文件 (`/var/log`)、進程狀態 (`ps aux`)。
*   **資料庫連線失敗**:
    *   確認 `init-db.sh` 成功執行 (查看 `docker logs`)。
    *   確認 Laravel 的 `.env` 或 `docker-compose.yml` 中的 `DB_*` 和 `POSTGRES_*` 變數匹配且正確。
    *   進入容器，嘗試手動連接: `psql -h 127.0.0.1 -U nexus -d nexus_erp`。
*   **Nginx 502 Bad Gateway**:
    *   檢查 PHP-FPM 是否正在運行 (`ps aux | grep php-fpm` in container)。
    *   檢查 Nginx 配置中的 `fastcgi_pass` 是否與 PHP-FPM 的監聽地址匹配 (Unix socket 或 TCP)。
    *   檢查 `/run/php/php8.2-fpm.sock` 文件是否存在且權限正確 (如果使用 socket)。
    *   查看 PHP-FPM 錯誤日誌 (可能在 `docker logs` 或容器內的 `/var/log/` 下)。
*   **檔案權限問題 (尤其是掛載卷)**:
    *   檢查 Dockerfile 中的 `chown` 和 `chmod` 命令是否針對正確的用戶和目錄。
    *   macOS 上的掛載卷性能問題，嘗試使用 `:cached` 或 `:delegated` 掛載選項。
    *   **避免 `chmod 777`**。找出哪個進程需要哪個權限，精確設定。
*   **網路問題 (跨容器)**:
    *   `docker network inspect nexus-network`: 確認所有相關容器都在此網路中。
    *   `docker exec -it <other_container_name> sh`: 進入其他容器，嘗試 `ping nexus-erp` 或 `curl http://nexus-erp:8080`。

## 7. 最佳實踐與安全性

*   **密碼管理**: **不要** 將明文密碼寫在 `docker-compose.yml` 或提交到版本控制。生產環境務必使用 Docker Secrets 或其他安全的密碼管理機制。
*   **最小權限**: 確保容器內的進程以非 root 用戶運行 (例如 `nobody`, `nginx`, `postgres`)，除非必要。
*   **端口暴露**: 僅暴露必要的端口到主機。如果 PostgreSQL 只需被其他容器訪問，不要映射 `5432:5432`。
*   **映像大小**: 定期清理未使用的 Docker 映像 (`docker image prune`) 和構建緩存 (`docker builder prune`)。多階段構建有助於減小最終映像大小。
*   **資源限制**: 在 `docker-compose.yml` 中設定 `mem_limit` 和 `cpus` 防止單個容器耗盡主機資源。
*   **備份**: 定期備份持久化數據卷 (`./postgres-data`)。
*   **日誌**: 配置結構化日誌，並考慮將日誌發送到集中的日誌系統 (ELK, Grafana Loki 等)。

---

此指南提供了一個在 macOS 上部署 NexusERP 的綜合方案。根據你的具體需求，可能需要調整某些配置細節。 