@extends('layouts.app')

@section('title', '供應商註冊 - NexusERP')

@push('meta')
<meta name="csrf-token" content="{{ csrf_token() }}">
@endpush

@push('styles')
<style>
/* 多步驟表單樣式 */
.step-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.step-indicator {
    display: flex;
    justify-content: space-between;
    margin-bottom: 3rem;
    position: relative;
}

.step-indicator::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: #e5e7eb;
    z-index: 0;
}

.step-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
}

.step-number {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
    background: #f3f4f6;
    color: #6b7280;
    border: 2px solid #e5e7eb;
    transition: all 0.3s ease;
}

.step-item.active .step-number {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.step-item.completed .step-number {
    background: #10b981;
    color: white;
    border-color: #10b981;
}

.step-item.completed .step-number::before {
    content: '✓';
}

.step-label {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
    text-align: center;
    white-space: nowrap;
}

.step-item.active .step-label {
    color: #3b82f6;
    font-weight: 600;
}

.step-item.completed .step-label {
    color: #10b981;
}

.form-container {
    background: white;
    border-radius: 0.75rem;
    padding: 2rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
}

.form-input,
.form-select,
.form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error,
.form-select.error,
.form-textarea.error {
    border-color: #ef4444;
}

.form-error {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #ef4444;
}

.form-help {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
}

.required {
    color: #ef4444;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .step-indicator {
        margin-bottom: 2rem;
    }
    
    .step-label {
        font-size: 0.75rem;
    }
    
    .step-container {
        padding: 1rem;
    }
}

.btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.btn-primary {
    background: #3b82f6;
    color: white;
}

.btn-primary:hover {
    background: #2563eb;
}

.btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
}

.btn-secondary:hover {
    background: #e5e7eb;
}

.btn-success {
    background: #10b981;
    color: white;
}

.btn-success:hover {
    background: #059669;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
}

