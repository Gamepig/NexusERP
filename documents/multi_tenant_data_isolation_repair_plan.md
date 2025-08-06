# NexusERP 多租戶數據隔離修復規劃

## 📋 **執行摘要**

NexusERP 系統經過全面數據結構分析，發現多租戶架構中存在關鍵的數據隔離問題。本文件提供完整的修復規劃，確保不同公司/用戶間的數據完全隔離，提升系統安全性和數據完整性。

**分析結果：**
- 總計 71 個資料表
- 67 個業務相關表格
- 識別出 15 個需要修復的關鍵表格
- 系統整體多租戶完成度：82%

---

## 🎯 **核心問題分析**

### **發現的主要問題**
1. **🚨 用戶註冊流程缺陷** - 用戶註冊時未建立公司關聯，導致多租戶架構失效
2. **倉庫管理缺乏公司隔離** - 不同公司可能看到彼此的倉庫
3. **產品分類系統全局共享** - 公司無法自定義專屬分類
4. **員工資料缺乏公司關聯** - 人事管理權限控制有漏洞
5. **財務數據間接關聯** - 查詢效能和安全性不佳
6. **庫存數據隔離不完整** - 庫存報表可能出現跨公司數據

### **影響範圍評估**
- **🚨 緊急風險**：用戶註冊流程、公司關聯機制
- **高風險**：倉庫、產品分類、員工資料
- **中風險**：財務數據、庫存管理
- **低風險**：系統配置、報表相關

---

## 🏗️ **修復架構設計**

### **多租戶隔離策略**

#### **方案 A：公司級隔離（推薦）**
```sql
-- 每個業務表格添加 company_id
ALTER TABLE {table_name} ADD COLUMN company_id bigint REFERENCES companies(id);
CREATE INDEX idx_{table_name}_company ON {table_name}(company_id);
```

#### **方案 B：用戶級隔離**
```sql
-- 適用於需要用戶專屬數據的表格
ALTER TABLE {table_name} ADD COLUMN created_by_user_id bigint REFERENCES users(id);
ALTER TABLE {table_name} ADD COLUMN owned_by_user_id bigint REFERENCES users(id);
```

#### **方案 C：混合模式**
```sql
-- 同時支援公司級和用戶級隔離
ALTER TABLE {table_name} ADD COLUMN company_id bigint REFERENCES companies(id);
ALTER TABLE {table_name} ADD COLUMN created_by_user_id bigint REFERENCES users(id);
ALTER TABLE {table_name} ADD COLUMN owned_by_user_id bigint REFERENCES users(id);
```

---

## 📊 **詳細修復規劃**

### **🚨 第零優先級：緊急修復（第1天）**

#### **0. 用戶註冊流程修復**
```php
// 業務重要性：⭐⭐⭐⭐⭐
// 影響範圍：整個多租戶架構的基礎
// 風險等級：CRITICAL
// 說明：必須優先修復，否則新註冊用戶無法正常使用系統

// 修復目標檔案：
// - frontend/app/Http/Controllers/Auth/BusinessSetupController.php
// - frontend/app/Http/Middleware/EnsureCompanySetup.php (新建)
// - frontend/resources/views/auth/business-setup.blade.php

// 1. 修改 BusinessSetupController::store() 方法
public function store(Request $request)
{
    $request->validate([
        'business_type' => 'required|string',
        'role' => 'required|string',
        'company_name' => 'required|string|max:255',  // 新增必填欄位
        'company_code' => 'nullable|string|max:50|unique:companies,code',
    ]);

    DB::transaction(function() use ($request) {
        // 更新用戶業務資訊
        auth()->user()->update([
            'business_type' => $request->business_type,
            'role' => $request->role,
        ]);

        // 建立公司記錄
        $company = Company::create([
            'name' => $request->company_name,
            'display_name' => $request->company_name,
            'code' => $request->company_code ?: strtoupper(substr($request->company_name, 0, 5)),
            'is_active' => true,
            'created_by_user_id' => auth()->id(),
        ]);

        // 建立用戶-公司關聯
        UserCompany::create([
            'user_id' => auth()->id(),
            'company_id' => $company->id,
            'role' => $request->role,
            'is_active' => true,
            'joined_at' => now(),
        ]);

        // 建立預設業務單位
        $businessUnit = BusinessUnit::create([
            'company_id' => $company->id,
            'name' => '總部',
            'code' => 'HQ',
            'is_active' => true,
            'created_by_user_id' => auth()->id(),
        ]);

        // 關聯用戶到業務單位
        UserBusinessUnit::create([
            'user_id' => auth()->id(),
            'business_unit_id' => $businessUnit->id,
            'role' => $request->role,
            'is_active' => true,
            'joined_at' => now(),
        ]);
    });

    return redirect()->route('dashboard')
        ->with('success', '業務設定完成！歡迎使用 NexusERP 系統');
}

// 2. 建立公司設定檢查中介軟體
class EnsureCompanySetup
{
    public function handle($request, Closure $next)
    {
        $user = auth()->user();
        
        // 檢查用戶是否完成公司設定
        if (!$user->companies()->exists()) {
            return redirect()->route('auth.business-setup')
                ->with('warning', '請完成公司設定以繼續使用系統');
        }
        
        // 設定當前公司 ID 到會話中
        if (!session()->has('current_company_id')) {
            $firstCompany = $user->companies()->first();
            session(['current_company_id' => $firstCompany->id]);
        }
        
        return $next($request);
    }
}

// 3. 修改業務設定表單，加入公司資訊欄位
// frontend/resources/views/auth/business-setup.blade.php 需要添加：
<div class="mb-4">
    <label for="company_name" class="block text-sm font-medium text-gray-700">
        公司名稱 <span class="text-red-500">*</span>
    </label>
    <input type="text" name="company_name" id="company_name" required
           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
</div>

<div class="mb-4">
    <label for="company_code" class="block text-sm font-medium text-gray-700">
        公司代碼 (選填，系統會自動產生)
    </label>
    <input type="text" name="company_code" id="company_code"
           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
</div>

// 4. 建立必要的 Eloquent 模型關聯
// User.php 中添加：
public function companies()
{
    return $this->belongsToMany(Company::class, 'user_companies')
                ->withPivot(['role', 'is_active', 'joined_at'])
                ->wherePivot('is_active', true);
}

public function currentCompany()
{
    $companyId = session('current_company_id');
    return $this->companies()->where('companies.id', $companyId)->first();
}
```

#### **修復驗證腳本**
```sql
-- 檢查註冊用戶是否都有公司關聯
SELECT 
    u.id, u.name, u.email, u.created_at,
    c.id as company_id, c.name as company_name,
    uc.role, uc.joined_at
FROM users u
LEFT JOIN user_companies uc ON u.id = uc.user_id AND uc.is_active = true
LEFT JOIN companies c ON uc.company_id = c.id
WHERE u.created_at >= '2025-07-23'  -- 修復後的註冊用戶
ORDER BY u.created_at DESC;

-- 識別沒有公司關聯的孤兒用戶
SELECT u.id, u.name, u.email, u.created_at
FROM users u
LEFT JOIN user_companies uc ON u.id = uc.user_id AND uc.is_active = true
WHERE uc.user_id IS NULL
ORDER BY u.created_at DESC;
```

