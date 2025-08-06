#!/bin/bash

# NexusERP Quick Test Runner
# 快速測試執行腳本

set -e  # Exit on any error

echo "🚀 NexusERP Quick Test Runner"
echo "=============================="

# Function to check if Laravel is running
check_laravel() {
    echo "🔍 檢查 Laravel 應用程式..."
    if curl -s --max-time 5 http://127.0.0.1:8000 > /dev/null 2>&1; then
        echo "✅ Laravel 應用程式運行正常"
        return 0
    else
        echo "❌ Laravel 應用程式未運行"
        return 1
    fi
}

# Function to start Laravel if not running
start_laravel() {
    echo "🌐 啟動 Laravel 應用程式..."
    cd frontend
    php artisan serve --port=8000 --host=127.0.0.1 &
    LARAVEL_PID=$!
    echo "📝 Laravel PID: $LARAVEL_PID"
    
    # Wait for Laravel to start
    echo "⏳ 等待 Laravel 啟動..."
    for i in {1..30}; do
        if curl -s --max-time 2 http://127.0.0.1:8000 > /dev/null 2>&1; then
            echo "✅ Laravel 已成功啟動"
            cd ..
            return 0
        fi
        sleep 2
        echo "   嘗試 $i/30..."
    done
    
    echo "❌ Laravel 啟動超時"
    cd ..
    return 1
}

# Function to run tests
run_tests() {
    local test_type=${1:-"auth"}
    echo "🧪 執行 $test_type 測試..."
    
    case $test_type in
        "auth")
            node run-comprehensive-tests.js --suite=auth --headed
            ;;
        "customers")
            node run-comprehensive-tests.js --suite=customers --headed
            ;;
        "all")
            node run-comprehensive-tests.js --headed
            ;;
        "quick")
            node run-comprehensive-tests.js --suite=auth
            ;;
        *)
            echo "🔧 可用的測試選項: auth, customers, all, quick"
            exit 1
            ;;
    esac
}

# Function to show results
show_results() {
    echo ""
    echo "📊 測試結果摘要"
    echo "================"
    
    if [ -f "test-results/comprehensive-test-report.html" ]; then
        echo "📋 HTML 報告: test-results/comprehensive-test-report.html"
        
        # Try to open report (macOS)
        if command -v open &> /dev/null; then
            echo "🌐 自動開啟測試報告..."
            open test-results/comprehensive-test-report.html
        fi
    fi
    
    if [ -d "test-results/screenshots" ]; then
        local screenshot_count=$(find test-results/screenshots -name "*.png" 2>/dev/null | wc -l)
        echo "📸 截圖數量: $screenshot_count"
    fi
}

# Function to cleanup
cleanup() {
    echo ""
    echo "🧹 清理資源..."
    
    if [ ! -z "$LARAVEL_PID" ]; then
        echo "🛑 停止 Laravel (PID: $LARAVEL_PID)"
        kill $LARAVEL_PID 2>/dev/null || true
    fi
    
    echo "✅ 清理完成"
}

# Set up cleanup trap
trap cleanup EXIT

# Main execution
main() {
    local test_type=${1:-"quick"}
    
    echo "🎯 執行測試類型: $test_type"
    echo ""
    
    # Check Laravel status
    if ! check_laravel; then
        echo "🚀 嘗試啟動 Laravel..."
        if ! start_laravel; then
            echo "❌ 無法啟動 Laravel，請手動啟動："
            echo "   cd frontend && php artisan serve --port=8000"
            exit 1
        fi
    fi
    
    # Ensure we're in the right directory
    if [ ! -f "run-comprehensive-tests.js" ]; then
        echo "❌ 找不到測試執行器，請確認在專案根目錄執行此腳本"
        exit 1
    fi
    
    # Make test runner executable
    chmod +x run-comprehensive-tests.js
    
    # Run tests
    if run_tests $test_type; then
        echo ""
        echo "🎉 測試執行完成！"
        show_results
    else
        echo ""
        echo "❌ 測試執行失敗"
        show_results
        exit 1
    fi
}

# Help text
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    cat << EOF
🧪 NexusERP Quick Test Runner

Usage: ./run-quick-test.sh [test_type]

Test Types:
  quick      - 快速認證測試 (預設)
  auth       - 完整認證測試 (有視窗)
  customers  - 客戶管理測試 (有視窗)
  all        - 所有測試 (有視窗)

Examples:
  ./run-quick-test.sh              # 快速測試
  ./run-quick-test.sh auth         # 認證測試
  ./run-quick-test.sh customers    # 客戶測試
  ./run-quick-test.sh all          # 所有測試

Notes:
  - 腳本會自動檢查並啟動 Laravel (如需要)
  - 測試完成後會自動開啟結果報告
  - 支援 macOS 環境
EOF
    exit 0
fi

# Run main function
main $1