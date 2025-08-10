<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class QuoteDraftController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * 保存報價草稿
     * 支援多步驟表單的即時草稿保存功能
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            // 確保用戶有公司上下文
            $currentCompanyId = $user->current_company_id ?? $this->getUserCompanyId($user);
            
            if (!$currentCompanyId) {
                return response()->json([
                    'success' => false,
                    'message' => '請先設定公司資訊後再建立報價單'
                ], 400);
            }

            // 驗證基本請求資料
            $validator = Validator::make($request->all(), [
                'customer_id' => 'nullable|integer|min:1',
                'quote_date' => 'nullable|date',
                'valid_until' => 'nullable|date',
                'status' => 'nullable|string|in:draft,sent,accepted,rejected,expired',
                'contact_person' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
                'items' => 'nullable|array',
                'items.*.name' => 'nullable|string|max:255',
                'items.*.product_id' => 'nullable|integer',
                'items.*.description' => 'nullable|string|max:500',
                'items.*.quantity' => 'nullable|numeric|min:0',
                'items.*.unit_price' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => '資料驗證失敗',
                    'errors' => $validator->errors()
                ], 422);
            }

            // 準備草稿資料
            $draftData = [
                'user_id' => $user->id,
                'company_id' => $currentCompanyId,
                'customer_id' => $request->input('customer_id'),
                'quote_date' => $request->input('quote_date'),
                'valid_until' => $request->input('valid_until'),
                'status' => $request->input('status', 'draft'),
                'contact_person' => $request->input('contact_person'),
                'notes' => $request->input('notes'),
                'items' => $this->sanitizeItems($request->input('items', [])),
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString(),
            ];

            // 生成草稿 ID
            $draftId = $request->input('draft_id') ?? $this->generateDraftId($user->id);
            
            // 使用 Cache 儲存草稿 (24小時過期)
            $cacheKey = "quote_draft_{$user->id}_{$draftId}";
            Cache::put($cacheKey, $draftData, now()->addHours(24));

            // 記錄草稿保存
            Log::info('Quote draft saved successfully', [
                'user_id' => $user->id,
                'draft_id' => $draftId,
                'company_id' => $currentCompanyId,
                'cache_key' => $cacheKey
            ]);

            return response()->json([
                'success' => true,
                'message' => '草稿已成功保存',
                'data' => [
                    'draft_id' => $draftId,
                    'expires_at' => now()->addHours(24)->toISOString(),
                    'user_id' => $user->id,
                    'company_id' => $currentCompanyId
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Quote draft save error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => '草稿保存失敗，請稍後再試'
            ], 500);
        }
    }

    /**
     * 載入報價草稿
     * 支援多步驟表單的草稿恢復功能
     */
    public function show(Request $request, $draftId = null)
    {
        try {
            $user = Auth::user();

            // 如果沒有提供草稿 ID，嘗試獲取最新的草稿
            if (!$draftId) {
                $draftId = $this->getLatestDraftId($user->id);
                if (!$draftId) {
                    return response()->json([
                        'success' => false,
                        'message' => '沒有找到草稿'
                    ], 404);
                }
            }

            $cacheKey = "quote_draft_{$user->id}_{$draftId}";
            $draftData = Cache::get($cacheKey);

            if (!$draftData) {
                return response()->json([
                    'success' => false,
                    'message' => '草稿不存在或已過期'
                ], 404);
            }

            // 驗證草稿所有者
            if ($draftData['user_id'] !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => '無權存取此草稿'
                ], 403);
            }

            Log::info('Quote draft loaded successfully', [
                'user_id' => $user->id,
                'draft_id' => $draftId,
                'cache_key' => $cacheKey
            ]);

            return response()->json([
                'success' => true,
                'message' => '草稿載入成功',
                'data' => $draftData
            ]);

        } catch (\Exception $e) {
            Log::error('Quote draft load error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'draft_id' => $draftId
            ]);

            return response()->json([
                'success' => false,
                'message' => '草稿載入失敗'
            ], 500);
        }
    }

    /**
     * 列出用戶的所有草稿
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $drafts = [];

            // 搜尋用戶的所有草稿 (簡單實作，使用 cache 標記)
            $draftListKey = "quote_drafts_list_{$user->id}";
            $draftIds = Cache::get($draftListKey, []);

            foreach ($draftIds as $draftId) {
                $cacheKey = "quote_draft_{$user->id}_{$draftId}";
                $draftData = Cache::get($cacheKey);
                
                if ($draftData) {
                    $drafts[] = [
                        'id' => $draftId,
                        'customer_id' => $draftData['customer_id'],
                        'quote_date' => $draftData['quote_date'],
                        'notes' => $draftData['notes'],
                        'items_count' => count($draftData['items'] ?? []),
                        'created_at' => $draftData['created_at'],
                        'updated_at' => $draftData['updated_at'],
                    ];
                }
            }

            // 按更新時間排序
            usort($drafts, function($a, $b) {
                return strtotime($b['updated_at']) - strtotime($a['updated_at']);
            });

            return response()->json([
                'success' => true,
                'message' => '草稿列表載入成功',
                'data' => $drafts
            ]);

        } catch (\Exception $e) {
            Log::error('Quote drafts list error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => '草稿列表載入失敗'
            ], 500);
        }
    }

    /**
     * 刪除草稿
     */
    public function destroy(Request $request, $draftId)
    {
        try {
            $user = Auth::user();
            $cacheKey = "quote_draft_{$user->id}_{$draftId}";

            // 檢查草稿是否存在
            $draftData = Cache::get($cacheKey);
            if (!$draftData) {
                return response()->json([
                    'success' => false,
                    'message' => '草稿不存在'
                ], 404);
            }

            // 驗證草稿所有者
            if ($draftData['user_id'] !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => '無權刪除此草稿'
                ], 403);
            }

            // 刪除草稿
            Cache::forget($cacheKey);

            // 從草稿列表中移除
            $draftListKey = "quote_drafts_list_{$user->id}";
            $draftIds = Cache::get($draftListKey, []);
            $draftIds = array_filter($draftIds, function($id) use ($draftId) {
                return $id !== $draftId;
            });
            Cache::put($draftListKey, $draftIds, now()->addHours(24));

            Log::info('Quote draft deleted successfully', [
                'user_id' => $user->id,
                'draft_id' => $draftId,
                'cache_key' => $cacheKey
            ]);

            return response()->json([
                'success' => true,
                'message' => '草稿已刪除'
            ]);

        } catch (\Exception $e) {
            Log::error('Quote draft delete error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'draft_id' => $draftId
            ]);

            return response()->json([
                'success' => false,
                'message' => '草稿刪除失敗'
            ], 500);
        }
    }

    /**
     * 驗證報價草稿資料
     * 支援分步驟驗證
     */
    public function validateDraft(Request $request)
    {
        try {
            $user = Auth::user();
            $step = $request->input('step', 1);
            $data = $request->all();

            $errors = [];
            $isValid = true;

            // 步驟 1: 客戶資訊驗證
            if ($step >= 1) {
                if (empty($data['customer_id'])) {
                    $errors['customer_id'] = '請選擇客戶';
                    $isValid = false;
                }
                if (empty($data['quote_date'])) {
                    $errors['quote_date'] = '請選擇報價日期';
                    $isValid = false;
                }
                if (empty($data['valid_until'])) {
                    $errors['valid_until'] = '請選擇有效期限';
                    $isValid = false;
                } elseif (!empty($data['quote_date']) && strtotime($data['valid_until']) <= strtotime($data['quote_date'])) {
                    $errors['valid_until'] = '有效期限必須晚於報價日期';
                    $isValid = false;
                }
            }

            // 步驟 2: 產品項目驗證
            if ($step >= 2) {
                $items = $data['items'] ?? [];
                $hasValidItem = false;

                foreach ($items as $index => $item) {
                    if (!empty($item['name']) && strlen(trim($item['name'])) >= 2) {
                        $hasValidItem = true;
                        if (empty($item['quantity']) || $item['quantity'] <= 0) {
                            $errors["items.{$index}.quantity"] = '數量必須大於 0';
                            $isValid = false;
                        }
                        if (!isset($item['unit_price']) || $item['unit_price'] < 0) {
                            $errors["items.{$index}.unit_price"] = '單價不能為負數';
                            $isValid = false;
                        }
                    }
                }

                if (!$hasValidItem) {
                    $errors['items'] = '至少需要一個有效的產品項目';
                    $isValid = false;
                }
            }

            return response()->json([
                'success' => $isValid,
                'message' => $isValid ? '資料驗證通過' : '資料驗證失敗',
                'errors' => $errors,
                'step' => $step
            ]);

        } catch (\Exception $e) {
            Log::error('Quote draft validation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'step' => $request->input('step'),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => '驗證過程發生錯誤'
            ], 500);
        }
    }

    /**
     * 清理產品項目資料
     */
    private function sanitizeItems($items)
    {
        $sanitized = [];
        
        foreach ($items as $item) {
            if (!empty($item['name'])) {
                $sanitized[] = [
                    'name' => trim($item['name']),
                    'product_id' => isset($item['product_id']) ? (int)$item['product_id'] : null,
                    'description' => trim($item['description'] ?? ''),
                    'quantity' => isset($item['quantity']) ? (float)$item['quantity'] : 1,
                    'unit_price' => isset($item['unit_price']) ? (float)$item['unit_price'] : 0,
                    'subtotal' => isset($item['subtotal']) ? (float)$item['subtotal'] : 0,
                ];
            }
        }
        
        return $sanitized;
    }

    /**
     * 生成草稿 ID
     */
    private function generateDraftId($userId)
    {
        $timestamp = now()->timestamp;
        $random = mt_rand(1000, 9999);
        $draftId = "draft_{$userId}_{$timestamp}_{$random}";
        
        // 更新草稿列表
        $draftListKey = "quote_drafts_list_{$userId}";
        $draftIds = Cache::get($draftListKey, []);
        $draftIds[] = $draftId;
        
        // 保留最新的 10 個草稿
        $draftIds = array_slice($draftIds, -10);
        
        Cache::put($draftListKey, $draftIds, now()->addHours(24));
        
        return $draftId;
    }

    /**
     * 獲取最新的草稿 ID
     */
    private function getLatestDraftId($userId)
    {
        $draftListKey = "quote_drafts_list_{$userId}";
        $draftIds = Cache::get($draftListKey, []);
        
        return empty($draftIds) ? null : end($draftIds);
    }

    /**
     * 獲取用戶公司 ID
     */
    private function getUserCompanyId($user)
    {
        // 優先使用 current_company_id
        if ($user->current_company_id) {
            return $user->current_company_id;
        }
        
        // 嘗試從用戶公司關聯中獲取
        $primaryCompany = $user->companies()->wherePivot('is_primary', true)->first();
        if ($primaryCompany) {
            return $primaryCompany->id;
        }
        
        // 使用第一個關聯的公司
        $firstCompany = $user->companies()->first();
        return $firstCompany ? $firstCompany->id : null;
    }
}