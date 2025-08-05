{{--
  NexusERP 統計卡片組件 - P1.3 儀表板統計卡片
  
  使用範例：
  <x-dashboard.stat-card 
      title="總營收"
      :value="125000"
      :change="15.5"
      change-type="positive"
      icon="currency-dollar"
      prefix="$"
  />
--}}

@props([
    'title' => '',
    'value' => 0,
    'change' => 0,
    'changeType' => 'neutral',  // positive, negative, neutral
    'icon' => 'chart-bar',
    'iconColor' => 'var(--nexus-primary-500)',
    'loading' => false,
    'prefix' => '',
    'suffix' => '',
    'trend' => null,
    'description' => null,
    'statKey' => null
])

@php
    // 變化類型樣式對應
    $changeClasses = [
        'positive' => 'text-green-600 bg-green-100 border-green-200',
        'negative' => 'text-red-600 bg-red-100 border-red-200', 
        'neutral' => 'text-gray-600 bg-gray-100 border-gray-200'
    ];

    // 趨勢圖標對應
    $trendIcons = [
        'up' => 'M7 14l3-3 3 3m-6 0l3-3 3 3M12 3v1m0 4v1m0 4v1m0 4v1',
        'down' => 'M17 10l-3 3-3-3m6 0l-3 3-3-3M12 21v-1m0-4v-1m0-4v-1m0-4v-1',
        'stable' => 'M5 12h14'
    ];

    // 統計卡片樣式
    $cardClasses = 'nexus-card relative overflow-hidden transition-all duration-300 hover:shadow-lg group';
    if ($loading) {
        $cardClasses .= ' animate-pulse';
    }
@endphp

<div class="{{ $cardClasses }}" 
     @if($statKey) data-stat="{{ $statKey }}" @endif
     x-data="{ 
         loading: {{ $loading ? 'true' : 'false' }}, 
         updated: false,
         refresh() {
             this.loading = true;
             $dispatch('refresh-stat', '{{ $statKey }}');
         },
         markUpdated() {
             this.updated = true;
             setTimeout(() => { this.updated = false; }, 2000);
         }
     }"
     x-on:stat-updated.window="if ($event.detail.key === '{{ $statKey }}') markUpdated()"
     :class="{ 'stat-updated': updated }">
     
    {{-- 更新動畫覆蓋層 --}}
    <div x-show="updated" 
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="opacity-0"
         x-transition:enter-end="opacity-100"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="opacity-100"
         x-transition:leave-end="opacity-0"
         class="absolute inset-0 bg-gradient-to-r from-nexus-primary-50 to-nexus-primary-100 pointer-events-none z-10"
         style="background: linear-gradient(45deg, rgba(var(--nexus-primary-rgb), 0.1), rgba(var(--nexus-primary-rgb), 0.05));">
    </div>

    <div class="p-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1">
                {{-- 圖標區域 --}}
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center relative group-hover:scale-110 transition-transform duration-200" 
                         style="background-color: rgba(var(--nexus-primary-rgb), 0.1);">
                        @if($loading)
                            <div class="animate-spin">
                                <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                                </svg>
                            </div>
                        @else
                            <x-dynamic-component 
                                :component="'heroicon-o-' . $icon" 
                                class="w-6 h-6" 
                                style="color: {{ $iconColor }};" 
                            />
                        @endif
                    </div>
                </div>
                
                {{-- 內容區域 --}}
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium nexus-text-secondary truncate">{{ $title }}</p>
                    
                    @if($loading)
                        <div class="animate-pulse mt-1">
                            <div class="h-8 bg-gray-300 rounded w-24"></div>
                        </div>
                    @else
                        <div class="flex items-baseline space-x-2 mt-1">
                            <p class="text-2xl font-bold nexus-text-primary stat-value">
                                {{ $prefix }}{{ is_numeric($value) ? number_format($value) : $value }}{{ $suffix }}
                            </p>
                            
                            @if($change != 0)
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium stat-change {{ $changeClasses[$changeType] }} border">
                                    @if($trend && isset($trendIcons[$trend]))
                                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{{ $trendIcons[$trend] }}" />
                                        </svg>
                                    @endif
                                    {{ $change > 0 ? '+' : '' }}{{ number_format($change, 1) }}%
                                </span>
                            @endif
                        </div>
                    @endif
                    
                    @if($description && !$loading)
                        <p class="text-xs nexus-text-muted mt-1 stat-description">{{ $description }}</p>
                    @endif
                </div>
            </div>
            
            {{-- 操作按鈕 --}}
            @if(!$loading)
                <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button @click="refresh()" 
                            :disabled="loading"
                            class="p-2 rounded-lg nexus-text-muted hover:nexus-text-primary hover:bg-nexus-secondary transition-all duration-200 disabled:opacity-50"
                            title="重新整理統計數據">
                        <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            @endif
        </div>
    </div>
    
    {{-- 底部指示器 --}}
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60" 
         style="background: linear-gradient(90deg, {{ $iconColor }}, rgba(var(--nexus-primary-rgb), 0.5));">
    </div>
