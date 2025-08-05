{{--
  NexusERP Select Component - 企業級選擇組件系統
  
  使用範例：
  <x-ui.select name="category" label="產品類別" :options="$categories" placeholder="請選擇類別" />
  <x-ui.select name="tags" label="標籤" :options="$tags" :multiple="true" searchable />
  <x-ui.select name="supplier" label="供應商" :options="$suppliers" searchable :value="$selectedSupplier" />
--}}

@props([
    'label' => null,
    'name' => '',
    'id' => null,
    'options' => [],
    'value' => null,
    'selected' => null,
    'placeholder' => '請選擇...',
    'multiple' => false,
    'searchable' => false,
    'required' => false,
    'disabled' => false,
    'error' => null,
    'help' => null,
    'success' => null,
    'size' => 'md',              // sm, md, lg
    'maxHeight' => '240px',      // 下拉清單最大高度
    'allowClear' => false,       // 允許清除選擇
    'loading' => false,          // 載入狀態
    'loadingText' => '載入中...',
    'noOptionsText' => '沒有可選項目',
    'noResultsText' => '沒有找到相符的項目',
    'clearText' => '清除選擇',
    'selectAllText' => '全選',
    'deselectAllText' => '取消全選',
])

@php
    // 生成唯一 ID
    $selectId = $id ?: ($name ? $name . '_' . uniqid() : 'select_' . uniqid());
    
    // 處理選項格式
    $processedOptions = [];
    foreach ($options as $key => $option) {
        if (is_array($option)) {
            $processedOptions[] = [
                'value' => $option['value'] ?? $key,
                'label' => $option['label'] ?? $option['text'] ?? $key,
                'disabled' => $option['disabled'] ?? false,
                'group' => $option['group'] ?? null,
            ];
        } else {
            $processedOptions[] = [
                'value' => $key,
                'label' => $option,
                'disabled' => false,
                'group' => null,
            ];
        }
    }
    
    // 處理選中值
    $selectedValue = $selected ?? $value ?? old($name);
    if ($multiple && !is_array($selectedValue)) {
        $selectedValue = $selectedValue ? [$selectedValue] : [];
    }
    
    // 尺寸樣式對應
    $sizeClasses = [
        'sm' => 'px-nexus-3 py-nexus-1.5 text-nexus-sm min-h-[32px]',
        'md' => 'px-nexus-4 py-nexus-2 text-nexus-base min-h-[40px]',
        'lg' => 'px-nexus-4 py-nexus-3 text-nexus-lg min-h-[48px]',
    ];
    
    // 基礎樣式
    $baseClasses = 'nexus-select relative block w-full rounded-nexus-md border bg-nexus-surface-primary text-nexus-text-primary nexus-transition-fast focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-nexus-secondary disabled:text-nexus-text-disabled disabled:cursor-not-allowed cursor-pointer';
    
    // 狀態樣式
    if ($error) {
        $stateClasses = 'border-nexus-error-500 focus:border-nexus-error-500 focus:ring-nexus-error-500';
    } elseif ($success) {
        $stateClasses = 'border-nexus-success-500 focus:border-nexus-success-500 focus:ring-nexus-success-500';
    } else {
        $stateClasses = 'border-nexus-primary focus:border-nexus-primary-500 focus:ring-nexus-primary-500';
    }
    
    // 組合樣式類別
    $triggerClasses = $baseClasses . ' ' . $sizeClasses[$size] . ' ' . $stateClasses;
    
    // Alpine.js 數據
    $alpineData = [
        'isOpen' => false,
        'searchTerm' => '',
        'selectedValue' => $selectedValue,
        'selectedLabels' => [],
        'options' => $processedOptions,
        'loading' => $loading,
        'placeholder' => $placeholder,
        'multiple' => $multiple,
        'searchable' => $searchable,
        'allowClear' => $allowClear,
        'maxHeight' => $maxHeight,
        'noOptionsText' => $noOptionsText,
        'noResultsText' => $noResultsText,
        'clearText' => $clearText,
        'selectAllText' => $selectAllText,
        'deselectAllText' => $deselectAllText,
    ];
