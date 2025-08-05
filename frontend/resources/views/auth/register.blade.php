@extends('layouts.guest')

@section('content')
    <!-- AI 引導式註冊介面 -->
    <div id="ai-guided-registration" class="space-y-6">
        <!-- 步驟指示器 -->
        <div class="flex items-center justify-center mb-6">
            <div class="flex items-center space-x-4">
                <div id="step1-indicator" class="flex items-center">
                    <div class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                    <span class="ml-2 text-sm font-medium nexus-text-primary">基本資料</span>
                </div>
                <div class="w-8 h-0.5 nexus-border-secondary"></div>
                <div id="step2-indicator" class="flex items-center">
                    <div class="w-8 h-8 nexus-bg-secondary nexus-text-secondary rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                    <span class="ml-2 text-sm font-medium nexus-text-secondary">AI 引導</span>
                </div>
                <div class="w-8 h-0.5 nexus-border-secondary"></div>
                <div id="step3-indicator" class="flex items-center">
                    <div class="w-8 h-8 nexus-bg-secondary nexus-text-secondary rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                    <span class="ml-2 text-sm font-medium nexus-text-secondary">確認完成</span>
                </div>
            </div>
        </div>

        <!-- 步驟 1: 基本資料 -->
        <div id="step1" class="space-y-4">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold nexus-text-primary">歡迎註冊 NexusERP</h2>
                <p class="nexus-text-secondary mt-2">我們將透過 AI 助手協助您快速設定業務資料</p>
            </div>

            <!-- 第三方登入選項 -->
            <div class="space-y-3 mb-6">
                <a href="{{ route('auth.google') }}" class="w-full flex items-center justify-center px-4 py-2 nexus-border-secondary rounded-md shadow-sm text-sm font-medium nexus-text-primary nexus-card hover:nexus-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                    <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    使用 Google 帳號註冊
                </a>

                <a href="{{ route('auth.line') }}" class="w-full flex items-center justify-center px-4 py-2 nexus-border-secondary rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors">
                    <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                    使用 LINE 帳號註冊
                </a>
                
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t nexus-border-secondary"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 nexus-card nexus-text-secondary">或使用電子郵件註冊</span>
                    </div>
                </div>
            </div>

            <!-- 傳統註冊表單 -->
            <form id="basic-form" method="POST" action="{{ route('register') }}" class="space-y-4">
                @csrf
                
                <!-- Name -->
                <div>
                    <x-input-label for="name" :value="__('姓名')" />
                    <x-text-input id="name" class="block mt-1 w-full" type="text" name="name" :value="old('name')" required autofocus autocomplete="name" />
                    <x-input-error :messages="$errors->get('name')" class="mt-2" />
                </div>

                <!-- Email Address -->
                <div>
                    <x-input-label for="email" :value="__('電子郵件')" />
                    <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autocomplete="username" />
                    <x-input-error :messages="$errors->get('email')" class="mt-2" />
                </div>

                <!-- Password -->
                <div>
                    <x-input-label for="password" :value="__('密碼')" />
                    <x-text-input id="password" class="block mt-1 w-full" type="password" name="password" required autocomplete="new-password" />
                    <x-input-error :messages="$errors->get('password')" class="mt-2" />
                </div>

                <!-- Confirm Password -->
                <div>
                    <x-input-label for="password_confirmation" :value="__('確認密碼')" />
                    <x-text-input id="password_confirmation" class="block mt-1 w-full" type="password" name="password_confirmation" required autocomplete="new-password" />
                    <x-input-error :messages="$errors->get('password_confirmation')" class="mt-2" />
                </div>

                <div class="flex items-center justify-between mt-6">
                    <a class="underline text-sm nexus-text-secondary hover:nexus-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" href="{{ route('login') }}">
                        {{ __('已經有帳號了？') }}
                    </a>

                    <button type="button" id="next-to-ai" class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
                        下一步：AI 引導設定 
                        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>
            </form>
        </div>

        <!-- 步驟 2: AI 引導式設定 -->
        <div id="step2" class="hidden space-y-4">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold nexus-text-primary">AI 助手引導設定</h2>
                <p class="nexus-text-secondary mt-2">請用自然語言描述您的業務，我們會自動為您分類</p>
            </div>

            <div class="nexus-card rounded-lg p-4 mb-6">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h4 class="text-sm font-medium nexus-text-accent">AI 助手建議</h4>
                        <p class="text-sm nexus-text-secondary mt-1">例如：「我有一間養雞場，也在菜市場賣雞肉」或「我們是電子商務公司，主要賣3C產品」</p>
                    </div>
                </div>
            </div>

            <!-- AI 對話介面 -->
            <div class="nexus-border-primary rounded-lg">
                <div class="nexus-bg-secondary px-4 py-3 nexus-border-primary">
                    <h3 class="text-sm font-medium nexus-text-primary">與 AI 助手對話</h3>
                </div>
                <div id="ai-chat-messages" class="p-4 h-64 overflow-y-auto space-y-3">
                    <div class="flex items-start mb-3">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="ml-3 flex-1">
                            <div class="bg-white dark:bg-gray-700 rounded-lg px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600">
                                <p class="text-sm text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">您好！我是 NexusERP 的 AI 助手。請用自然語言告訴我您的業務內容，我會協助您完成設定。</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="nexus-border-primary p-4">
                    <div class="flex space-x-3">
                        <input type="text" id="ai-input" class="flex-1 nexus-input nexus-border-secondary rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="描述您的業務內容...">
                        <button type="button" id="send-to-ai" class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
                            發送
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex justify-between mt-6">
                <button type="button" id="back-to-basic" class="inline-flex items-center px-4 py-2 bg-gray-300 border border-transparent rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-400 focus:bg-gray-400 active:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    上一步
                </button>

                <button type="button" id="complete-registration" class="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 hidden">
                    完成註冊
                </button>
            </div>
        </div>

        <!-- 步驟 3: 確認完成 -->
        <div id="step3" class="hidden space-y-4">
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold nexus-text-primary">註冊完成！</h2>
                <p class="nexus-text-secondary mt-2">歡迎使用 NexusERP，系統已為您準備好了</p>
            </div>
        </div>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // 步驟管理
        let currentStep = 1;
        const steps = {
            1: document.getElementById('step1'),
            2: document.getElementById('step2'),
            3: document.getElementById('step3')
        };

        // AI 對話資料
        let aiConversation = [];
        let registrationData = {};

        // 步驟切換函式
        function showStep(stepNumber) {
            // 隱藏所有步驟
            Object.values(steps).forEach(step => step.classList.add('hidden'));
            
            // 顯示目標步驟
            steps[stepNumber].classList.remove('hidden');
            
            // 更新指示器
            updateStepIndicators(stepNumber);
            
            currentStep = stepNumber;
        }

        function updateStepIndicators(activeStep) {
            for (let i = 1; i <= 3; i++) {
                const indicator = document.getElementById(`step${i}-indicator`);
                const circle = indicator.querySelector('.w-8.h-8');
                const text = indicator.querySelector('span');
                
                if (i <= activeStep) {
                    circle.classList.remove('bg-gray-300', 'text-gray-600');
                    circle.classList.add('bg-indigo-600', 'text-white');
                    text.classList.remove('text-gray-500');
                    text.classList.add('text-gray-900');
                } else {
                    circle.classList.remove('bg-indigo-600', 'text-white');
                    circle.classList.add('bg-gray-300', 'text-gray-600');
                    text.classList.remove('text-gray-900');
                    text.classList.add('text-gray-500');
                }
            }
        }

        // 事件監聽器
        document.getElementById('next-to-ai').addEventListener('click', function(e) {
            e.preventDefault();
            
            // 驗證基本表單
            const form = document.getElementById('basic-form');
            const formData = new FormData(form);
            
            // 儲存基本資料
            registrationData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                password_confirmation: formData.get('password_confirmation')
            };
            
            // 簡單驗證
            if (!registrationData.name || !registrationData.email || !registrationData.password) {
                alert('請填寫所有必要欄位');
                return;
            }
            
            if (registrationData.password !== registrationData.password_confirmation) {
                alert('密碼確認不符');
                return;
            }
            
            showStep(2);
        });

        document.getElementById('back-to-basic').addEventListener('click', function() {
            showStep(1);
        });

        // AI 對話功能
        document.getElementById('send-to-ai').addEventListener('click', sendToAI);
        document.getElementById('ai-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendToAI();
            }
        });

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
                // 呼叫真實的 AI API
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        message: message,
                        conversation_history: aiConversation.slice(-5).map(conv => ({ 
                            user: conv.sender === 'user' ? conv.message : '',
                            ai: conv.sender === 'ai' ? conv.message : ''
                        })).filter(conv => conv.user || conv.ai)
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.success && data.data.response) {
                        // 使用真實 AI 回應
                        const aiResponse = data.data.response;
                        addMessageToChat('ai', aiResponse);
                        
                        // 如果對話進行了足夠長時間，顯示完成按鈕
                        if (aiConversation.filter(conv => conv.sender === 'user').length >= 2) {
                            document.getElementById('complete-registration').classList.remove('hidden');
                        }
                    } else {
                        // AI API 回應異常，使用備用邏輯
                        const fallbackResponse = generateAIResponse(message);
                        addMessageToChat('ai', fallbackResponse + '（備用回應）');
                    }
                } else {
                    throw new Error('API 請求失敗');
                }
                
            } catch (error) {
                console.error('AI API 錯誤:', error);
                
                // API 失敗時使用備用回應
                const fallbackResponse = generateAIResponse(message);
                addMessageToChat('ai', fallbackResponse + '（AI 服務暫時不可用，使用備用回應）');
                
                // 即使在備用模式下，也允許用戶繼續
                if (aiConversation.filter(conv => conv.sender === 'user').length >= 2) {
                    document.getElementById('complete-registration').classList.remove('hidden');
                }
            } finally {
                // 重新啟用輸入和按鈕
                input.disabled = false;
                sendButton.disabled = false;
                sendButton.innerHTML = '發送';
            }
        }

        function addMessageToChat(sender, message) {
            const chatMessages = document.getElementById('ai-chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'flex items-start mb-3';
            
            if (sender === 'user') {
                messageDiv.innerHTML = `
                    <div class="flex-1"></div>
                    <div class="flex-1 ml-3">
                        <div class="bg-indigo-600 rounded-lg px-3 py-2 shadow-sm ml-auto max-w-fit">
                            <p class="text-sm text-white break-words whitespace-pre-wrap">${message}</p>
                        </div>
                    </div>
                    <div class="flex-shrink-0 ml-2">
                        <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                        </div>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-3 flex-1">
                        <div class="bg-white dark:bg-gray-700 rounded-lg px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-600">
                            <p class="text-sm text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">${message}</p>
                        </div>
                    </div>
                `;
            }
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            aiConversation.push({ sender, message });
        }

        function generateAIResponse(userMessage) {
            // 模擬 AI 回應邏輯（實際應該呼叫後端 API）
            if (userMessage.includes('養雞') || userMessage.includes('畜牧')) {
                return '養殖業，是否同時零售？';
            } else if (userMessage.includes('電商') || userMessage.includes('網路') || userMessage.includes('線上')) {
                return '電商業，主要產品和規模？';
            } else if (aiConversation.length === 1) {
                return '建議分類：農業-養殖、零售業。公司名稱和員工人數？';
            } else {
                return '資訊足夠，請點選「完成註冊」。';
            }
        }

        // 完成註冊
        document.getElementById('complete-registration').addEventListener('click', async function() {
            const button = this;
            button.disabled = true;
            button.innerHTML = '正在處理...';
            
            try {
                // 收集用戶的業務描述
                const businessDescription = aiConversation
                    .filter(conv => conv.sender === 'user')
                    .map(conv => conv.message)
                    .join(' ');

                // 先進行 AI 業務分析
                let aiAnalysis = null;
                try {
                    const analysisResponse = await fetch('/api/ai/analyze-business', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        },
                        body: JSON.stringify({
                            business_description: businessDescription
                        })
                    });

                    if (analysisResponse.ok) {
                        const analysisData = await analysisResponse.json();
                        if (analysisData.success) {
                            aiAnalysis = analysisData.data;
                        }
                    }
                } catch (error) {
                    console.log('AI 分析失敗，將繼續註冊流程:', error);
                }

                // 準備完整的註冊資料
                const completeData = {
                    ...registrationData,
                    business_description: businessDescription,
                    ai_analysis: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
                    conversation_history: JSON.stringify(aiConversation)
                };

                // 提交註冊資料
                const response = await fetch('{{ route("register") }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify(completeData)
                });

                if (response.ok) {
                    showStep(3);
                    
                    // 顯示 AI 分析結果（如果有的話）
                    if (aiAnalysis && aiAnalysis.business_analysis) {
                        const summaryElement = document.querySelector('#step3 p');
                        summaryElement.innerHTML += '<br><br><strong>AI 分析結果：</strong><br>' + 
                            (aiAnalysis.business_analysis.summary || '已完成業務分析設定');
                    }
                    
                    // 3 秒後導向 dashboard
                    setTimeout(() => {
                        window.location.href = '{{ route("dashboard") }}';
                    }, 3000);
                } else {
                    const errorData = await response.json();
                    console.error('註冊失敗:', errorData);
                    
                    // 處理驗證錯誤
                    if (errorData.errors) {
                        let errorMessages = [];
                        for (const [field, messages] of Object.entries(errorData.errors)) {
                            errorMessages.push(...messages);
                        }
                        alert('註冊失敗：\n' + errorMessages.join('\n'));
                    } else {
                        alert('註冊失敗：' + (errorData.message || '請稍後再試'));
                    }
                }
                
            } catch (error) {
                console.error('註冊錯誤:', error);
                alert('註冊失敗，請稍後再試');
            } finally {
                button.disabled = false;
                button.innerHTML = '完成註冊';
            }
        });

        // 初始化
        updateStepIndicators(1);
    });
    </script>
@endsection