#### **緊急數據修復**
```sql
-- 為現有的孤兒用戶建立預設公司
DO $$
DECLARE
    orphan_user RECORD;
    new_company_id bigint;
    new_business_unit_id bigint;
BEGIN
    FOR orphan_user IN 
        SELECT u.id, u.name, u.email 
        FROM users u
        LEFT JOIN user_companies uc ON u.id = uc.user_id AND uc.is_active = true
        WHERE uc.user_id IS NULL
    LOOP
        -- 為每個孤兒用戶建立個人公司
        INSERT INTO companies (name, display_name, code, is_active, created_by_user_id, created_at, updated_at)
        VALUES (
            orphan_user.name || ' 的公司',
            orphan_user.name || ' 的公司',
            'USR' || orphan_user.id,
            true,
            orphan_user.id,
            now(),
            now()
        ) RETURNING id INTO new_company_id;
        
        -- 建立用戶-公司關聯
        INSERT INTO user_companies (user_id, company_id, role, is_active, joined_at, created_at, updated_at)
        VALUES (orphan_user.id, new_company_id, 'admin', true, now(), now(), now());
        
        -- 建立預設業務單位
        INSERT INTO business_units (company_id, name, code, is_active, created_by_user_id, created_at, updated_at)
        VALUES (new_company_id, '總部', 'HQ', true, orphan_user.id, now(), now())
        RETURNING id INTO new_business_unit_id;
        
        -- 關聯用戶到業務單位
        INSERT INTO user_business_units (user_id, business_unit_id, role, is_active, joined_at, created_at, updated_at)
        VALUES (orphan_user.id, new_business_unit_id, 'admin', true, now(), now(), now());
        
        RAISE NOTICE '已為用戶 % (ID: %) 建立公司 % (ID: %)', 
            orphan_user.name, orphan_user.id, orphan_user.name || ' 的公司', new_company_id;
    END LOOP;
END $$;
```

#### **AI 引導整合 - 強制公司資訊收集**
```typescript
// 業務重要性：⭐⭐⭐⭐⭐
// 影響範圍：AI 引導功能、用戶體驗、數據完整性
// 風險等級：CRITICAL
// 說明：AI 引導必須強制收集公司資訊，確保多租戶架構完整性

// 修復目標檔案：
// - frontend/resources/js/services/aiGuidedSetup.ts
// - frontend/resources/js/components/AIGuidedSetup.vue
// - backend/internal/handlers/ai_guided_setup.go

// 1. AI 引導步驟定義更新
export interface SetupStep {
    id: string;
    title: string;
    description: string;
    required: boolean;  // 新增必填標記
    fields: SetupField[];
}

export const setupSteps: SetupStep[] = [
    {
        id: 'company_info',
        title: '公司基本資訊',
        description: '請提供您的公司基本資訊，這是使用系統的必要步驟',
        required: true,  // 強制必填
        fields: [
            {
                name: 'company_name',
                label: '公司名稱',
                type: 'text',
                required: true,
                validation: 'required|string|max:255',
                aiPrompt: '請問貴公司的正式名稱是什麼？'
            },
            {
                name: 'company_code',
                label: '公司代碼',
                type: 'text',
                required: false,
                validation: 'nullable|string|max:50|unique:companies,code',
                aiPrompt: '貴公司有特定的代碼嗎？（選填，系統會自動產生）'
            },
            {
                name: 'tax_id',
                label: '統一編號',
                type: 'text',
                required: true,
                validation: 'required|string|regex:/^[0-9]{8}$/',
                aiPrompt: '請提供貴公司的統一編號（8位數字）'
            },
            {
                name: 'industry',
                label: '產業類別',
                type: 'select',
                required: true,
                options: ['製造業', '批發零售', '服務業', '科技業', '其他'],
                aiPrompt: '貴公司屬於哪個產業類別？'
            },
            {
                name: 'employee_count',
                label: '員工人數',
                type: 'select',
                required: true,
                options: ['1-10', '11-50', '51-200', '201-500', '500+'],
                aiPrompt: '貴公司目前有多少員工？'
            }
        ]
    },
    {
        id: 'company_contact',
        title: '公司聯絡資訊',
        description: '請提供公司聯絡方式',
        required: true,  // 強制必填
        fields: [
            {
                name: 'company_phone',
                label: '公司電話',
                type: 'tel',
                required: true,
                validation: 'required|string|regex:/^[0-9-]+$/',
                aiPrompt: '請提供公司的主要聯絡電話'
            },
            {
                name: 'company_address',
                label: '公司地址',
                type: 'text',
                required: true,
                validation: 'required|string|max:500',
                aiPrompt: '請提供公司的完整地址'
            },
            {
                name: 'company_email',
                label: '公司電子郵件',
                type: 'email',
                required: false,
                validation: 'nullable|email',
                aiPrompt: '請提供公司的官方電子郵件（選填）'
            }
        ]
    },
    // ... 其他步驟
];

// 2. AI 引導驗證邏輯強化
class AIGuidedSetupService {
    async validateStep(stepId: string, data: any): Promise<ValidationResult> {
        const step = setupSteps.find(s => s.id === stepId);
        
        if (!step) {
            throw new Error('Invalid step ID');
        }
        
        // 強制驗證必填步驟
        if (step.required) {
            for (const field of step.fields) {
                if (field.required && !data[field.name]) {
                    return {
                        valid: false,
                        errors: {
                            [field.name]: `${field.label} 為必填欄位`
                        },
                        aiResponse: `我注意到您還沒有提供${field.label}，這是使用系統的必要資訊。${field.aiPrompt}`
                    };
                }
            }
        }
        
        return this.performValidation(step, data);
    }
    
    async canSkipStep(stepId: string): Promise<boolean> {
        const step = setupSteps.find(s => s.id === stepId);
        
        // 必填步驟不可跳過
        if (step?.required) {
            return false;
        }
        
        // 檢查是否已有公司資訊
        const userHasCompany = await this.checkUserCompanyExists();
        if (!userHasCompany && (stepId === 'company_info' || stepId === 'company_contact')) {
            return false;  // 沒有公司資訊時不可跳過
        }
        
        return true;
    }
    
    async saveCompanyInfo(data: any): Promise<void> {
        // 確保公司資訊完整保存
        const response = await api.post('/ai-guided-setup/company', {
            company_name: data.company_name,
            company_code: data.company_code,
            tax_id: data.tax_id,
            industry: data.industry,
            employee_count: data.employee_count,
            phone: data.company_phone,
            address: data.company_address,
            email: data.company_email
        });
        
        if (!response.data.success) {
            throw new Error('無法建立公司資訊');
        }
        
        // 更新本地狀態
        store.commit('setCurrentCompany', response.data.company);
    }
}

// 3. AI 對話增強 - 確保收集公司資訊
export const aiPrompts = {
    welcome: `歡迎使用 NexusERP！我是您的 AI 助理，將協助您完成系統設定。
             首先，我需要了解您的公司資訊，這是使用系統的必要步驟。
             請問貴公司的正式名稱是什麼？`,
    
    missingCompanyInfo: `我注意到您還沒有設定公司資訊。
                        為了確保系統正常運作，我需要先收集一些基本的公司資訊。
                        讓我們從公司名稱開始，請問貴公司的正式名稱是什麼？`,
    
    cannotSkipCompany: `抱歉，公司資訊是使用 NexusERP 的必要條件。
                       沒有公司資訊，系統無法正確管理您的業務數據。
                       請提供您的公司名稱以繼續。`,
    
    companyValidation: {
        invalidTaxId: `統一編號必須是8位數字，請重新輸入。`,
        duplicateCode: `這個公司代碼已被使用，請選擇其他代碼或留空讓系統自動產生。`,
        missingRequired: `這是必填資訊，請提供完整資料。`
    }
};

// 4. 後端 API 端點強化
// backend/internal/handlers/ai_guided_setup.go
func (h *AIGuidedSetupHandler) SaveCompanyInfo(c *gin.Context) {
    var req CompanyInfoRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request data"})
        return
    }
    
    userID := c.GetInt64("userID")
    
    // 檢查用戶是否已有公司
    existingCompany, _ := h.service.GetUserPrimaryCompany(userID)
    if existingCompany != nil {
        c.JSON(400, gin.H{"error": "User already has a company"})
        return
    }
    
    // 開始事務
    tx := h.db.Begin()
    
    // 建立公司
    company := &models.Company{
        Name:         req.CompanyName,
        DisplayName:  req.CompanyName,
        Code:         h.generateCompanyCode(req),
        TaxID:        req.TaxID,
        Industry:     req.Industry,
        EmployeeCount: req.EmployeeCount,
        Phone:        req.Phone,
        Address:      req.Address,
        Email:        req.Email,
        IsActive:     true,
        CreatedByUserID: userID,
    }
    
    if err := tx.Create(company).Error; err != nil {
        tx.Rollback()
        c.JSON(500, gin.H{"error": "Failed to create company"})
        return
    }
    
    // 建立用戶-公司關聯
    userCompany := &models.UserCompany{
        UserID:    userID,
        CompanyID: company.ID,
        Role:      "admin",
        IsActive:  true,
        JoinedAt:  time.Now(),
    }
    
    if err := tx.Create(userCompany).Error; err != nil {
        tx.Rollback()
        c.JSON(500, gin.H{"error": "Failed to link user to company"})
        return
    }
    
    // 建立預設業務單位
    businessUnit := &models.BusinessUnit{
        CompanyID: company.ID,
        Name:      "總部",
        Code:      "HQ",
        IsActive:  true,
        CreatedByUserID: userID,
    }
    
    if err := tx.Create(businessUnit).Error; err != nil {
        tx.Rollback()
        c.JSON(500, gin.H{"error": "Failed to create business unit"})
        return
    }
    
    // 提交事務
    tx.Commit()
    
    // 記錄 AI 引導完成狀態
    h.service.UpdateUserSetupStatus(userID, "company_setup_completed", true)
    
    c.JSON(200, gin.H{
        "success": true,
        "company": company,
        "message": "公司資訊設定完成",
    })
}

// 5. 前端強制檢查機制
// AIGuidedSetup.vue
export default {
    mounted() {
        this.checkCompanySetup();
    },
    
    methods: {
        async checkCompanySetup() {
            const hasCompany = await this.aiService.checkUserCompanyExists();
            
            if (!hasCompany) {
                // 強制跳轉到公司設定步驟
                this.currentStep = 'company_info';
                this.canNavigateAway = false;
                
                // 顯示 AI 提示
                this.showAIMessage(aiPrompts.missingCompanyInfo);
            }
        },
        
        async nextStep() {
            // 驗證當前步驟
            const validation = await this.aiService.validateStep(
                this.currentStep, 
                this.formData
            );
            
            if (!validation.valid) {
                this.showErrors(validation.errors);
                this.showAIMessage(validation.aiResponse);
                return;
            }
            
            // 儲存公司資訊
            if (this.currentStep === 'company_contact') {
                try {
                    await this.aiService.saveCompanyInfo(this.formData);
                    this.showSuccess('公司資訊設定完成！');
                } catch (error) {
                    this.showError('無法儲存公司資訊，請重試');
                    return;
                }
            }
            
            // 檢查是否可以跳過下一步
            const canSkip = await this.aiService.canSkipStep(this.getNextStepId());
            if (!canSkip) {
                this.showAIMessage(aiPrompts.cannotSkipCompany);
            }
            
            this.moveToNextStep();
        },
        
        skipStep() {
            // 檢查是否可以跳過
            if (this.currentStepConfig.required) {
                this.showAIMessage(aiPrompts.cannotSkipCompany);
                return;
            }
            
            this.moveToNextStep();
        }
    }
};
```

