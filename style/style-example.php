<?php
// 載入風格指南
$style = json_decode(file_get_contents('style.json'), true);
$colors = $style['style_guide']['colors'];
$components = $style['style_guide']['components'];
$typography = $style['style_guide']['typography'];

// 輔助函數：產生元件樣式
function generateComponentCSS($component, $style) {
    $css = '';
    foreach ($component as $property => $value) {
        if (is_array($value)) {
            continue; // 跳過巢狀物件
        }
        $css .= str_replace('_', '-', $property) . ': ' . $value . '; ';
    }
    return $css;
}

// 輔助函數：產生顏色 CSS 變數
function generateColorVariables($colors) {
    $css = ':root { ';
    foreach ($colors as $category => $colorSet) {
        foreach ($colorSet as $name => $value) {
            $css .= '--' . $category . '-' . str_replace('_', '-', $name) . ': ' . $value . '; ';
        }
    }
    $css .= '}';
    return $css;
}

// 輔助函數：建立卡片元件
function createCard($title, $content, $type = 'default') {
    global $components;
    $cardClass = $type === 'wallet' ? 'nx-card wallet-card' : 'nx-card';
    
    return "
    <div class=\"{$cardClass}\">
        <h3>{$title}</h3>
        <div>{$content}</div>
    </div>";
}

// 輔助函數：建立按鈕元件
function createButton($text, $type = 'primary') {
    return "<button class=\"nx-btn nx-btn-{$type}\">{$text}</button>";
}

// 輔助函數：建立狀態標籤
function createBadge($text, $type = 'success') {
    return "<span class=\"nx-badge nx-badge-{$type}\">{$text}</span>";
}
?>

