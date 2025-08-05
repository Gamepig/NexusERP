<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class StyleController extends Controller
{
    /**
     * 獲取安全的樣式配置
     * 
     * @return array
     */
    public function getStyles()
    {
        return Cache::remember('app_styles', 3600, function () {
            $stylePath = public_path('style/style.json');
            
            if (!File::exists($stylePath)) {
                return $this->getDefaultStyles();
            }
            
            $rawData = File::get($stylePath);
            $styles = json_decode($rawData, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                \Log::warning('Invalid style.json format, using defaults');
                return $this->getDefaultStyles();
            }
            
            return $this->sanitizeStyles($styles);
        });
    }
    
    /**
     * 清理和驗證樣式數據
     * 
     * @param array $styles
     * @return array
     */
    private function sanitizeStyles(array $styles): array
    {
        $sanitized = [];
        
        if (isset($styles['style_guide']['colors'])) {
            $sanitized['colors'] = $this->sanitizeColors($styles['style_guide']['colors']);
        }
        
        if (isset($styles['style_guide']['components'])) {
            $sanitized['components'] = $this->sanitizeComponents($styles['style_guide']['components']);
        }
        
        if (isset($styles['style_guide']['typography'])) {
            $sanitized['typography'] = $this->sanitizeTypography($styles['style_guide']['typography']);
        }
        
        if (isset($styles['style_guide']['layout'])) {
            $sanitized['layout'] = $this->sanitizeLayout($styles['style_guide']['layout']);
        }
        
        return $sanitized;
    }
    
    /**
     * 清理顏色配置
     * 
     * @param array $colors
     * @return array
     */
    private function sanitizeColors(array $colors): array
    {
        $sanitized = [];
        
        foreach ($colors as $category => $colorGroup) {
            if (is_array($colorGroup)) {
                foreach ($colorGroup as $key => $value) {
                    if ($this->isValidColor($value)) {
                        $sanitized[$category][$key] = $value;
                    }
                }
            }
        }
        
        return $sanitized;
    }
    
    /**
     * 驗證顏色值是否安全
     * 
     * @param string $color
     * @return bool
     */
    private function isValidColor(string $color): bool
    {
        // 允許的顏色格式：hex, rgb, rgba, hsl, hsla, CSS 關鍵字
        $patterns = [
            '/^#[0-9A-Fa-f]{3,8}$/',                    // hex
            '/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/', // rgb
            '/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-9.]+\s*\)$/', // rgba
            '/^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/', // hsl
            '/^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[0-9.]+\s*\)$/', // hsla
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $color)) {
                return true;
            }
        }
        
        // 檢查 CSS 顏色關鍵字
        $cssColors = [
            'transparent', 'black', 'white', 'red', 'green', 'blue',
            'yellow', 'cyan', 'magenta', 'gray', 'grey'
        ];
        
        return in_array(strtolower($color), $cssColors);
    }
    
    /**
     * 清理組件配置
     * 
     * @param array $components
     * @return array
     */
    private function sanitizeComponents(array $components): array
    {
        $sanitized = [];
        $allowedProperties = [
            'background', 'color', 'border_radius', 'padding', 'margin',
            'box_shadow', 'border', 'font_weight', 'transition'
        ];
        
        foreach ($components as $component => $config) {
            if (is_array($config)) {
                foreach ($config as $variant => $properties) {
                    if (is_array($properties)) {
                        foreach ($properties as $prop => $value) {
                            if (in_array($prop, $allowedProperties) && $this->isValidCSSValue($prop, $value)) {
                                $sanitized[$component][$variant][$prop] = $value;
                            }
                        }
                    }
                }
            }
        }
        
        return $sanitized;
    }
    
    /**
     * 驗證 CSS 值是否安全
     * 
     * @param string $property
     * @param string $value
     * @return bool
     */
    private function isValidCSSValue(string $property, string $value): bool
    {
        // 移除可能的惡意內容
        if (preg_match('/[<>"\']|javascript:|data:|expression\(/', $value)) {
            return false;
        }
        
        // 根據屬性類型驗證
        switch ($property) {
            case 'background':
            case 'color':
                return $this->isValidColor($value) || $this->isValidGradient($value);
                
            case 'border_radius':
            case 'padding':
            case 'margin':
                return preg_match('/^[\d\s.px%rem em]+$/', $value);
                
            case 'box_shadow':
                return preg_match('/^[\d\s.px%rem em#a-fA-F,rgba()]+$/', $value);
                
            case 'font_weight':
                return preg_match('/^(normal|bold|bolder|lighter|\d+)$/', $value);
                
            case 'transition':
                return preg_match('/^[\w\s.]+$/', $value);
                
            default:
                return strlen($value) < 100 && !preg_match('/[<>"\']/', $value);
        }
    }
    
    /**
     * 驗證漸變值
     * 
     * @param string $gradient
     * @return bool
     */
    private function isValidGradient(string $gradient): bool
    {
        return preg_match('/^(linear|radial)-gradient\([\w\s,#%.()]+\)$/', $gradient);
    }
    
    /**
     * 清理版式配置
     * 
     * @param array $typography
     * @return array
     */
    private function sanitizeTypography(array $typography): array
    {
        $sanitized = [];
        
        if (isset($typography['font_family'])) {
            foreach ($typography['font_family'] as $key => $value) {
                if ($this->isValidFontFamily($value)) {
                    $sanitized['font_family'][$key] = $value;
                }
            }
        }
        
        return $sanitized;
    }
    
    /**
     * 驗證字體家族
     * 
     * @param string $fontFamily
     * @return bool
     */
    private function isValidFontFamily(string $fontFamily): bool
    {
        return preg_match('/^[\w\s,\'".-]+$/', $fontFamily) && !preg_match('/[<>]/', $fontFamily);
    }
    
    /**
     * 清理佈局配置
     * 
     * @param array $layout
     * @return array
     */
    private function sanitizeLayout(array $layout): array
    {
        $sanitized = [];
        
        if (isset($layout['grid'])) {
            $sanitized['grid'] = $this->sanitizeGridConfig($layout['grid']);
        }
        
        if (isset($layout['border_radius'])) {
            foreach ($layout['border_radius'] as $key => $value) {
                if (preg_match('/^[\d.px%rem em]+$/', $value)) {
                    $sanitized['border_radius'][$key] = $value;
                }
            }
        }
        
        return $sanitized;
    }
    
    /**
     * 清理網格配置
     * 
     * @param array $grid
     * @return array
     */
    private function sanitizeGridConfig(array $grid): array
    {
        $sanitized = [];
        
        if (isset($grid['gap'])) {
            foreach ($grid['gap'] as $key => $value) {
                if (preg_match('/^[\d.px%rem em]+$/', $value)) {
                    $sanitized['gap'][$key] = $value;
                }
            }
        }
        
        if (isset($grid['columns'])) {
            foreach ($grid['columns'] as $key => $value) {
                if (preg_match('/^repeat\(\d+,\s*1fr\)$|^[\d\s.fr%]+$/', $value)) {
                    $sanitized['columns'][$key] = $value;
                }
            }
        }
        
        return $sanitized;
    }
    
    /**
     * 獲取預設樣式
     * 
     * @return array
     */
    private function getDefaultStyles(): array
    {
        return [
            'colors' => [
                'primary' => [
                    'background' => '#0a0a0a',
                    'secondary_background' => '#1a1a1a',
                    'card_background' => '#2a2a2a',
                    'sidebar_background' => '#1a1a1a'
                ],
                'text' => [
                    'primary' => '#EDEDEC',
                    'secondary' => '#B3B3B3',
                    'muted' => '#808080'
                ],
                'accent' => [
                    'purple' => '#8B5CF6',
                    'blue' => '#3B82F6',
                    'green' => '#10B981',
                    'orange' => '#F59E0B',
                    'red' => '#EF4444'
                ],
                'border' => [
                    'primary' => '#333333'
                ]
            ],
            'components' => [
                'card' => [
                    'default' => [
                        'border_radius' => '12px',
                        'padding' => '24px',
                        'box_shadow' => '0 4px 6px rgba(0, 0, 0, 0.1)'
                    ]
                ],
                'button' => [
                    'primary' => [
                        'border_radius' => '8px',
                        'padding' => '12px 24px',
                        'font_weight' => '600'
                    ]
                ]
            ]
        ];
    }
}