#!/bin/bash

echo "🔍 現金流量表顏色修正最終驗證"
echo "================================"

# 檢查伺服器狀態
echo "1. 檢查Laravel伺服器狀態..."
if lsof -i :8000 > /dev/null 2>&1; then
    echo "✅ Laravel伺服器正在端口8000運行"
else
    echo "❌ Laravel伺服器未運行，請先啟動伺服器"
    exit 1
fi

# 檢查現金流量表相關檔案
echo ""
echo "2. 檢查現金流量表相關檔案..."

echo "📁 檢查控制器檔案:"
if [ -f "app/Http/Controllers/ReportsController.php" ]; then
    echo "✅ ReportsController.php 存在"
else
    echo "❌ ReportsController.php 不存在"
fi

echo "📁 檢查視圖檔案:"
if [ -f "resources/views/reports/financial/cash-flow.blade.php" ]; then
    echo "✅ cash-flow.blade.php 存在"
else
    echo "❌ cash-flow.blade.php 不存在"
fi

echo "📁 檢查CSS檔案:"
if [ -f "public/css/reports.css" ]; then
    echo "✅ reports.css 存在"
else
    echo "❌ reports.css 不存在"
fi

echo ""
echo "3. 檢查CSS中的顏色定義..."
if [ -f "public/css/reports.css" ]; then
    echo "🎨 CSS顏色定義:"
    grep -n "background\|bg-" public/css/reports.css | head -20
fi

echo ""
echo "4. 現在請手動執行以下步驟進行最終驗證："
echo ""
echo "🌐 請在瀏覽器中執行以下步驟："
echo "   1. 開啟瀏覽器訪問: http://127.0.0.1:8000/login"
echo "   2. 使用測試帳號登入:"
echo "      - 帳號: test@example.com"
echo "      - 密碼: password123"
echo "   3. 登入後訪問: http://127.0.0.1:8000/reports/financial/cash-flow"
echo ""
echo "🔍 請檢查以下顏色是否正確顯示："
echo ""
echo "📊 表格主要區域："
echo "   - 營業活動現金流量（標題行）→ 綠色背景"
echo "   - 營業活動現金流入淨額（總計行）→ 較深綠色背景"
echo "   - 投資活動現金流量（標題行）→ 橘色背景"
echo "   - 投資活動現金流出淨額（總計行）→ 較深橘色背景"
echo "   - 籌資活動現金流量（標題行）→ 藍色背景"
echo "   - 籌資活動現金流出淨額（總計行）→ 較深藍色背景"
echo ""
echo "💰 底部總計區域："
echo "   - 本期現金淨增減（重要總計）→ 灰色背景"
echo "   - 期初現金餘額 → 淺灰色背景"
echo "   - 期末現金餘額 → 綠色背景（最終結果）"
echo ""
echo "📈 右側圖表區域："
echo "   - 營業活動現金流 → 綠色背景"
echo "   - 投資活動現金流 → 橘色背景"
echo "   - 籌資活動現金流 → 藍色背景"
echo "   - 現金淨增減 → 灰色背景"
echo ""
echo "✅ 如果所有顏色都正確顯示，表示修正已完成！"
echo ""

# 開啟瀏覽器（Mac系統）
echo "🚀 正在開啟瀏覽器到登入頁面..."
open "http://127.0.0.1:8000/login"

echo ""
echo "按 Enter 鍵檢查完成後繼續..."
read -p ""

echo "驗證完成！請確認所有顏色都已正確顯示。"