#!/bin/bash

# NexusERP 安全掃描腳本
# 執行自動化安全測試和掃描

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 輔助函數
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

# 檢查必要工具是否安裝
check_tools() {
    print_header "檢查安全掃描工具"
    
    local tools=("npm" "go" "docker")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            print_success "$tool 已安裝"
        else
            print_error "$tool 未安裝"
            missing_tools+=("$tool")
        fi
    done
    
    # 檢查可選的安全掃描工具
    local optional_tools=("semgrep" "gosec" "npm-audit" "bandit")
    for tool in "${optional_tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            print_success "$tool 已安裝"
        else
            print_warning "$tool 未安裝（可選）"
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "缺少必要工具：${missing_tools[*]}"
        exit 1
    fi
}

# 執行 Go 代碼安全掃描
run_go_security_scan() {
    print_header "執行 Go 代碼安全掃描"
    
    cd backend
    
    # 使用內建的 go vet
    print_info "運行 go vet..."
    if go vet ./...; then
        print_success "go vet 檢查通過"
    else
        print_error "go vet 發現問題"
    fi
    
    # 檢查是否有 gosec
    if command -v gosec >/dev/null 2>&1; then
        print_info "運行 gosec 安全掃描..."
        if gosec -fmt json -out ../reports/gosec-report.json ./...; then
            print_success "gosec 掃描完成，報告已生成"
        else
            print_warning "gosec 掃描發現潛在問題"
        fi
    else
        print_warning "gosec 未安裝，跳過 Go 安全掃描"
        print_info "安裝指令：go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest"
    fi
    
    # 檢查依賴漏洞
    print_info "檢查 Go 依賴漏洞..."
    if go list -json -deps ./... | nancy sleuth; then
        print_success "依賴漏洞檢查通過"
    else
        print_warning "Nancy 未安裝或發現漏洞"
        print_info "安裝指令：go install github.com/sonatypeoss/nancy@latest"
    fi
    
    cd ..
}

# 執行前端安全掃描
run_frontend_security_scan() {
    print_header "執行前端安全掃描"
    
    cd frontend
    
    # NPM audit
    print_info "運行 npm audit..."
    if npm audit --audit-level=moderate; then
        print_success "npm audit 檢查通過"
    else
        print_warning "npm audit 發現安全問題"
        print_info "嘗試自動修復：npm audit fix"
    fi
    
    # 檢查 package.json 中的已知漏洞
    print_info "檢查已知漏洞..."
    npm audit --json > ../reports/npm-audit-report.json 2>/dev/null || true
    
    cd ..
}

# 執行靜態代碼分析
run_static_analysis() {
    print_header "執行靜態代碼分析"
    
    # 檢查是否有 semgrep
    if command -v semgrep >/dev/null 2>&1; then
        print_info "運行 Semgrep 安全規則..."
        
        # 建立報告目錄
        mkdir -p reports
        
        # 掃描 Go 代碼
        semgrep --config=auto --json --output=reports/semgrep-go-report.json backend/ || true
        
        # 掃描 PHP 代碼
        semgrep --config=auto --json --output=reports/semgrep-php-report.json frontend/ || true
        
        # 掃描 JavaScript 代碼
        semgrep --config=auto --json --output=reports/semgrep-js-report.json frontend/resources/js/ || true
        
        print_success "Semgrep 掃描完成"
    else
        print_warning "Semgrep 未安裝，跳過靜態分析"
        print_info "安裝指令：pip install semgrep"
    fi
}

