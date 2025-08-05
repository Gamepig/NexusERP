#!/bin/bash

# NexusERP CSS 類別修復腳本
# 將自定義 nexus-* 類別替換為 Tailwind 類別並加上內聯樣式

echo "🔧 開始修復 NexusERP CSS 類別..."

# 定義要處理的檔案
FILES=(
    "resources/views/dashboard.blade.php"
)

# 備份原始檔案
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$file.backup"
        echo "✅ 已備份 $file"
    fi
done

# 修復 dashboard.blade.php 中的 nexus- 類別
if [ -f "resources/views/dashboard.blade.php" ]; then
    echo "🔧 修復 dashboard.blade.php..."
    
    # 修復常見的 nexus- 類別
    sed -i '' 's/nexus-text-primary/text-gray-800 dark:text-gray-200" style="color: var(--nexus-text-primary);/g' resources/views/dashboard.blade.php
    sed -i '' 's/nexus-text-secondary/text-gray-600 dark:text-gray-400" style="color: var(--nexus-text-secondary);/g' resources/views/dashboard.blade.php
    sed -i '' 's/nexus-text-muted/text-gray-500 dark:text-gray-500" style="color: var(--nexus-text-muted);/g' resources/views/dashboard.blade.php
    sed -i '' 's/nexus-card/bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" style="background-color: var(--nexus-card-bg); border-color: var(--nexus-border-primary);/g' resources/views/dashboard.blade.php
    sed -i '' 's/nexus-shadow-md/shadow-md" style="box-shadow: var(--nexus-shadow-md);/g' resources/views/dashboard.blade.php
    sed -i '' 's/nexus-shadow-lg/shadow-lg" style="box-shadow: var(--nexus-shadow-lg);/g' resources/views/dashboard.blade.php
    sed -i '' 's/nexus-bg-secondary/bg-gray-100 dark:bg-gray-700" style="background-color: var(--nexus-bg-secondary);/g' resources/views/dashboard.blade.php
    sed -i '' 's/nexus-bg-tertiary/bg-gray-200 dark:bg-gray-600" style="background-color: var(--nexus-bg-tertiary);/g' resources/views/dashboard.blade.php
    sed -i '' 's/nexus-border-secondary/border-gray-200 dark:border-gray-600" style="border-color: var(--nexus-border-secondary);/g' resources/views/dashboard.blade.php
    sed -i '' 's/nexus-border-primary/border-gray-200 dark:border-gray-700" style="border-color: var(--nexus-border-primary);/g' resources/views/dashboard.blade.php
    
    echo "✅ dashboard.blade.php 修復完成"
fi

echo ""
echo "🎉 CSS 類別修復完成！"
echo ""
echo "📋 修復總結："
echo "   - 已備份原始檔案（.backup）"
echo "   - 替換 nexus-* 類別為 Tailwind + 內聯樣式"
echo "   - 保留 CSS 變數功能"
echo ""
echo "💡 如需恢復原始檔案，可使用 .backup 檔案"