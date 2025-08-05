<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class QuoteController extends Controller
{
    private $goApiUrl;

    public function __construct()
    {
        $this->goApiUrl = config('services.go_backend.url', 'http://localhost:8082');
        $this->middleware('auth');
    }

    /**
     * 顯示報價單列表頁面
     */
    public function index(Request $request)
    {
        try {
            // 建立查詢參數
            $queryParams = array_filter([
                'page' => $request->get('page', 1),
                'per_page' => $request->get('per_page', 20),
                'search' => $request->get('search'),
                'status' => $request->get('status'),
                'customer_id' => $request->get('customer_id'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'sort' => $request->get('sort', 'created_at_desc'),
            ]);

            // 處理排序參數
            $sortMapping = [
                'created_at_desc' => ['field' => 'created_at', 'direction' => 'desc'],
                'created_at_asc' => ['field' => 'created_at', 'direction' => 'asc'],
                'quote_date_desc' => ['field' => 'quote_date', 'direction' => 'desc'],
                'quote_date_asc' => ['field' => 'quote_date', 'direction' => 'asc'],
                'total_amount_desc' => ['field' => 'total_amount', 'direction' => 'desc'],
                'total_amount_asc' => ['field' => 'total_amount', 'direction' => 'asc'],
            ];

            $sortKey = $request->get('sort', 'created_at_desc');
            if (isset($sortMapping[$sortKey])) {
                $queryParams['sort_field'] = $sortMapping[$sortKey]['field'];
                $queryParams['sort_direction'] = $sortMapping[$sortKey]['direction'];
            }

            // 移除原始的 sort 參數，避免 API 混淆
            unset($queryParams['sort']);

            Log::info('Quote API Query Parameters:', $queryParams);

            $response = $this->callGoAPI('/api/quotes?' . http_build_query($queryParams));
            
            if ($response->successful()) {
                $quotes = $response->json();
                
                // 確保資料結構正確
                if (!isset($quotes['quotes'])) {
                    $quotes = [
                        'quotes' => $quotes['data'] ?? [],
                        'total' => $quotes['total'] ?? 0,
                        'current_page' => $quotes['current_page'] ?? 1,
                        'per_page' => $quotes['per_page'] ?? 20,
                        'last_page' => $quotes['last_page'] ?? 1,
                    ];
                }

                Log::info('Quote data structure:', ['count' => count($quotes['quotes'] ?? [])]);
                
                return view('quotes.index', compact('quotes'));
            } else {
                Log::error('Go API response error:', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                
                return view('quotes.index', ['quotes' => ['quotes' => [], 'total' => 0]])
                       ->with('error', 'API 回應錯誤: ' . $response->status());
            }
            
        } catch (\Exception $e) {
            Log::error('Error fetching quotes: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return view('quotes.index', ['quotes' => ['quotes' => [], 'total' => 0]])
                   ->with('error', '載入報價單列表時發生錯誤: ' . $e->getMessage());
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
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            // 準備報價單資料 - 將日期轉換為RFC3339格式供Go API使用
            $quoteData = [
                'customer_id' => (int)$validated['customer_id'],
                'quote_date' => \Carbon\Carbon::parse($validated['quote_date'])->toISOString(),
                'valid_until' => \Carbon\Carbon::parse($validated['valid_until'])->toISOString(),
                'notes' => $validated['notes'] ?? '',
                'status' => 'draft',
                'items' => array_map(function($item) {
                    // 如果有product_id就使用，否則使用預設產品ID (832)
                    $productId = isset($item['product_id']) && $item['product_id'] > 0 
                               ? (int)$item['product_id'] 
                               : 832; // 使用 "測試商品 A" 作為預設產品ID
                    
                    return [
                        'product_id' => $productId,
                        'name' => $item['name'], // 覆蓋產品名稱
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
            
            return back()->withInput()->withErrors(['submit' => $errorMessage]);
            
        } catch (\Exception $e) {
            Log::error('Error creating quote: ' . $e->getMessage());
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
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            // 準備更新資料 - 將日期轉換為RFC3339格式供Go API使用
            $quoteData = [
                'customer_id' => (int)$validated['customer_id'],
                'quote_date' => \Carbon\Carbon::parse($validated['quote_date'])->toISOString(),
                'valid_until' => \Carbon\Carbon::parse($validated['valid_until'])->toISOString(),
                'notes' => $validated['notes'] ?? '',
                'items' => array_map(function($item) {
                    return [
                        'name' => $item['name'],
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
            $response = $this->callGoAPI("/api/quotes/{$id}/convert", 'POST');

            if ($response->successful()) {
                $salesOrder = $response->json()['sales_order'];
                $salesOrderId = $salesOrder['id'];
                
                return redirect()->route('orders.sales.show', $salesOrderId)
                               ->with('success', '報價單已成功轉換為銷售訂單');
            }

            return back()->with('error', '轉換報價單時發生錯誤');
            
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
                $user = Auth::user();
                
                // 為認證用戶生成臨時API token（解決資料庫結構限制）
                $apiToken = $this->getOrCreateApiToken($user);
                
                $headers['Authorization'] = 'Bearer ' . $apiToken;
                $headers['X-User-ID'] = Auth::id();
                $headers['X-User-Email'] = $user->email;
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
     */
    private function getOrCreateApiToken($user): string
    {
        try {
            // 生成符合 Go backend 期望的 simple token 格式
            $payload = [
                'user_id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'exp' => time() + (24 * 60 * 60) // 24小時後過期
            ];
            
            // 轉換為 JSON 並 base64 編碼
            $jsonPayload = json_encode($payload);
            $base64Token = base64_encode($jsonPayload);
            
            Log::info('Generated Go backend compatible token for user', [
                'user_id' => $user->id,
                'token_length' => strlen($base64Token)
            ]);
            
            return $base64Token;
            
        } catch (\Exception $e) {
            Log::error('Failed to generate Go backend token: ' . $e->getMessage());
            
            // 緊急備用方案
            $fallbackPayload = [
                'user_id' => 1, // 預設用戶 ID
                'email' => 'test@example.com',
                'name' => 'Test User',
                'exp' => time() + (24 * 60 * 60)
            ];
            
            return base64_encode(json_encode($fallbackPayload));
        }
    }
}