#### **資料庫表格更新**
```sql
-- 為 companies 表添加 AI 引導收集的欄位
ALTER TABLE companies 
ADD COLUMN tax_id varchar(20),              -- 統一編號（選填，個人工作室可空白）
ADD COLUMN industry varchar(50),            -- 產業類別（必填）
ADD COLUMN employee_count varchar(20),      -- 員工人數範圍（必填）
ADD COLUMN phone varchar(50),               -- 聯絡電話（必填）
ADD COLUMN address text,                    -- 公司地址（必填）
ADD COLUMN email varchar(255),              -- 公司電子郵件（選填）
ADD COLUMN setup_completed_at timestamp;    -- AI 引導完成時間

-- 為 users 表添加 AI 引導狀態追蹤
ALTER TABLE users
ADD COLUMN ai_setup_status jsonb DEFAULT '{}',
ADD COLUMN company_setup_required boolean DEFAULT true,
ADD COLUMN company_setup_completed_at timestamp;

-- 建立 AI 引導進度追蹤表
CREATE TABLE ai_guided_setup_progress (
    id bigserial PRIMARY KEY,
    user_id bigint REFERENCES users(id),
    step_id varchar(50) NOT NULL,
    status varchar(20) NOT NULL, -- pending, in_progress, completed, skipped
    data jsonb,
    started_at timestamp,
    completed_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_guided_setup_progress_user ON ai_guided_setup_progress(user_id);
CREATE INDEX idx_ai_guided_setup_progress_status ON ai_guided_setup_progress(user_id, status);
```

#### **AI 引導程式修改 - 詳細技術規劃**

基於目前系統架構分析，以下是完整的 AI 引導程式修改規劃：

##### **1. 前端註冊頁面修改**
```php
// 檔案：frontend/resources/views/auth/register.blade.php
// 修改第 109-174 行 - AI 引導步驟

<!-- 步驟 2: AI 引導式設定 -->
<div id="step2" class="hidden space-y-4">
    <div class="text-center mb-6">
        <h2 class="text-2xl font-bold nexus-text-primary">AI 助手引導設定</h2>
        <p class="nexus-text-secondary mt-2">請告訴我您的業務內容，我會協助您完成公司資訊設定</p>
    </div>

    <!-- AI 強制提示區域 -->
    <div class="nexus-card rounded-lg p-4 mb-6 border-l-4 border-amber-500">
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
            </div>
            <div class="ml-3">
                <h4 class="text-sm font-medium text-amber-800">⚠️ 重要提醒</h4>
                <p class="text-sm text-amber-700 mt-1">公司資訊是使用系統的必要條件，AI 將引導您完成所有必填資訊的設定</p>
            </div>
        </div>
    </div>

    <!-- 進度指示器 -->
    <div class="nexus-card rounded-lg p-4 mb-6">
        <h4 class="text-sm font-medium nexus-text-primary mb-3">設定進度</h4>
        <div class="space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-sm nexus-text-secondary">公司基本資訊</span>
                <span id="company-info-status" class="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">待完成</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm nexus-text-secondary">業務分類</span>
                <span id="business-type-status" class="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">待完成</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm nexus-text-secondary">系統設定</span>
                <span id="system-setup-status" class="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">待完成</span>
            </div>
        </div>
    </div>

    <!-- AI 對話介面保持不變，但增強引導邏輯 -->
    <!-- ... 現有的 AI 對話介面 ... -->

    <!-- 資料收集表單（初期隱藏，AI 引導後顯示） -->
    <div id="company-data-form" class="hidden nexus-card rounded-lg p-6">
        <h4 class="text-lg font-medium nexus-text-primary mb-4">公司資訊確認</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium nexus-text-primary">公司名稱 <span class="text-red-500">*</span></label>
                <input type="text" id="company_name" class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md" required>
            </div>
            <div>
                <label class="block text-sm font-medium nexus-text-primary">統一編號 <span class="text-gray-400 text-xs">(選填，個人工作室可跳過)</span></label>
                <input type="text" id="tax_id" class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md" pattern="[0-9]{8}" placeholder="8位數字，無統編可留空">
            </div>
            <div>
                <label class="block text-sm font-medium nexus-text-primary">產業類別 <span class="text-red-500">*</span></label>
                <select id="industry" class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md" required>
                    <option value="">請選擇</option>
                    <option value="manufacturing">製造業</option>
                    <option value="retail">零售業</option>
                    <option value="service">服務業</option>
                    <option value="restaurant">餐飲業</option>
                    <option value="technology">科技業</option>
                    <option value="other">其他</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium nexus-text-primary">員工人數 <span class="text-red-500">*</span></label>
                <select id="employee_count" class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md" required>
                    <option value="">請選擇</option>
                    <option value="1-10">1-10 人</option>
                    <option value="11-50">11-50 人</option>
                    <option value="51-200">51-200 人</option>
                    <option value="201-500">201-500 人</option>
                    <option value="500+">500+ 人</option>
                </select>
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium nexus-text-primary">公司地址 <span class="text-red-500">*</span></label>
                <input type="text" id="company_address" class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md" required>
            </div>
            <div>
                <label class="block text-sm font-medium nexus-text-primary">聯絡電話 <span class="text-red-500">*</span></label>
                <input type="tel" id="company_phone" class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md" required>
            </div>
            <div>
                <label class="block text-sm font-medium nexus-text-primary">公司電子郵件</label>
                <input type="email" id="company_email" class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md">
            </div>
        </div>
    </div>
</div>
```

