<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use App\Services\SimpleGoJWTService;

class QuoteController extends Controller
{
    private $goApiUrl;

    public function __construct()
    {
        $this->goApiUrl = config('services.go_backend.url', 'http://localhost:8082');
        $this->middleware('auth');
        // 確保與 Go 後端整合時已有 JWT 可用（若失敗不阻斷）
        $this->middleware(\App\Http\Middleware\SimpleGoJWTMiddleware::class);
    }

    /**
     * 顯示報價單列表頁面
     * 支援多租戶數據隔離、搜尋篩選、排序和分頁功能
     */
    public function index(Request $request)
    {
        try {
            // **多租戶數據隔離**: 確保當前用戶的公司上下文
            $user = Auth::user();
            
            // 優先使用 current_company_id，若不存在則使用主要公司或第一個公司
            $currentCompanyId = $user->current_company_id ?? null;
            
            if (!$currentCompanyId) {
                // 嘗試從用戶公司關聯中獲取公司 ID
                $primaryCompany = $user->companies()->wherePivot('is_primary', true)->first();
                if ($primaryCompany) {
                    $currentCompanyId = $primaryCompany->id;
                } else {
                    $firstCompany = $user->companies()->first();
                    $currentCompanyId = $firstCompany ? $firstCompany->id : null;
                }
            }
            
            if (!$currentCompanyId) {
                Log::warning('User has no associated companies', ['user_id' => $user->id]);
                return view('quotes.index', ['quotes' => ['quotes' => [], 'total' => 0]])
                       ->with('error', '請先設定公司資訊後再查看報價單');
            }
            
            Log::info('Using company ID for quotes', ['user_id' => $user->id, 'company_id' => $currentCompanyId]);

            // 建立查詢參數 - 加入公司 ID 確保數據隔離
            $queryParams = array_filter([
                'company_id' => $currentCompanyId, // **強制加入公司 ID**
                'page' => $request->get('page', 1),
                'page_size' => $request->get('per_page', 20), // ✅ 修正參數名稱
                'search' => $request->get('search'),
                'status' => $request->get('status'),
                'customer_id' => $request->get('customer_id'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'sort' => $request->get('sort', 'created_at_desc'),
            ], function($value) {
                return $value !== null && $value !== '';
            });

            // **進階排序支援**: 擴展排序選項
            $sortMapping = [
                'created_at_desc' => ['field' => 'created_at', 'direction' => 'desc'],
                'created_at_asc' => ['field' => 'created_at', 'direction' => 'asc'],
                'quote_date_desc' => ['field' => 'quote_date', 'direction' => 'desc'],
                'quote_date_asc' => ['field' => 'quote_date', 'direction' => 'asc'],
                'total_amount_desc' => ['field' => 'total_amount', 'direction' => 'desc'],
                'total_amount_asc' => ['field' => 'total_amount', 'direction' => 'asc'],
                'quote_number_desc' => ['field' => 'quote_number', 'direction' => 'desc'],
                'quote_number_asc' => ['field' => 'quote_number', 'direction' => 'asc'],
                'customer_name_desc' => ['field' => 'customer_name', 'direction' => 'desc'],
                'customer_name_asc' => ['field' => 'customer_name', 'direction' => 'asc'],
            ];

            $sortKey = $request->get('sort', 'created_at_desc');
            if (isset($sortMapping[$sortKey])) {
                $queryParams['sort_by'] = $sortMapping[$sortKey]['field'];     // ✅ 修正參數名稱
                $queryParams['sort_order'] = $sortMapping[$sortKey]['direction']; // ✅ 修正參數名稱
            }

            // 移除原始的 sort 參數，避免 API 混淆
            unset($queryParams['sort']);

            // ❌ 移除不支援的 search_fields 參數
            // if (!empty($queryParams['search'])) {
            //     $queryParams['search_fields'] = 'quote_number,customer_name,notes';
            // }

            Log::info('Quote API Query Parameters with Multi-tenant:', [
                'params' => $queryParams,
                'company_id' => $currentCompanyId,
                'user_id' => $user->id
            ]);

            $response = $this->callGoAPI('/api/quotes?' . http_build_query($queryParams));
            
            Log::info('Go API Raw Response:', [
                'status' => $response->status(),
                'headers' => $response->headers(),
                'body_preview' => substr($response->body(), 0, 500) . '...',
                'successful' => $response->successful()
            ]);
            
            if ($response->successful()) {
                $quotes = $response->json();
                
                // **改進的資料結構處理**: 支援多種 API 回應格式
                // 始終標準化分頁欄位名稱，無論原始結構如何
                $standardizedQuotes = [
                    'quotes' => $quotes['quotes'] ?? $quotes['data'] ?? $quotes['items'] ?? [],
                    'total' => $quotes['total'] ?? $quotes['total_count'] ?? 0,
                    'current_page' => $quotes['current_page'] ?? $quotes['page'] ?? 1,
                    'per_page' => $quotes['per_page'] ?? $quotes['page_size'] ?? 20,
                    'last_page' => $quotes['last_page'] ?? $quotes['total_pages'] ?? 1,
                ];
                $quotes = $standardizedQuotes;


                // **資料驗證**: 確保關鍵欄位存在
                foreach ($quotes['quotes'] as &$quote) {
                    $quote['quote_number'] = $quote['quote_number'] ?? 'QT-' . str_pad($quote['id'] ?? 0, 6, '0', STR_PAD_LEFT);
                    $quote['customer'] = $quote['customer'] ?? ['name' => '未知客戶'];
                    $quote['total_amount'] = $quote['total_amount'] ?? 0;
                    $quote['status'] = $quote['status'] ?? 'draft';
                    
                    // **修復日期欄位顯示問題**: 處理 ISO 8601 格式和其他可能的日期格式
                    if (isset($quote['quote_date'])) {
                        // 處理 ISO 8601 格式 (例如: 2025-08-06T00:00:00Z)
                        $quote['quote_date'] = date('Y-m-d', strtotime($quote['quote_date']));
                    }
                    
                    // **修復欄位名稱映射**: Go API 使用 expiry_date, 前端期望 valid_until
                    if (isset($quote['expiry_date'])) {
                        // 處理 ISO 8601 格式 (例如: 2025-09-05T00:00:00Z)
                        $quote['valid_until'] = date('Y-m-d', strtotime($quote['expiry_date']));
                    }
                    
                    // **向後相容處理**: 如果直接有 valid_until 欄位就使用
                    if (isset($quote['valid_until']) && !isset($quote['expiry_date'])) {
                        $quote['valid_until'] = date('Y-m-d', strtotime($quote['valid_until']));
                    }
                    
                    // **額外的日期欄位處理**: 支援不同的欄位名稱
                    if (!isset($quote['valid_until']) && isset($quote['valid_until_date'])) {
                        $quote['valid_until'] = date('Y-m-d', strtotime($quote['valid_until_date']));
                    }
                    
                    if (!isset($quote['quote_date']) && isset($quote['created_at'])) {
                        $quote['quote_date'] = date('Y-m-d', strtotime($quote['created_at']));
                    }
                }

                Log::info('Quote data processed:', [
                    'count' => count($quotes['quotes'] ?? []),
                    'total' => $quotes['total'] ?? 0,
                    'current_page' => $quotes['current_page'] ?? 1,
                    'raw_structure' => array_keys($quotes),
                    'sample_quote' => isset($quotes['quotes'][0]) ? [
                        'id' => $quotes['quotes'][0]['id'] ?? 'missing',
                        'quote_date' => $quotes['quotes'][0]['quote_date'] ?? 'missing',
                        'valid_until' => $quotes['quotes'][0]['valid_until'] ?? 'missing',
                        'raw_keys' => array_keys($quotes['quotes'][0])
                    ] : 'no_quotes'
                ]);
                
                return view('quotes.index', compact('quotes'));
            } else {
                $statusCode = $response->status();
                $errorBody = $response->body();
                
                Log::error('Go API response error:', [
                    'status' => $statusCode,
                    'body' => $errorBody,
                    'company_id' => $currentCompanyId
                ]);
                
                $errorMessage = 'API 回應錯誤';
                if ($statusCode === 401) {
                    $errorMessage = '認證失敗，請重新登入';
                } elseif ($statusCode === 403) {
                    $errorMessage = '沒有權限存取此資料';
                } elseif ($statusCode === 404) {
                    $errorMessage = '找不到報價資料';
                }
                
                return view('quotes.index', ['quotes' => ['quotes' => [], 'total' => 0]])
                       ->with('error', $errorMessage . ' (狀態: ' . $statusCode . ')');
            }
            
        } catch (\Exception $e) {
            Log::error('Error fetching quotes: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'company_id' => $currentCompanyId ?? 'unknown'
            ]);
            
            return view('quotes.index', ['quotes' => ['quotes' => [], 'total' => 0]])
                   ->with('error', '載入報價單列表時發生錯誤，請稍後再試');
        }
    }

