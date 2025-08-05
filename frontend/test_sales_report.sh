#!/bin/bash

echo "🧪 Testing NexusERP Sales Report Page..."

# 1. 確保服務運行
echo "1. Checking Laravel service..."
if ! curl -s http://127.0.0.1:8000/login > /dev/null; then
    echo "❌ Laravel service not accessible"
    exit 1
fi
echo "✅ Laravel service is running"

# 2. 測試 API endpoint
echo "2. Testing sales report API..."
API_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://127.0.0.1:8000/api/reports/sales?date_from=2025-01-01&date_to=2025-12-31")
echo "API Response Code: $API_RESPONSE"

# 3. 檢查測試數據
echo "3. Checking test data..."
php -r "
require 'vendor/autoload.php';
\$app = require 'bootstrap/app.php';
\$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

\$orderCount = DB::table('sales_orders')->where('business_unit_id', 176)->count();
\$totalSales = DB::table('sales_orders')->where('business_unit_id', 176)->sum('total_amount');

echo \"Sales Orders: \$orderCount\\n\";
echo \"Total Sales: \" . number_format(\$totalSales, 2) . \"\\n\";

if (\$orderCount > 0) {
    echo \"✅ Test data is available\\n\";
} else {
    echo \"❌ No test data found\\n\";
}
"

# 4. 開啟瀏覽器進行手動測試
echo "4. Opening browser for manual testing..."
echo "Please login with: test@example.com / password123"
echo "Then navigate to: http://127.0.0.1:8000/reports/sales"

osascript << EOF
tell application "Google Chrome"
    activate
    open location "http://127.0.0.1:8000/reports/sales"
end tell
EOF

echo "
📝 Manual Test Steps:
1. Login with test@example.com / password123
2. Navigate to Reports > Sales Report  
3. Check if charts and data are displayed correctly
4. Verify the following elements:
   - Summary cards (Total Sales, Orders Count, Average Order)
   - Sales trend chart (should show data)
   - Top customers chart (should show data)
   - Sales detail table (should have data rows)
   - Date filter functionality
   - Export buttons

Please take a screenshot and share for analysis.
"