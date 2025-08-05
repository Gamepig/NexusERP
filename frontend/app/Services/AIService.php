<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Yaml\Yaml;

class AIService
{
    protected $client;
    protected $apiKey;
    protected $apiUrl;
    protected $defaultModel;
    protected $fallbackModel;

    public function __construct()
    {
        $this->client = new Client();
        $this->apiKey = config('services.openrouter.api_key');
        $this->apiUrl = config('services.openrouter.api_url');
        $this->defaultModel = config('services.openrouter.default_model');
        $this->fallbackModel = config('services.openrouter.fallback_model');
    }

    /**
     * 分析用戶業務描述並生成建議
     */
    public function analyzeBusinessDescription(string $description): array
    {
        $prompt = $this->buildBusinessAnalysisPrompt($description);
        
        try {
            $response = $this->callOpenRouter($prompt);
            return $this->parseBusinessAnalysisResponse($response);
        } catch (\Exception $e) {
            Log::error('AI Business Analysis failed: ' . $e->getMessage());
            return $this->getFallbackBusinessAnalysis($description);
        }
    }

    /**
     * AI 引導式對話回應
     */
    public function generateChatResponse(string $message, array $conversationHistory = []): string
    {
        $prompt = $this->buildChatPrompt($message, $conversationHistory);
        
        try {
            $response = $this->callOpenRouter($prompt);
            return $this->parseChatResponse($response);
        } catch (\Exception $e) {
            Log::error('AI Chat Response failed: ' . $e->getMessage());
            return $this->getFallbackChatResponse($message);
        }
    }