    /**
     * 顯示建立報價單頁面
     */
    public function create(Request $request)
    {
        try {
            // 載入客戶列表 (直接調用控制器)
            $customerController = new \App\Http\Controllers\Api\CustomerController();
            $customerRequest = clone $request;
            $customerRequest->merge(['limit' => 1000]);
            
            $customers = [];
            try {
                $customerResponse = $customerController->index($customerRequest);
                $responseData = $customerResponse->getData(true);
                $customers = $responseData['data'] ?? [];
            } catch (\Exception $e) {
                Log::error('Failed to load customers: ' . $e->getMessage());
            }

            return view('quotes.form', [
                'mode' => 'create',
                'customers' => $customers,
                'customerId' => $request->get('customer_id')
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error loading quote create page: ' . $e->getMessage());
            return view('quotes.form', [
                'mode' => 'create',
                'customers' => [],
                'customerId' => null
            ])->with('error', '載入頁面時發生錯誤');
        }
    }

    /**
     * 顯示建立報價單頁面 (多步驟表單)
     */
    public function createMultiStep(Request $request)
    {
        try {
            // 載入客戶列表 (直接調用控制器)
            $customerController = new \App\Http\Controllers\Api\CustomerController();
            $customerRequest = clone $request;
            $customerRequest->merge(['limit' => 1000]);
            
            $customers = [];
            try {
                $customerResponse = $customerController->index($customerRequest);
                $responseData = $customerResponse->getData(true);
                $customers = $responseData['data'] ?? [];
            } catch (\Exception $e) {
                Log::error('Failed to load customers: ' . $e->getMessage());
            }

            return view('quotes.multi-step-form', [
                'mode' => 'create',
                'customers' => $customers,
                'customerId' => $request->get('customer_id')
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error loading multi-step quote create page: ' . $e->getMessage());
            return view('quotes.multi-step-form', [
                'mode' => 'create',
                'customers' => [],
                'customerId' => null
            ])->with('error', '載入頁面時發生錯誤');
        }
    }

    /**
     * 顯示為特定客戶建立報價單頁面
     */
    public function createForCustomer(Request $request, $customerId)
    {
        try {
            // 載入客戶列表 (直接調用控制器)
            $customerController = new \App\Http\Controllers\Api\CustomerController();
            $customerRequest = clone $request;
            $customerRequest->merge(['limit' => 1000]);
            
            $customers = [];
            $selectedCustomer = null;
            
            try {
                $customerResponse = $customerController->index($customerRequest);
                $responseData = $customerResponse->getData(true);
                $customers = $responseData['data'] ?? [];
                
                // 尋找選中的客戶並確保其聯絡人資訊完整
                foreach ($customers as &$customer) {
                    if ($customer['id'] == $customerId) {
                        $selectedCustomer = $customer;
                        // 確保聯絡人資訊存在
                        if (empty($customer['contact_person'])) {
                            $customer['contact_person'] = $customer['name'] ?? '';
                        }
                        break;
                    }
                }
                
            } catch (\Exception $e) {
                Log::error('Failed to load customers: ' . $e->getMessage());
            }

            return view('quotes.form', [
                'mode' => 'create',
                'customers' => $customers,
                'customerId' => $customerId,
                'selectedCustomer' => $selectedCustomer
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error loading quote create page for customer: ' . $e->getMessage());
            return view('quotes.form', [
                'mode' => 'create',
                'customers' => [],
                'customerId' => $customerId,
                'selectedCustomer' => null
            ])->with('error', '載入頁面時發生錯誤');
        }
    }

    /**
     * 儲存新的報價單
     */
    public function store(Request $request)
    {
        // 驗證請求資料
        $validated = $request->validate([
            'customer_id' => 'required|integer|min:1',
            'quote_date' => 'required|date',
            'valid_until' => 'required|date|after:quote_date', 
            'contact_person' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|string|in:draft,pending,approved,rejected,expired,sent,accepted', // 支援新舊狀態值
            'currency' => 'nullable|string|in:TWD,USD,EUR,JPY,CNY,HKD,SGD',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            // 準備報價單資料 - 使用正確的Currency ID映射
            $currencyMapping = [
                'TWD' => 251, 'USD' => 252, 'EUR' => 253, 'JPY' => 254, 
                'CNY' => 255, 'HKD' => 256, 'SGD' => 257
            ];
            
            // ✅ 狀態映射邏輯
            $status = $validated['status'] ?? 'draft';
            $statusMapping = [
                'sent' => 'pending',      // 前端→後端映射
                'accepted' => 'approved', // 前端→後端映射
                // 其他狀態保持不變
            ];
            
            $quoteData = [
                'customer_id' => (int)$validated['customer_id'],
                'quote_date' => \Carbon\Carbon::parse($validated['quote_date'])->toISOString(),
                'expiry_date' => \Carbon\Carbon::parse($validated['valid_until'])->toISOString(),
                'notes' => $validated['notes'] ?? '',
                'status' => $statusMapping[$status] ?? $status, // ✅ 使用映射後的狀態
                // 🔧 修復1: 使用 currency_id 而非 currency 字串
                'currency_id' => $currencyMapping[$validated['currency'] ?? 'TWD'] ?? 1,
                'items' => array_map(function($item) {
                    // 確保有有效的product_id，否則使用預設產品ID (832)
                    $productId = isset($item['product_id']) && $item['product_id'] > 0 
                               ? (int)$item['product_id'] 
                               : 832;
                    
                    return [
                        'product_id' => $productId,
                        // 🔧 修復2: 移除name覆蓋，讓系統從products表讀取標準名稱
                        // 'name' => $item['name'], // ❌ 已移除：違反資料庫正規化
                        'description' => $item['description'] ?? '',
                        'quantity' => (float)$item['quantity'],
                        'unit_price' => (float)$item['unit_price'],
                    ];
                }, $validated['items'])
            ];

            Log::info('Preparing to send quote data to Go API', [
                'quote_data' => $quoteData,
                'validated_data' => $validated
            ]);

            // 呼叫 Go API 建立報價單
            $response = $this->callGoAPI('/api/quotes', 'POST', $quoteData);
            
            Log::info('Go API response received', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'response_body' => $response->body()
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                $quoteId = $responseData['quote']['id'] ?? null;
                
                if ($quoteId) {
                    // 檢查請求是否為JSON
                    if ($request->expectsJson() || $request->is('api/*') || $request->header('Content-Type') === 'application/json') {
                        return response()->json([
                            'success' => true,
                            'message' => '報價單建立成功！',
                            'redirect' => route('quotes.show', $quoteId),
                            'quote_id' => $quoteId
                        ]);
                    }
                    
                    return redirect()->route('quotes.show', $quoteId)
                                   ->with('success', '報價單建立成功！');
                }
            }

            // API 回應錯誤
            $responseBody = $response->json();
            $errorMessage = $responseBody['error'] ?? $responseBody['message'] ?? '建立報價單時發生錯誤';
            
            Log::error('Go API error response', [
                'status' => $response->status(),
                'response' => $responseBody,
                'quote_data' => $quoteData
            ]);
            
            // 根據狀態碼提供更具體的錯誤信息
            if ($response->status() === 400) {
                $errorMessage = "請求資料格式錯誤：" . $errorMessage;
            } elseif ($response->status() === 401) {
                $errorMessage = "認證失敗，請重新登入";
            } elseif ($response->status() === 422) {
                $errorMessage = "資料驗證失敗：" . $errorMessage;
            }
            
            // 檢查請求是否為JSON
            if ($request->expectsJson() || $request->is('api/*') || $request->header('Content-Type') === 'application/json') {
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'errors' => ['submit' => $errorMessage]
                ], $response->status());
            }
            
            return back()->withInput()->withErrors(['submit' => $errorMessage]);
            
        } catch (\Exception $e) {
            Log::error('Error creating quote: ' . $e->getMessage());
            
            // 檢查請求是否為JSON
            if ($request->expectsJson() || $request->is('api/*') || $request->header('Content-Type') === 'application/json') {
                return response()->json([
                    'success' => false,
                    'message' => '系統錯誤，請稍後再試',
                    'errors' => ['submit' => '系統錯誤，請稍後再試']
                ], 500);
            }
            
            return back()->withInput()->withErrors(['submit' => '系統錯誤，請稍後再試']);
        }
    }

    /**
     * 顯示報價單詳細頁面
     */
    public function show($id)
    {
        try {
            $response = $this->callGoAPI("/api/quotes/{$id}");

            if ($response->successful()) {
                $quote = $response->json()['quote'];
                
                // **數據標準化處理**: 確保所有必要欄位存在且格式正確
                $quote = $this->normalizeQuoteData($quote);
                
                $quoteId = $id;
                return view('quotes.show', compact('quote', 'quoteId'));
            }

            return redirect()->route('quotes.index')
                           ->with('error', '找不到該報價單');
                           
        } catch (\Exception $e) {
            Log::error('Error fetching quote: ' . $e->getMessage());
            return redirect()->route('quotes.index')
                           ->with('error', '載入報價單時發生錯誤');
        }
    }

    /**
     * 顯示編輯報價單頁面
     */
    public function edit($id)
    {
        try {
            // 載入報價單資料
            $quoteResponse = $this->callGoAPI("/api/quotes/{$id}");
            
            if (!$quoteResponse->successful()) {
                return redirect()->route('quotes.index')
                               ->with('error', '找不到該報價單');
            }

            // 載入客戶列表 (直接調用控制器)
            $customerController = new \App\Http\Controllers\Api\CustomerController();
            $request = new \Illuminate\Http\Request();
            $request->merge(['limit' => 1000]);
            
            $customers = [];
            try {
                $customerResponse = $customerController->index($request);
                $responseData = $customerResponse->getData(true);
                $customers = $responseData['data'] ?? [];
            } catch (\Exception $e) {
                Log::error('Failed to load customers: ' . $e->getMessage());
            }

            $quote = $quoteResponse->json()['quote'];
            // 標準化資料：補齊產品名稱/日期欄位等，與顯示頁一致
            $quote = $this->normalizeQuoteData($quote);

            return view('quotes.form', [
                'mode' => 'edit',
                'quote' => $quote,
                'customers' => $customers,
                'quoteId' => $id
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error loading quote edit page: ' . $e->getMessage());
            return redirect()->route('quotes.index')
                           ->with('error', '載入編輯頁面時發生錯誤');
        }
    }

    /**
     * 顯示編輯報價單頁面 (多步驟表單)
     */
    public function editMultiStep($id)
    {
        try {
            // 載入報價單資料
            $quoteResponse = $this->callGoAPI("/api/quotes/{$id}");
            
            if (!$quoteResponse->successful()) {
                return redirect()->route('quotes.index')
                               ->with('error', '找不到該報價單');
            }

            // 載入客戶列表 (直接調用控制器)
            $customerController = new \App\Http\Controllers\Api\CustomerController();
            $request = new \Illuminate\Http\Request();
            $request->merge(['limit' => 1000]);
            
            $customers = [];
            try {
                $customerResponse = $customerController->index($request);
                $responseData = $customerResponse->getData(true);
                $customers = $responseData['data'] ?? [];
            } catch (\Exception $e) {
                Log::error('Failed to load customers: ' . $e->getMessage());
            }

            $quote = $quoteResponse->json()['quote'];
            // 標準化資料：補齊產品名稱/日期欄位等，與顯示頁一致
            $quote = $this->normalizeQuoteData($quote);

            return view('quotes.multi-step-form', [
                'mode' => 'edit',
                'quote' => $quote,
                'customers' => $customers,
                'quoteId' => $id
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error loading multi-step quote edit page: ' . $e->getMessage());
            return redirect()->route('quotes.index')
                           ->with('error', '載入編輯頁面時發生錯誤');
        }
    }

    /**
     * 更新報價單
     */
    public function update(Request $request, $id)
    {
        // 驗證請求資料
        $validated = $request->validate([
            'customer_id' => 'required|integer|min:1',
            'quote_date' => 'required|date',
            'valid_until' => 'required|date|after:quote_date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|string|in:draft,pending,approved,rejected,expired,sent,accepted', // 支援新舊狀態值
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.product_id' => 'nullable|integer|min:1',
        ]);

        try {
            // ✅ 狀態映射邏輯（update 方法）
            $status = $validated['status'] ?? 'draft';
            $statusMapping = [
                'sent' => 'pending',      // 前端→後端映射
                'accepted' => 'approved', // 前端→後端映射
                // 其他狀態保持不變
            ];
            
            // 準備更新資料 - 將日期轉換為RFC3339格式供Go API使用
            $quoteData = [
                'customer_id' => (int)$validated['customer_id'],
                'quote_date' => \Carbon\Carbon::parse($validated['quote_date'])->toISOString(),
                'expiry_date' => \Carbon\Carbon::parse($validated['valid_until'])->toISOString(),
                'notes' => $validated['notes'] ?? '',
                'status' => $statusMapping[$status] ?? $status, // ✅ 使用映射後的狀態
                'items' => array_map(function($item) {
                    // Go UpdateQuoteRequest 需要 product_id、quantity、unit_price、description
                    $productId = isset($item['product_id']) && (int)$item['product_id'] > 0
                        ? (int)$item['product_id']
                        : 832; // 與建立流程一致的保底

                    return [
                        'product_id' => $productId,
                        'description' => $item['description'] ?? '',
                        'quantity' => (float)$item['quantity'],
                        'unit_price' => (float)$item['unit_price'],
                    ];
                }, $validated['items'])
            ];

            // 呼叫 Go API 更新報價單
            $response = $this->callGoAPI("/api/quotes/{$id}", 'PUT', $quoteData);

            if ($response->successful()) {
                return redirect()->route('quotes.show', $id)
                               ->with('success', '報價單更新成功！');
            }

            // API 回應錯誤
            $errorMessage = $response->json()['error'] ?? '更新報價單時發生錯誤';
            return back()->withInput()->withErrors(['submit' => $errorMessage]);
            
        } catch (\Exception $e) {  
            Log::error('Error updating quote: ' . $e->getMessage());
            return back()->withInput()->withErrors(['submit' => '系統錯誤，請稍後再試']);
        }
    }

    /**
     * 刪除報價單
     */
    public function destroy($id)
    {
        try {
            $response = $this->callGoAPI("/api/quotes/{$id}", 'DELETE');

            if ($response->successful()) {
                return redirect()->route('quotes.index')
                               ->with('success', '報價單刪除成功');
            }

            return redirect()->route('quotes.index')
                           ->with('error', '刪除報價單時發生錯誤');
                           
        } catch (\Exception $e) {
            Log::error('Error deleting quote: ' . $e->getMessage());
            return redirect()->route('quotes.index')
                           ->with('error', '系統錯誤，請稍後再試');
        }
    }

    /**
     * 批准報價單
     */
    public function approve($id)
    {
        try {
            $response = $this->callGoAPI("/api/quotes/{$id}/approve", 'POST');

            if ($response->successful()) {
                return redirect()->route('quotes.show', $id)
                               ->with('success', '報價單批准成功');
            }

            return back()->with('error', '批准報價單時發生錯誤');
            
        } catch (\Exception $e) {
            Log::error('Error approving quote: ' . $e->getMessage());
            return back()->with('error', '系統錯誤，請稍後再試');
        }
    }

    /**
     * 拒絕報價單
     */
    public function reject($id)
    {
        try {
            $response = $this->callGoAPI("/api/quotes/{$id}/reject", 'POST');

            if ($response->successful()) {
                return redirect()->route('quotes.show', $id)
                               ->with('success', '報價單已拒絕');
            }

            return back()->with('error', '拒絕報價單時發生錯誤');
            
        } catch (\Exception $e) {
            Log::error('Error rejecting quote: ' . $e->getMessage());
            return back()->with('error', '系統錯誤，請稍後再試');
        }
    }

    /**
     * 轉換報價單為銷售訂單
     */
    public function convert($id)
    {
        try {
            // 送出空的 JSON 物件（{} 而非 []），避免 Go 端 ShouldBindJSON 綁定失敗
            $payload = new \stdClass(); // 會被編碼為 {}
            $response = $this->callGoAPI("/api/quotes/{$id}/convert", 'POST', $payload);

            if ($response->successful()) {
                $salesOrder = $response->json()['sales_order'];
                $salesOrderId = $salesOrder['id'];
                
                return redirect()->route('orders.sales.show', $salesOrderId)
                               ->with('success', '報價單已成功轉換為銷售訂單');
            }

            // 優先顯示後端的具體錯誤訊息（如：必須已批准、已轉換、已過期等），並附加 details 以利除錯
            $statusCode = $response->status();
            $errorMessage = '轉換報價單時發生錯誤';
            try {
                $resp = $response->json();
                $errorMessage = $resp['message'] ?? $resp['error'] ?? $errorMessage;
                if (isset($resp['details'])) {
                    $details = is_string($resp['details']) ? $resp['details'] : json_encode($resp['details'], JSON_UNESCAPED_UNICODE);
                    $errorMessage .= '｜詳情：' . $details;
                }
            } catch (\Throwable $t) {
                // 非 JSON 回應，取原始 body 前 300 字元
                $body = substr($response->body(), 0, 300);
                $errorMessage .= "（HTTP {$statusCode}）" . ($body ? "｜回應：{$body}" : '');
            }
            return back()->with('error', $errorMessage);
            
        } catch (\Exception $e) {
            Log::error('Error converting quote: ' . $e->getMessage());
            return back()->with('error', '系統錯誤，請稍後再試');
        }
    }

    /**
     * 呼叫 Go Backend API
     */
    private function callGoAPI($endpoint, $method = 'GET', $data = null)
    {
        try {
            $headers = [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ];

            // 如果用戶已登入，添加認證標頭
            if (Auth::check()) {
                // 改用 Go JWT（優先使用現有 Session，否則即時取得）
                $jwt = Session::get('go_jwt_token');
                if (!$jwt) {
                    try {
                        $service = new SimpleGoJWTService();
                        $result = $service->authenticateUser(Auth::user());
                        if (!empty($result['success']) && !empty($result['access_token'])) {
                            $jwt = $result['access_token'];
                        }
                    } catch (\Throwable $t) {
                        Log::warning('Failed to acquire Go JWT', ['error' => $t->getMessage()]);
                    }
                }

                if ($jwt) {
                    $headers['Authorization'] = 'Bearer ' . $jwt;
                }
            }

            $httpClient = Http::withHeaders($headers)->timeout(30);

            switch (strtoupper($method)) {
                case 'GET':
                    return $httpClient->get($this->goApiUrl . $endpoint);
                case 'POST':
                    return $httpClient->post($this->goApiUrl . $endpoint, $data);
                case 'PUT':
                    return $httpClient->put($this->goApiUrl . $endpoint, $data);
                case 'DELETE':
                    return $httpClient->delete($this->goApiUrl . $endpoint);
                default:
                    throw new \InvalidArgumentException("Unsupported HTTP method: {$method}");
            }
            
        } catch (\Exception $e) {
            Log::error('Go API call failed', [
                'endpoint' => $endpoint,
                'method' => $method,
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            throw $e;
        }
    }

    /**
     * 獲取或創建用戶的API Token (適配 Go backend 格式)
     * 
     * ⚠️ 安全性警告：此方法使用簡單的 base64 編碼，僅適用於開發環境
     * TODO: 生產環境必須改用安全的 JWT 或加密 token 機制
     * 
     * 已知安全風險：
     * - 無加密保護：任何人都可以解碼獲取用戶資訊
     * - 無簽名驗證：token 可被偽造
     * - 無撤銷機制：無法主動撤銷已簽發的 token
     * 
     * 建議改進：
     * 1. 使用 Laravel Sanctum 或 JWT 
     * 2. 實作 token 撤銷機制
     * 3. 加入 token 刷新機制
     */
    private function getOrCreateApiToken($user): string
    {
        try {
            // 直接生成符合 Go backend 期望的 simple base64 token 格式
            // ⚠️ 臨時方案：不使用 Laravel API token 因為格式不相容
            $payload = [
                'user_id' => (int)$user->id, // 確保是整數類型
                'email' => $user->email,
                'name' => $user->name ?? ($user->first_name . ' ' . $user->last_name),
                'exp' => time() + (24 * 60 * 60) // 24小時後過期
            ];
            
            // 轉換為 JSON 並 base64 編碼
            $jsonPayload = json_encode($payload);
            $base64Token = base64_encode($jsonPayload);
            
            Log::info('Generated Go backend compatible simple token for user', [
                'user_id' => $user->id,
                'token_length' => strlen($base64Token),
                'payload' => $payload
            ]);
            
            return $base64Token;
            
        } catch (\Exception $e) {
            Log::error('Failed to generate Go backend token: ' . $e->getMessage(), [
                'user_id' => $user->id ?? 'unknown',
                'error_trace' => $e->getTraceAsString()
            ]);
            
            // 緊急備用方案 - 使用第一個活躍用戶的 ID
            $firstUser = \App\Models\User::where('status', 'active')->first();
            $fallbackUserId = $firstUser ? $firstUser->id : 1061; // 使用已知存在的用戶 ID
            
            $fallbackPayload = [
                'user_id' => (int)$fallbackUserId,
                'email' => $firstUser ? $firstUser->email : 'VtfOSCV@TRBcCZd.top',
                'name' => $firstUser ? $firstUser->name : 'Fallback User',
                'exp' => time() + (24 * 60 * 60)
            ];
            
            Log::warning('Using fallback token with user ID', $fallbackPayload);
            
            return base64_encode(json_encode($fallbackPayload));
        }
    }

    /**
     * 數據標準化處理 - 確保報價單數據格式一致性
     */
    private function normalizeQuoteData($quote): array
    {
        // 🔧 修復產品名稱問題: 為缺少名稱的items獲取產品資訊
        $processedItems = [];
        $subtotal = 0;
        
        if (isset($quote['items']) && is_array($quote['items'])) {
            foreach ($quote['items'] as $item) {
                $quantity = floatval($item['quantity'] ?? 0);
                $unitPrice = floatval($item['unit_price'] ?? 0);
                $subtotal += $quantity * $unitPrice;
                
                // 檢查是否缺少產品名稱
                if (empty($item['name']) && empty($item['product_name']) && !empty($item['product_id'])) {
                    try {
                        // 調用Product API獲取產品名稱
                        $productResponse = $this->callGoAPI("/api/products/{$item['product_id']}");
                        
                        if ($productResponse->successful()) {
                            $productData = $productResponse->json();
                            $item['name'] = $productData['name'] ?? 'Unknown Product';
                            $item['product_name'] = $productData['name'] ?? 'Unknown Product';
                            
                            Log::info("Product name fetched for quote item", [
                                'product_id' => $item['product_id'],
                                'product_name' => $item['name']
                            ]);
                        } else {
                            Log::warning("Failed to fetch product name", [
                                'product_id' => $item['product_id'],
                                'api_status' => $productResponse->status()
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::error("Error fetching product name", [
                            'product_id' => $item['product_id'],
                            'error' => $e->getMessage()
                        ]);
                    }
                }
                
                $processedItems[] = $item;
            }
        }

        // 標準化數據欄位
        return [
            'id' => $quote['id'] ?? null,
            // 🔧 修復3: 單號格式統一化 - 使用正確的年份格式
            'quote_number' => $quote['quote_number'] ?? 'QT' . date('Y') . str_pad($quote['id'] ?? 0, 6, '0', STR_PAD_LEFT),
            'customer' => $quote['customer'] ?? ['name' => '未知客戶'],
            'status' => $quote['status'] ?? 'draft',
            'quote_date' => $quote['quote_date'] ?? $quote['created_at'] ?? null,
            'expiry_date' => $quote['expiry_date'] ?? $quote['valid_until'] ?? $quote['valid_until_date'] ?? null,
            'contact_person' => $quote['contact_person'] ?? '',
            'notes' => $quote['notes'] ?? '',
            // 🔧 修復4: Currency預設值改為TWD以符合currency_id映射
            'currency' => $quote['currency'] ?? 'TWD',
            
            // **重要修復**: 確保金額欄位正確
            'subtotal' => $quote['subtotal'] ?? $subtotal,
            'total_amount' => $quote['total_amount'] ?? $quote['total'] ?? $subtotal,
            'discount' => $quote['discount'] ?? 0,
            'tax' => $quote['tax'] ?? ($subtotal * 0.05), // 5% 稅率
            
            // 項目數據 - 使用處理過的items（包含產品名稱）
            'items' => $processedItems,
            
            // 保留原始數據
            'original' => $quote
        ];
    }
}