##### **2. JavaScript AI 引導邏輯增強**
```javascript
// 檔案：frontend/resources/views/auth/register.blade.php (script 區域)
// 修改第 279-350 行的 sendToAI 函數

// AI 引導狀態管理
let aiGuidedData = {
    companyInfoCollected: false,
    businessTypeIdentified: false,
    systemConfigReady: false,
    collectedData: {}
};

// AI 引導階段定義
const AI_GUIDANCE_PHASES = {
    WELCOME: 'welcome',
    COMPANY_INFO: 'company_info',
    BUSINESS_TYPE: 'business_type',
    CONFIRMATION: 'confirmation',
    COMPLETED: 'completed'
};

let currentAIPhase = AI_GUIDANCE_PHASES.WELCOME;

async function sendToAI() {
    const input = document.getElementById('ai-input');
    const sendButton = document.getElementById('send-to-ai');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 禁用輸入和按鈕
    input.disabled = true;
    sendButton.disabled = true;
    sendButton.innerHTML = '正在思考...';
    
    // 添加用戶訊息到對話中
    addMessageToChat('user', message);
    input.value = '';
    
    try {
        // 呼叫增強的 AI API
        const response = await fetch('/api/ai/guided-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                message: message,
                phase: currentAIPhase,
                collected_data: aiGuidedData.collectedData,
                conversation_history: aiConversation.slice(-5)
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
                const aiResponse = data.data.response;
                const phase = data.data.phase;
                const extractedData = data.data.extracted_data;
                const nextActions = data.data.next_actions;
                
                // 更新 AI 引導狀態
                if (extractedData) {
                    aiGuidedData.collectedData = { ...aiGuidedData.collectedData, ...extractedData };
                    updateProgressIndicators(extractedData);
                }
                
                // 顯示 AI 回應
                addMessageToChat('ai', aiResponse);
                
                // 根據階段執行相應動作
                handleAIPhaseActions(phase, nextActions, extractedData);
                
                // 更新當前階段
                currentAIPhase = phase;
            }
        } else {
            throw new Error('API 請求失敗');
        }
        
    } catch (error) {
        console.error('AI API 錯誤:', error);
        
        // 使用增強的備用邏輯
        const enhancedFallback = getEnhancedFallbackResponse(message, currentAIPhase);
        addMessageToChat('ai', enhancedFallback.response);
        
        if (enhancedFallback.showForm) {
            showCompanyDataForm();
        }
    } finally {
        // 重新啟用輸入和按鈕
        input.disabled = false;
        sendButton.disabled = false;
        sendButton.innerHTML = '發送';
    }
}

// 處理 AI 階段動作
function handleAIPhaseActions(phase, actions, extractedData) {
    if (actions && actions.includes('show_company_form')) {
        showCompanyDataForm();
        if (extractedData) {
            populateCompanyForm(extractedData);
        }
    }
    
    if (actions && actions.includes('enable_completion')) {
        document.getElementById('complete-registration').classList.remove('hidden');
    }
    
    if (phase === AI_GUIDANCE_PHASES.COMPLETED) {
        aiGuidedData.companyInfoCollected = true;
        aiGuidedData.businessTypeIdentified = true;
        aiGuidedData.systemConfigReady = true;
        updateProgressIndicators();
    }
}

// 顯示公司資料表單
function showCompanyDataForm() {
    const form = document.getElementById('company-data-form');
    form.classList.remove('hidden');
    
    // 添加表單驗證
    addCompanyFormValidation();
}

// 填充公司表單資料
function populateCompanyForm(data) {
    const fields = ['company_name', 'tax_id', 'industry', 'employee_count', 'company_address', 'company_phone', 'company_email'];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element && data[field]) {
            element.value = data[field];
        }
    });
}

// 更新進度指示器
function updateProgressIndicators(newData = null) {
    const indicators = {
        'company-info-status': aiGuidedData.companyInfoCollected,
        'business-type-status': aiGuidedData.businessTypeIdentified,
        'system-setup-status': aiGuidedData.systemConfigReady
    };
    
    // 檢查新資料是否完成了某些需求
    if (newData) {
        if (newData.company_name && newData.company_address && newData.company_phone) {
            aiGuidedData.companyInfoCollected = true;  // 移除 tax_id 必要條件
        }
        if (newData.industry || newData.business_type) {
            aiGuidedData.businessTypeIdentified = true;
        }
    }
    
    // 更新視覺指示器
    Object.entries(indicators).forEach(([elementId, completed]) => {
        const element = document.getElementById(elementId);
        if (element) {
            if (completed || (newData && checkIfStepCompleted(elementId, newData))) {
                element.className = 'text-xs px-2 py-1 rounded-full bg-green-200 text-green-800';
                element.textContent = '已完成';
            } else {
                element.className = 'text-xs px-2 py-1 rounded-full bg-amber-200 text-amber-800';
                element.textContent = '進行中';
            }
        }
    });
}

// 增強的備用回應
function getEnhancedFallbackResponse(message, phase) {
    const responses = {
        [AI_GUIDANCE_PHASES.WELCOME]: {
            response: '歡迎！為了為您設定最適合的 ERP 系統，請告訴我您的公司名稱是什麼？',
            showForm: false
        },
        [AI_GUIDANCE_PHASES.COMPANY_INFO]: {
            response: '感謝您提供的資訊！現在我需要一些基本的公司資料來完成設定。請填寫下方的表單。',
            showForm: true
        },
        [AI_GUIDANCE_PHASES.BUSINESS_TYPE]: {
            response: '根據您的描述，我建議將業務類型設定為相應分類。請確認下方的表單資料是否正確。',
            showForm: true
        },
        [AI_GUIDANCE_PHASES.CONFIRMATION]: {
            response: '所有資料看起來都很完整！請確認無誤後點選「完成註冊」。',
            showForm: false
        }
    };
    
    return responses[phase] || responses[AI_GUIDANCE_PHASES.WELCOME];
}

// 添加公司表單驗證
function addCompanyFormValidation() {
    const requiredFields = ['company_name', 'industry', 'employee_count', 'company_address', 'company_phone']; // 移除 tax_id
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', validateField);
        }
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // 移除舊的錯誤訊息
    const oldError = field.parentNode.querySelector('.error-message');
    if (oldError) {
        oldError.remove();
    }
    
    let errorMessage = '';
    
    // 特殊驗證邏輯
    if (field.id === 'tax_id') {
        // 統一編號選填，但如果填寫就要符合格式
        if (value && !/^[0-9]{8}$/.test(value)) {
            errorMessage = '統一編號必須是8位數字（可留空）';
        }
    }
    
    if (field.required && !value) {
        errorMessage = '此欄位為必填';
    }
    
    // 顯示錯誤訊息
    if (errorMessage) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-500 text-xs mt-1';
        errorDiv.textContent = errorMessage;
        field.parentNode.appendChild(errorDiv);
        field.classList.add('border-red-500');
    } else {
        field.classList.remove('border-red-500');
        field.classList.add('border-green-500');
    }
}
```

