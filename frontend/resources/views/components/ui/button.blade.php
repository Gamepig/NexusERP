{{--
  NexusERP Button Component - 企業級按鈕組件系統
  
  使用範例：
  <x-ui.button>預設按鈕</x-ui.button>
  <x-ui.button variant="secondary" size="lg">大型次要按鈕</x-ui.button>
  <x-ui.button variant="primary" :loading="true">載入中</x-ui.button>
  <x-ui.button variant="outline" icon="plus" icon-position="left">新增項目</x-ui.button>
  <x-ui.button href="/dashboard" variant="ghost">前往儀表板</x-ui.button>
--}}

@props([
    'variant' => 'primary',        // primary, secondary, outline, ghost, danger
    'size' => 'md',               // xs, sm, md, lg, xl
    'disabled' => false,
    'loading' => false,
    'icon' => null,
    'iconPosition' => 'left',     // left, right
    'fullWidth' => false,
    'href' => null,
    'type' => 'button',
    'target' => null,
    'rel' => null,
    'tooltip' => null,
])

@php
    // 基礎樣式類別
    $baseClasses = 'nexus-btn-base inline-flex items-center justify-center font-nexus-medium leading-nexus-none border nexus-transition-fast focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    // 變體樣式對應
    $variantClasses = [
        'primary' => 'bg-nexus-primary-500 text-white hover:bg-nexus-primary-600 focus:ring-nexus-primary-500 border-transparent shadow-nexus-sm nexus-hover-lift',
        'secondary' => 'bg-nexus-surface-primary text-nexus-text-primary hover:bg-nexus-secondary border-nexus-primary focus:ring-nexus-primary-500 shadow-nexus-sm',
        'outline' => 'border-nexus-primary-500 text-nexus-primary-500 bg-transparent hover:bg-nexus-primary-50 hover:text-nexus-primary-600 focus:ring-nexus-primary-500',
        'ghost' => 'text-nexus-primary-500 bg-transparent border-transparent hover:bg-nexus-primary-50 hover:text-nexus-primary-600 focus:ring-nexus-primary-500',
        'danger' => 'bg-nexus-error-500 text-white hover:bg-nexus-error-600 focus:ring-nexus-error-500 border-transparent shadow-nexus-sm nexus-hover-lift',
    ];

    // 尺寸樣式對應
    $sizeClasses = [
        'xs' => 'px-nexus-2 py-nexus-1 text-nexus-xs rounded-nexus-sm min-h-[24px]',
        'sm' => 'px-nexus-3 py-nexus-1.5 text-nexus-sm rounded-nexus-md min-h-[32px]',
        'md' => 'px-nexus-4 py-nexus-2 text-nexus-base rounded-nexus-md min-h-[40px]',
        'lg' => 'px-nexus-6 py-nexus-3 text-nexus-lg rounded-nexus-lg min-h-[48px]',
        'xl' => 'px-nexus-8 py-nexus-4 text-nexus-xl rounded-nexus-lg min-h-[56px]',
    ];

    // 圖標尺寸對應
    $iconSizes = [
        'xs' => 'w-3 h-3',
        'sm' => 'w-4 h-4',
        'md' => 'w-4 h-4',
        'lg' => 'w-5 h-5',
        'xl' => 'w-6 h-6',
    ];

    // 組合所有樣式類別
    $classes = $baseClasses . ' ' . $variantClasses[$variant] . ' ' . $sizeClasses[$size];

    // 全寬度支援
    if ($fullWidth) {
        $classes .= ' w-full';
    }

    // 載入或禁用狀態
    if ($loading || $disabled) {
        $classes .= ' pointer-events-none';
    }

    // 載入狀態額外樣式
    if ($loading) {
        $classes .= ' relative overflow-hidden';
    }

    // 決定使用的 HTML 標籤
    $tag = $href ? 'a' : 'button';
    
    // 標籤屬性
    $tagAttributes = [];
    if ($href) {
        $tagAttributes['href'] = $href;
        if ($target) $tagAttributes['target'] = $target;
        if ($rel) $tagAttributes['rel'] = $rel;
    } else {
        $tagAttributes['type'] = $type;
        if ($disabled && !$href) $tagAttributes['disabled'] = true;
    }

    // Tooltip 支援
    if ($tooltip) {
        $tagAttributes['title'] = $tooltip;
        $tagAttributes['data-tooltip'] = $tooltip;
    }

    // 檢查是否有內容
    $hasSlotContent = trim($slot->toHtml()) !== '';
@endphp

{{-- 按鈕元素 --}}
<{{ $tag }} 
    {{ $attributes->merge($tagAttributes)->merge(['class' => $classes]) }}
    @if($loading) aria-busy="true" aria-live="polite" @endif
    @if($disabled) aria-disabled="true" @endif
