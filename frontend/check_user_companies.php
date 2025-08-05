<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // 檢查 user_companies 表資料
    $result = DB::select('SELECT * FROM user_companies WHERE user_id = 1191 LIMIT 1');
    
    if (!empty($result)) {
        echo "📊 user_companies 表資料:\n";
        foreach ($result[0] as $key => $value) {
            echo "  {$key}: {$value}\n";
        }
        
        // 檢查 is_primary 和 is_active 字段的值
        $record = $result[0];
        echo "\n🔍 關鍵字段檢查:\n";
        echo "  is_primary: " . (isset($record->is_primary) ? ($record->is_primary ? 'true' : 'false') : 'null') . "\n";
        echo "  is_active: " . (isset($record->is_active) ? ($record->is_active ? 'true' : 'false') : 'null') . "\n";
        
    } else {
        echo "❌ user_companies 表中沒有用戶 1191 的記錄\n";
        
        // 檢查表結構
        $columns = DB::select("SELECT column_name, data_type, is_nullable 
                              FROM information_schema.columns 
                              WHERE table_name = 'user_companies' 
                              ORDER BY ordinal_position");
        
        echo "\n📋 user_companies 表結構:\n";
        foreach ($columns as $column) {
            echo "  {$column->column_name}: {$column->data_type} " . 
                 ($column->is_nullable === 'YES' ? '(nullable)' : '(not null)') . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ 錯誤: " . $e->getMessage() . "\n";
    echo "📚 堆疊跟蹤:\n" . $e->getTraceAsString() . "\n";
}