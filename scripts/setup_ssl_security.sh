#!/bin/bash

# NexusERP SSL/TLS 和網路安全設定腳本
# 用於配置生產環境的安全設定

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 檢查是否為 root 使用者
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "請以 root 權限執行此腳本"
        exit 1
    fi
}

# 安裝必要的套件
install_dependencies() {
    print_header "安裝必要套件"
    
    # 檢測作業系統
    if [ -f /etc/debian_version ]; then
        print_info "檢測到 Debian/Ubuntu 系統"
        apt-get update
        apt-get install -y nginx openssl ufw fail2ban certbot python3-certbot-nginx
        print_success "套件安裝完成"
    elif [ -f /etc/redhat-release ]; then
        print_info "檢測到 RedHat/CentOS 系統"
        yum update -y
        yum install -y nginx openssl firewalld fail2ban certbot python3-certbot-nginx
        print_success "套件安裝完成"
    elif [ "$(uname)" == "Darwin" ]; then
        print_info "檢測到 macOS 系統"
        if command -v brew >/dev/null; then
            brew install nginx openssl
            print_success "套件安裝完成"
        else
            print_warning "請先安裝 Homebrew"
        fi
    else
        print_warning "未知的作業系統，請手動安裝 nginx, openssl, ufw, fail2ban"
    fi
}

# 生成 DH 參數
generate_dhparam() {
    print_header "生成 DH 參數"
    
    mkdir -p /etc/nginx/ssl
    
    if [ ! -f /etc/nginx/ssl/dhparam.pem ]; then
        print_info "生成 DH 參數（這可能需要幾分鐘）..."
        openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
        print_success "DH 參數生成完成"
    else
        print_success "DH 參數已存在"
    fi
}

# 設定自簽證書（開發用）
setup_self_signed_cert() {
    print_header "設定自簽證書（開發環境）"
    
    mkdir -p /etc/nginx/ssl
    
    if [ ! -f /etc/nginx/ssl/nexus-erp.crt ]; then
        print_info "生成自簽證書..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/nginx/ssl/nexus-erp.key \
            -out /etc/nginx/ssl/nexus-erp.crt \
            -subj "/C=TW/ST=Taiwan/L=Taipei/O=NexusERP/CN=localhost"
        
        chmod 600 /etc/nginx/ssl/nexus-erp.key
        chmod 644 /etc/nginx/ssl/nexus-erp.crt
        
        print_success "自簽證書生成完成"
    else
        print_success "自簽證書已存在"
    fi
}

# 配置防火牆
setup_firewall() {
    print_header "配置防火牆"
    
    if command -v ufw >/dev/null; then
        print_info "配置 UFW 防火牆..."
        
        # 重置防火牆規則
        ufw --force reset
        
        # 預設政策
        ufw default deny incoming
        ufw default allow outgoing
        
        # 允許 SSH（請根據實際情況調整埠號）
        ufw allow 22/tcp
        
        # 允許 HTTP 和 HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # 允許應用程式埠（請根據實際情況調整）
        ufw allow 8080/tcp comment 'NexusERP Backend'
        ufw allow 8000/tcp comment 'NexusERP Frontend'
        
        # 限制 SSH 連接速率
        ufw limit ssh
        
        # 啟用防火牆
        ufw --force enable
        
        print_success "UFW 防火牆配置完成"
        
    elif command -v firewall-cmd >/dev/null; then
        print_info "配置 firewalld..."
        
        systemctl enable firewalld
        systemctl start firewalld
        
        # 配置服務
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-service=ssh
        
        # 配置自訂埠
        firewall-cmd --permanent --add-port=8080/tcp
        firewall-cmd --permanent --add-port=8000/tcp
        
        # 重載配置
        firewall-cmd --reload
        
        print_success "firewalld 配置完成"
    else
        print_warning "未檢測到防火牆，請手動配置"
    fi
}