##### **3. 後端 AIController 新增端點**
```php
// 檔案：frontend/app/Http/Controllers/AIController.php
// 新增方法（約第 620 行後）

/**
 * AI 引導式對話 - 強制公司資訊收集
 */
public function guidedChatResponse(Request $request): JsonResponse
{
    $request->validate([
        'message' => 'required|string|min:1|max:500',
        'phase' => 'required|string|in:welcome,company_info,business_type,confirmation,completed',
        'collected_data' => 'sometimes|array',
        'conversation_history' => 'sometimes|array|max:10',
    ]);

    try {
        $message = $request->input('message');
        $phase = $request->input('phase');
        $collectedData = $request->input('collected_data', []);
        $conversationHistory = $request->input('conversation_history', []);

        // 使用 AI 服務進行引導式分析
        $guidedResponse = $this->aiService->generateGuidedResponse(
            $message, 
            $phase, 
            $collectedData, 
            $conversationHistory
        );

        return response()->json([
            'success' => true,
            'data' => [
                'response' => $guidedResponse['response'],
                'phase' => $guidedResponse['next_phase'],
                'extracted_data' => $guidedResponse['extracted_data'] ?? null,
                'next_actions' => $guidedResponse['actions'] ?? [],
                'validation_errors' => $guidedResponse['validation_errors'] ?? [],
                'completion_percentage' => $this->calculateCompletionPercentage($guidedResponse['extracted_data'] ?? []),
                'timestamp' => now()->toISOString(),
                'ai_powered' => true
            ],
            'message' => 'AI 引導回應生成成功'
        ]);

    } catch (\Exception $e) {
        Log::error('AI Guided Chat Error: ' . $e->getMessage(), [
            'request_data' => $request->all(),
            'trace' => $e->getTraceAsString()
        ]);
        
        // 提供階段性備用回應
        $fallbackResponse = $this->getGuidedFallbackResponse(
            $request->input('message'), 
            $request->input('phase'),
            $request->input('collected_data', [])
        );
        
        return response()->json([
            'success' => true,
            'data' => [
                'response' => $fallbackResponse['response'],
                'phase' => $fallbackResponse['next_phase'],
                'extracted_data' => $fallbackResponse['extracted_data'] ?? null,
                'next_actions' => $fallbackResponse['actions'] ?? [],
                'completion_percentage' => 0,
                'timestamp' => now()->toISOString(),
                'ai_powered' => false,
                'fallback' => true
            ],
            'message' => 'AI 引導服務暫時不可用，提供備用回應'
        ]);
    }
}

/**
 * 計算設定完成度
 */
private function calculateCompletionPercentage(array $extractedData): int
{
    $requiredFields = [
        'company_name', 'industry', 'employee_count', 
        'company_address', 'company_phone'  // 移除 tax_id 必填要求
    ];
    
    $completedFields = 0;
    foreach ($requiredFields as $field) {
        if (!empty($extractedData[$field])) {
            $completedFields++;
        }
    }
    
    return round(($completedFields / count($requiredFields)) * 100);
}

/**
 * 引導式備用回應
 */
private function getGuidedFallbackResponse(string $message, string $phase, array $collectedData): array
{
    $phaseResponses = [
        'welcome' => [
            'response' => '歡迎使用 NexusERP！為了為您設定最適合的系統，我需要了解您的公司資訊。請告訴我您的公司名稱是什麼？',
            'next_phase' => 'company_info',
            'actions' => []
        ],
        'company_info' => [
            'response' => '感謝您提供公司名稱！現在我需要收集一些基本的公司資料，包括地址和聯絡方式。統一編號可選填，個人工作室可跳過。',
            'next_phase' => 'business_type',
            'actions' => ['show_company_form'],
            'extracted_data' => $this->extractCompanyInfoFromMessage($message, $collectedData)
        ],
        'business_type' => [
            'response' => '很好！根據您的業務描述，我建議設定相應的業務類型。請確認下方表單中的資料是否正確。',
            'next_phase' => 'confirmation',
            'actions' => ['show_company_form'],
            'extracted_data' => $this->extractBusinessTypeFromMessage($message, $collectedData)
        ],
        'confirmation' => [
            'response' => '所有必要的公司資訊都已經收集完成！請最後確認一次資料無誤，然後點選「完成註冊」開始使用系統。',
            'next_phase' => 'completed',
            'actions' => ['enable_completion']
        ],
        'completed' => [
            'response' => '設定已完成！系統已為您準備好所有必要的配置。',
            'next_phase' => 'completed',
            'actions' => ['enable_completion']
        ]
    ];
    
    return $phaseResponses[$phase] ?? $phaseResponses['welcome'];
}

/**
 * 從訊息中提取公司資訊
 */
private function extractCompanyInfoFromMessage(string $message, array $existingData): array
{
    $extractedData = $existingData;
    
    // 簡單的關鍵詞提取邏輯
    if (!isset($extractedData['company_name'])) {
        // 嘗試提取可能的公司名稱
        if (preg_match('/公司[是叫名稱]*(.+?)(?:[，。！？\s]|$)/u', $message, $matches)) {
            $extractedData['company_name'] = trim($matches[1]);
        }
    }
    
    // 提取員工人數
    if (preg_match('/(\d+)\s*(?:個|位|人)?\s*員工/u', $message, $matches)) {
        $count = (int)$matches[1];
        if ($count <= 10) {
            $extractedData['employee_count'] = '1-10';
        } elseif ($count <= 50) {
            $extractedData['employee_count'] = '11-50';
        } elseif ($count <= 200) {
            $extractedData['employee_count'] = '51-200';
        } elseif ($count <= 500) {
            $extractedData['employee_count'] = '201-500';
        } else {
            $extractedData['employee_count'] = '500+';
        }
    }
    
    return $extractedData;
}

/**
 * 從訊息中提取業務類型
 */
private function extractBusinessTypeFromMessage(string $message, array $existingData): array
{
    $extractedData = $existingData;
    
    // 業務類型關鍵詞映射
    $businessTypes = [
        'manufacturing' => ['製造', '工廠', '生產', '加工'],
        'retail' => ['零售', '商店', '販售', '銷售'],
        'restaurant' => ['餐廳', '餐飲', '食物', '料理'],
        'service' => ['服務', '顧問', '維修', '專業'],
        'technology' => ['科技', '軟體', '網路', '電腦']
    ];
    
    foreach ($businessTypes as $type => $keywords) {
        foreach ($keywords as $keyword) {
            if (strpos($message, $keyword) !== false) {
                $extractedData['industry'] = $type;
                break 2;
            }
        }
    }
    
    return $extractedData;
}
```

##### **4. AIService 增強方法**
```php
// 檔案：frontend/app/Services/AIService.php
// 新增方法（約第 464 行後）

/**
 * 生成引導式回應 - 強制收集公司資訊
 */
public function generateGuidedResponse(string $message, string $phase, array $collectedData, array $conversationHistory): array
{
    $prompt = $this->buildGuidedPrompt($message, $phase, $collectedData, $conversationHistory);
    
    try {
        $response = $this->callOpenRouter($prompt);
        return $this->parseGuidedResponse($response, $phase, $collectedData);
    } catch (\Exception $e) {
        Log::error('AI Guided Response failed: ' . $e->getMessage());
        return $this->getFallbackGuidedResponse($message, $phase, $collectedData);
    }
}

/**
 * 構建引導式提示詞
 */
protected function buildGuidedPrompt(string $message, string $phase, array $collectedData, array $conversationHistory): string
{
    $context = "你是 NexusERP 的 AI 註冊助手。你的任務是引導用戶完成公司資訊設定，這是使用系統的絕對必要條件。

當前階段：{$phase}
已收集資料：" . json_encode($collectedData, JSON_UNESCAPED_UNICODE) . "

階段說明：
- welcome: 歡迎用戶，開始收集公司名稱
- company_info: 收集基本公司資訊（名稱、統一編號、地址、電話）
- business_type: 分析業務類型，確定產業分類
- confirmation: 確認所有資訊完整，準備完成註冊
- completed: 所有必要資訊已收集完成

用戶訊息：{$message}

請以 YAML 格式回應，包含以下結構：

```yaml
response: \"你的回應內容（繁體中文，親切但堅持必要資訊）\"
next_phase: \"下一個階段\"
extracted_data:
  company_name: \"提取的公司名稱\"
  tax_id: \"統一編號\"
  industry: \"產業類別\"
  employee_count: \"員工人數範圍\"
  company_address: \"公司地址\"
  company_phone: \"聯絡電話\"
  company_email: \"公司電子郵件\"
