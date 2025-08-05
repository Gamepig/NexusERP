<!-- 公司資訊區域 - 三欄平衡設計 -->
<div class="mt-3">
    <div class="dashboard-info-grid-wrapper">
        <div class="dashboard-info-grid">
            <!-- 使用者身份卡片 -->
            <div class="user-identity-card">
                <div class="card-header">
                    <div class="header-section">
                        <svg class="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span class="header-title">使用者身份</span>
                    </div>
                </div>
                <div class="card-content">
                    <div class="user-profile-section">
                        <div class="user-avatar-display">
                            @if(auth()->user() && auth()->user()->avatar)
                                <img src="{{ auth()->user()->avatar }}" alt="使用者頭像" class="avatar-image">
                            @else
                                <div class="avatar-placeholder">
                                    <span class="avatar-initial">{{ auth()->user() ? substr(auth()->user()->name, 0, 1) : 'T' }}</span>
                                </div>
                            @endif
                            <div class="online-indicator"></div>
                        </div>
                        <div class="user-basic-info">
                            <div class="info-item-modern">
                                <span class="info-label">使用者名稱</span>
                                <span class="info-value">{{ auth()->user()->name ?? '未登入' }}</span>
                            </div>
                            <div class="info-item-modern">
                                <span class="info-label">登入時間</span>
                                <span class="info-value time-value">{{ auth()->user() ? auth()->user()->last_login_at?->format('H:i') ?? '首次' : '未知' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 公司資訊卡片 -->
            <div class="company-info-card">
                <div class="card-header">
                    <div class="header-section">
                        <svg class="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <span class="header-title">公司資訊</span>
                    </div>
                </div>
                <div class="card-content">
                    <div class="company-details">
                        <div class="info-item-modern company-main">
                            <span class="info-label">目前公司</span>
                            <span class="info-value company-name">{{ session('current_company_name', 'Test Company') }}</span>
                        </div>
                        
                        @if(auth()->user() && auth()->user()->business_type)
                            <div class="info-item-modern">
                                <span class="info-label">業務類型</span>
                                <span class="info-value business-badge">
                                    @switch(auth()->user()->business_type)
                                        @case('restaurant') 🍽️ 餐飲業 @break
                                        @case('retail') 🛍️ 零售業 @break
                                        @case('manufacturing') 🏭 製造業 @break
                                        @case('service') 💼 服務業 @break
                                        @case('agriculture') 🌾 農業 @break
                                        @default 🏢 其他業務
                                    @endswitch
                                </span>
                            </div>
                        @endif
                        
                        @if(auth()->user() && auth()->user()->role)
                            <div class="info-item-modern">
                                <span class="info-label">職務角色</span>
                                <span class="info-value role-badge">
                                    @switch(auth()->user()->role)
                                        @case('restaurant_owner') 👨‍🍳 餐廳負責人 @break
                                        @case('shop_owner') 🏪 店鋪負責人 @break
                                        @case('factory_owner') 🏭 工廠負責人 @break
                                        @case('service_provider') 🤝 服務提供者 @break
                                        @case('farmer') 👨‍🌾 農場經營者 @break
                                        @case('business_owner') 💼 企業負責人 @break
                                        @default 👤 {{ auth()->user()->role }}
                                    @endswitch
                                </span>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
            
            <!-- 業務統計卡片 -->
            <div class="business-stats-card">
                <div class="card-header">
                    <div class="header-section">
                        <svg class="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <span class="header-text">業務概況</span>
                    </div>
                </div>
                <div class="card-content">
                    <div class="stats-grid">
                        <div class="stat-item-modern">
                            <div class="stat-icon bg-green-500">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value text-green-400" id="company-active-orders">0</span>
                                <span class="stat-label">活躍訂單</span>
                            </div>
                        </div>
                        
                        <div class="stat-item-modern">
                            <div class="stat-icon bg-blue-500">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value text-blue-400" id="company-total-products">0</span>
                                <span class="stat-label">產品總數</span>
                            </div>
                        </div>
                        
                        <div class="stat-item-modern">
                            <div class="stat-icon bg-purple-500">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value text-purple-400" id="company-total-customers">0</span>
                                <span class="stat-label">客戶總數</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 系統狀態單獨放置在底部 -->
                    <div class="system-status">
                        <div class="status-indicator online"></div>
                        <span class="status-text online">系統正常運行</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>