# 配置 Fail2Ban
setup_fail2ban() {
    print_header "配置 Fail2Ban"
    
    if command -v fail2ban-server >/dev/null; then
        print_info "配置 Fail2Ban..."
        
        # 創建 NexusERP 專用的 jail 配置
        cat > /etc/fail2ban/jail.d/nexus-erp.conf << 'EOF'
[DEFAULT]
# 預設封鎖時間（秒）
bantime = 3600
# 檢查時間窗口（秒）
findtime = 600
# 最大嘗試次數
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 3600

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6
bantime = 3600

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 3600

[nexus-erp-auth]
enabled = true
filter = nexus-erp-auth
port = http,https
logpath = /var/log/nginx/nexus_security.log
maxretry = 5
bantime = 7200
EOF

        # 創建 NexusERP 認證失敗過濾器
        cat > /etc/fail2ban/filter.d/nexus-erp-auth.conf << 'EOF'
[Definition]
# 匹配 NexusERP 認證失敗的模式
failregex = ^<HOST> .* "POST /api/auth/login HTTP.*" 401 .*$
            ^<HOST> .* "POST /api/auth/register HTTP.*" 401 .*$
            ^<HOST> .* "POST /api/auth/refresh HTTP.*" 401 .*$

ignoreregex =
EOF

        # 重啟 Fail2Ban 服務
        systemctl enable fail2ban
        systemctl restart fail2ban
        
        print_success "Fail2Ban 配置完成"
    else
        print_warning "Fail2Ban 未安裝，請手動安裝和配置"
    fi
}

# 配置 Nginx 安全設定
setup_nginx_security() {
    print_header "配置 Nginx 安全設定"
    
    # 備份原始配置
    if [ -f /etc/nginx/nginx.conf ]; then
        cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d)
        print_info "已備份原始 Nginx 配置"
    fi
    
    # 複製安全配置檔案
    cp nginx/conf.d/ssl-security.conf /etc/nginx/conf.d/
    
    # 創建主要的 server 配置
    cat > /etc/nginx/sites-available/nexus-erp << 'EOF'
# NexusERP 主要配置檔案

# HTTP 重導向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name _;
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;
    
    # SSL 證書配置
    ssl_certificate /etc/nginx/ssl/nexus-erp.crt;
    ssl_certificate_key /etc/nginx/ssl/nexus-erp.key;
    
    # 包含安全配置
    include /etc/nginx/conf.d/ssl-security.conf;
    
    # 日誌配置
    access_log /var/log/nginx/nexus-erp-access.log;
    error_log /var/log/nginx/nexus-erp-error.log;
    
    # 根目錄配置
    root /var/www/nexus-erp/frontend/public;
    index index.php index.html index.htm;
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # PHP 處理
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # 後端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超時設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 緩衝設定
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # WebSocket 支援（如需要）
    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 靜態資源
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
}
EOF

    # 啟用站點
    ln -sf /etc/nginx/sites-available/nexus-erp /etc/nginx/sites-enabled/
    
    # 移除預設站點
    rm -f /etc/nginx/sites-enabled/default
    
    # 測試配置
    if nginx -t; then
        print_success "Nginx 配置測試通過"
        systemctl enable nginx
        systemctl reload nginx
        print_success "Nginx 服務已重新載入"
    else
        print_error "Nginx 配置有誤，請檢查"
        exit 1
    fi
}