</div>

{{-- 統計卡片增強樣式 --}}
@once
@push('styles')
<style>
    /* 統計卡片更新動畫 */
    .stat-updated {
        transform: scale(1.02);
        box-shadow: 0 10px 25px rgba(var(--nexus-primary-rgb), 0.15) !important;
    }
    
    /* 載入狀態優化 */
    .stat-card-loading {
        pointer-events: none;
        opacity: 0.7;
    }
    
    /* 數值變化動畫 */
    .stat-value {
        transition: all 0.3s ease;
    }
    
    /* 變化指示器動畫 */
    .stat-change {
        animation: statChangePulse 2s ease-in-out infinite;
    }
    
    @keyframes statChangePulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
    }
    
    /* 深色主題適配 */
    .dark .stat-change.text-green-600 {
        @apply text-green-400 bg-green-900 border-green-700;
    }
    
    .dark .stat-change.text-red-600 {
        @apply text-red-400 bg-red-900 border-red-700;
    }
    
    .dark .stat-change.text-gray-600 {
        @apply text-gray-400 bg-gray-800 border-gray-600;
    }
    
    /* 響應式設計增強 */
    @media (max-width: 640px) {
        .nexus-card .p-6 {
            @apply p-4;
        }
        
        .nexus-card .text-2xl {
            @apply text-xl;
        }
        
        .nexus-card .w-12.h-12 {
            @apply w-10 h-10;
        }
        
        .nexus-card .w-6.h-6 {
            @apply w-5 h-5;
        }
    }
    
    /* 高對比度模式支援 */
    @media (prefers-contrast: high) {
        .nexus-card {
            border-width: 2px;
        }
        
        .stat-change {
            border-width: 2px;
            font-weight: 600;
        }
    }
    
    /* 減少動畫設定 */
    @media (prefers-reduced-motion: reduce) {
        .nexus-card,
        .stat-value,
        .stat-change,
        .group-hover\:scale-110 {
            transition: none !important;
            animation: none !important;
        }
        
        .animate-pulse,
        .animate-spin {
            animation: none !important;
        }
    }
</style>
@endpush
@endonce

{{-- 統計卡片 JavaScript 增強 --}}
@once
@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 統計卡片實時更新處理
    window.addEventListener('stat-updated', function(event) {
        const { key, value, change, trend } = event.detail;
        const cardElement = document.querySelector(`[data-stat="${key}"]`);
        
        if (cardElement) {
            updateStatCard(cardElement, { value, change, trend });
        }
    });
    
    // 更新統計卡片數據
    function updateStatCard(element, data) {
        // 更新數值
        const valueElement = element.querySelector('.stat-value');
        if (valueElement && data.value !== undefined) {
            // 添加數值變化動畫
            valueElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                valueElement.style.transform = 'scale(1)';
            }, 200);
            
            // 更新數值內容（保留前綴和後綴）
            const prefix = valueElement.textContent.match(/^[^0-9]*/)[0] || '';
            const suffix = valueElement.textContent.match(/[^0-9]*$/)[0] || '';
            valueElement.textContent = prefix + formatNumber(data.value) + suffix;
        }
        
        // 更新變化百分比
        const changeElement = element.querySelector('.stat-change');
        if (changeElement && data.change !== undefined) {
            const changeText = (data.change > 0 ? '+' : '') + data.change.toFixed(1) + '%';
            changeElement.textContent = changeText;
            
            // 更新變化類型樣式
            const changeType = data.change > 0 ? 'positive' : (data.change < 0 ? 'negative' : 'neutral');
            changeElement.className = changeElement.className.replace(/(text-\w+-\d+|bg-\w+-\d+|border-\w+-\d+)/g, '');
            
            const changeClasses = {
                'positive': 'text-green-600 bg-green-100 border-green-200',
                'negative': 'text-red-600 bg-red-100 border-red-200',
                'neutral': 'text-gray-600 bg-gray-100 border-gray-200'
            };
            
            changeElement.classList.add(...changeClasses[changeType].split(' '));
        }
        
        // 觸發更新動畫
        element.dispatchEvent(new CustomEvent('stat-updated', {
            detail: { key: element.dataset.stat }
        }));
    }
    
    // 數值格式化工具
    function formatNumber(num) {
        if (typeof num !== 'number') return num;
        
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }
    
    // 統計卡片錯誤處理
    document.addEventListener('stat-error', function(event) {
        const { key, error } = event.detail;
        const cardElement = document.querySelector(`[data-stat="${key}"]`);
        
        if (cardElement) {
            // 顯示錯誤狀態
            cardElement.classList.add('stat-error');
            
            // 3秒後移除錯誤狀態
            setTimeout(() => {
                cardElement.classList.remove('stat-error');
            }, 3000);
        }
    });
});
</script>
@endpush
@endonce