.checkbox-group {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.checkbox-input {
    margin-top: 0.25rem;
}

.checkbox-label {
    font-size: 0.875rem;
    line-height: 1.5;
    color: #374151;
}

.step-content {
    display: none;
}

.step-content.active {
    display: block;
}

.progress-bar {
    width: 100%;
    height: 0.5rem;
    background: #e5e7eb;
    border-radius: 0.25rem;
    margin-bottom: 2rem;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #3b82f6;
    border-radius: 0.25rem;
    transition: width 0.3s ease;
}
</style>
@endpush

@section('content')
<div class="step-container">
    <!-- 頁面標題 -->
    <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">供應商註冊</h1>
        <p class="text-gray-600">加入 NexusERP 市場平台，開始您的業務合作</p>
    </div>

    <!-- 進度條 -->
    <div class="progress-bar">
        <div class="progress-fill" id="progressBar" style="width: 25%;"></div>
    </div>

    <!-- 步驟指示器 -->
    <div class="step-indicator">
        <div class="step-item active" data-step="1">
            <div class="step-number">1</div>
            <div class="step-label">基本公司資訊</div>
        </div>
        <div class="step-item" data-step="2">
            <div class="step-number">2</div>
            <div class="step-label">聯絡資訊</div>
        </div>
        <div class="step-item" data-step="3">
            <div class="step-number">3</div>
            <div class="step-label">業務詳情</div>
        </div>
        <div class="step-item" data-step="4">
            <div class="step-number">4</div>
            <div class="step-label">條款確認</div>
        </div>
    </div>

    <!-- 表單容器 -->
    <div class="form-container">
        <form id="supplierRegistrationForm" method="POST">
            @csrf
            
            <!-- 步驟 1: 基本公司資訊 -->
            <div class="step-content active" data-step="1">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">基本公司資訊</h2>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="company_name" class="form-label">
                            公司名稱 <span class="required">*</span>
                        </label>
                        <input type="text" id="company_name" name="company_name" class="form-input" required maxlength="255">
                        <div class="form-error" id="company_name_error"></div>
                    </div>

                    <div class="form-group">
                        <label for="business_registration_number" class="form-label">營業登記號碼</label>
                        <input type="text" id="business_registration_number" name="business_registration_number" class="form-input">
                        <div class="form-help">例如：12345678</div>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="tax_id" class="form-label">統一編號</label>
                        <input type="text" id="tax_id" name="tax_id" class="form-input" maxlength="8">
                        <div class="form-help">8位數統一編號</div>
                        <div class="form-error" id="tax_id_error"></div>
                    </div>

                    <div class="form-group">
                        <label for="business_type" class="form-label">業務類型</label>
                        <select id="business_type" name="business_type" class="form-select">
                            <option value="">請選擇業務類型</option>
                            <option value="manufacturer">製造商</option>
                            <option value="distributor">經銷商</option>
                            <option value="retailer">零售商</option>
                            <option value="service_provider">服務提供商</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="business_category" class="form-label">業務類別</label>
                    <input type="text" id="business_category" name="business_category" class="form-input" placeholder="例如：電子產品、食品、服裝等">
                    <div class="form-help">描述您的主要業務類別</div>
                </div>
            </div>

            <!-- 步驟 2: 聯絡資訊 -->
            <div class="step-content" data-step="2">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">聯絡資訊</h2>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="contact_person_name" class="form-label">
                            聯絡人姓名 <span class="required">*</span>
                        </label>
                        <input type="text" id="contact_person_name" name="contact_person_name" class="form-input" required maxlength="100">
                        <div class="form-error" id="contact_person_name_error"></div>
                    </div>

                    <div class="form-group">
                        <label for="contact_email" class="form-label">
                            聯絡電子郵件 <span class="required">*</span>
                        </label>
                        <input type="email" id="contact_email" name="contact_email" class="form-input" required maxlength="255">
                        <div class="form-help">我們會透過此信箱與您聯繫</div>
                        <div class="form-error" id="contact_email_error"></div>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="contact_phone" class="form-label">聯絡電話</label>
                        <input type="tel" id="contact_phone" name="contact_phone" class="form-input" placeholder="例如：02-1234-5678">
                        <div class="form-help">含區碼的電話號碼</div>
                        <div class="form-error" id="contact_phone_error"></div>
                    </div>

                    <div class="form-group">
                        <label for="website_url" class="form-label">公司網站</label>
                        <input type="url" id="website_url" name="website_url" class="form-input" placeholder="https://www.example.com">
                        <div class="form-help">若有公司官方網站請提供</div>
                        <div class="form-error" id="website_url_error"></div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="business_address" class="form-label">營業地址</label>
                    <textarea id="business_address" name="business_address" class="form-textarea" rows="3" placeholder="請輸入完整的營業地址"></textarea>
                    <div class="form-help">請提供詳細的營業地址，包含縣市、區域、街道等</div>
                    <div class="form-error" id="business_address_error"></div>
                </div>

                <div class="form-group">
                    <label for="billing_address" class="form-label">帳單地址</label>
                    <textarea id="billing_address" name="billing_address" class="form-textarea" rows="3" placeholder="若與營業地址不同，請輸入帳單地址"></textarea>
                    <div class="form-help">如果帳單地址與營業地址相同，可以留空</div>
                    <div class="form-error" id="billing_address_error"></div>
                </div>

                <div class="checkbox-group">
                    <input type="checkbox" id="same_as_business" class="checkbox-input">
                    <label for="same_as_business" class="checkbox-label">
                        帳單地址與營業地址相同
                    </label>
                </div>
            </div>

            <!-- 步驟 3: 業務詳情 -->
            <div class="step-content" data-step="3">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">業務詳情</h2>
                
                <div class="form-group">
                    <label for="description" class="form-label">公司簡介</label>
                    <textarea id="description" name="description" class="form-textarea" rows="4" placeholder="請簡要描述您的公司背景、主要業務和服務內容"></textarea>
                    <div class="form-help">詳細的公司介紹有助於我們更好地了解您的業務</div>
                    <div class="form-error" id="description_error"></div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="established_year" class="form-label">成立年份</label>
                        <input type="number" id="established_year" name="established_year" class="form-input" min="1900" max="2025" placeholder="2000">
                        <div class="form-help">公司成立的西元年份</div>
                        <div class="form-error" id="established_year_error"></div>
                    </div>

                    <div class="form-group">
                        <label for="employee_count_range" class="form-label">員工人數規模</label>
                        <select id="employee_count_range" name="employee_count_range" class="form-select">
                            <option value="">請選擇員工人數規模</option>
                            <option value="1-10">1-10 人</option>
                            <option value="11-50">11-50 人</option>
                            <option value="51-200">51-200 人</option>
                            <option value="201-500">201-500 人</option>
                            <option value="501-1000">501-1000 人</option>
                            <option value="1000+">1000 人以上</option>
                        </select>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="annual_revenue_range" class="form-label">年營收規模</label>
                        <select id="annual_revenue_range" name="annual_revenue_range" class="form-select">
                            <option value="">請選擇年營收規模</option>
                            <option value="below-1m">低於 100 萬</option>
                            <option value="1m-5m">100 萬 - 500 萬</option>
                            <option value="5m-10m">500 萬 - 1000 萬</option>
                            <option value="10m-50m">1000 萬 - 5000 萬</option>
                            <option value="50m-100m">5000 萬 - 1 億</option>
                            <option value="100m+">1 億以上</option>
                        </select>
                        <div class="form-help">此資訊僅供內部評估，不會對外公開</div>
                    </div>

                    <div class="form-group">
                        <label for="payment_terms" class="form-label">付款條件</label>
                        <select id="payment_terms" name="payment_terms" class="form-select">
                            <option value="">請選擇付款條件</option>
                            <option value="cash">現金交易</option>
                            <option value="net-7">貨到付款</option>
                            <option value="net-15">15 天付款</option>
                            <option value="net-30">30 天付款</option>
                            <option value="net-60">60 天付款</option>
                            <option value="custom">其他條件</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="delivery_capabilities" class="form-label">交貨能力</label>
                    <textarea id="delivery_capabilities" name="delivery_capabilities" class="form-textarea" rows="3" placeholder="請描述您的配送範圍、交貨時間、物流方式等"></textarea>
                    <div class="form-help">例如：全台配送、3-5 個工作天、自有物流或委託物流等</div>
                    <div class="form-error" id="delivery_capabilities_error"></div>
                </div>

                <div class="form-group">
                    <label for="certifications" class="form-label">認證資格</label>
                    <textarea id="certifications" name="certifications" class="form-textarea" rows="3" placeholder="請列出您擁有的相關認證、證照或資格"></textarea>
                    <div class="form-help">例如：ISO 認證、品質管理認證、行業特定認證等</div>
                    <div class="form-error" id="certifications_error"></div>
                </div>
            </div>

            <!-- 步驟 4: 條款確認 -->
            <div class="step-content" data-step="4">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">條款確認</h2>
                
                <!-- 註冊資訊摘要 -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3">註冊資訊摘要</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium text-gray-700">公司名稱：</span>
                            <span id="summary_company_name" class="text-gray-600">-</span>
                        </div>
                        <div>
                            <span class="font-medium text-gray-700">業務類型：</span>
                            <span id="summary_business_type" class="text-gray-600">-</span>
                        </div>
                        <div>
                            <span class="font-medium text-gray-700">聯絡人：</span>
                            <span id="summary_contact_person" class="text-gray-600">-</span>
                        </div>
                        <div>
                            <span class="font-medium text-gray-700">聯絡信箱：</span>
                            <span id="summary_contact_email" class="text-gray-600">-</span>
                        </div>
                    </div>
                </div>

                <!-- 服務條款 -->
                <div class="form-group">
                    <div class="bg-white border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto mb-4">
                        <h4 class="font-semibold text-gray-900 mb-3">NexusERP 供應商服務條款</h4>
                        <div class="text-sm text-gray-700 space-y-2">
                            <p><strong>1. 服務說明</strong></p>
                            <p>本平台為企業資源規劃(ERP)系統的供應商市場平台，旨在連接供應商與採購商，促進商業交易。</p>
                            
                            <p><strong>2. 供應商義務</strong></p>
                            <ul class="list-disc list-inside ml-4 space-y-1">
                                <li>提供真實、準確的公司資訊和產品資料</li>
                                <li>及時回應詢價和訂單請求</li>
                                <li>確保產品品質符合承諾標準</li>
                                <li>遵守交貨時間和付款條件</li>
                                <li>維護良好的商業信譽</li>
                            </ul>
                            
                            <p><strong>3. 平台規範</strong></p>
                            <ul class="list-disc list-inside ml-4 space-y-1">
                                <li>不得發布虛假或誤導性資訊</li>
                                <li>不得從事任何違法或欺詐行為</li>
                                <li>尊重智慧財產權</li>
                                <li>維護公平競爭環境</li>
                            </ul>
                            
                            <p><strong>4. 費用說明</strong></p>
                            <p>供應商註冊免費，平台將根據交易量收取合理的手續費。具體費率將另行通知。</p>
                            
                            <p><strong>5. 終止條件</strong></p>
                            <p>任一方可隨時終止合作關係，但需提前30天書面通知。違反條款者，平台有權立即終止服務。</p>
                        </div>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="agree_terms" name="agree_terms" class="checkbox-input" required>
                        <label for="agree_terms" class="checkbox-label">
                            我已閱讀並同意上述服務條款 <span class="required">*</span>
                        </label>
                    </div>
                    <div class="form-error" id="agree_terms_error"></div>
                </div>

                <!-- 隱私權政策 -->
                <div class="form-group">
                    <div class="bg-white border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto mb-4">
                        <h4 class="font-semibold text-gray-900 mb-3">隱私權政策</h4>
                        <div class="text-sm text-gray-700 space-y-2">
                            <p><strong>1. 資料收集</strong></p>
                            <p>我們收集您在註冊和使用過程中提供的資訊，包括公司資料、聯絡資訊和交易記錄。</p>
                            
                            <p><strong>2. 資料使用</strong></p>
                            <ul class="list-disc list-inside ml-4 space-y-1">
                                <li>提供平台服務和技術支援</li>
                                <li>處理交易和付款</li>
                                <li>改善服務品質</li>
                                <li>法律法規要求的其他用途</li>
                            </ul>
                            
                            <p><strong>3. 資料保護</strong></p>
                            <p>我們採用適當的技術和管理措施保護您的個人資料，防止未經授權的存取、使用或洩露。</p>
                            
                            <p><strong>4. 資料分享</strong></p>
                            <p>除法律要求外，我們不會向第三方分享您的個人資料，但為提供服務所需的必要資訊除外。</p>
                            
                            <p><strong>5. 您的權利</strong></p>
                            <p>您有權查詢、更正、刪除或限制處理您的個人資料。如有需要，請聯絡我們的客服團隊。</p>
                        </div>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="agree_privacy" name="agree_privacy" class="checkbox-input" required>
                        <label for="agree_privacy" class="checkbox-label">
                            我已閱讀並同意隱私權政策 <span class="required">*</span>
                        </label>
                    </div>
                    <div class="form-error" id="agree_privacy_error"></div>
                </div>

                <!-- 行銷通訊 -->
                <div class="form-group">
                    <div class="checkbox-group">
                        <input type="checkbox" id="agree_marketing" name="agree_marketing" class="checkbox-input">
                        <label for="agree_marketing" class="checkbox-label">
                            我同意接收 NexusERP 的產品資訊、促銷活動和相關服務通知
                        </label>
                    </div>
                    <div class="form-help">此項為選擇性同意，不影響您的註冊申請</div>
                </div>

                <!-- 最終確認 -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-start">
                        <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div class="text-sm text-blue-800">
                            <p class="font-semibold mb-1">提交前請確認</p>
                            <p>提交申請後，我們會在 1-3 個工作天內審核您的資料。審核結果將透過電子郵件通知您。請確保所提供的聯絡資訊正確無誤。</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 表單操作按鈕 -->
            <div class="form-actions">
                <button type="button" id="prevButton" class="btn btn-secondary" style="display: none;">
                    上一步
                </button>
                <div></div>
                <button type="button" id="nextButton" class="btn btn-primary">
                    下一步
                </button>
                <button type="submit" id="submitButton" class="btn btn-success" style="display: none;">
                    提交註冊
                </button>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
// 多步驟表單 JavaScript 控制
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('supplierRegistrationForm');
    const stepContents = document.querySelectorAll('.step-content');
    const stepItems = document.querySelectorAll('.step-item');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const submitButton = document.getElementById('submitButton');
    const progressBar = document.getElementById('progressBar');
    
    let currentStep = {{ $currentStep ?? 1 }};
    const totalSteps = 4;
    
    // 初始化步驟
    function initializeStep() {
        updateStepDisplay();
        updateProgressBar();
        updateButtons();
    }
    
    // 更新步驟顯示
    function updateStepDisplay() {
        stepContents.forEach((content, index) => {
            content.classList.toggle('active', index + 1 === currentStep);
        });
        
        stepItems.forEach((item, index) => {
            const stepNumber = index + 1;
            item.classList.remove('active', 'completed');
            
            if (stepNumber === currentStep) {
                item.classList.add('active');
            } else if (stepNumber < currentStep) {
                item.classList.add('completed');
            }
        });
    }
    
    // 更新進度條
    function updateProgressBar() {
        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = progress + '%';
    }
    
    // 更新按鈕狀態
    function updateButtons() {
        prevButton.style.display = currentStep > 1 ? 'inline-flex' : 'none';
        nextButton.style.display = currentStep < totalSteps ? 'inline-flex' : 'none';
        submitButton.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
    }
    
    // 驗證當前步驟
    function validateCurrentStep() {
        const currentStepContent = document.querySelector(`.step-content[data-step="${currentStep}"]`);
        const requiredFields = currentStepContent.querySelectorAll('[required]');
        let isValid = true;
        
        // 清除之前的錯誤
        currentStepContent.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
        currentStepContent.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });
        
        // 驗證必填欄位
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');
                const errorElement = document.getElementById(field.id + '_error');
                if (errorElement) {
                    errorElement.textContent = '此欄位為必填';
                }
            }
        });
        
        // 特殊驗證邏輯
        if (currentStep === 1) {
            const companyName = document.getElementById('company_name');
            if (companyName.value.trim().length < 2) {
                isValid = false;
                companyName.classList.add('error');
                document.getElementById('company_name_error').textContent = '公司名稱至少需要 2 個字元';
            }
            
            const taxId = document.getElementById('tax_id');
            if (taxId.value && !/^\d{8}$/.test(taxId.value)) {
                isValid = false;
                taxId.classList.add('error');
                const taxIdError = document.getElementById('tax_id_error');
                if (taxIdError) {
                    taxIdError.textContent = '統一編號必須為 8 位數字';
                }
            }
        }
        
        if (currentStep === 2) {
            const contactEmail = document.getElementById('contact_email');
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (contactEmail.value && !emailPattern.test(contactEmail.value)) {
                isValid = false;
                contactEmail.classList.add('error');
                document.getElementById('contact_email_error').textContent = '請輸入有效的電子郵件地址';
            }
            
            const contactPhone = document.getElementById('contact_phone');
            if (contactPhone.value && !/^[\d\-\+\(\)\s]+$/.test(contactPhone.value)) {
                isValid = false;
                contactPhone.classList.add('error');
                document.getElementById('contact_phone_error').textContent = '請輸入有效的電話號碼';
            }
            
            const websiteUrl = document.getElementById('website_url');
            if (websiteUrl.value && !/^https?:\/\/.+/.test(websiteUrl.value)) {
                isValid = false;
                websiteUrl.classList.add('error');
                document.getElementById('website_url_error').textContent = '請輸入有效的網站網址 (需含 http:// 或 https://)';
            }
        }
        
        if (currentStep === 3) {
            const establishedYear = document.getElementById('established_year');
            const currentYear = new Date().getFullYear();
            if (establishedYear.value && (establishedYear.value < 1900 || establishedYear.value > currentYear)) {
                isValid = false;
                establishedYear.classList.add('error');
                document.getElementById('established_year_error').textContent = `成立年份必須在 1900 到 ${currentYear} 之間`;
            }
        }
        
        if (currentStep === 4) {
            const agreeTerms = document.getElementById('agree_terms');
            if (!agreeTerms.checked) {
                isValid = false;
                document.getElementById('agree_terms_error').textContent = '您必須同意服務條款才能繼續';
            }
            
            const agreePrivacy = document.getElementById('agree_privacy');
            if (!agreePrivacy.checked) {
                isValid = false;
                document.getElementById('agree_privacy_error').textContent = '您必須同意隱私權政策才能繼續';
            }
        }
        
        return isValid;
    }
    
    // 更新摘要資訊
    function updateSummary() {
        if (currentStep === 4) {
            const companyName = document.getElementById('company_name').value || '-';
            const businessType = document.getElementById('business_type');
            const businessTypeText = businessType.selectedOptions[0]?.text || '-';
            const contactPerson = document.getElementById('contact_person_name').value || '-';
            const contactEmail = document.getElementById('contact_email').value || '-';
            
            document.getElementById('summary_company_name').textContent = companyName;
            document.getElementById('summary_business_type').textContent = businessTypeText;
            document.getElementById('summary_contact_person').textContent = contactPerson;
            document.getElementById('summary_contact_email').textContent = contactEmail;
        }
    }
    
    // 下一步
    nextButton.addEventListener('click', function() {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateStepDisplay();
                updateProgressBar();
                updateButtons();
                updateSummary();
                
                // 更新 URL
                const newUrl = `/marketplace/supplier/register/step/${currentStep}`;
                window.history.pushState({ step: currentStep }, '', newUrl);
            }
        }
    });
    
    // 上一步
    prevButton.addEventListener('click', function() {
        if (currentStep > 1) {
            currentStep--;
            updateStepDisplay();
            updateProgressBar();
            updateButtons();
            
            // 更新 URL
            const newUrl = currentStep === 1 
                ? '/marketplace/supplier/register'
                : `/marketplace/supplier/register/step/${currentStep}`;
            window.history.pushState({ step: currentStep }, '', newUrl);
        }
    });
    
    // 處理瀏覽器返回/前進
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.step) {
            currentStep = event.state.step;
        } else {
            currentStep = 1;
        }
        updateStepDisplay();
        updateProgressBar();
        updateButtons();
    });
    
    // 顯示通知訊息
    function showNotification(message, type = 'error') {
        // 移除舊的通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-red-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    ${type === 'success' ? 
                        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' :
                        type === 'warning' ?
                        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>' :
                        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
                    }
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="inline-flex text-white hover:text-gray-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 自動移除通知
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // 處理 API 錯誤
    function handleAPIError(status, result) {
        let errorMessage = '註冊失敗，請檢查輸入資料';
        
        switch (status) {
            case 400:
                errorMessage = '輸入資料有誤，請檢查必填欄位';
                if (result.message && result.message.includes('email')) {
                    errorMessage = '電子郵件格式不正確';
                } else if (result.message && result.message.includes('validation')) {
                    errorMessage = '資料驗證失敗，請檢查輸入格式';
                }
                break;
            case 409:
                errorMessage = '此公司或電子郵件已經註冊過，請檢查是否重複申請';
                break;
            case 500:
                errorMessage = '伺服器錯誤，請稍後再試或聯絡客服';
                break;
            default:
                if (result.error) {
                    errorMessage = result.error;
                }
                if (result.message) {
                    errorMessage += ': ' + result.message;
                }
        }
        
        showNotification(errorMessage, 'error');
        
        // 如果是驗證錯誤，嘗試跳回第一步
        if (status === 400) {
            setTimeout(() => {
                currentStep = 1;
                updateStepDisplay();
                updateProgressBar();
                updateButtons();
            }, 2000);
        }
    }
    
    // 收集表單資料
    function collectFormData() {
        const formData = {
            company_name: document.getElementById('company_name').value,
            business_registration_number: document.getElementById('business_registration_number').value || null,
            tax_id: document.getElementById('tax_id').value || null,
            contact_person_name: document.getElementById('contact_person_name').value,
            contact_email: document.getElementById('contact_email').value,
            contact_phone: document.getElementById('contact_phone').value || null,
            business_address: document.getElementById('business_address').value || null,
            billing_address: document.getElementById('billing_address').value || null,
            website_url: document.getElementById('website_url').value || null,
            business_type: document.getElementById('business_type').value || null,
            business_category: document.getElementById('business_category').value || null,
            description: document.getElementById('description').value || null,
            established_year: document.getElementById('established_year').value ? parseInt(document.getElementById('established_year').value) : null,
            employee_count_range: document.getElementById('employee_count_range').value || null,
            annual_revenue_range: document.getElementById('annual_revenue_range').value || null,
            payment_terms: document.getElementById('payment_terms').value || null,
            delivery_capabilities: document.getElementById('delivery_capabilities').value || null,
            certifications: document.getElementById('certifications').value || null
        };
        
        // 移除空值
        Object.keys(formData).forEach(key => {
            if (formData[key] === '' || formData[key] === null) {
                delete formData[key];
            }
        });
        
        return formData;
    }
    
    // 顯示提交載入狀態
    function setSubmitLoading(isLoading) {
        const submitButton = document.getElementById('submitButton');
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                提交中...
            `;
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = '提交註冊';
        }
    }
    
    // 表單提交處理
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateCurrentStep()) {
            return;
        }
        
        const formData = collectFormData();
        
        try {
            setSubmitLoading(true);
            
            // 調用後端 API  
            const response = await fetch('/api/marketplace/suppliers/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // 註冊成功，跳轉到成功頁面
                window.location.href = '/marketplace/supplier/register/success';
            } else {
                // 處理錯誤
                handleAPIError(response.status, result);
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            alert('網路錯誤，請稍後再試。如果問題持續，請聯絡客服。');
        } finally {
            setSubmitLoading(false);
        }
    });
    
    // 地址自動填入功能
    const sameAsBusinessCheckbox = document.getElementById('same_as_business');
    const businessAddressTextarea = document.getElementById('business_address');
    const billingAddressTextarea = document.getElementById('billing_address');
    
    sameAsBusinessCheckbox.addEventListener('change', function() {
        if (this.checked) {
            billingAddressTextarea.value = businessAddressTextarea.value;
            billingAddressTextarea.disabled = true;
            billingAddressTextarea.style.backgroundColor = '#f3f4f6';
        } else {
            billingAddressTextarea.disabled = false;
            billingAddressTextarea.style.backgroundColor = '';
        }
    });
    
    businessAddressTextarea.addEventListener('input', function() {
        if (sameAsBusinessCheckbox.checked) {
            billingAddressTextarea.value = this.value;
        }
    });
    
    // 初始化
    initializeStep();
});
</script>
@endpush