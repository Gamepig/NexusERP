<?php
// 測試出貨功能的腳本
require_once __DIR__ . '/frontend/vendor/autoload.php';

// 設定測試數據
$baseUrl = 'http://127.0.0.1:8000/api';
$webUrl = 'http://127.0.0.1:8000';
$testData = [
    'order_number' => 'TEST-' . time(),
    'customer_id' => 1,
    'status' => 'confirmed',
    'order_items' => [
        [
            'product_id' => 843,
            'quantity' => 10,
            'unit_price' => 100.00
        ]
    ]
];

// 測試函數
function testAPI($url, $data = null, $method = 'GET', $cookies = null, $csrfToken = null) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
        'X-Requested-With: XMLHttpRequest'
    ];
    
    if ($csrfToken) {
        $headers[] = 'X-CSRF-TOKEN: ' . $csrfToken;
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($cookies) {
        curl_setopt($ch, CURLOPT_COOKIE, $cookies);
    }
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status_code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

// 登入函數
function login($email, $password) {
    global $webUrl;
    
    // 第一步：獲取 CSRF token
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$webUrl/login");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/cookies.txt');
    curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/cookies.txt');
    
    $loginPage = curl_exec($ch);
    curl_close($ch);
    
    // 從登入頁面解析 CSRF token
    preg_match('/<meta name="csrf-token" content="([^"]+)"/', $loginPage, $matches);
    $csrfToken = $matches[1] ?? '';
    
    // 第二步：提交登入表單
    $ch = curl_init();  
    curl_setopt($ch, CURLOPT_URL, "$webUrl/login");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/cookies.txt');
    curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/cookies.txt');
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        '_token' => $csrfToken,
        'email' => $email,
        'password' => $password
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-CSRF-TOKEN: ' . $csrfToken,
        'Referer: ' . $webUrl . '/login'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // 讀取 cookies 和 XSRF-TOKEN
    $cookieString = '';
    $xsrfToken = '';
    if (file_exists('/tmp/cookies.txt')) {
        $cookieContent = file_get_contents('/tmp/cookies.txt');
        $lines = explode("\n", $cookieContent);
        
        foreach ($lines as $line) {
            if (strpos($line, "\t") !== false) {
                $parts = explode("\t", $line);
                if (count($parts) >= 7) {
                    $cookieName = $parts[5];
                    $cookieValue = $parts[6];
                    $cookieString .= $cookieName . '=' . $cookieValue . '; ';
                    
                    // 特別處理 XSRF-TOKEN
                    if ($cookieName === 'XSRF-TOKEN') {
                        // URL decode the XSRF token
                        $xsrfToken = urldecode($cookieValue);
                        // 解碼 Laravel 的加密 token (簡化版)
                        $tokenData = json_decode(base64_decode($xsrfToken), true);
                        if (isset($tokenData['value'])) {
                            $xsrfToken = $tokenData['value'];
                        }
                    }
                }
            }
        }
    }
    
    return [
        'status_code' => $httpCode,
        'cookies' => trim($cookieString, '; '),
        'csrf_token' => $xsrfToken ?: $csrfToken
    ];
}

echo "=== 測試出貨功能 ===\n\n";

// 0. 登入系統
echo "0. 登入系統:\n";
$loginResult = login('test@example.com', 'password123');
echo "Login Status: {$loginResult['status_code']}\n";
$cookies = $loginResult['cookies'];
$csrfToken = $loginResult['csrf_token'];
echo "Cookies: " . substr($cookies, 0, 50) . "...\n";
echo "CSRF Token: " . substr($csrfToken, 0, 20) . "...\n\n";

// 1. 檢查庫存狀態（從資料庫直接查詢實際數據）
echo "1. 檢查產品 843 的庫存狀態:\n";
$inventoryResult = testAPI("$baseUrl/inventory/levels?product_id=843", null, 'GET', $cookies, $csrfToken);
echo "Status: {$inventoryResult['status_code']}\n";
if ($inventoryResult['response']) {
    echo "Response: " . json_encode($inventoryResult['response'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}
echo "\n";

// 2. 建立測試訂單
echo "2. 建立測試訂單:\n";
$orderResult = testAPI("$baseUrl/sales-orders", $testData, 'POST', $cookies, $csrfToken);
echo "Status: {$orderResult['status_code']}\n";
if ($orderResult['response']) {
    $orderId = $orderResult['response']['data']['id'] ?? null;
    echo "訂單 ID: $orderId\n";
    echo "訂單狀態: " . ($orderResult['response']['data']['status'] ?? 'unknown') . "\n";
    echo "Response: " . json_encode($orderResult['response'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} else {
    echo "錯誤: " . json_encode($orderResult['response']) . "\n";
}
echo "\n";

// 3. 測試出貨功能
if (isset($orderId)) {
    echo "3. 測試出貨功能:\n";
    $shipmentData = [
        'tracking_number' => 'TRACK-' . time(),
        'shipped_date' => date('Y-m-d'),
        'carrier' => 'Test Courier'
    ];
    
    $shipResult = testAPI("$baseUrl/sales-orders/$orderId/ship", $shipmentData, 'POST', $cookies, $csrfToken);
    echo "Status: {$shipResult['status_code']}\n";
    if ($shipResult['response']) {
        echo "出貨結果: " . json_encode($shipResult['response'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    }
    echo "\n";

    // 4. 檢查出貨後的庫存
    echo "4. 檢查出貨後的庫存:\n";
    $inventoryAfter = testAPI("$baseUrl/inventory/levels?product_id=843", null, 'GET', $cookies, $csrfToken);
    if ($inventoryAfter['response']) {
        echo "Response: " . json_encode($inventoryAfter['response'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    }
}

echo "\n=== 測試完成 ===\n";