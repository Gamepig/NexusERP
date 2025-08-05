#!/bin/bash

echo "🔍 NexusERP 導航功能驗證腳本"
echo "=================================="
echo

# 檢查網站是否可存取
echo "1. 檢查網站可存取性..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000 | grep -q "200"; then
    echo "   ✅ 網站正常運行 (HTTP 200)"
else
    echo "   ❌ 網站無法存取"
    exit 1
fi

# 檢查調試元素
echo "2. 檢查調試元素移除..."
if curl -s http://127.0.0.1:8000 | grep -q "修復導航\|debug.*button\|test-button"; then
    echo "   ❌ 仍然發現調試元素"
else
    echo "   ✅ 無調試元素殘留"
fi

# 檢查導航組件載入
echo "3. 檢查導航組件..."
if curl -s http://127.0.0.1:8000 | grep -q "enhanced-navigation\|nexus-nav"; then
    echo "   ✅ 導航組件正常載入"
else
    echo "   ⚠️  無法檢測導航組件（可能需要 JavaScript 渲染）"
fi

# 檢查關鍵文件
echo "4. 檢查關鍵導航檔案..."
files=(
    "resources/views/layouts/app.blade.php"
    "resources/views/components/layouts/enhanced-navigation.blade.php"
    "resources/views/components/navigation/multi-level-nav.blade.php"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "修復導航\|debug.*button" "$file"; then
            echo "   ❌ $file 仍包含調試程式碼"
        else
            echo "   ✅ $file 已清理"
        fi
    else
        echo "   ⚠️  $file 不存在"
    fi
done

# 檢查滾動相關問題
echo "5. 檢查滾動設定..."
if grep -r "max-height.*200px\|overflow.*auto.*200" resources/views/components/navigation/ 2>/dev/null; then
    echo "   ❌ 仍然存在滾動限制設定"
else
    echo "   ✅ 無異常滾動設定"
fi

echo
echo "🎯 驗證完成！"
echo "請手動訪問 http://127.0.0.1:8000 進行最終確認："
echo "   • 無「🔧 修復導航」按鈕"
echo "   • 下拉選單無異常滾動條"
echo "   • 所有導航功能正常"
echo
echo "如需重新開啟瀏覽器測試，請執行："
echo "   open http://127.0.0.1:8000"