actions:
  - \"show_company_form\"  # 顯示公司資料表單
  - \"enable_completion\"  # 啟用完成按鈕
validation_errors:
  - \"錯誤訊息（如果有）\"
```

重要原則：
1. 絕對不可跳過公司資訊收集
2. 必須收集：公司名稱、產業類別、員工人數、地址、聯絡電話（統一編號選填）
3. 如果用戶嘗試跳過，要堅持解釋其重要性
4. 回應簡潔有力，不超過50字
5. 確保 YAML 格式正確";

    return $context;
}

/**
 * 解析引導式回應
 */
protected function parseGuidedResponse(array $response, string $currentPhase, array $collectedData): array
{
    $content = $response['choices'][0]['message']['content'] ?? '';
    
    try {
        $yamlContent = $this->extractYamlFromResponse($content);
        
        if ($yamlContent) {
            $parsedData = Yaml::parse($yamlContent);
            
            return [
                'response' => $parsedData['response'] ?? '請提供更多公司資訊。',
                'next_phase' => $this->validatePhaseTransition($parsedData['next_phase'] ?? $currentPhase, $collectedData),
                'extracted_data' => $parsedData['extracted_data'] ?? [],
                'actions' => $parsedData['actions'] ?? [],
                'validation_errors' => $parsedData['validation_errors'] ?? []
            ];
        }
    } catch (\Exception $e) {
        Log::warning('Guided YAML 解析失敗: ' . $e->getMessage());
    }

    // 備用邏輯
    return $this->getFallbackGuidedResponse('', $currentPhase, $collectedData);
}

/**
 * 驗證階段轉換的合理性
 */
protected function validatePhaseTransition(string $nextPhase, array $collectedData): string
{
    $requiredFieldsByPhase = [
        'business_type' => ['company_name'],
        'confirmation' => ['company_name', 'industry', 'employee_count'],
        'completed' => ['company_name', 'industry', 'employee_count', 'company_address', 'company_phone']  // 移除 tax_id 必填
    ];
    
    // 檢查是否滿足階段轉換條件
    if (isset($requiredFieldsByPhase[$nextPhase])) {
        foreach ($requiredFieldsByPhase[$nextPhase] as $field) {
            if (empty($collectedData[$field])) {
                // 資料不足，保持當前階段或回退
                return $nextPhase === 'completed' ? 'confirmation' : 'company_info';
            }
        }
    }
    
    return $nextPhase;
}

/**
 * 備用引導式回應
 */
protected function getFallbackGuidedResponse(string $message, string $phase, array $collectedData): array
{
    $phaseMap = [
        'welcome' => [
            'response' => '歡迎！請告訴我您的公司名稱，這是設定系統的第一步。',
            'next_phase' => 'company_info',
            'actions' => []
        ],
        'company_info' => [
            'response' => '請提供公司地址和聯絡電話，統一編號可選填。',
            'next_phase' => 'business_type',
            'actions' => ['show_company_form']
        ],
        'business_type' => [
            'response' => '請選擇您的產業類別，以便為您推薦適合的功能模組。',
            'next_phase' => 'confirmation',
            'actions' => ['show_company_form']
        ],
        'confirmation' => [
            'response' => '資料收集完成！請確認無誤後即可開始使用 NexusERP。',
            'next_phase' => 'completed',
            'actions' => ['enable_completion']
        ]
    ];
    
    $response = $phaseMap[$phase] ?? $phaseMap['welcome'];
    $response['extracted_data'] = $this->extractDataFromMessage($message, $collectedData);
    
    return $response;
}

/**
 * 從訊息中提取資料的通用方法
 */
protected function extractDataFromMessage(string $message, array $existingData): array
{
    $data = $existingData;
    
    // 提取公司名稱的各種模式
    $companyPatterns = [
        '/(?:公司名稱|公司叫|我們公司|我們是)(?:是|叫)?[\s:：]*([^\s，。！？\n]+)/u',
        '/([^\s，。！？\n]+)(?:公司|企業|有限公司|股份有限公司)/u'
    ];
    
    foreach ($companyPatterns as $pattern) {
        if (preg_match($pattern, $message, $matches) && !isset($data['company_name'])) {
            $data['company_name'] = trim($matches[1]);
            break;
        }
    }
    
    // 提取統一編號
    if (preg_match('/(?:統編|統一編號)[\s:：]*(\d{8})/u', $message, $matches)) {
        $data['tax_id'] = $matches[1];
    }
    
    // 提取員工人數
    if (preg_match('/(\d+)\s*(?:個|位|名)?\s*員工/u', $message, $matches)) {
        $count = (int)$matches[1];
        $data['employee_count'] = $this->categorizeEmployeeCount($count);
    }
    
    // 提取地址
    if (preg_match('/(?:地址|位於|在)[\s:：]*([^\s，。！？\n]{10,})/u', $message, $matches)) {
        $data['company_address'] = trim($matches[1]);
    }
    
    // 提取電話
    if (preg_match('/(?:電話|聯絡電話|公司電話)[\s:：]*([0-9\-\(\)\s]+)/u', $message, $matches)) {
        $data['company_phone'] = trim($matches[1]);
    }
    
    return $data;
}

/**
 * 員工人數分類
 */
protected function categorizeEmployeeCount(int $count): string
{
    if ($count <= 10) return '1-10';
    if ($count <= 50) return '11-50';
    if ($count <= 200) return '51-200';
    if ($count <= 500) return '201-500';
    return '500+';
}
```

##### **5. 路由設定**
```php
// 檔案：frontend/routes/web.php
// 在 AI 路由群組中添加（約第 40 行後）

Route::prefix('api/ai')->withoutMiddleware('web')->group(function () {
    // 現有路由...
    Route::post('/guided-chat', [AIController::class, 'guidedChatResponse']); // 新增
    Route::post('/validate-company-data', [AIController::class, 'validateCompanyData']); // 新增
});
```

這個完整的技術規劃確保：

1. **強制收集**：用戶無法跳過公司資訊設定
2. **AI 引導**：智慧化收集過程，自然對話體驗
3. **資料驗證**：即時驗證和錯誤提示
4. **進度追蹤**：清楚的視覺化進度指示
5. **備用機制**：AI 服務失敗時的降級處理
6. **資料完整性**：確保所有必要欄位都被收集

---

### **🔴 第一優先級：立即修復（第1週）**

#### **1. warehouses (倉庫表)**
```sql
-- 業務重要性：⭐⭐⭐⭐⭐
-- 影響範圍：庫存管理、採購、銷售、報表
-- 風險等級：HIGH

-- 修復腳本
ALTER TABLE warehouses ADD COLUMN company_id bigint;
ALTER TABLE warehouses ADD COLUMN created_by_user_id bigint;
ALTER TABLE warehouses ADD CONSTRAINT fk_warehouses_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE warehouses ADD CONSTRAINT fk_warehouses_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id);

-- 索引建立
CREATE INDEX idx_warehouses_company ON warehouses(company_id);
CREATE INDEX idx_warehouses_created_by_user ON warehouses(created_by_user_id);
CREATE INDEX idx_warehouses_company_active ON warehouses(company_id, is_active) 
    WHERE is_active = true;

-- 數據遷移
UPDATE warehouses SET 
    company_id = 67,  -- 中華電信
    created_by_user_id = 1075  -- gamepig1976@gmail.com
WHERE company_id IS NULL;

-- 驗證腳本
SELECT 
    w.id, w.name, w.code,
    c.display_name as company_name,
    u.name as created_by
FROM warehouses w
LEFT JOIN companies c ON w.company_id = c.id
LEFT JOIN users u ON w.created_by_user_id = u.id
WHERE w.company_id = 67;
```

