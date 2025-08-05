<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use App\Models\BusinessUnit;
use App\Models\UserCompany;
use App\Models\UserBusinessUnit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class BusinessSetupController extends Controller
{
    /**
     * 顯示業務設定頁面
     */
    public function show(): View|RedirectResponse
    {
        $user = Auth::user();
        
        // 如果用戶已經設定過業務類型，重定向到 Dashboard
        if ($user->business_type && $user->role) {
            return redirect()->route('dashboard');
        }
        
        // 取得註冊時的業務上下文
        $registrationContext = session('registration_business_context', []);
        
        return view('auth.business-setup', [
            'hasAIContext' => !empty($registrationContext['business_description']) || !empty($registrationContext['ai_analysis']),
            'businessDescription' => $registrationContext['business_description'] ?? '',
            'conversationHistory' => $registrationContext['conversation_history'] ?? '',
        ]);
    }

    /**
     * 處理業務設定提交
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'business_type' => 'required|string|in:restaurant,retail,manufacturing,service,agriculture,other',
            'company_name' => 'required|string|max:255',
            'company_code' => 'nullable|string|max:50|unique:companies,code',
            'tax_number' => 'nullable|string|regex:/^[0-9]{8}$/',
            'industry' => 'required|string|in:manufacturing,retail,service,restaurant,technology,other',
            'size' => 'required|string|in:1-10,11-50,51-200,201-500,500+',
            'company_address' => 'required|string|max:500',
            'company_phone' => 'required|string|regex:/^[0-9\-\(\)\s]+$/',
            'company_email' => 'nullable|email',
        ]);

        $user = Auth::user();
        $businessType = $request->business_type;
        
        // 檢查用戶是否已有公司關聯
        if ($user->companies()->exists()) {
            return redirect()->route('dashboard')
                ->with('info', '您已經完成公司設定。');
        }
        
        // 根據業務類型自動設定角色
        $role = $this->determineRoleFromBusinessType($businessType);
        
        try {
            DB::transaction(function () use ($request, $user, $businessType, $role) {
                // 更新用戶資料
                $user->update([
                    'business_type' => $businessType,
                    'role' => $role,
                ]);

                // 建立公司記錄
                $company = Company::create([
                    'name' => $request->company_name,
                    'display_name' => $request->company_name,
                    'code' => $request->company_code ?: Company::generateCode($request->company_name),
                    'tax_number' => $request->tax_number,
                    'industry' => $request->industry,
                    'size' => $request->size,
                    'phone' => $request->company_phone,
                    'address' => ['full' => $request->company_address],
                    'email' => $request->company_email,
                    'is_active' => true,
                    'created_by_user_id' => $user->id,
                    'currency' => 'TWD',
                    'timezone' => 'Asia/Taipei',
                    'locale' => 'zh_TW',
                ]);

                // 建立用戶-公司關聯
                UserCompany::create([
                    'user_id' => $user->id,
                    'company_id' => $company->id,
                    'role' => 'admin',
                    'is_primary' => true,
                    'is_active' => true,
                    'joined_at' => now(),
                ]);

                // 建立預設業務單位
                $businessUnit = BusinessUnit::create([
                    'company_id' => $company->id,
                    'name' => '總部',
                    'display_name' => '總部',
                    'code' => 'HQ',
                    'type' => 'headquarters',
                    'is_active' => true,
                    'created_by_user_id' => $user->id,
                ]);

                // 關聯用戶到業務單位
                UserBusinessUnit::create([
                    'user_id' => $user->id,
                    'business_unit_id' => $businessUnit->id,
                    'role' => 'admin',
                    'is_primary' => true,
                    'is_active' => true,
                    'joined_at' => now(),
                ]);

                // 設定會話中的當前公司 ID
                session(['current_company_id' => $company->id]);
            });

            Log::info('User business setup completed with company creation', [
                'user_id' => $user->id,
                'business_type' => $businessType,
                'role' => $role,
                'company_name' => $request->company_name,
                'setup_method' => $request->has('ai_recommendation') ? 'ai' : 'manual'
            ]);

            // 根據業務類型顯示歡迎訊息
            $welcomeMessage = $this->getWelcomeMessage($businessType);

            return redirect()
                ->route('dashboard')
                ->with('success', $welcomeMessage);
                
        } catch (\Exception $e) {
            Log::error('Business setup failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', '設定過程發生錯誤，請重試。');
        }
    }

    /**
     * 根據業務類型決定角色
     */
    private function determineRoleFromBusinessType(string $businessType): string
    {
        $roleMapping = [
            'restaurant' => 'restaurant_owner',
            'retail' => 'shop_owner', 
            'manufacturing' => 'factory_owner',
            'service' => 'service_provider',
            'agriculture' => 'farmer',
            'other' => 'business_owner'
        ];

        return $roleMapping[$businessType] ?? 'business_owner';
    }

    /**
     * 取得歡迎訊息
     */
    private function getWelcomeMessage(string $businessType): string
    {
        $messages = [
            'restaurant' => '歡迎使用 NexusERP！您的餐飲業管理系統已準備就緒，包含菜單管理、訂單追蹤、庫存控制等功能。',
            'retail' => '歡迎使用 NexusERP！您的零售業管理系統已準備就緒，包含商品管理、銷售分析、客戶關係等功能。',
            'manufacturing' => '歡迎使用 NexusERP！您的製造業管理系統已準備就緒，包含生產管理、原料追蹤、品質控制等功能。',
            'service' => '歡迎使用 NexusERP！您的服務業管理系統已準備就緒，包含客戶管理、專案追蹤、服務記錄等功能。',
            'agriculture' => '歡迎使用 NexusERP！您的農業管理系統已準備就緒，包含作物管理、收成記錄、銷售追蹤等功能。',
            'other' => '歡迎使用 NexusERP！您的業務管理系統已準備就緒，所有核心功能都已為您啟用。'
        ];

        return $messages[$businessType] ?? '歡迎使用 NexusERP！您的業務管理系統已準備就緒。';
    }

    /**
     * API：AI 業務分析
     */
    public function analyzeBusinessWithAI(Request $request)
    {
        $request->validate([
            'description' => 'required|string|max:1000',
        ]);

        $description = $request->description;
        
        try {
            // 調用 AI 分析服務
            $aiService = app(\App\Services\AIService::class);
            $analysis = $aiService->analyzeBusinessType($description);
            
            return response()->json([
                'success' => true,
                'recommendation' => $analysis['business_type'],
                'confidence' => $analysis['confidence'],
                'explanation' => $analysis['explanation'],
                'suggested_features' => $analysis['features'] ?? []
            ]);
            
        } catch (\Exception $e) {
            Log::error('AI business analysis failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'description' => $description
            ]);

            // 降級到基於關鍵字的分析
            $fallbackAnalysis = $this->fallbackBusinessAnalysis($description);
            
            return response()->json([
                'success' => true,
                'recommendation' => $fallbackAnalysis['business_type'],
                'confidence' => $fallbackAnalysis['confidence'],
                'explanation' => $fallbackAnalysis['explanation'],
                'fallback' => true
            ]);
        }
    }

    /**
     * 降級業務分析（基於關鍵字）
     */
    private function fallbackBusinessAnalysis(string $description): array
    {
        $description = strtolower($description);
        
        // 關鍵字映射
        $keywords = [
            'restaurant' => ['餐廳', '咖啡', '食物', '菜單', '用餐', '廚房', '料理', '飲料', '小吃', '餐飲'],
            'retail' => ['商店', '零售', '販售', '商品', '購買', '客戶', '銷售', '商場', '店面'],
            'manufacturing' => ['工廠', '製造', '生產', '機械', '產品', '組裝', '製作', '加工'],
            'service' => ['服務', '顧問', '維修', '專業', '諮詢', '技術', '支援'],
            'agriculture' => ['農場', '農業', '種植', '養殖', '作物', '畜牧', '農產品', '收成']
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
        $recommendedType = array_keys($scores, max($scores))[0];
        $maxScore = max($scores);
        
        if ($maxScore === 0) {
            $recommendedType = 'other';
            $confidence = 0.3;
            $explanation = '無法從描述中識別明確的業務類型，建議選擇「其他」類型。';
        } else {
            $confidence = min(0.8, $maxScore * 0.2);
            $businessNames = [
                'restaurant' => '餐飲業',
                'retail' => '零售業',
                'manufacturing' => '製造業', 
                'service' => '服務業',
                'agriculture' => '農業'
            ];
            $explanation = "根據您的描述，推薦設定為「{$businessNames[$recommendedType]}」。";
        }

        return [
            'business_type' => $recommendedType,
            'confidence' => $confidence,
            'explanation' => $explanation
        ];
    }
}