# 設定 Let's Encrypt 證書（生產環境）
setup_letsencrypt() {
    print_header "設定 Let's Encrypt 證書"
    
    read -p "請輸入您的域名（例如：example.com）: " domain_name
    read -p "請輸入您的電子郵件地址: " email_address
    
    if [ -n "$domain_name" ] && [ -n "$email_address" ]; then
        print_info "正在獲取 Let's Encrypt 證書..."
        
        # 停止 nginx 以釋放 80 埠
        systemctl stop nginx
        
        # 獲取證書
        certbot certonly --standalone --agree-tos --no-eff-email \
            --email "$email_address" -d "$domain_name"
        
        if [ $? -eq 0 ]; then
            # 更新 nginx 配置使用 Let's Encrypt 證書
            sed -i "s|ssl_certificate /etc/nginx/ssl/nexus-erp.crt;|ssl_certificate /etc/letsencrypt/live/$domain_name/fullchain.pem;|" \
                /etc/nginx/sites-available/nexus-erp
            sed -i "s|ssl_certificate_key /etc/nginx/ssl/nexus-erp.key;|ssl_certificate_key /etc/letsencrypt/live/$domain_name/privkey.pem;|" \
                /etc/nginx/sites-available/nexus-erp
            sed -i "s|server_name _;|server_name $domain_name;|" \
                /etc/nginx/sites-available/nexus-erp
            
            # 設定自動續約
            (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
            
            print_success "Let's Encrypt 證書設定完成"
        else
            print_error "Let's Encrypt 證書獲取失敗"
        fi
        
        # 重啟 nginx
        systemctl start nginx
    else
        print_warning "跳過 Let's Encrypt 設定"
    fi
}

# 設定網路監控
setup_monitoring() {
    print_header "設定網路監控"
    
    # 創建監控腳本
    cat > /usr/local/bin/nexus-security-monitor.sh << 'EOF'
#!/bin/bash

# NexusERP 安全監控腳本
LOG_FILE="/var/log/nexus-security-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 檢查異常連接
SUSPICIOUS_CONNECTIONS=$(netstat -tuln | grep -E ':80|:443|:8080|:8000' | wc -l)
if [ $SUSPICIOUS_CONNECTIONS -gt 100 ]; then
    echo "[$DATE] WARNING: High number of connections detected: $SUSPICIOUS_CONNECTIONS" >> $LOG_FILE
fi

# 檢查磁碟使用率
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "[$DATE] CRITICAL: Disk usage is $DISK_USAGE%" >> $LOG_FILE
fi

# 檢查記憶體使用率
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    echo "[$DATE] WARNING: Memory usage is $MEMORY_USAGE%" >> $LOG_FILE
fi

# 檢查 Fail2Ban 狀態
if systemctl is-active --quiet fail2ban; then
    BANNED_IPS=$(fail2ban-client status | grep "Jail list" | cut -d: -f2 | xargs -n1 fail2ban-client status | grep "Currently banned" | wc -l)
    if [ $BANNED_IPS -gt 0 ]; then
        echo "[$DATE] INFO: $BANNED_IPS IPs currently banned by Fail2Ban" >> $LOG_FILE
    fi
fi

# 檢查 SSL 證書到期時間
if [ -f /etc/letsencrypt/live/*/cert.pem ]; then
    CERT_EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/*/cert.pem -noout -enddate | cut -d= -f2)
    EXPIRY_TIMESTAMP=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
    
    if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
        echo "[$DATE] WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days" >> $LOG_FILE
    fi
fi
EOF

    chmod +x /usr/local/bin/nexus-security-monitor.sh
    
    # 設定定時執行
    (crontab -l 2>/dev/null; echo "*/15 * * * * /usr/local/bin/nexus-security-monitor.sh") | crontab -
    
    print_success "網路監控設定完成"
}

# 顯示安全摘要
show_security_summary() {
    print_header "安全設定摘要"
    
    echo -e "${GREEN}✅ SSL/TLS 安全配置已完成${NC}"
    echo -e "${GREEN}✅ HTTP 安全標頭已啟用${NC}"
    echo -e "${GREEN}✅ 防火牆已配置${NC}"
    echo -e "${GREEN}✅ Fail2Ban 入侵防護已啟用${NC}"
    echo -e "${GREEN}✅ Nginx 安全配置已應用${NC}"
    echo -e "${GREEN}✅ 網路監控已設定${NC}"
    
    echo ""
    echo -e "${BLUE}重要提醒：${NC}"
    echo "1. 定期更新系統和套件"
    echo "2. 監控安全日誌："
    echo "   - /var/log/nginx/nexus_security.log"
    echo "   - /var/log/nexus-security-monitor.log"
    echo "   - /var/log/fail2ban.log"
    echo "3. 定期檢查 SSL 證書狀態"
    echo "4. 考慮使用 CDN 和 WAF 服務"
    echo "5. 實施定期的安全掃描"
}

# 主程式
main() {
    print_header "NexusERP SSL/TLS 和網路安全設定"
    
    check_root
    install_dependencies
    generate_dhparam
    setup_self_signed_cert
    setup_firewall
    setup_fail2ban
    setup_nginx_security
    setup_monitoring
    
    # 詢問是否設定 Let's Encrypt
    echo ""
    read -p "是否要設定 Let's Encrypt 證書？(y/N): " setup_le
    if [[ $setup_le =~ ^[Yy]$ ]]; then
        setup_letsencrypt
    fi
    
    show_security_summary
    
    print_success "SSL/TLS 和網路安全設定完成！"
}

# 執行主程式
main "$@"