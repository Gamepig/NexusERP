<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\AIService;
use Exception;

class AIController extends Controller
{
    private $goApiUrl;
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->goApiUrl = env('GO_API_URL', 'http://localhost:8080');
        $this->aiService = $aiService;
    }

    /**
     * 分析用戶業務描述並生成系統設定建議 (使用 OpenRouter AI)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function analyzeBusinessDescription(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'business_description' => 'required|string|max:2000',
                'business_type' => 'nullable|string|max:100',
                'company_size' => 'nullable|string|in:small,medium,large',
                'industry' => 'nullable|string|max:100'
            ]);

            $description = $request->input('business_description');
            
            // 優先使用 AI 服務分析
            try {
                $aiAnalysis = $this->aiService->analyzeBusinessDescription($description);
                
                // 將 AI 分析結果轉換為符合前端預期的格式
                return response()->json([
                    'success' => true,
                    'data' => [
                        'business_analysis' => [
                            'summary' => $aiAnalysis['raw_response'] ?? '已完成業務分析',
                            'industry_classification' => $aiAnalysis['industry_classification'] ?? '一般商業',
                            'business_characteristics' => $aiAnalysis['business_characteristics'] ?? '',
                        ],
                        'recommendations' => [
                            'priority_modules' => $this->getRecommendedModules($aiAnalysis['industry_classification'] ?? ''),
                            'setup_order' => [
                                '1. 基本設定（公司資訊、用戶權限）',
                                '2. ' . ($aiAnalysis['erp_recommendations'] ?? '庫存管理設定'),
                                '3. 客戶資料建立',
                                '4. 會計科目設定',
                                '5. 進階功能啟用'
                            ],
                            'estimated_setup_time' => $this->getEstimatedSetupTime($request->input('company_size', 'small'))
                        ],
                        'modules_suggestion' => $this->formatModuleSuggestions($aiAnalysis['industry_classification'] ?? ''),
                        'workflow_suggestions' => [
                            'ai_recommendation' => $aiAnalysis['erp_recommendations'] ?? '建議使用基礎 ERP 模組',
                            'development_suggestion' => $aiAnalysis['development_suggestions'] ?? '可考慮逐步擴展功能'
                        ],
                        'confidence_score' => 0.9,
                        'ai_powered' => true
                    ]
                ]);
                
            } catch (\Exception $aiError) {
                Log::warning('AI Service failed, falling back to Go API or default', [
                    'ai_error' => $aiError->getMessage()
                ]);
                
                // AI 服務失敗時，嘗試使用原有的 Go API
                return $this->tryGoApiOrFallback($request);
            }

        } catch (Exception $e) {
            Log::error('AI analysis completely failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => '分析服務暫時不可用，請稍後再試',
                'error_code' => 'AI_SERVICE_UNAVAILABLE'
            ], 500);
        }
    }

    /**
     * 嘗試使用 Go API 或回退到預設建議
     */
    private function tryGoApiOrFallback(Request $request): JsonResponse
    {
        $businessData = [
            'business_description' => $request->input('business_description'),
            'business_type' => $request->input('business_type'),
            'company_size' => $request->input('company_size', 'small'),
            'industry' => $request->input('industry'),
            'timestamp' => now()->toISOString()
        ];

        try {
            // 調用後端 Go API 服務
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($this->goApiUrl . '/api/ai/analyze-business', $businessData);

            if (!$response->successful()) {
                Log::error('Go API failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'request_data' => $businessData
                ]);

                // 如果後端服務不可用，返回默認建議
                return $this->getFallbackRecommendations($businessData);
            }

            $apiData = $response->json();

            // 驗證 API 回應結構
            if (!isset($apiData['recommendations'])) {
                Log::warning('Invalid API response structure', ['response' => $apiData]);
                return $this->getFallbackRecommendations($businessData);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'business_analysis' => $apiData['business_analysis'] ?? null,
                    'recommendations' => $apiData['recommendations'],
                    'modules_suggestion' => $apiData['modules_suggestion'] ?? [],
                    'workflow_suggestions' => $apiData['workflow_suggestions'] ?? [],
                    'confidence_score' => $apiData['confidence_score'] ?? 0.8,
                    'processing_time' => $apiData['processing_time'] ?? null,
                    'ai_powered' => false
                ]
            ]);
            
        } catch (Exception $e) {
            Log::warning('Go API also failed, using fallback', ['error' => $e->getMessage()]);
            return $this->getFallbackRecommendations($businessData);
        }
    }

    /**
     * 根據行業分類取得推薦模組
     */
    private function getRecommendedModules(string $industryClassification): array
    {
        $baseModules = ['inventory', 'accounting', 'customers'];
        
        switch ($industryClassification) {
            case '製造業':
                return array_merge($baseModules, ['production', 'quality_control']);
            case '零售業':
                return array_merge($baseModules, ['pos', 'sales']);
            case '服務業':
                return array_merge($baseModules, ['projects', 'employees']);
            case '科技業':
                return array_merge($baseModules, ['projects', 'time_tracking']);
            default:
                return $baseModules;
        }
    }

    /**
     * 格式化模組建議
     */
    private function formatModuleSuggestions(string $industryClassification): array
    {
        $modules = $this->getRecommendedModules($industryClassification);
        
        return array_map(function($module) {
            return [
                'module' => $module,
                'priority' => in_array($module, ['inventory', 'accounting', 'customers']) ? 'high' : 'medium',
                'description' => $this->getModuleDescription($module)
            ];
        }, $modules);
    }

    /**
     * 取得預估設定時間
     */
    private function getEstimatedSetupTime(string $companySize): string
    {
        switch ($companySize) {
            case 'large':
                return '2-3 週';
            case 'medium':
                return '1-2 週';
            default:
                return '3-5 天';
        }
    }

    /**
     * 當後端服務不可用時的後備建議
     *
     * @param array $businessData
     * @return JsonResponse
     */
    private function getFallbackRecommendations(array $businessData): JsonResponse
    {
        $businessType = strtolower($businessData['business_type'] ?? '');
        $companySize = $businessData['company_size'] ?? 'small';

        // 基於業務類型的基本建議
        $modules = ['inventory', 'accounting', 'customers'];
        $workflows = [
            'basic_inventory' => '建立基本庫存管理流程',
            'customer_management' => '設定客戶資料管理',
            'basic_accounting' => '設定基本會計科目'
        ];

        // 根據公司規模調整建議
        if ($companySize === 'medium' || $companySize === 'large') {
            $modules[] = 'employees';
            $modules[] = 'reports';
            $workflows['employee_management'] = '設定員工管理系統';
            $workflows['advanced_reporting'] = '配置進階報表功能';
        }

        // 根據業務類型調整建議
        if (str_contains($businessType, 'retail') || str_contains($businessType, '零售')) {
            $modules[] = 'pos';
            $workflows['retail_pos'] = '設定零售銷售點系統';
        }

        if (str_contains($businessType, 'manufacturing') || str_contains($businessType, '製造')) {
            $modules[] = 'production';
            $workflows['production_planning'] = '設定生產計劃流程';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'business_analysis' => [
                    'summary' => '基於您提供的資訊，系統建議以下配置',
                    'business_type' => $businessData['business_type'],
                    'company_size' => $companySize,
                    'suggested_focus' => '建議先從基本功能開始，逐步擴展'
                ],
                'recommendations' => [
                    'priority_modules' => $modules,
                    'setup_order' => [
                        '1. 基本設定（公司資訊、用戶權限）',
                        '2. 庫存管理設定',
                        '3. 客戶資料建立',
                        '4. 會計科目設定',
                        '5. 進階功能啟用'
                    ],
                    'estimated_setup_time' => $companySize === 'large' ? '2-3 週' : ($companySize === 'medium' ? '1-2 週' : '3-5 天')
                ],
                'modules_suggestion' => array_map(function($module) {
                    return [
                        'module' => $module,
                        'priority' => in_array($module, ['inventory', 'accounting', 'customers']) ? 'high' : 'medium',
                        'description' => $this->getModuleDescription($module)
                    ];
                }, $modules),
                'workflow_suggestions' => $workflows,
                'confidence_score' => 0.7,
                'is_fallback' => true
            ]
        ]);
    }

    /**
     * 取得模組描述
     *
     * @param string $module
     * @return string
     */
    private function getModuleDescription(string $module): string
    {
        $descriptions = [
            'inventory' => '庫存管理 - 追蹤產品數量、成本和供應商資訊',
            'accounting' => '會計管理 - 處理財務記錄、應收應付和報表',
            'customers' => '客戶管理 - 維護客戶資料和交易歷史',
            'employees' => '員工管理 - 管理員工資訊、薪資和考勤',
            'reports' => '報表分析 - 生成業務分析和績效報告',
            'pos' => '銷售點系統 - 處理現場銷售和收銀',
            'production' => '生產管理 - 規劃和追蹤製造流程'
        ];

        return $descriptions[$module] ?? '進階功能模組';
    }

    /**
     * 取得支援的業務類型列表
     *
     * @return JsonResponse
     */
    public function getBusinessTypes(): JsonResponse
    {
        $businessTypes = [
            'retail' => '零售業',
            'wholesale' => '批發業',
            'manufacturing' => '製造業',
            'services' => '服務業',
            'restaurant' => '餐飲業',
            'e_commerce' => '電子商務',
            'construction' => '建築業',
            'healthcare' => '醫療保健',
            'education' => '教育服務',
            'technology' => '科技業',
            'consulting' => '顾問服务',
            'other' => '其他'
        ];

        return response()->json([
            'success' => true,
            'data' => $businessTypes
        ]);
    }

    /**
     * 取得公司規模選項
     *
     * @return JsonResponse
     */
    public function getCompanySizes(): JsonResponse
    {
        $companySizes = [
            'small' => [
                'label' => '小型企業',
                'description' => '1-50 人員工',
                'features' => ['基本功能', '簡化流程', '快速設定']
            ],
            'medium' => [
                'label' => '中型企業',
                'description' => '51-200 人員工',
                'features' => ['完整功能', '部門管理', '進階報表']
            ],
            'large' => [
                'label' => '大型企業',
                'description' => '201+ 人員工',
                'features' => ['企業級功能', '多層級管理', '客製化選項']
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $companySizes
        ]);
    }

    /**
     * AI 引導式對話回應
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function generateChatResponse(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|min:1|max:500',
            'conversation_history' => 'sometimes|array|max:10',
        ]);

        try {
            $message = $request->input('message');
            $conversationHistory = $request->input('conversation_history', []);

            $response = $this->aiService->generateChatResponse($message, $conversationHistory);

            return response()->json([
                'success' => true,
                'data' => [
                    'response' => $response,
                    'timestamp' => now()->toISOString(),
                    'ai_powered' => true
                ],
                'message' => 'AI 回應生成成功'
            ]);

        } catch (\Exception $e) {
            Log::error('AI Chat Response API Error: ' . $e->getMessage());
            
            // 提供備用回應
            $fallbackResponse = $this->getFallbackChatResponse($request->input('message'));
            
            return response()->json([
                'success' => true,
                'data' => [
                    'response' => $fallbackResponse,
                    'timestamp' => now()->toISOString(),
                    'ai_powered' => false,
                    'fallback' => true
                ],
                'message' => 'AI 對話服務暫時不可用，提供備用回應'
            ]);
        }
    }

    /**
     * AI 服務健康狀態檢查
     *
     * @return JsonResponse
     */
    public function healthCheck(): JsonResponse
    {
        try {
            $isConfigured = !empty(config('services.openrouter.api_key'));
            
            return response()->json([
                'success' => true,
                'data' => [
                    'configured' => $isConfigured,
                    'model' => config('services.openrouter.default_model'),
                    'status' => $isConfigured ? 'ready' : 'not_configured',
                    'ai_service_available' => true
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('AI Health Check Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'AI 服務狀態檢查失敗',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * 備用對話回應
     */
    private function getFallbackChatResponse(string $message): string
    {
        if (strpos($message, '公司') !== false && strpos($message, '員工') !== false) {
            return '感謝您提供的公司資訊！根據您的描述，我建議為您的企業配置相應的人力資源管理和組織架構設定。';
        }

        if (strpos($message, '業務') !== false || strpos($message, '商業') !== false) {
            return '了解您的業務需求後，我建議先從基礎的 ERP 功能開始，如庫存管理、客戶關係管理和財務記錄。';
        }

        if (strpos($message, '員工') !== false || strpos($message, '人數') !== false) {
            return '根據您的員工規模，我們可以為您推薦適合的系統配置和權限管理方案。';
        }

        return '感謝您的資訊！我正在分析您的業務需求，請稍等片刻讓我為您提供更詳細的建議。';
    }

    /**
     * Get AI capabilities and configuration
     */
    public function getCapabilities(): JsonResponse
    {
        try {
            $capabilities = [
                'available_features' => [
                    'business_analysis' => [
                        'enabled' => true,
                        'description' => '業務分析和 ERP 模組建議',
                        'endpoints' => ['/api/ai/analyze-business']
                    ],
                    'chat_assistance' => [
                        'enabled' => true,
                        'description' => '即時對話協助和業務諮詢',
                        'endpoints' => ['/api/ai/chat']
                    ],
                    'dashboard_insights' => [
                        'enabled' => true,
                        'description' => '儀表板數據分析和見解',
                        'endpoints' => ['/api/ai/dashboard-insights']
                    ],
                    'business_classification' => [
                        'enabled' => true,
                        'description' => '自動業務分類和建議',
                        'endpoints' => ['/api/ai/business-types', '/api/ai/company-sizes']
                    ]
                ],
                'service_status' => [
                    'operational' => true,
                    'provider' => 'OpenRouter',
                    'model' => config('services.openrouter.default_model', 'tencent/hunyuan-a13b-instruct:free'),
                    'last_check' => now()->toISOString()
                ],
                'usage_limits' => [
                    'rate_limit' => '100 requests per minute',
                    'context_length' => '8192 tokens',
                    'supported_languages' => ['zh-TW', 'zh-CN', 'en']
                ],
                'integration_info' => [
                    'version' => '1.0.0',
                    'api_version' => 'v1',
                    'supported_formats' => ['JSON', 'YAML'],
                    'authentication' => 'Bearer token optional'
                ]
            ];

            return response()->json([
                'success' => true,
                'message' => 'AI capabilities loaded successfully',
                'data' => $capabilities
            ]);
            
        } catch (Exception $e) {
            Log::error('Failed to get AI capabilities', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load AI capabilities',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard insights and data analysis
     */
    public function getDashboardInsights(Request $request): JsonResponse
    {
        try {
            // 模擬儀表板數據（實際情況下應該從資料庫獲取）
            $dashboardData = [
                'total_sales' => 125000,
                'order_count' => 45,
                'inventory_value' => 89000,
                'low_stock_count' => 8,
                'total_ar' => 65000,
                'overdue_ar' => 12000,
                'cash_flow' => 23000
            ];

            $insights = $this->generateDashboardInsights($dashboardData);

            return response()->json([
                'success' => true,
                'data' => [
                    'insights' => $insights,
                    'dashboard_data' => $dashboardData,
                    'generated_at' => now()->toISOString()
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Failed to generate dashboard insights', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => '無法生成儀表板分析',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate AI-powered dashboard insights
     */
    private function generateDashboardInsights(array $data): array
    {
        $insights = [];

        // 銷售分析
        if ($data['total_sales'] > 100000) {
            $insights[] = [
                'type' => 'positive',
                'title' => '銷售表現優異',
                'message' => '本期銷售額達到 $' . number_format($data['total_sales']) . '，表現優於預期',
                'action' => '考慮擴大庫存以滿足需求'
            ];
        }

        // 庫存警告
        if ($data['low_stock_count'] > 5) {
            $insights[] = [
                'type' => 'warning',
                'title' => '庫存警告',
                'message' => '目前有 ' . $data['low_stock_count'] . ' 項商品庫存不足',
                'action' => '建議立即補貨以避免缺貨'
            ];
        }

        // 現金流分析
        if ($data['cash_flow'] > 0) {
            $insights[] = [
                'type' => 'positive',
                'title' => '現金流穩健',
                'message' => '淨現金流為 $' . number_format($data['cash_flow']) . '，財務狀況良好',
                'action' => '可考慮投資新設備或擴展業務'
            ];
        }

        // 應收帳款警告
        $overduePercentage = ($data['overdue_ar'] / $data['total_ar']) * 100;
        if ($overduePercentage > 15) {
            $insights[] = [
                'type' => 'critical',
                'title' => '應收帳款風險',
                'message' => '逾期應收帳款佔比達 ' . round($overduePercentage, 1) . '%',
                'action' => '加強催收作業，檢視客戶信用政策'
            ];
        }

        return $insights;
    }
}