@endphp

<div class="w-full">
    {{-- 標籤 --}}
    @if($label)
        <label for="{{ $selectId }}" 
               class="block text-nexus-sm font-nexus-medium text-nexus-text-primary mb-nexus-1">
            {{ $label }}
            @if($required)
                <span class="text-nexus-error-500 ml-nexus-1" aria-label="必填">*</span>
            @endif
        </label>
    @endif
    
    {{-- 選擇器組件 --}}
    <div x-data="nexusSelect(@js($alpineData))" 
         x-init="init()"
         class="relative">
        
        {{-- 觸發器 --}}
        <button type="button"
                id="{{ $selectId }}"
                @click="toggleDropdown()"
                @keydown.escape="closeDropdown()"
                @keydown.arrow-down.prevent="openDropdown(); $nextTick(() => focusFirstOption())"
                @keydown.arrow-up.prevent="openDropdown(); $nextTick(() => focusLastOption())"
                :disabled="$wire?.loading || loading"
                class="{{ $triggerClasses }}"
                :class="{ 'pr-nexus-20': allowClear && hasSelection(), 'pr-nexus-10': !allowClear || !hasSelection() }"
                :aria-expanded="isOpen"
                :aria-invalid="@js(!!$error)"
                aria-haspopup="listbox">
            
            {{-- 顯示內容 --}}
            <span class="flex items-center justify-between w-full">
                <span class="flex-1 text-left truncate">
                    <template x-if="loading">
                        <span class="text-nexus-text-tertiary">{{ $loadingText }}</span>
                    </template>
                    
                    <template x-if="!loading && !hasSelection()">
                        <span class="text-nexus-text-quaternary">{{ $placeholder }}</span>
                    </template>
                    
                    <template x-if="!loading && hasSelection() && !multiple">
                        <span x-text="getSelectedLabel()"></span>
                    </template>
                    
                    <template x-if="!loading && hasSelection() && multiple">
                        <div class="flex flex-wrap gap-nexus-1">
                            <template x-for="label in getSelectedLabels().slice(0, 3)" :key="label">
                                <span class="inline-flex items-center px-nexus-2 py-nexus-0.5 rounded-nexus-sm bg-nexus-primary-100 text-nexus-primary-700 text-nexus-xs font-nexus-medium">
                                    <span x-text="label"></span>
                                </span>
                            </template>
                            <template x-if="getSelectedLabels().length > 3">
                                <span class="text-nexus-text-tertiary text-nexus-sm" 
                                      x-text="'和其他 ' + (getSelectedLabels().length - 3) + ' 項'"></span>
                            </template>
                        </div>
                    </template>
                </span>
                
                {{-- 操作按鈕區域 --}}
                <div class="flex items-center space-x-nexus-1">
                    {{-- 清除按鈕 --}}
                    <template x-if="allowClear && hasSelection() && !loading">
                        <button type="button"
                                @click.stop="clearSelection()"
                                class="flex items-center justify-center w-4 h-4 text-nexus-text-tertiary hover:text-nexus-text-secondary nexus-transition-fast"
                                :title="clearText">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </template>
                    
                    {{-- 下拉箭頭 --}}
                    <div class="flex items-center">
                        <template x-if="loading">
                            <svg class="w-4 h-4 text-nexus-text-tertiary animate-nexus-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </template>
                        
                        <template x-if="!loading">
                            <svg class="w-5 h-5 text-nexus-text-tertiary transition-transform duration-200"
                                 :class="{ 'rotate-180': isOpen }"
                                 fill="none" 
                                 stroke="currentColor" 
                                 viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </template>
                    </div>
                </div>
            </span>
        </button>
        
        {{-- 下拉清單 --}}
        <div x-show="isOpen"
             x-transition:enter="nexus-transition-fast ease-out"
             x-transition:enter-start="opacity-0 scale-95"
             x-transition:enter-end="opacity-100 scale-100"
             x-transition:leave="nexus-transition-fast ease-in"
             x-transition:leave-start="opacity-100 scale-100"
             x-transition:leave-end="opacity-0 scale-95"
             @click.outside="closeDropdown()"
             class="absolute z-nexus-dropdown mt-nexus-1 w-full bg-nexus-surface-primary border border-nexus-primary rounded-nexus-md shadow-nexus-lg"
             :style="{ maxHeight: maxHeight }"
             style="display: none;">
            
            {{-- 搜尋框 --}}
            <template x-if="searchable">
                <div class="p-nexus-3 border-b border-nexus-primary">
                    <input type="text"
                           x-model="searchTerm"
                           @keydown.escape="closeDropdown()"
                           @keydown.arrow-down.prevent="focusFirstOption()"
                           @keydown.arrow-up.prevent="focusLastOption()"
                           placeholder="搜尋..."
                           class="w-full px-nexus-3 py-nexus-2 text-nexus-sm border border-nexus-secondary rounded-nexus-sm focus:outline-none focus:ring-1 focus:ring-nexus-primary-500 focus:border-nexus-primary-500">
                </div>
            </template>
            
            {{-- 多選操作按鈕 --}}
            <template x-if="multiple && filteredOptions().length > 0">
                <div class="flex items-center justify-between p-nexus-2 border-b border-nexus-primary">
                    <button type="button"
                            @click="selectAll()"
                            class="text-nexus-sm text-nexus-primary-600 hover:text-nexus-primary-700 font-nexus-medium"
                            x-text="selectAllText">
                    </button>
                    <button type="button"
                            @click="deselectAll()"
                            class="text-nexus-sm text-nexus-text-tertiary hover:text-nexus-text-secondary font-nexus-medium"
                            x-text="deselectAllText">
                    </button>
                </div>
            </template>
            
            {{-- 選項清單 --}}
            <div class="overflow-y-auto" 
                 :style="{ maxHeight: 'calc(' + maxHeight + ' - 100px)' }">
                
                <template x-if="filteredOptions().length === 0 && !loading">
                    <div class="px-nexus-4 py-nexus-8 text-center text-nexus-text-tertiary">
                        <svg class="mx-auto h-12 w-12 text-nexus-text-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12M6 20.291A7.962 7.962 0 016 12m6-8a8 8 0 11-8 8 8 8 0 018-8z" />
                        </svg>
                        <p class="mt-nexus-2 text-nexus-sm" x-text="searchTerm ? noResultsText : noOptionsText"></p>
                    </div>
                </template>
                
                <template x-for="(option, index) in filteredOptions()" :key="option.value">
                    <div @click="selectOption(option)"
                         @keydown.enter.prevent="selectOption(option)"
                         @keydown.space.prevent="selectOption(option)"
                         @keydown.arrow-down.prevent="focusNext()"
                         @keydown.arrow-up.prevent="focusPrevious()"
                         @keydown.escape="closeDropdown()"
                         :tabindex="option.disabled ? -1 : 0"
                         class="relative px-nexus-4 py-nexus-3 cursor-pointer select-none focus:outline-none"
                         :class="{
                             'bg-nexus-primary-50 text-nexus-primary-700': isSelected(option.value),
                             'text-nexus-text-primary hover:bg-nexus-secondary': !isSelected(option.value) && !option.disabled,
                             'text-nexus-text-disabled cursor-not-allowed': option.disabled
                         }">
                        
                        <div class="flex items-center justify-between">
                            <span class="flex-1 truncate" x-text="option.label"></span>
                            
                            {{-- 選中狀態指示器 --}}
                            <template x-if="isSelected(option.value)">
                                <svg class="h-5 w-5 text-nexus-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                            </template>
                            
                            {{-- 多選複選框 --}}
                            <template x-if="multiple">
                                <div class="flex items-center">
                                    <input type="checkbox"
                                           :checked="isSelected(option.value)"
                                           @click.stop
                                           class="h-4 w-4 text-nexus-primary-600 focus:ring-nexus-primary-500 border-nexus-secondary rounded">
                                </div>
                            </template>
                        </div>
                    </div>
                </template>
            </div>
        </div>
        
        {{-- 隱藏的表單輸入 --}}
        <template x-if="multiple">
            <template x-for="value in selectedValue" :key="value">
                <input type="hidden" :name="'{{ $name }}[]'" :value="value">
            </template>
        </template>
        
        <template x-if="!multiple">
            <input type="hidden" name="{{ $name }}" :value="selectedValue">
        </template>
    </div>
    
    {{-- 錯誤訊息 --}}
    @if($error)
        <p class="mt-nexus-1 text-nexus-sm text-nexus-error-600" role="alert">
            {{ $error }}
        </p>
    @endif
    
    {{-- 成功訊息 --}}
    @if($success)
        <p class="mt-nexus-1 text-nexus-sm text-nexus-success-600">
            {{ $success }}
        </p>
    @endif
    
    {{-- 幫助文字 --}}
    @if($help && !$error)
        <p class="mt-nexus-1 text-nexus-sm text-nexus-text-tertiary">
            {{ $help }}
        </p>
    @endif