>
    {{-- 載入狀態覆蓋層 --}}
    @if($loading)
        <span class="absolute inset-0 flex items-center justify-center bg-inherit">
            <svg class="animate-nexus-spin {{ $iconSizes[$size] }} text-current" 
                 xmlns="http://www.w3.org/2000/svg" 
                 fill="none" 
                 viewBox="0 0 24 24"
                 aria-hidden="true">
                <circle class="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        stroke-width="4">
                </circle>
                <path class="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
            </svg>
        </span>
        
        {{-- 載入時隱藏原內容 --}}
        <span class="opacity-0">
    @endif

    {{-- 左側圖標 --}}
    @if($icon && $iconPosition === 'left' && !$loading)
        @if(str_starts_with($icon, 'heroicon-'))
            <x-dynamic-component 
                :component="$icon" 
                class="{{ $iconSizes[$size] }} {{ $hasSlotContent ? 'mr-nexus-2' : '' }}" 
                aria-hidden="true"
            />
        @else
            <i class="{{ $icon }} {{ $iconSizes[$size] }} {{ $hasSlotContent ? 'mr-nexus-2' : '' }}" 
               aria-hidden="true"></i>
        @endif
    @endif
    
    {{-- 按鈕文字內容 --}}
    @if($hasSlotContent)
        <span class="nexus-transition-fast">
            {{ $slot }}
        </span>
    @endif
    
    {{-- 右側圖標 --}}
    @if($icon && $iconPosition === 'right' && !$loading)
        @if(str_starts_with($icon, 'heroicon-'))
            <x-dynamic-component 
                :component="$icon" 
                class="{{ $iconSizes[$size] }} {{ $hasSlotContent ? 'ml-nexus-2' : '' }}" 
                aria-hidden="true"
            />
        @else
            <i class="{{ $icon }} {{ $iconSizes[$size] }} {{ $hasSlotContent ? 'ml-nexus-2' : '' }}" 
               aria-hidden="true"></i>
        @endif
    @endif

    {{-- 載入狀態結束標籤 --}}
    @if($loading)
        </span>
    @endif
</{{ $tag }}>

{{-- 組件樣式增強 --}}
@once
@push('styles')
<style>
    /* 按鈕按壓效果增強 */
    .nexus-btn-base:active:not(:disabled):not([aria-disabled="true"]) {
        transform: scale(0.98);
    }
    
    /* 焦點環增強 */
    .nexus-btn-base:focus-visible {
        outline: 2px solid var(--nexus-focus-ring);
        outline-offset: 2px;
    }
    
    /* 載入狀態動畫 */
    .nexus-btn-base[aria-busy="true"] {
        position: relative;
    }
    
    /* 高對比度模式支援 */
    @media (prefers-contrast: high) {
        .nexus-btn-base {
            border-width: 2px;
        }
    }
    
    /* 減少動畫設定 */
    @media (prefers-reduced-motion: reduce) {
        .nexus-btn-base {
            transition: none;
        }
        
        .nexus-btn-base .animate-nexus-spin {
            animation: none;
        }
    }
    
    /* Tooltip 基礎樣式（如果需要） */
    .nexus-btn-base[data-tooltip]:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--nexus-gray-900);
        color: white;
        padding: var(--nexus-space-2) var(--nexus-space-3);
        border-radius: var(--nexus-radius-md);
        font-size: var(--nexus-text-sm);
        white-space: nowrap;
        z-index: var(--nexus-z-tooltip);
        margin-bottom: var(--nexus-space-2);
        pointer-events: none;
    }
    
    .nexus-btn-base[data-tooltip]:hover::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: var(--nexus-gray-900);
        z-index: var(--nexus-z-tooltip);
        pointer-events: none;
    }
</style>
@endpush
@endonce

{{-- JavaScript 增強功能 --}}
@once
@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // 為所有按鈕添加鍵盤支援
        document.querySelectorAll('.nexus-btn-base').forEach(button => {
            // Enter 和 Space 鍵支援（對於 a 標籤）
            if (button.tagName === 'A' && !button.hasAttribute('href')) {
                button.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        button.click();
                    }
                });
            }
            
            // 防止多重點擊
            let isSubmitting = false;
            button.addEventListener('click', function(e) {
                if (button.getAttribute('aria-busy') === 'true' || isSubmitting) {
                    e.preventDefault();
                    return false;
                }
                
                // 如果是表單提交按鈕，防止重複提交
                if (button.type === 'submit') {
                    isSubmitting = true;
                    setTimeout(() => {
                        isSubmitting = false;
                    }, 2000);
                }
            });
        });
        
        // 表單提交時自動設定載入狀態
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function() {
                const submitButton = form.querySelector('button[type="submit"].nexus-btn-base');
                if (submitButton && !submitButton.hasAttribute('data-no-loading')) {
                    submitButton.setAttribute('aria-busy', 'true');
                    submitButton.style.pointerEvents = 'none';
                }
            });
        });
    });
</script>
@endpush
@endonce