<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexusERP - 風格指南範例</title>
    <style>
        <?php echo generateColorVariables($colors); ?>
        
        /* 基礎樣式 */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: <?php echo $typography['font_family']['primary']; ?>;
            background-color: <?php echo $colors['primary']['background']; ?>;
            color: <?php echo $colors['text']['primary']; ?>;
            line-height: <?php echo $typography['line_height']['normal']; ?>;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        /* 網格系統 */
        .nx-grid {
            display: grid;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .nx-grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
        .nx-grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .nx-grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .nx-grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

        /* 卡片樣式 */
        .nx-card {
            background: <?php echo $components['card']['default']['background']; ?>;
            border: <?php echo $components['card']['default']['border']; ?>;
            border-radius: <?php echo $components['card']['default']['border_radius']; ?>;
            padding: <?php echo $components['card']['default']['padding']; ?>;
            box-shadow: <?php echo $components['card']['default']['box_shadow']; ?>;
            transition: transform 0.2s ease;
        }

        .nx-card:hover {
            transform: translateY(-2px);
        }

        .nx-card.wallet-card {
            background: <?php echo $components['card']['wallet']['background']; ?>;
            border: <?php echo $components['card']['wallet']['border']; ?>;
            color: <?php echo $components['card']['wallet']['color']; ?>;
            box-shadow: <?php echo $components['card']['wallet']['box_shadow']; ?>;
        }

        .nx-card h3 {
            font-size: <?php echo $typography['font_size']['lg']; ?>;
            font-weight: <?php echo $typography['font_weight']['semibold']; ?>;
            margin-bottom: 1rem;
        }

        .nx-card h2 {
            font-size: <?php echo $typography['font_size']['2xl']; ?>;
            font-weight: <?php echo $typography['font_weight']['bold']; ?>;
            margin-bottom: 0.5rem;
        }

        /* 按鈕樣式 */
        .nx-btn {
            display: inline-block;
            padding: <?php echo $components['button']['primary']['padding']; ?>;
            border: <?php echo $components['button']['primary']['border']; ?>;
            border-radius: <?php echo $components['button']['primary']['border_radius']; ?>;
            font-weight: <?php echo $components['button']['primary']['font_weight']; ?>;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
            transition: <?php echo $components['button']['primary']['transition']; ?>;
            margin: 0.25rem;
        }

        .nx-btn-primary {
            background: <?php echo $components['button']['primary']['background']; ?>;
            color: <?php echo $components['button']['primary']['color']; ?>;
            box-shadow: <?php echo $components['button']['primary']['box_shadow']; ?>;
        }

        .nx-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 12px -1px rgba(139, 92, 246, 0.4);
        }

        .nx-btn-secondary {
            background: <?php echo $components['button']['secondary']['background']; ?>;
            color: <?php echo $components['button']['secondary']['color']; ?>;
            border: <?php echo $components['button']['secondary']['border']; ?>;
        }

        .nx-btn-success {
            background: <?php echo $components['button']['success']['background']; ?>;
            color: <?php echo $components['button']['success']['color']; ?>;
        }

        .nx-btn-danger {
            background: <?php echo $components['button']['danger']['background']; ?>;
            color: <?php echo $components['button']['danger']['color']; ?>;
        }

        /* 狀態標籤 */
        .nx-badge {
            padding: <?php echo $components['badge']['success']['padding']; ?>;
            border-radius: <?php echo $components['badge']['success']['border_radius']; ?>;
            font-size: <?php echo $components['badge']['success']['font_size']; ?>;
            font-weight: <?php echo $components['badge']['success']['font_weight']; ?>;
            display: inline-block;
            margin: 0.25rem;
        }

        .nx-badge-success {
            background: <?php echo $components['badge']['success']['background']; ?>;
            color: <?php echo $components['badge']['success']['color']; ?>;
        }

        .nx-badge-warning {
            background: <?php echo $components['badge']['warning']['background']; ?>;
            color: <?php echo $components['badge']['warning']['color']; ?>;
        }

        .nx-badge-error {
            background: <?php echo $components['badge']['error']['background']; ?>;
            color: <?php echo $components['badge']['error']['color']; ?>;
        }

        /* 輸入框樣式 */
        .nx-input {
            background: <?php echo $components['input']['default']['background']; ?>;
            border: <?php echo $components['input']['default']['border']; ?>;
            border-radius: <?php echo $components['input']['default']['border_radius']; ?>;
            padding: <?php echo $components['input']['default']['padding']; ?>;
            color: <?php echo $components['input']['default']['color']; ?>;
            font-size: <?php echo $components['input']['default']['font_size']; ?>;
            width: 100%;
            margin-bottom: 1rem;
        }

        .nx-input:focus {
            outline: none;
            border-color: <?php echo $components['input']['focus']['border_color']; ?>;
            box-shadow: <?php echo $components['input']['focus']['box_shadow']; ?>;
        }

        /* 標題樣式 */
        .section-title {
            font-size: <?php echo $typography['font_size']['3xl']; ?>;
            font-weight: <?php echo $typography['font_weight']['bold']; ?>;
            margin-bottom: 2rem;
            color: <?php echo $colors['text']['primary']; ?>;
        }

        .subsection-title {
            font-size: <?php echo $typography['font_size']['xl']; ?>;
            font-weight: <?php echo $typography['font_weight']['semibold']; ?>;
            margin-bottom: 1rem;
            color: <?php echo $colors['text']['secondary']; ?>;
        }

        /* 響應式設計 */
        @media (max-width: 640px) {
            .nx-grid-cols-3,
            .nx-grid-cols-4 {
                grid-template-columns: repeat(1, 1fr);
            }
            
            .nx-grid-cols-2 {
                grid-template-columns: repeat(1, 1fr);
            }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
            .nx-grid-cols-4 {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .nx-grid-cols-3 {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="section-title">NexusERP 風格指南範例</h1>
        
        <!-- 卡片範例 -->
        <h2 class="subsection-title">卡片元件</h2>
        <div class="nx-grid nx-grid-cols-3">
            <?php echo createCard('一般卡片', '這是一般卡片的內容展示', 'default'); ?>
            <?php echo createCard('儲存金額', 'IDR 4,509,063', 'wallet'); ?>
            <?php echo createCard('數據統計', '1,234 筆記錄', 'default'); ?>
        </div>

        <!-- 按鈕範例 -->
        <h2 class="subsection-title">按鈕元件</h2>
        <div class="nx-grid nx-grid-cols-4">
            <div>
                <?php echo createButton('主要按鈕', 'primary'); ?>
            </div>
            <div>
                <?php echo createButton('次要按鈕', 'secondary'); ?>
            </div>
            <div>
                <?php echo createButton('成功按鈕', 'success'); ?>
            </div>
            <div>
                <?php echo createButton('危險按鈕', 'danger'); ?>
            </div>
        </div>

        <!-- 狀態標籤範例 -->
        <h2 class="subsection-title">狀態標籤</h2>
        <div class="nx-grid nx-grid-cols-1">
            <div>
                <?php echo createBadge('完成', 'success'); ?>
                <?php echo createBadge('等待中', 'warning'); ?>
                <?php echo createBadge('失敗', 'error'); ?>
            </div>
        </div>

        <!-- 表單範例 -->
        <h2 class="subsection-title">表單元件</h2>
        <div class="nx-grid nx-grid-cols-2">
            <div class="nx-card">
                <h3>使用者資訊</h3>
                <input type="text" class="nx-input" placeholder="使用者名稱">
                <input type="email" class="nx-input" placeholder="電子郵件">
                <input type="password" class="nx-input" placeholder="密碼">
                <?php echo createButton('提交', 'primary'); ?>
            </div>
            <div class="nx-card">
                <h3>系統設定</h3>
                <input type="text" class="nx-input" placeholder="系統名稱">
                <input type="text" class="nx-input" placeholder="管理員">
                <input type="text" class="nx-input" placeholder="聯絡電話">
                <?php echo createButton('儲存', 'success'); ?>
            </div>
        </div>

        <!-- 統計卡片範例 -->
        <h2 class="subsection-title">統計卡片</h2>
        <div class="nx-grid nx-grid-cols-4">
            <div class="nx-card">
                <h3>總營收</h3>
                <h2>NT$ 1,234,567</h2>
                <?php echo createBadge('+12.5%', 'success'); ?>
            </div>
            <div class="nx-card">
                <h3>新客戶</h3>
                <h2>156</h2>
                <?php echo createBadge('+8.2%', 'success'); ?>
            </div>
            <div class="nx-card">
                <h3>訂單數量</h3>
                <h2>2,847</h2>
                <?php echo createBadge('-2.1%', 'error'); ?>
            </div>
            <div class="nx-card">
                <h3>庫存預警</h3>
                <h2>23</h2>
                <?php echo createBadge('需注意', 'warning'); ?>
            </div>
        </div>
    </div>

    <script>
        // 載入風格指南 JSON
        const loadStyleGuide = async () => {
            try {
                const response = await fetch('style.json');
                const style = await response.json();
                return style;
            } catch (error) {
                console.error('無法載入風格指南:', error);
                return null;
            }
        };

        // 動態建立元件
        function createDynamicCard(title, content, type = 'default') {
            const card = document.createElement('div');
            card.className = type === 'wallet' ? 'nx-card wallet-card' : 'nx-card';
            card.innerHTML = `
                <h3>${title}</h3>
                <div>${content}</div>
            `;
            return card;
        }

        // 初始化
        document.addEventListener('DOMContentLoaded', async () => {
            const style = await loadStyleGuide();
            if (style) {
                console.log('風格指南載入成功:', style);
                
                // 範例：動態建立卡片
                const container = document.querySelector('.container');
                const dynamicSection = document.createElement('div');
                dynamicSection.innerHTML = '<h2 class="subsection-title">動態產生的卡片</h2>';
                
                const gridContainer = document.createElement('div');
                gridContainer.className = 'nx-grid nx-grid-cols-3';
                
                // 建立三個動態卡片
                for (let i = 1; i <= 3; i++) {
                    const card = createDynamicCard(
                        `動態卡片 ${i}`,
                        `這是使用 JavaScript 動態建立的卡片 ${i}`,
                        i === 2 ? 'wallet' : 'default'
                    );
                    gridContainer.appendChild(card);
                }
                
                dynamicSection.appendChild(gridContainer);
                container.appendChild(dynamicSection);
            }
        });
    </script>
</body>
</html> 