#### **2. product_categories (產品分類表)**
```sql
-- 業務重要性：⭐⭐⭐⭐⭐
-- 影響範圍：產品管理、報表分類、搜尋功能
-- 風險等級：HIGH

-- 修復腳本
ALTER TABLE product_categories ADD COLUMN company_id bigint;
ALTER TABLE product_categories ADD COLUMN created_by_user_id bigint;
ALTER TABLE product_categories ADD COLUMN is_global boolean DEFAULT false;

ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id);

-- 索引建立
CREATE INDEX idx_product_categories_company ON product_categories(company_id);
CREATE INDEX idx_product_categories_created_by_user ON product_categories(created_by_user_id);
CREATE INDEX idx_product_categories_global ON product_categories(is_global) 
    WHERE is_global = true;
CREATE INDEX idx_product_categories_company_active ON product_categories(company_id, is_active) 
    WHERE is_active = true;

-- 數據遷移策略
-- 將現有分類標記為全局分類
UPDATE product_categories SET 
    is_global = true,
    created_by_user_id = 1  -- 系統管理員
WHERE company_id IS NULL;

-- 為特定公司創建專屬分類
INSERT INTO product_categories (name, company_id, created_by_user_id, is_active)
SELECT 
    name || ' (中華電信專用)',
    67,
    1075,
    true
FROM product_categories 
WHERE is_global = true AND id IN (468, 469, 470, 471, 472);

-- 驗證腳本
SELECT 
    pc.id, pc.name, pc.is_global,
    c.display_name as company_name,
    u.name as created_by
FROM product_categories pc
LEFT JOIN companies c ON pc.company_id = c.id
LEFT JOIN users u ON pc.created_by_user_id = u.id
ORDER BY pc.is_global DESC, pc.company_id, pc.name;
```

#### **3. employees (員工表)**
```sql
-- 業務重要性：⭐⭐⭐⭐
-- 影響範圍：人事管理、權限控制、報表
-- 風險等級：HIGH

-- 修復腳本
ALTER TABLE employees ADD COLUMN company_id bigint;
ALTER TABLE employees ADD CONSTRAINT fk_employees_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- 索引建立
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_company_user ON employees(company_id, user_id);

-- 數據遷移（如果有現有員工數據）
UPDATE employees SET company_id = (
    SELECT uc.company_id 
    FROM user_companies uc 
    WHERE uc.user_id = employees.user_id 
    LIMIT 1
) WHERE company_id IS NULL;

-- 驗證腳本
SELECT 
    e.id, e.user_id,
    u.name as employee_name,
    c.display_name as company_name
FROM employees e
JOIN users u ON e.user_id = u.id
LEFT JOIN companies c ON e.company_id = c.id
ORDER BY c.display_name, u.name;
```

### **🟡 第二優先級：重要修復（第2週）**

#### **4. accounts_payable (應付帳款表)**
```sql
-- 業務重要性：⭐⭐⭐⭐
-- 影響範圍：財務報表、現金流管理
-- 風險等級：MEDIUM

-- 修復腳本
ALTER TABLE accounts_payable ADD COLUMN company_id bigint;
ALTER TABLE accounts_payable ADD CONSTRAINT fk_accounts_payable_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- 索引建立
CREATE INDEX idx_accounts_payable_company ON accounts_payable(company_id);
CREATE INDEX idx_accounts_payable_company_status ON accounts_payable(company_id, status);
CREATE INDEX idx_accounts_payable_company_due_date ON accounts_payable(company_id, due_date);

-- 數據遷移腳本
UPDATE accounts_payable SET company_id = (
    SELECT s.company_id 
    FROM suppliers s 
    WHERE s.id = accounts_payable.supplier_id
) WHERE company_id IS NULL;

-- 驗證腳本
SELECT 
    ap.id, ap.amount, ap.status,
    s.name as supplier_name,
    c.display_name as company_name
FROM accounts_payable ap
JOIN suppliers s ON ap.supplier_id = s.id
LEFT JOIN companies c ON ap.company_id = c.id
ORDER BY c.display_name, ap.due_date;
```

#### **5. accounts_receivable (應收帳款表)**
```sql
-- 業務重要性：⭐⭐⭐⭐
-- 影響範圍：財務報表、客戶管理
-- 風險等級：MEDIUM

-- 修復腳本
ALTER TABLE accounts_receivable ADD COLUMN company_id bigint;
ALTER TABLE accounts_receivable ADD CONSTRAINT fk_accounts_receivable_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- 索引建立
CREATE INDEX idx_accounts_receivable_company ON accounts_receivable(company_id);
CREATE INDEX idx_accounts_receivable_company_status ON accounts_receivable(company_id, status);
CREATE INDEX idx_accounts_receivable_company_due_date ON accounts_receivable(company_id, due_date);

-- 數據遷移腳本
UPDATE accounts_receivable SET company_id = (
    SELECT cust.company_id 
    FROM customers cust 
    WHERE cust.id = accounts_receivable.customer_id
) WHERE company_id IS NULL;

-- 驗證腳本
SELECT 
    ar.id, ar.amount_due, ar.balance_due, ar.status,
    cust.name as customer_name,
    c.display_name as company_name
FROM accounts_receivable ar
JOIN customers cust ON ar.customer_id = cust.id
LEFT JOIN companies c ON ar.company_id = c.id
ORDER BY c.display_name, ar.due_date;
```

#### **6. customer_contacts (客戶聯繫人表)**
```sql
-- 業務重要性：⭐⭐⭐
-- 影響範圍：客戶管理、銷售流程
-- 風險等級：MEDIUM

-- 修復腳本
ALTER TABLE customer_contacts ADD COLUMN company_id bigint;
ALTER TABLE customer_contacts ADD CONSTRAINT fk_customer_contacts_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- 索引建立
CREATE INDEX idx_customer_contacts_company ON customer_contacts(company_id);
CREATE INDEX idx_customer_contacts_company_customer ON customer_contacts(company_id, customer_id);

-- 數據遷移腳本
UPDATE customer_contacts SET company_id = (
    SELECT c.company_id 
    FROM customers c 
    WHERE c.id = customer_contacts.customer_id
) WHERE company_id IS NULL;

-- 驗證腳本
SELECT 
    cc.id, cc.first_name, cc.last_name, cc.email,
    cust.name as customer_name,
    comp.display_name as company_name
FROM customer_contacts cc
JOIN customers cust ON cc.customer_id = cust.id
LEFT JOIN companies comp ON cc.company_id = comp.id
WHERE cc.deleted_at IS NULL
ORDER BY comp.display_name, cust.name, cc.first_name;
```

### **🟢 第三優先級：中度修復（第3週）**

#### **7. inventory_levels (庫存水平表)**
```sql
-- 業務重要性：⭐⭐⭐⭐
-- 影響範圍：庫存報表、補貨管理
-- 風險等級：MEDIUM

-- 修復腳本
ALTER TABLE inventory_levels ADD COLUMN company_id bigint;
ALTER TABLE inventory_levels ADD CONSTRAINT fk_inventory_levels_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- 索引建立
CREATE INDEX idx_inventory_levels_company ON inventory_levels(company_id);
CREATE INDEX idx_inventory_levels_company_product ON inventory_levels(company_id, product_id);
CREATE INDEX idx_inventory_levels_company_warehouse ON inventory_levels(company_id, warehouse_id);

-- 數據遷移腳本
UPDATE inventory_levels SET company_id = (
    SELECT p.company_id 
    FROM products p 
    WHERE p.id = inventory_levels.product_id
) WHERE company_id IS NULL;

-- 驗證腳本
SELECT 
    il.product_id, il.warehouse_id, il.quantity_on_hand, il.quantity_available,
    p.name as product_name,
    w.name as warehouse_name,
    c.display_name as company_name
FROM inventory_levels il
JOIN products p ON il.product_id = p.id
JOIN warehouses w ON il.warehouse_id = w.id
LEFT JOIN companies c ON il.company_id = c.id
ORDER BY c.display_name, w.name, p.name;
```