</div>

{{-- Alpine.js 組件邏輯 --}}
@once
@push('scripts')
<script>
    function nexusSelect(config) {
        return {
            isOpen: config.isOpen,
            searchTerm: config.searchTerm,
            selectedValue: config.selectedValue,
            selectedLabels: config.selectedLabels,
            options: config.options,
            loading: config.loading,
            placeholder: config.placeholder,
            multiple: config.multiple,
            searchable: config.searchable,
            allowClear: config.allowClear,
            maxHeight: config.maxHeight,
            noOptionsText: config.noOptionsText,
            noResultsText: config.noResultsText,
            clearText: config.clearText,
            selectAllText: config.selectAllText,
            deselectAllText: config.deselectAllText,
            
            init() {
                this.updateSelectedLabels();
                
                // 監聽外部值變化（如果使用 Livewire）
                if (window.Livewire) {
                    this.$watch('$wire.loading', value => {
                        this.loading = value;
                    });
                }
            },
            
            toggleDropdown() {
                if (this.loading) return;
                this.isOpen ? this.closeDropdown() : this.openDropdown();
            },
            
            openDropdown() {
                this.isOpen = true;
                this.searchTerm = '';
                this.$nextTick(() => {
                    if (this.searchable) {
                        this.$el.querySelector('input[type="text"]')?.focus();
                    }
                });
            },
            
            closeDropdown() {
                this.isOpen = false;
                this.searchTerm = '';
            },
            
            selectOption(option) {
                if (option.disabled) return;
                
                if (this.multiple) {
                    if (this.isSelected(option.value)) {
                        this.selectedValue = this.selectedValue.filter(v => v !== option.value);
                    } else {
                        this.selectedValue.push(option.value);
                    }
                } else {
                    this.selectedValue = option.value;
                    this.closeDropdown();
                }
                
                this.updateSelectedLabels();
                this.emitChange();
            },
            
            isSelected(value) {
                if (this.multiple) {
                    return this.selectedValue.includes(value);
                }
                return this.selectedValue === value;
            },
            
            hasSelection() {
                if (this.multiple) {
                    return this.selectedValue.length > 0;
                }
                return this.selectedValue !== null && this.selectedValue !== '';
            },
            
            clearSelection() {
                this.selectedValue = this.multiple ? [] : null;
                this.updateSelectedLabels();
                this.emitChange();
            },
            
            selectAll() {
                this.selectedValue = this.filteredOptions()
                    .filter(option => !option.disabled)
                    .map(option => option.value);
                this.updateSelectedLabels();
                this.emitChange();
            },
            
            deselectAll() {
                this.selectedValue = [];
                this.updateSelectedLabels();
                this.emitChange();
            },
            
            getSelectedLabel() {
                if (!this.hasSelection()) return '';
                const option = this.options.find(opt => opt.value === this.selectedValue);
                return option ? option.label : this.selectedValue;
            },
            
            getSelectedLabels() {
                if (!this.multiple || !this.hasSelection()) return [];
                return this.selectedValue.map(value => {
                    const option = this.options.find(opt => opt.value === value);
                    return option ? option.label : value;
                });
            },
            
            updateSelectedLabels() {
                if (this.multiple) {
                    this.selectedLabels = this.getSelectedLabels();
                } else {
                    this.selectedLabels = this.hasSelection() ? [this.getSelectedLabel()] : [];
                }
            },
            
            filteredOptions() {
                if (!this.searchable || !this.searchTerm) {
                    return this.options;
                }
                
                const term = this.searchTerm.toLowerCase();
                return this.options.filter(option => 
                    option.label.toLowerCase().includes(term) ||
                    option.value.toString().toLowerCase().includes(term)
                );
            },
            
            focusFirstOption() {
                this.$nextTick(() => {
                    const firstOption = this.$el.querySelector('[tabindex="0"]');
                    if (firstOption) firstOption.focus();
                });
            },
            
            focusLastOption() {
                this.$nextTick(() => {
                    const options = this.$el.querySelectorAll('[tabindex="0"]');
                    if (options.length > 0) options[options.length - 1].focus();
                });
            },
            
            focusNext() {
                const focused = document.activeElement;
                const options = Array.from(this.$el.querySelectorAll('[tabindex="0"]'));
                const currentIndex = options.indexOf(focused);
                
                if (currentIndex < options.length - 1) {
                    options[currentIndex + 1].focus();
                }
            },
            
            focusPrevious() {
                const focused = document.activeElement;
                const options = Array.from(this.$el.querySelectorAll('[tabindex="0"]'));
                const currentIndex = options.indexOf(focused);
                
                if (currentIndex > 0) {
                    options[currentIndex - 1].focus();
                } else if (this.searchable) {
                    this.$el.querySelector('input[type="text"]')?.focus();
                }
            },
            
            emitChange() {
                // 發送自定義事件
                this.$el.dispatchEvent(new CustomEvent('nexus-select-change', {
                    detail: {
                        value: this.selectedValue,
                        labels: this.selectedLabels,
                        multiple: this.multiple
                    },
                    bubbles: true
                }));
                
                // Livewire 支援
                if (window.Livewire && this.$wire) {
                    this.$wire.set(this.$el.getAttribute('wire:model') || 'selectedValue', this.selectedValue);
                }
            }
        }
    }
