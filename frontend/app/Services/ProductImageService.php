<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use GdImage;

/**
 * 產品圖片服務
 * 
 * 處理產品圖片的生成、儲存和預設圖片管理
 */
class ProductImageService
{
    protected $defaultImagePath = 'images/products/defaults';
    protected $productImagePath = 'images/products';
    
    /**
     * 為產品生成或獲取圖片 URL（快速版本，適用於列表）
     */
    public function getProductImageUrl($product, $fastMode = true): string
    {
        // 如果產品已有圖片，直接返回
        if (!empty($product->image_url)) {
            return $this->ensureAbsoluteUrl($product->image_url);
        }
        
        // 快速模式：直接返回基於種子的佔位圖片，不進行網路請求
        if ($fastMode) {
            return $this->getFastPlaceholderImage($product);
        }
        
        // 完整模式：嘗試生成或獲取預設圖片
        return $this->generateDefaultImage($product);
    }
    
    /**
     * 生成預設產品圖片
     */
    public function generateDefaultImage($product): string
    {
        $fileName = $this->getDefaultImageFileName($product);
        $filePath = public_path("{$this->defaultImagePath}/{$fileName}");
        
        // 如果預設圖片已存在，直接返回
        if (file_exists($filePath)) {
            return url("{$this->defaultImagePath}/{$fileName}");
        }
        
        // 嘗試從網路獲取類似圖片
        $networkImage = $this->fetchImageFromNetwork($product);
        if ($networkImage) {
            return $networkImage;
        }
        
        // 生成程式化圖片
        return $this->createProgrammaticImage($product, $filePath, $fileName);
    }
    
    /**
     * 快速獲取佔位圖片（不進行網路請求）
     */
    protected function getFastPlaceholderImage($product): string
    {
        // 基於產品名稱生成種子
        $seed = abs(crc32($product->name ?? 'product'));
        
        // 直接返回 Lorem Picsum URL，不進行驗證
        return "https://picsum.photos/seed/{$seed}/400/300";
    }
    
    /**
     * 從網路獲取相關圖片（僅在非快速模式下使用）
     */
    protected function fetchImageFromNetwork($product): ?string
    {
        try {
            // 使用 Lorem Picsum 生成佔位圖片，基於產品名稱種子
            $seed = abs(crc32($product->name ?? 'product'));
            $imageUrl = "https://picsum.photos/seed/{$seed}/400/300";
            
            // 驗證圖片可訪問性
            $response = Http::timeout(5)->get($imageUrl);
            if ($response->successful()) {
                return $imageUrl;
            }
        } catch (\Exception $e) {
            Log::warning("Failed to fetch network image for product {$product->id}: " . $e->getMessage());
        }
        
        return null;
    }
    
    /**
     * 創建程式化產品圖片
     */
    protected function createProgrammaticImage($product, $filePath, $fileName): string
    {
        try {
            // 確保目錄存在
            $directory = dirname($filePath);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            
            // 創建 400x300 的圖片
            $width = 400;
            $height = 300;
            $image = imagecreatetruecolor($width, $height);
            
            if (!$image) {
                throw new \Exception('Failed to create image resource');
            }
            
            // 根據產品名稱生成顏色
            $colorSeed = abs(crc32($product->name ?? 'product'));
            $bgColor = $this->generateColor($image, $colorSeed);
            $textColor = imagecolorallocate($image, 255, 255, 255);
            
            // 填充背景
            imagefill($image, 0, 0, $bgColor);
            
            // 添加產品名稱文字
            $productName = $product->name ?? '產品圖片';
            $lines = $this->wrapText($productName, 20); // 每行最多20字符
            
            // 計算文字位置
            $fontHeight = 16;
            $totalHeight = count($lines) * $fontHeight;
            $startY = ($height - $totalHeight) / 2;
            
            foreach ($lines as $i => $line) {
                $textX = ($width - strlen($line) * 10) / 2; // 粗略計算文字寬度
                $textY = $startY + ($i * $fontHeight);
                imagestring($image, 4, max(10, $textX), $textY, $line, $textColor);
            }
            
            // 添加 SKU 或 ID
            $sku = $product->sku ?? "ID: {$product->id}";
            $skuX = 10;
            $skuY = $height - 30;
            imagestring($image, 2, $skuX, $skuY, $sku, $textColor);
            
            // 保存圖片
            $saved = imagepng($image, $filePath);
            imagedestroy($image);
            
            if ($saved) {
                return url("{$this->defaultImagePath}/{$fileName}");
            }
            
        } catch (\Exception $e) {
            Log::error("Failed to create programmatic image for product {$product->id}: " . $e->getMessage());
        }
        
        // 如果圖片生成失敗，返回通用預設圖片 URL
        return $this->getGenericPlaceholder();
    }
    
    /**
     * 生成顏色
     */
    protected function generateColor($image, $seed): int|false
    {
        mt_srand($seed);
        $r = mt_rand(50, 200);
        $g = mt_rand(50, 200);
        $b = mt_rand(50, 200);
        return imagecolorallocate($image, $r, $g, $b);
    }
    
    /**
     * 文字換行
     */
    protected function wrapText($text, $maxLength): array
    {
        $lines = [];
        $words = explode(' ', $text);
        $currentLine = '';
        
        foreach ($words as $word) {
            if (strlen($currentLine . ' ' . $word) <= $maxLength) {
                $currentLine .= ($currentLine ? ' ' : '') . $word;
            } else {
                if ($currentLine) {
                    $lines[] = $currentLine;
                }
                $currentLine = $word;
            }
        }
        
        if ($currentLine) {
            $lines[] = $currentLine;
        }
        
        return array_slice($lines, 0, 4); // 最多4行
    }
    
    /**
     * 獲取預設圖片檔名
     */
    protected function getDefaultImageFileName($product): string
    {
        $productId = $product->id ?? 'unknown';
        $hash = substr(md5($product->name ?? 'product'), 0, 8);
        return "product-{$productId}-{$hash}.png";
    }
    
    /**
     * 檢查圖片是否存在
     */
    protected function imageExists($url): bool
    {
        if (empty($url)) {
            return false;
        }
        
        // 如果是本地路徑
        if (strpos($url, 'http') !== 0) {
            $localPath = public_path($url);
            return file_exists($localPath);
        }
        
        // 如果是外部 URL，檢查可訪問性
        try {
            $response = Http::timeout(3)->head($url);
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * 確保返回完整 URL
     */
    protected function ensureAbsoluteUrl($url): string
    {
        if (strpos($url, 'http') === 0) {
            return $url;
        }
        
        return url($url);
    }
    
    /**
     * 獲取通用佔位圖片
     */
    protected function getGenericPlaceholder(): string
    {
        // 返回一個簡單的 SVG 佔位圖片
        $svgData = $this->createSvgPlaceholder();
        return "data:image/svg+xml;base64," . base64_encode($svgData);
    }
    
    /**
     * 創建 SVG 佔位圖片
     */
    protected function createSvgPlaceholder(): string
    {
        return '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#e5e7eb"/>
            <text x="200" y="150" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
                產品圖片
            </text>
            <text x="200" y="170" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">
                暫無圖片
            </text>
        </svg>';
    }
}