#### **8. units_of_measure (計量單位表)**
```sql
-- 業務重要性：⭐⭐⭐
-- 影響範圍：產品管理、訂單處理
-- 風險等級：LOW
-- 特殊考量：需要支援全局標準單位 + 公司自定義單位

-- 修復腳本
ALTER TABLE units_of_measure ADD COLUMN company_id bigint;
ALTER TABLE units_of_measure ADD COLUMN created_by_user_id bigint;
ALTER TABLE units_of_measure ADD COLUMN is_global boolean DEFAULT false;

ALTER TABLE units_of_measure ADD CONSTRAINT fk_units_of_measure_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE units_of_measure ADD CONSTRAINT fk_units_of_measure_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id);

-- 索引建立
CREATE INDEX idx_units_of_measure_company ON units_of_measure(company_id);
CREATE INDEX idx_units_of_measure_global ON units_of_measure(is_global) 
    WHERE is_global = true;
CREATE INDEX idx_units_of_measure_company_active ON units_of_measure(company_id, is_active) 
    WHERE is_active = true;

-- 數據遷移策略
-- 將現有單位標記為全局標準單位
UPDATE units_of_measure SET 
    is_global = true,
    created_by_user_id = 1  -- 系統管理員
WHERE company_id IS NULL;

-- 驗證腳本
SELECT 
    uom.id, uom.name, uom.symbol, uom.is_global,
    c.display_name as company_name,
    u.name as created_by
FROM units_of_measure uom
LEFT JOIN companies c ON uom.company_id = c.id
LEFT JOIN users u ON uom.created_by_user_id = u.id
WHERE uom.is_active = true
ORDER BY uom.is_global DESC, c.display_name, uom.name;
```

### **🔵 第四優先級：低度修復（第4週）**

#### **9. 訂單項目表格群組**
```sql
-- quote_items, sales_order_items, purchase_order_items, invoice_items
-- 業務重要性：⭐⭐
-- 影響範圍：查詢效能優化
-- 風險等級：LOW
-- 說明：這些表格通過父表間接關聯公司，添加冗餘欄位可提升查詢效能

-- 以 quote_items 為例
ALTER TABLE quote_items ADD COLUMN company_id bigint;
ALTER TABLE quote_items ADD CONSTRAINT fk_quote_items_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);
CREATE INDEX idx_quote_items_company ON quote_items(company_id);

-- 數據遷移
UPDATE quote_items SET company_id = (
    SELECT q.company_id 
    FROM quotes q 
    JOIN user_companies uc ON q.user_id = uc.user_id
    WHERE q.id = quote_items.quote_id
    LIMIT 1
) WHERE company_id IS NULL;
```

#### **10. marketplace 相關表格**
```sql
-- marketplace_products, marketplace_suppliers, marketplace_categories
-- 業務重要性：⭐⭐
-- 影響範圍：市場功能
-- 風險等級：LOW
-- 需要確認：是全局市場還是公司專屬市場

-- 如果是公司專屬市場
ALTER TABLE marketplace_products ADD COLUMN company_id bigint;
ALTER TABLE marketplace_suppliers ADD COLUMN company_id bigint;
-- 索引和約束...
```

---

## 🔒 **安全性增強**

### **Row Level Security (RLS) 實施**

```sql
-- 啟用行級安全性
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 創建安全策略
CREATE POLICY warehouse_company_policy ON warehouses 
    USING (company_id = current_setting('app.current_company_id')::bigint);

CREATE POLICY product_categories_company_policy ON product_categories 
    USING (
        company_id = current_setting('app.current_company_id')::bigint 
        OR is_global = true
    );

CREATE POLICY employees_company_policy ON employees 
    USING (company_id = current_setting('app.current_company_id')::bigint);
```

### **應用層安全控制**

```go
// Go 範例：中介軟體設置公司上下文
func SetCompanyContext(c *gin.Context) {
    userID := getCurrentUserID(c)
    companyID := getUserCompanyID(userID)
    
    // 設置 PostgreSQL 會話變數
    db.Exec("SET app.current_company_id = ?", companyID)
    
    c.Next()
}
```

---

## 📈 **效能優化建議**

### **索引策略**

```sql
-- 複合索引優化查詢效能
CREATE INDEX idx_products_company_category ON products(company_id, category_id);
CREATE INDEX idx_inventory_levels_company_low_stock ON inventory_levels(company_id, product_id) 
    WHERE quantity_available <= reorder_point;
CREATE INDEX idx_accounts_receivable_company_overdue ON accounts_receivable(company_id, due_date) 
    WHERE status = 'open' AND due_date < CURRENT_DATE;
```

### **查詢優化範例**

```sql
-- 優化前：全表掃描
SELECT * FROM products WHERE name LIKE '%processor%';

-- 優化後：使用公司隔離
SELECT * FROM products 
WHERE company_id = current_setting('app.current_company_id')::bigint 
    AND name LIKE '%processor%';
```

---

## 🧪 **測試策略**

### **數據隔離測試**

```sql
-- 測試腳本：驗證公司間數據隔離
-- 設置公司 A 的上下文
SET app.current_company_id = 67;
SELECT COUNT(*) as company_a_products FROM products;

-- 設置公司 B 的上下文
SET app.current_company_id = 68;
SELECT COUNT(*) as company_b_products FROM products;

-- 驗證：兩個公司看到的產品數量應該不同
```

### **效能基準測試**

```sql
-- 測試複雜查詢的執行計畫
EXPLAIN ANALYZE 
SELECT 
    p.name,
    pc.name as category,
    il.quantity_on_hand,
    w.name as warehouse
FROM products p
JOIN product_categories pc ON p.category_id = pc.id
JOIN inventory_levels il ON p.id = il.product_id
JOIN warehouses w ON il.warehouse_id = w.id
WHERE p.company_id = 67
    AND il.quantity_available <= il.reorder_point;
```

---

## 🚀 **部署策略**

### **階段性部署計畫**

#### **第一階段：準備期**
1. 建立測試環境
2. 備份生產資料庫
3. 執行修復腳本（測試環境）
4. 驗證數據完整性

#### **第二階段：實施期**
1. 維護視窗期間執行修復
2. 逐表執行，實時監控
3. 驗證應用程式相容性
4. 回滾計畫準備

#### **第三階段：驗證期**
1. 完整功能測試
2. 效能基準比較
3. 用戶接受度測試
4. 監控系統穩定性

### **回滾計畫**

```sql
-- 緊急回滾腳本範例
-- 移除新增的欄位（僅在必要時使用）
ALTER TABLE warehouses DROP COLUMN IF EXISTS company_id;
ALTER TABLE warehouses DROP COLUMN IF EXISTS created_by_user_id;

-- 停用 RLS（緊急措施）
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
```

---

## 📋 **檢查清單**

### **修復前檢查**
- [ ] 完整資料庫備份
- [ ] 測試環境準備
- [ ] 應用程式代碼審查
- [ ] 依賴關係分析
- [ ] 效能基準建立

### **修復中檢查**
- [ ] 外鍵約束完整性
- [ ] 索引建立成功
- [ ] 數據遷移正確性
- [ ] 應用程式相容性
- [ ] 效能影響評估

### **修復後檢查**
- [ ] 功能完整性測試
- [ ] 數據隔離驗證
- [ ] 效能基準比較
- [ ] 安全性驗證
- [ ] 文件更新完成

---

## 📚 **相關文件**

- **資料庫規格**: `documents/database_spec.md`
- **開發規範**: `documents/claude_code_rules.md`
- **安全政策**: `documents/SECURITY_POLICIES_AND_PROCEDURES.md`
- **API 規劃**: `documents/API_Planning_Document.md`

---

## 👥 **聯絡資訊**

**技術負責人**: gamepig1976@gmail.com (Vic Huang)  
**專案代號**: NexusERP-MultiTenant-Fix  
**建立日期**: 2025-07-23  
**最後更新**: 2025-07-23  

---

**⚠️ 重要提醒**: 本修復計畫涉及核心資料庫結構變更，建議在維護視窗期間執行，並確保完整備份和回滾計畫準備就緒。