</script>
@endpush
@endonce

{{-- 組件樣式 --}}
@once
@push('styles')
<style>
    /* 選擇器焦點增強 */
    .nexus-select:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    /* 錯誤狀態焦點 */
    .nexus-select[aria-invalid="true"]:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
    
    /* 下拉清單動畫增強 */
    .nexus-select-dropdown {
        transform-origin: top;
    }
    
    /* 選項懸停效果 */
    .nexus-select-option:hover {
        background-color: var(--nexus-bg-secondary);
    }
    
    /* 滾動條樣式 */
    .nexus-select .overflow-y-auto::-webkit-scrollbar {
        width: 6px;
    }
    
    .nexus-select .overflow-y-auto::-webkit-scrollbar-track {
        background: var(--nexus-bg-secondary);
    }
    
    .nexus-select .overflow-y-auto::-webkit-scrollbar-thumb {
        background: var(--nexus-border-tertiary);
        border-radius: var(--nexus-radius-full);
    }
    
    .nexus-select .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: var(--nexus-text-quaternary);
    }
    
    /* 高對比度模式支援 */
    @media (prefers-contrast: high) {
        .nexus-select {
            border-width: 2px;
        }
        
        .nexus-select:focus {
            border-width: 3px;
        }
    }
    
    /* 減少動畫設定 */
    @media (prefers-reduced-motion: reduce) {
        .nexus-select * {
            transition: none !important;
        }
    }
</style>
@endpush
@endonce