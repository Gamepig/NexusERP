@extends('layouts.app')

@section('title', '完成帳戶設定')

@section('content')
<div class="min-h-screen nexus-bg-primary flex items-center justify-center px-4">
    <div class="max-w-2xl w-full space-y-8">
        <!-- 歡迎標題 -->
        <div class="text-center">
            <div class="mx-auto h-20 w-20 rounded-full nexus-bg-secondary flex items-center justify-center mb-6">
                <svg class="h-10 w-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
            </div>
            <h1 class="text-3xl font-bold nexus-text-primary mb-2">
                歡迎使用 NexusERP，{{ auth()->user()->name }}！
            </h1>
            @if($hasAIContext ?? false)
                <p class="text-lg nexus-text-secondary">
                    根據您剛才的對話內容，我們可以為您智能推薦設定，或您也可以手動選擇
                </p>
            @else
                <p class="text-lg nexus-text-secondary">
                    為了提供更好的服務體驗，請告訴我們您的業務類型
                </p>
            @endif
        </div>

        <!-- 選項卡片 -->
        <div class="grid md:grid-cols-2 gap-6">
            <!-- AI 智能分析選項 -->
            <div class="nexus-card hover:scale-105 transition-all duration-300 cursor-pointer" id="ai-option">
                <div class="text-center p-6">
                    <div class="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                        <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold nexus-text-primary mb-2">
                        @if($hasAIContext ?? false)
                            智能推薦設定
                        @else
                            AI 智能分析
                        @endif
                    </h3>
                    <p class="nexus-text-secondary mb-4">
                        @if($hasAIContext ?? false)
                            基於您剛才的對話內容，AI 將為您推薦最適合的業務設定
                        @else
                            透過 AI 對話了解您的業務需求，智能推薦最適合的業務類型和功能模組
                        @endif
                    </p>
                    <ul class="text-sm nexus-text-muted text-left space-y-1">
                        @if($hasAIContext ?? false)
                            <li>🎯 基於對話內容分析</li>
                            <li>⚡ 一鍵套用推薦設定</li>
                            <li>🔧 可進一步調整優化</li>
                        @else
                            <li>✨ 智能業務類型識別</li>
                            <li>🎯 個人化功能推薦</li>
                            <li>⚡ 快速設定完成</li>
                        @endif
                    </ul>
                </div>
            </div>

            <!-- 手動選擇選項 -->
            <div class="nexus-card hover:scale-105 transition-all duration-300 cursor-pointer" id="manual-option">
                <div class="text-center p-6">
                    <div class="mx-auto h-16 w-16 rounded-full nexus-bg-tertiary flex items-center justify-center mb-4">
                        <svg class="h-8 w-8 nexus-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold nexus-text-primary mb-2">手動選擇</h3>
                    <p class="nexus-text-secondary mb-4">
                        直接從預設的業務類型中選擇，快速完成帳戶設定
                    </p>
                    <ul class="text-sm nexus-text-muted text-left space-y-1">
                        <li>📋 預設業務類型清單</li>
                        <li>⚙️ 基本功能配置</li>
                        <li>🚀 立即開始使用</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- 手動選擇表單（預設隱藏） -->
        <div id="manual-form" class="nexus-card hidden">
            <form method="POST" action="{{ route('auth.business-setup.store') }}" class="space-y-6">
                @csrf
                
                <!-- 步驟 1: 業務類型選擇 -->
                <div id="step-1" class="step-content">
                    <h3 class="text-xl font-semibold nexus-text-primary mb-4">步驟 1: 選擇您的業務類型</h3>
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        <label class="flex items-center space-x-3 p-3 rounded-lg nexus-bg-secondary cursor-pointer hover:bg-opacity-80">
                            <input type="radio" name="business_type" value="restaurant" class="text-purple-500 focus:ring-purple-500" required>
                            <div>
                                <div class="font-medium nexus-text-primary">餐飲業</div>
                                <div class="text-sm nexus-text-secondary">餐廳、咖啡廳、小吃店</div>
                            </div>
                        </label>
                        
                        <label class="flex items-center space-x-3 p-3 rounded-lg nexus-bg-secondary cursor-pointer hover:bg-opacity-80">
                            <input type="radio" name="business_type" value="retail" class="text-purple-500 focus:ring-purple-500" required>
                            <div>
                                <div class="font-medium nexus-text-primary">零售業</div>
                                <div class="text-sm nexus-text-secondary">商店、電商、批發</div>
                            </div>
                        </label>
                        
                        <label class="flex items-center space-x-3 p-3 rounded-lg nexus-bg-secondary cursor-pointer hover:bg-opacity-80">
                            <input type="radio" name="business_type" value="manufacturing" class="text-purple-500 focus:ring-purple-500" required>
                            <div>
                                <div class="font-medium nexus-text-primary">製造業</div>
                                <div class="text-sm nexus-text-secondary">工廠、生產、加工</div>
                            </div>
                        </label>
                        
                        <label class="flex items-center space-x-3 p-3 rounded-lg nexus-bg-secondary cursor-pointer hover:bg-opacity-80">
                            <input type="radio" name="business_type" value="service" class="text-purple-500 focus:ring-purple-500" required>
                            <div>
                                <div class="font-medium nexus-text-primary">服務業</div>
                                <div class="text-sm nexus-text-secondary">顧問、維修、專業服務</div>
                            </div>
                        </label>
                        
                        <label class="flex items-center space-x-3 p-3 rounded-lg nexus-bg-secondary cursor-pointer hover:bg-opacity-80">
                            <input type="radio" name="business_type" value="other" class="text-purple-500 focus:ring-purple-500" required>
                            <div>
                                <div class="font-medium nexus-text-primary">其他</div>
                                <div class="text-sm nexus-text-secondary">其他類型業務</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- 步驟 2: 公司基本資訊 -->
                <div id="step-2" class="step-content hidden">
                    <h3 class="text-xl font-semibold nexus-text-primary mb-4">步驟 2: 公司基本資訊</h3>
                    
                    <!-- 重要提醒 -->
                    <div class="nexus-card rounded-lg p-4 mb-6 border-l-4 border-amber-500">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h4 class="text-sm font-medium text-amber-800">⚠️ 重要提醒</h4>
                                <p class="text-sm text-amber-700 mt-1">公司資訊是使用系統的必要條件，請提供完整資訊以確保系統正常運作</p>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium nexus-text-primary">公司名稱 <span class="text-red-500">*</span></label>
                            <input type="text" name="company_name" id="company_name" required
                                   class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md">
                            @error('company_name')
                                <span class="text-red-500 text-xs mt-1">{{ $message }}</span>
                            @enderror
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium nexus-text-primary">公司代碼 <span class="text-gray-400 text-xs">(選填，系統會自動產生)</span></label>
                            <input type="text" name="company_code" id="company_code"
                                   class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md"
                                   placeholder="例如: ABCD，留空自動產生">
                            @error('company_code')
                                <span class="text-red-500 text-xs mt-1">{{ $message }}</span>
                            @enderror
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium nexus-text-primary">統一編號 <span class="text-gray-400 text-xs">(選填，個人工作室可跳過)</span></label>
                            <input type="text" name="tax_number" id="tax_number" pattern="[0-9]{8}"
                                   class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md"
                                   placeholder="8位數字，無統編可留空">
                            @error('tax_number')
                                <span class="text-red-500 text-xs mt-1">{{ $message }}</span>
                            @enderror
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium nexus-text-primary">產業類別 <span class="text-red-500">*</span></label>
                            <select name="industry" id="industry" required
                                    class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md">
                                <option value="">請選擇</option>
                                <option value="manufacturing">製造業</option>
                                <option value="retail">零售業</option>
                                <option value="service">服務業</option>
                                <option value="restaurant">餐飲業</option>
                                <option value="technology">科技業</option>
                                <option value="other">其他</option>
                            </select>
                            @error('industry')
                                <span class="text-red-500 text-xs mt-1">{{ $message }}</span>
                            @enderror
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium nexus-text-primary">員工人數 <span class="text-red-500">*</span></label>
                            <select name="size" id="size" required
                                    class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md">
                                <option value="">請選擇</option>
                                <option value="1-10">1-10 人</option>
                                <option value="11-50">11-50 人</option>
                                <option value="51-200">51-200 人</option>
                                <option value="201-500">201-500 人</option>
                                <option value="500+">500+ 人</option>
                            </select>
                            @error('size')
                                <span class="text-red-500 text-xs mt-1">{{ $message }}</span>
                            @enderror
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium nexus-text-primary">聯絡電話 <span class="text-red-500">*</span></label>
                            <input type="tel" name="company_phone" id="company_phone" required
                                   class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md"
                                   placeholder="例如: 02-1234-5678">
                            @error('company_phone')
                                <span class="text-red-500 text-xs mt-1">{{ $message }}</span>
                            @enderror
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium nexus-text-primary">公司地址 <span class="text-red-500">*</span></label>
                            <input type="text" name="company_address" id="company_address" required
                                   class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md"
                                   placeholder="請輸入完整地址">
                            @error('company_address')
                                <span class="text-red-500 text-xs mt-1">{{ $message }}</span>
                            @enderror
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium nexus-text-primary">公司電子郵件</label>
                            <input type="email" name="company_email" id="company_email"
                                   class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md"
                                   placeholder="選填">
                            @error('company_email')
                                <span class="text-red-500 text-xs mt-1">{{ $message }}</span>
                            @enderror
                        </div>
                    </div>
                </div>

                <!-- 步驟控制按鈕 -->
                <div class="flex justify-between pt-4">
                    <button type="button" id="prev-step" class="nexus-btn-secondary">
                        上一步
                    </button>
                    <button type="button" id="next-step" class="nexus-btn-primary">
                        下一步
                    </button>
                    <button type="submit" id="submit-form" class="nexus-btn-primary hidden">
                        完成設定
                    </button>
                </div>
            </form>
        </div>

        <!-- AI 引導表單（預設隱藏） -->
        <div id="ai-form" class="nexus-card hidden">
            <div class="text-center mb-6">
                <h3 class="text-xl font-semibold nexus-text-primary mb-2">AI 智能分析</h3>
                <p class="nexus-text-secondary">請描述您的業務，AI 將為您推薦最適合的設定</p>
            </div>
            
            <div id="ai-chat-container" class="space-y-4 mb-6 max-h-96 overflow-y-auto">
                <!-- AI 對話訊息將在這裡顯示 -->
            </div>
            
            <div class="flex space-x-3">
                <input type="text" id="ai-input" placeholder="描述您的業務類型..." 
                       class="nexus-input flex-1" maxlength="500">
                <button id="ai-send" class="nexus-btn-primary px-6">
                    送出
                </button>
            </div>
            
            <div class="flex justify-between pt-4">
                <button type="button" id="back-to-options-ai" class="nexus-btn-secondary">
                    返回選擇
                </button>
                <button id="apply-ai-recommendation" class="nexus-btn-primary hidden">
                    套用推薦設定
                </button>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const aiOption = document.getElementById('ai-option');
    const manualOption = document.getElementById('manual-option');
    const manualForm = document.getElementById('manual-form');
    const aiForm = document.getElementById('ai-form');
    const backToOptions = document.getElementById('back-to-options');
    const backToOptionsAI = document.getElementById('back-to-options-ai');

    // 多步驟表單控制
    let currentStep = 1;
    const totalSteps = 2;

    function showStep(step) {
        // 隱藏所有步驟
        document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
        
        // 顯示當前步驟
        const stepEl = document.getElementById(`step-${step}`);
        if (stepEl) {
            stepEl.classList.remove('hidden');
        }
        
        // 控制按鈕顯示
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const submitBtn = document.getElementById('submit-form');
        const backToOptions = document.getElementById('back-to-options');
        
        // 重設所有按鈕
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
        
        if (step === 1) {
            prevBtn.textContent = '返回選擇';
            prevBtn.onclick = function() {
                manualForm.classList.add('hidden');
                document.querySelector('.grid.md\\:grid-cols-2').classList.remove('hidden');
            };
        } else {
            prevBtn.textContent = '上一步';
            prevBtn.onclick = function() {
                currentStep--;
                showStep(currentStep);
            };
        }
        
        if (step === totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.onclick = function() {
                if (validateCurrentStep()) {
                    currentStep++;
                    showStep(currentStep);
                }
            };
        }
    }

    function validateCurrentStep() {
        if (currentStep === 1) {
            // 驗證業務類型選擇
            const businessType = document.querySelector('input[name="business_type"]:checked');
            if (!businessType) {
                alert('請選擇業務類型');
                return false;
            }
            
            // 根據業務類型自動選擇產業類別
            const industryMap = {
                'restaurant': 'restaurant',
                'retail': 'retail',
                'manufacturing': 'manufacturing',
                'service': 'service',
                'other': 'other'
            };
            
            const industrySelect = document.getElementById('industry');
            if (industryMap[businessType.value]) {
                industrySelect.value = industryMap[businessType.value];
            }
        }
        
        return true;
    }

    // 顯示手動選擇表單
    manualOption.addEventListener('click', function() {
        document.querySelector('.grid.md\\:grid-cols-2').classList.add('hidden');
        manualForm.classList.remove('hidden');
        currentStep = 1;
        showStep(currentStep);
    });

    // 顯示 AI 引導表單
    aiOption.addEventListener('click', function() {
        document.querySelector('.grid.md\\:grid-cols-2').classList.add('hidden');
        aiForm.classList.remove('hidden');
        initAIChat();
    });

    // 返回選項
    backToOptionsAI.addEventListener('click', function() {
        aiForm.classList.add('hidden');
        document.querySelector('.grid.md\\:grid-cols-2').classList.remove('hidden');
    });

    // AI 對話功能
    function initAIChat() {
        const chatContainer = document.getElementById('ai-chat-container');
        const aiInput = document.getElementById('ai-input');
        const aiSend = document.getElementById('ai-send');
        
        // 檢查是否有註冊時的 AI 上下文
        const hasAIContext = {{ ($hasAIContext ?? false) ? 'true' : 'false' }};
        const businessDescription = @json($businessDescription ?? '');
        
        if (hasAIContext && businessDescription) {
            // 如果有 AI 上下文，直接分析並顯示推薦
            addMessage('ai', '根據您剛才的註冊資訊，我來為您分析最適合的業務設定...');
            setTimeout(() => {
                analyzeBusinessType(businessDescription);
            }, 1000);
        } else {
            // 添加歡迎訊息
            addMessage('ai', '您好！我是 NexusERP 的 AI 助手。請告訴我您的業務類型，例如：我經營一家咖啡廳，主要提供現煮咖啡和輕食。');
        }
        
        // 處理送出訊息
        function sendMessage() {
            const message = aiInput.value.trim();
            if (!message) return;
            
            addMessage('user', message);
            aiInput.value = '';
            
            // 模擬 AI 回應（實際應該調用 AI API）
            setTimeout(() => {
                analyzeBusinessType(message);
            }, 1000);
        }
        
        aiSend.addEventListener('click', sendMessage);
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    function addMessage(type, content) {
        const chatContainer = document.getElementById('ai-chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'}`;
        
        const messageBubble = document.createElement('div');
        messageBubble.className = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            type === 'user' 
                ? 'bg-purple-500 text-white' 
                : 'nexus-bg-secondary nexus-text-primary'
        }`;
        messageBubble.style.whiteSpace = 'pre-line'; // 支援換行
        messageBubble.textContent = content;
        
        messageDiv.appendChild(messageBubble);
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        return messageDiv; // 返回元素以供移除
    }

    function analyzeBusinessType(message) {
        // 顯示載入訊息
        const loadingMessage = addMessage('ai', '🤔 正在分析中...');
        
        // 調用 AI API
        fetch('{{ route("auth.business-setup.ai-analyze") }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                description: message
            })
        })
        .then(response => response.json())
        .then(data => {
            // 移除載入訊息
            loadingMessage.remove();
            
            if (data.success) {
                const businessNames = {
                    'restaurant': '餐飲業',
                    'retail': '零售業',
                    'manufacturing': '製造業', 
                    'service': '服務業',
                    'agriculture': '農業',
                    'other': '其他'
                };
                
                const businessName = businessNames[data.recommendation] || '其他';
                const confidence = Math.round((data.confidence || 0.5) * 100);
                
                let recommendation = `根據您的描述，我推薦將您的業務類型設定為「${businessName}」（信心度：${confidence}%）。\n\n${data.explanation || ''}`;
                
                if (data.suggested_features && data.suggested_features.length > 0) {
                    recommendation += '\n\n建議功能：' + data.suggested_features.join('、');
                }
                
                addMessage('ai', recommendation);
                
                // 顯示套用按鈕
                document.getElementById('apply-ai-recommendation').classList.remove('hidden');
                document.getElementById('apply-ai-recommendation').setAttribute('data-business-type', data.recommendation);
            } else {
                addMessage('ai', '抱歉，分析時發生錯誤。請提供更多詳細資訊，或選擇手動設定。');
            }
        })
        .catch(error => {
            // 移除載入訊息
            loadingMessage.remove();
            
            // 降級到簡單關鍵字分析
            let recommendation = '';
            let businessType = '';
            
            if (message.includes('咖啡') || message.includes('餐廳') || message.includes('食物')) {
                businessType = 'restaurant';
                recommendation = '根據您的描述，我推薦將您的業務類型設定為「餐飲業」。這將為您啟用菜單管理、訂單系統、庫存追蹤等功能。';
            } else if (message.includes('商店') || message.includes('販售') || message.includes('零售')) {
                businessType = 'retail';
                recommendation = '根據您的描述，我推薦將您的業務類型設定為「零售業」。這將為您啟用商品管理、銷售分析、客戶管理等功能。';
            } else {
                recommendation = '請提供更多關於您業務的詳細資訊，例如：您販售什麼產品或提供什麼服務？';
            }
            
            addMessage('ai', recommendation + '\n\n（註：使用簡化分析，建議可嘗試重新描述）');
            
            if (businessType) {
                document.getElementById('apply-ai-recommendation').classList.remove('hidden');
                document.getElementById('apply-ai-recommendation').setAttribute('data-business-type', businessType);
            }
        });
    }

    // 套用 AI 推薦
    document.getElementById('apply-ai-recommendation').addEventListener('click', function() {
        const businessType = this.getAttribute('data-business-type');
        
        // 提示用戶仍需完成公司資訊設定
        addMessage('ai', '很好！現在我需要收集一些基本的公司資訊以完成設定。請提供以下資訊：\n\n✅ 公司名稱（必填）\n📞 聯絡電話（必填）\n📍 公司地址（必填）\n🏢 統一編號（選填，個人工作室可跳過）\n✉️ 公司電子郵件（選填）');
        
        // 隱藏推薦按鈕，顯示表單收集介面
        this.classList.add('hidden');
        
        // 建立公司資訊收集表單
        const companyForm = document.createElement('div');
        companyForm.id = 'ai-company-form';
        companyForm.className = 'mt-6 space-y-4';
        companyForm.innerHTML = `
            <form id="ai-company-submit" method="POST" action="{{ route('auth.business-setup.store') }}" class="space-y-4">
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="hidden" name="business_type" value="${businessType}">
                <input type="hidden" name="ai_recommendation" value="true">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium nexus-text-primary">公司名稱 <span class="text-red-500">*</span></label>
                        <input type="text" name="company_name" id="ai_company_name" required
                               class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium nexus-text-primary">統一編號 <span class="text-gray-400">(選填)</span></label>
                        <input type="text" name="tax_number" id="ai_tax_number" pattern="[0-9]{8}"
                               class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md"
                               placeholder="8位數字，無統編可留空">
                    </div>

                    <div>
                        <label class="block text-sm font-medium nexus-text-primary">員工人數 <span class="text-red-500">*</span></label>
                        <select name="size" id="ai_size" required class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md">
                            <option value="">請選擇</option>
                            <option value="1-10">1-10 人</option>
                            <option value="11-50">11-50 人</option>
                            <option value="51-200">51-200 人</option>
                            <option value="201-500">201-500 人</option>
                            <option value="500+">500+ 人</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium nexus-text-primary">聯絡電話 <span class="text-red-500">*</span></label>
                        <input type="tel" name="company_phone" id="ai_company_phone" required
                               class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md"
                               placeholder="例如: 02-1234-5678">
                    </div>
                    
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium nexus-text-primary">公司地址 <span class="text-red-500">*</span></label>
                        <input type="text" name="company_address" id="ai_company_address" required
                               class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md"
                               placeholder="請輸入完整地址">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium nexus-text-primary">公司電子郵件</label>
                        <input type="email" name="company_email" id="ai_company_email"
                               class="mt-1 block w-full nexus-input nexus-border-secondary rounded-md"
                               placeholder="選填">
                    </div>
                </div>
                
                <input type="hidden" name="industry" value="${getIndustryFromBusinessType(businessType)}">
                
                <div class="flex justify-end pt-4">
                    <button type="submit" class="nexus-btn-primary">
                        完成設定
                    </button>
                </div>
            </form>
        `;
        
        // 將表單插入到對話容器之後
        document.getElementById('ai-chat-container').parentNode.insertBefore(companyForm, document.getElementById('ai-chat-container').nextSibling);
    });
    
    function getIndustryFromBusinessType(businessType) {
        const industryMap = {
            'restaurant': 'restaurant',
            'retail': 'retail',
            'manufacturing': 'manufacturing',
            'service': 'service',
            'agriculture': 'service',
            'other': 'other'
        };
        return industryMap[businessType] || 'other';
    }
});
</script>
@endsection