# 執行配置安全檢查
run_config_security_check() {
    print_header "執行配置安全檢查"
    
    mkdir -p reports
    
    print_info "檢查環境變數配置..."
    
    # 檢查 .env 範例檔案
    local security_issues=()
    
    if [ -f ".env.example" ]; then
        # 檢查是否有預設的不安全密碼
        if grep -q "password.*=" .env.example; then
            while IFS= read -r line; do
                if [[ $line =~ password.*= ]]; then
                    security_issues+=("發現預設密碼設定：$line")
                fi
            done < .env.example
        fi
        
        # 檢查 JWT 密鑰
        if grep -q "JWT_SECRET.*=" .env.example; then
            local jwt_secret=$(grep "JWT_SECRET" .env.example | cut -d'=' -f2)
            if [ ${#jwt_secret} -lt 32 ]; then
                security_issues+=("JWT_SECRET 長度不足（建議至少 32 字符）")
            fi
        fi
        
        print_success ".env.example 配置檢查完成"
    else
        print_warning ".env.example 檔案不存在"
    fi
    
    # 檢查 Docker 配置
    if [ -f "docker-compose.yml" ]; then
        print_info "檢查 Docker 配置..."
        
        # 檢查是否有硬編碼密碼
        if grep -i "password" docker-compose.yml | grep -v "\\$"; then
            security_issues+=("Docker 配置中發現硬編碼密碼")
        fi
        
        print_success "Docker 配置檢查完成"
    fi
    
    # 輸出安全問題報告
    if [ ${#security_issues[@]} -gt 0 ]; then
        print_warning "發現配置安全問題："
        for issue in "${security_issues[@]}"; do
            echo -e "  ${RED}- $issue${NC}"
        done
    else
        print_success "配置安全檢查通過"
    fi
    
    # 生成配置安全報告
    {
        echo "# 配置安全檢查報告"
        echo "## 檢查時間：$(date)"
        echo ""
        if [ ${#security_issues[@]} -gt 0 ]; then
            echo "## 發現的問題："
            for issue in "${security_issues[@]}"; do
                echo "- $issue"
            done
        else
            echo "## 結果：無安全問題"
        fi
    } > reports/config-security-report.md
}

# 執行權限檢查
run_permission_check() {
    print_header "執行檔案權限檢查"
    
    print_info "檢查敏感檔案權限..."
    
    local permission_issues=()
    
    # 檢查關鍵檔案權限
    local sensitive_files=(".env" "config/" "backend/internal/config/")
    
    for file in "${sensitive_files[@]}"; do
        if [ -e "$file" ]; then
            local perms=$(stat -f "%A" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)
            if [ "$perms" = "644" ] || [ "$perms" = "755" ]; then
                permission_issues+=("$file 權限過於寬鬆：$perms")
            fi
        fi
    done
    
    # 檢查腳本執行權限
    local scripts=(scripts/*.sh)
    for script in "${scripts[@]}"; do
        if [ -f "$script" ] && [ ! -x "$script" ]; then
            permission_issues+=("腳本 $script 缺少執行權限")
        fi
    done
    
    if [ ${#permission_issues[@]} -gt 0 ]; then
        print_warning "發現權限問題："
        for issue in "${permission_issues[@]}"; do
            echo -e "  ${RED}- $issue${NC}"
        done
    else
        print_success "檔案權限檢查通過"
    fi
}

# 執行模擬滲透測試
run_penetration_test() {
    print_header "執行模擬滲透測試"
    
    print_info "檢查是否有正在運行的 NexusERP 服務..."
    
    # 檢查服務是否運行
    local backend_port=8080
    local frontend_port=8000
    
    if netstat -an 2>/dev/null | grep -q ":$backend_port.*LISTEN" || ss -an 2>/dev/null | grep -q ":$backend_port.*LISTEN"; then
        print_success "後端服務正在運行（埠 $backend_port）"
        
        # 基本 API 安全測試
        print_info "執行基本 API 安全測試..."
        
        # 測試未授權存取
        local unauthorized_test=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$backend_port/api/users 2>/dev/null || echo "000")
        if [ "$unauthorized_test" = "401" ] || [ "$unauthorized_test" = "403" ]; then
            print_success "API 正確拒絕未授權存取"
        else
            print_error "API 可能存在授權問題（回應碼：$unauthorized_test）"
        fi
        
        # 測試 SQL 注入防護
        print_info "測試 SQL 注入防護..."
        local sqli_test=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$backend_port/api/users?id=1'OR'1'='1" 2>/dev/null || echo "000")
        if [ "$sqli_test" = "400" ] || [ "$sqli_test" = "401" ] || [ "$sqli_test" = "403" ]; then
            print_success "SQL 注入防護正常"
        else
            print_warning "SQL 注入防護可能有問題（回應碼：$sqli_test）"
        fi
        
    else
        print_warning "後端服務未運行，跳過 API 測試"
        print_info "啟動後端服務：cd backend && go run cmd/main.go"
    fi
}

# 生成安全報告
generate_security_report() {
    print_header "生成安全掃描報告"
    
    mkdir -p reports
    
    local report_file="reports/security-scan-report-$(date +%Y%m%d-%H%M%S).md"
    
    {
        echo "# NexusERP 安全掃描報告"
        echo ""
        echo "**掃描時間：** $(date)"
        echo "**掃描版本：** $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
        echo ""
        
        echo "## 掃描摘要"
        echo ""
        echo "本次安全掃描包含以下項目："
        echo "- Go 代碼安全掃描"
        echo "- 前端依賴漏洞檢查"
        echo "- 靜態代碼分析"
        echo "- 配置安全檢查"
        echo "- 檔案權限檢查"
        echo "- 基本滲透測試"
        echo ""
        
        echo "## 詳細報告"
        echo ""
        echo "詳細的掃描結果請參考以下檔案："
        echo ""
        
        if [ -f "reports/gosec-report.json" ]; then
            echo "- \`reports/gosec-report.json\` - Go 安全掃描報告"
        fi
        
        if [ -f "reports/npm-audit-report.json" ]; then
            echo "- \`reports/npm-audit-report.json\` - NPM 漏洞掃描報告"
        fi
        
        if [ -f "reports/semgrep-go-report.json" ]; then
            echo "- \`reports/semgrep-go-report.json\` - Go 靜態分析報告"
        fi
        
        if [ -f "reports/config-security-report.md" ]; then
            echo "- \`reports/config-security-report.md\` - 配置安全檢查報告"
        fi
        
        echo ""
        echo "## 建議改進項目"
        echo ""
        echo "1. 定期執行安全掃描（建議每週一次）"
        echo "2. 保持依賴套件更新"
        echo "3. 定期檢查和更新安全配置"
        echo "4. 實施自動化安全測試"
        echo "5. 進行專業的滲透測試"
        echo ""
        
        echo "## 下次掃描"
        echo ""
        echo "建議下次掃描時間：$(date -d '+1 week' '+%Y-%m-%d' 2>/dev/null || date -v+1w '+%Y-%m-%d' 2>/dev/null || echo "一週後")"
        
    } > "$report_file"
    
    print_success "安全報告已生成：$report_file"
}

# 主程式
main() {
    print_header "NexusERP 安全掃描工具"
    
    echo "開始執行全面的安全掃描..."
    echo ""
    
    # 建立報告目錄
    mkdir -p reports
    
    # 執行各項檢查
    check_tools
    run_go_security_scan
    run_frontend_security_scan
    run_static_analysis
    run_config_security_check
    run_permission_check
    run_penetration_test
    generate_security_report
    
    print_header "安全掃描完成"
    print_success "所有掃描項目已完成"
    print_info "請檢查 reports/ 目錄中的詳細報告"
    
    echo ""
    echo "如需更詳細的安全評估，建議："
    echo "1. 使用專業安全掃描工具（如 OWASP ZAP, Burp Suite）"
    echo "2. 委託專業安全團隊進行滲透測試"
    echo "3. 實施持續的安全監控"
}

# 執行主程式
main "$@"