    /**
     * 調用 OpenRouter API
     */
    protected function callOpenRouter(string $prompt, string $model = null): array
    {
        $model = $model ?: $this->defaultModel;
        
        $response = $this->client->post($this->apiUrl . '/chat/completions', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url'),
                'X-Title' => 'NexusERP AI Assistant',
            ],
            'json' => [
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are NexusERP AI Assistant, a helpful business analysis expert specializing in ERP systems and business classification.'
                    ],
                    [
                        'role' => 'user', 
                        'content' => $prompt
                    ]
                ],
                'max_tokens' => 500,
                'temperature' => 0.7,
                'top_p' => 0.9,
                'stream' => false
            ],
            'timeout' => 30
        ]);

        return json_decode($response->getBody()->getContents(), true);
    }

    /**
     * 構建業務分析提示詞
     */
    protected function buildBusinessAnalysisPrompt(string $description): string
    {
        return "請分析以下業務描述並以 YAML 格式回應：

業務描述：{$description}

請用以下 YAML 結構回應（必須是有效的 YAML 格式）：

```yaml
business_analysis:
  primary_industry: \"主要行業分類\"
  secondary_industry: \"次要行業分類\"
  business_type: \"業務類型（如：B2B, B2C, B2B2C）\"
  scale: \"業務規模（如：小型, 中型, 大型）\"
  
key_features:
  - \"業務特點1\"
  - \"業務特點2\"
  - \"業務特點3\"

erp_modules:
  high_priority:
    - module: \"模組名稱\"
      reason: \"推薦原因\"
  medium_priority:
    - module: \"模組名稱\"
      reason: \"推薦原因\"

recommendations:
  immediate: \"立即建議\"
  future: \"未來發展建議\"
```

請用繁體中文回應，確保 YAML 格式正確。";
    }

    /**
     * 構建對話提示詞
     */
    protected function buildChatPrompt(string $message, array $conversationHistory): string
    {
        $historyContext = '';
        if (!empty($conversationHistory)) {
            $historyContext = "對話歷史：\n";
            foreach ($conversationHistory as $entry) {
                $historyContext .= "用戶：{$entry['user']}\n";
                $historyContext .= "AI：{$entry['ai']}\n";
            }
            $historyContext .= "\n";
        }

        return "{$historyContext}用戶最新訊息：{$message}

請作為 NexusERP 的 AI 助手，根據對話歷史和用戶的最新訊息，提供專業且有幫助的回應。
要求：
1. 回應必須簡潔，不超過 80 字
2. 重點突出，避免冗長說明
3. 如果是業務相關問題，直接提供分類建議和 ERP 應用建議
4. 用繁體中文回應，保持自然對話的語調";
    }

    /**
     * 解析業務分析回應
     */
    protected function parseBusinessAnalysisResponse(array $response): array
    {
        $content = $response['choices'][0]['message']['content'] ?? '';
        
        try {
            // 嘗試從回應中提取 YAML 內容
            $yamlContent = $this->extractYamlFromResponse($content);
            
            if ($yamlContent) {
                $parsedData = Yaml::parse($yamlContent);
                
                return [
                    'business_analysis' => [
                        'primary_industry' => $parsedData['business_analysis']['primary_industry'] ?? '',
                        'secondary_industry' => $parsedData['business_analysis']['secondary_industry'] ?? '',
                        'business_type' => $parsedData['business_analysis']['business_type'] ?? '',
                        'scale' => $parsedData['business_analysis']['scale'] ?? '',
                    ],
                    'key_features' => $parsedData['key_features'] ?? [],
                    'erp_modules' => $parsedData['erp_modules'] ?? [],
                    'recommendations' => $parsedData['recommendations'] ?? [],
                    'industry_classification' => $parsedData['business_analysis']['primary_industry'] ?? '一般商業',
                    'raw_response' => $content
                ];
            }
        } catch (\Exception $e) {
            Log::warning('YAML 解析失敗，使用備用邏輯: ' . $e->getMessage());
        }

        // 備用邏輯：簡單的關鍵詞提取
        $analysis = [
            'industry_classification' => '',
            'business_characteristics' => '',
            'erp_recommendations' => '',
            'development_suggestions' => '',
            'raw_response' => $content
        ];

        // 簡單的關鍵詞提取邏輯
        if (strpos($content, '製造') !== false || strpos($content, '工廠') !== false) {
            $analysis['industry_classification'] = '製造業';
        } elseif (strpos($content, '零售') !== false || strpos($content, '販售') !== false) {
            $analysis['industry_classification'] = '零售業';
        } elseif (strpos($content, '服務') !== false || strpos($content, '顧問') !== false) {
            $analysis['industry_classification'] = '服務業';
        } elseif (strpos($content, '軟體') !== false || strpos($content, '科技') !== false) {
            $analysis['industry_classification'] = '科技業';
        } else {
            $analysis['industry_classification'] = '其他行業';
        }

        return $analysis;
    }

    /**
     * 從 AI 回應中提取 YAML 內容
     */
    protected function extractYamlFromResponse(string $content): ?string
    {
        // 尋找 ```yaml...``` 區塊
        if (preg_match('/```yaml\s*\n(.*?)\n```/s', $content, $matches)) {
            return trim($matches[1]);
        }

        // 尋找 ```\n...``` 區塊（假設是 YAML）
        if (preg_match('/```\s*\n(.*?)\n```/s', $content, $matches)) {
            $yamlCandidate = trim($matches[1]);
            // 簡單檢查是否像 YAML（包含冒號）
            if (strpos($yamlCandidate, ':') !== false) {
                return $yamlCandidate;
            }
        }

        // 如果沒有代碼區塊，嘗試直接解析整個內容
        if (strpos($content, 'business_analysis:') !== false) {
            return $content;
        }

        return null;
    }

    /**
     * 解析對話回應
     */
    protected function parseChatResponse(array $response): string
    {
        return $response['choices'][0]['message']['content'] ?? '抱歉，我現在無法處理您的請求。請稍後再試。';
    }

    /**
     * 備用業務分析（AI 服務失敗時使用）
     */
    protected function getFallbackBusinessAnalysis(string $description): array
    {
        return [
            'industry_classification' => '一般商業',
            'business_characteristics' => '您的業務具有獨特性，需要客製化的 ERP 解決方案。',
            'erp_recommendations' => '建議使用基礎財務管理和客戶關係管理模組。',
            'development_suggestions' => '可考慮逐步擴展到庫存管理和銷售分析功能。',
            'raw_response' => '感謝您提供的業務資訊。根據初步分析，我們建議從基礎的財務和客戶管理開始。'
        ];
    }

    /**
     * 備用對話回應（AI 服務失敗時使用）
     */
    protected function getFallbackChatResponse(string $message): string
    {
        if (strpos($message, '餐廳') !== false || strpos($message, '小吃') !== false || strpos($message, '餐飲') !== false) {
            return '餐飲業建議：庫存管理追蹤食材、POS 系統管理營運。主要管理哪些食材？';
        }

        if (strpos($message, '製造') !== false || strpos($message, '工廠') !== false || strpos($message, '生產') !== false) {
            return '製造業建議：原料管理、生產計劃、品質控制。主要生產什麼產品？';
        }

        if (strpos($message, '零售') !== false || strpos($message, '商店') !== false || strpos($message, '販賣') !== false) {
            return '零售業建議：庫存追蹤、客戶管理、銷售分析。主要販賣什麼商品？';
        }

        if (strpos($message, '服務') !== false || strpos($message, '顧問') !== false) {
            return '服務業建議：專案管理、時間記錄、客戶溝通。提供什麼類型服務？';
        }

        if (strpos($message, '公司') !== false && strpos($message, '員工') !== false) {
            return '了解！建議配置人資管理和組織架構設定。';
        }

        // 數字提取 - 檢查員工人數
        if (preg_match('/(\d+)\s*(?:個|位)?\s*員工/', $message, $matches)) {
            $employeeCount = (int)$matches[1];
            if ($employeeCount <= 5) {
                return '小團隊建議：基礎庫存管理、財務記錄、客戶資料。';
            } elseif ($employeeCount <= 20) {
                return '中型企業建議：員工管理、部門權限、庫存財務、專案管理。';
            } else {
                return '大企業建議：多層權限、完整財務、人資系統、客製報表。';
            }
        }

        return '請告訴我更多業務細節，讓我為您推薦適合的 ERP 模組。';
    }

    /**
     * 業務類型分析（專用於設定頁面）
     */
    public function analyzeBusinessType(string $description): array
    {
        $prompt = "請分析以下業務描述並推薦最適合的業務類型：

業務描述：{$description}

請以 YAML 格式回應，嚴格按照以下結構：

```yaml
analysis:
  business_type: \"restaurant|retail|manufacturing|service|agriculture|other\"
  confidence: 0.8
  explanation: \"推薦原因的詳細說明\"
  key_indicators:
    - \"識別指標1\"
    - \"識別指標2\"
  suggested_features:
    - \"建議功能1\"
    - \"建議功能2\"
```

業務類型選項說明：
- restaurant: 餐飲業（餐廳、咖啡廳、小吃店）
- retail: 零售業（商店、電商、批發）
- manufacturing: 製造業（工廠、生產、加工）
- service: 服務業（顧問、維修、專業服務）
- agriculture: 農業（農場、畜牧、漁業）
- other: 其他類型

請用繁體中文回應，確保 YAML 格式正確。";

        try {
            $response = $this->callOpenRouter($prompt);
            return $this->parseBusinessTypeResponse($response);
        } catch (\Exception $e) {
            Log::error('AI Business Type Analysis failed: ' . $e->getMessage());
            return $this->getFallbackBusinessTypeAnalysis($description);
        }
    }

    /**
     * 解析業務類型分析回應
     */
    protected function parseBusinessTypeResponse(array $response): array
    {
        $content = $response['choices'][0]['message']['content'] ?? '';
        
        try {
            $yamlContent = $this->extractYamlFromResponse($content);
            
            if ($yamlContent) {
                $parsedData = Yaml::parse($yamlContent);
                
                if (isset($parsedData['analysis'])) {
                    return [
                        'business_type' => $parsedData['analysis']['business_type'] ?? 'other',
                        'confidence' => $parsedData['analysis']['confidence'] ?? 0.5,
                        'explanation' => $parsedData['analysis']['explanation'] ?? '無法確定業務類型',
                        'key_indicators' => $parsedData['analysis']['key_indicators'] ?? [],
                        'features' => $parsedData['analysis']['suggested_features'] ?? [],
                        'raw_response' => $content
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning('YAML 解析失敗，使用關鍵詞分析: ' . $e->getMessage());
        }

        // 降級到關鍵詞分析
        return $this->getFallbackBusinessTypeAnalysis($description);
    }

    /**
     * 降級業務類型分析
     */
    protected function getFallbackBusinessTypeAnalysis(string $description): array
    {
        $description = strtolower($description);
        
        // 關鍵字映射
        $keywords = [
            'restaurant' => ['餐廳', '咖啡', '食物', '菜單', '用餐', '廚房', '料理', '飲料', '小吃', '餐飲', '食品'],
            'retail' => ['商店', '零售', '販售', '商品', '購買', '客戶', '銷售', '商場', '店面', '電商', '批發'],
            'manufacturing' => ['工廠', '製造', '生產', '機械', '產品', '組裝', '製作', '加工', '原料', '品質'],
            'service' => ['服務', '顧問', '維修', '專業', '諮詢', '技術', '支援', '顧問', '維護'],
            'agriculture' => ['農場', '農業', '種植', '養殖', '作物', '畜牧', '農產品', '收成', '漁業', '農民']
        ];

        $scores = [];
        foreach ($keywords as $type => $words) {
            $score = 0;
            foreach ($words as $word) {
                if (strpos($description, $word) !== false) {
                    $score++;
                }
            }
            $scores[$type] = $score;
        }

        // 找出得分最高的業務類型
        $maxScore = max($scores);
        $recommendedTypes = array_keys($scores, $maxScore);
        $recommendedType = $recommendedTypes[0];
        
        if ($maxScore === 0) {
            $recommendedType = 'other';
            $confidence = 0.3;
            $explanation = '無法從描述中識別明確的業務類型，建議選擇「其他」類型。';
            $indicators = ['描述不夠具體'];
        } else {
            $confidence = min(0.9, $maxScore * 0.15 + 0.3);
            $businessNames = [
                'restaurant' => '餐飲業',
                'retail' => '零售業',
                'manufacturing' => '製造業', 
                'service' => '服務業',
                'agriculture' => '農業'
            ];
            $explanation = "根據您的描述中的關鍵詞，推薦設定為「{$businessNames[$recommendedType]}」。";
            
            // 找出匹配的關鍵詞作為指標
            $indicators = [];
            foreach ($keywords[$recommendedType] as $word) {
                if (strpos($description, $word) !== false) {
                    $indicators[] = "包含關鍵詞：{$word}";
                }
            }
        }

        return [
            'business_type' => $recommendedType,
            'confidence' => $confidence,
            'explanation' => $explanation,
            'key_indicators' => $indicators,
            'features' => $this->getSuggestedFeatures($recommendedType),
            'fallback' => true
        ];
    }

    /**
     * 取得業務類型建議功能
     */
    protected function getSuggestedFeatures(string $businessType): array
    {
        $features = [
            'restaurant' => ['菜單管理', '訂單追蹤', '庫存控制', '收銀系統'],
            'retail' => ['商品管理', '銷售分析', '客戶管理', '庫存追蹤'],
            'manufacturing' => ['生產管理', '原料追蹤', '品質控制', '設備維護'],
            'service' => ['客戶管理', '專案追蹤', '服務記錄', '時間管理'],
            'agriculture' => ['作物管理', '收成記錄', '銷售追蹤', '天氣資訊'],
            'other' => ['基礎財務', '庫存管理', '客戶資料', '報表分析']
        ];

        return $features[$businessType] ?? $features['other'];
    }
}