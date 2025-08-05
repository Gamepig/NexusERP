{{--
  NexusERP Input Component - 企業級輸入表單組件系統
  
  使用範例：
  <x-ui.input name="email" label="電子郵件" type="email" required />
  <x-ui.input name="price" label="價格" prefix="$" suffix="USD" type="number" />
  <x-ui.input name="search" icon="search" placeholder="搜尋產品..." />
  <x-ui.input name="username" label="使用者名稱" help="需要3-20個字符" :error="$errors->first('username')" />
--}}

@props([
    'label' => null,
    'name' => '',
    'id' => null,
    'type' => 'text',
    'value' => '',
    'placeholder' => '',
    'required' => false,
    'disabled' => false,
    'readonly' => false,
    'autofocus' => false,
    'autocomplete' => null,
    'error' => null,
    'help' => null,
    'success' => null,
    'size' => 'md',              // sm, md, lg
    'prefix' => null,
    'suffix' => null,
    'icon' => null,
    'iconPosition' => 'left',    // left, right
    'min' => null,
    'max' => null,
    'step' => null,
    'pattern' => null,
    'maxlength' => null,
    'minlength' => null,
    'rows' => null,              // 用於 textarea
    'cols' => null,              // 用於 textarea
    'multiple' => false,         // 用於 file 類型
    'accept' => null,            // 用於 file 類型
])

@php
    // 生成唯一 ID
    $inputId = $id ?: ($name ? $name . '_' . uniqid() : 'input_' . uniqid());
    
    // 尺寸樣式對應
    $sizeClasses = [
        'sm' => 'px-nexus-3 py-nexus-1.5 text-nexus-sm min-h-[32px]',
        'md' => 'px-nexus-4 py-nexus-2 text-nexus-base min-h-[40px]',
        'lg' => 'px-nexus-4 py-nexus-3 text-nexus-lg min-h-[48px]',
    ];
    
    // 圖標尺寸對應
    $iconSizes = [
        'sm' => 'w-4 h-4',
        'md' => 'w-5 h-5',
        'lg' => 'w-5 h-5',
    ];
    
    // 基礎輸入框樣式
    $baseClasses = 'nexus-input block w-full rounded-nexus-md border bg-nexus-surface-primary text-nexus-text-primary placeholder-nexus-text-quaternary nexus-transition-fast focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-nexus-secondary disabled:text-nexus-text-disabled disabled:cursor-not-allowed';
    
    // 狀態樣式
    if ($error) {
        $stateClasses = 'border-nexus-error-500 focus:border-nexus-error-500 focus:ring-nexus-error-500';
    } elseif ($success) {
        $stateClasses = 'border-nexus-success-500 focus:border-nexus-success-500 focus:ring-nexus-success-500';
    } else {
        $stateClasses = 'border-nexus-primary focus:border-nexus-primary-500 focus:ring-nexus-primary-500';
    }
    
    // 組合樣式類別
    $classes = $baseClasses . ' ' . $sizeClasses[$size] . ' ' . $stateClasses;
    
    // 如果有前綴、後綴或圖標，調整 padding
    if ($prefix || ($icon && $iconPosition === 'left')) {
        $classes .= ' pl-nexus-10';
    }
    if ($suffix || ($icon && $iconPosition === 'right')) {
        $classes .= ' pr-nexus-10';
    }
    
    // 如果同時有前綴和後綴
    if (($prefix || ($icon && $iconPosition === 'left')) && ($suffix || ($icon && $iconPosition === 'right'))) {
        $classes .= ' px-nexus-10';
    }
    
    // 輸入框屬性
    $inputAttributes = [
        'id' => $inputId,
        'name' => $name,
        'type' => $type,
        'value' => old($name, $value),
        'class' => $classes,
    ];
    
    // 條件屬性
    if ($placeholder) $inputAttributes['placeholder'] = $placeholder;
    if ($required) $inputAttributes['required'] = true;
    if ($disabled) $inputAttributes['disabled'] = true;
    if ($readonly) $inputAttributes['readonly'] = true;
    if ($autofocus) $inputAttributes['autofocus'] = true;
    if ($autocomplete) $inputAttributes['autocomplete'] = $autocomplete;
    if ($min !== null) $inputAttributes['min'] = $min;
    if ($max !== null) $inputAttributes['max'] = $max;
    if ($step !== null) $inputAttributes['step'] = $step;
    if ($pattern) $inputAttributes['pattern'] = $pattern;
    if ($maxlength) $inputAttributes['maxlength'] = $maxlength;
    if ($minlength) $inputAttributes['minlength'] = $minlength;
    if ($multiple) $inputAttributes['multiple'] = true;
    if ($accept) $inputAttributes['accept'] = $accept;
    
    // ARIA 屬性
    if ($error) {
        $inputAttributes['aria-invalid'] = 'true';
        $inputAttributes['aria-describedby'] = $inputId . '_error';
    }
    if ($help) {
        $inputAttributes['aria-describedby'] = ($inputAttributes['aria-describedby'] ?? '') . ' ' . $inputId . '_help';
    }
    
    // 決定使用的標籤類型
    $isTextarea = $type === 'textarea' || $rows;
    $tagName = $isTextarea ? 'textarea' : 'input';
    
    // Textarea 特殊屬性
    if ($isTextarea) {
        unset($inputAttributes['type'], $inputAttributes['value']);
        if ($rows) $inputAttributes['rows'] = $rows;
        if ($cols) $inputAttributes['cols'] = $cols;
    }
@endphp

<div class="w-full">
    {{-- 標籤 --}}
    @if($label)
        <label for="{{ $inputId }}" 
               class="block text-nexus-sm font-nexus-medium text-nexus-text-primary mb-nexus-1">
            {{ $label }}
            @if($required)
                <span class="text-nexus-error-500 ml-nexus-1" aria-label="必填">*</span>
            @endif
        </label>
    @endif
    
    {{-- 輸入框容器 --}}
    <div class="relative">
        {{-- 左側前綴或圖標 --}}
        @if($prefix || ($icon && $iconPosition === 'left'))
            <div class="absolute inset-y-0 left-0 pl-nexus-3 flex items-center pointer-events-none">
                @if($icon && $iconPosition === 'left')
                    @if(str_starts_with($icon, 'heroicon-'))
                        <x-dynamic-component 
                            :component="$icon" 
                            class="{{ $iconSizes[$size] }} text-nexus-text-tertiary" 
                            aria-hidden="true"
                        />
                    @else
                        <i class="{{ $icon }} {{ $iconSizes[$size] }} text-nexus-text-tertiary" 
                           aria-hidden="true"></i>
                    @endif
                @elseif($prefix)
                    <span class="text-nexus-text-secondary text-nexus-sm font-nexus-medium">
                        {{ $prefix }}
                    </span>
                @endif
            </div>
        @endif
        
        {{-- 輸入框元素 --}}
        @if($isTextarea)
            <textarea {{ $attributes->merge($inputAttributes) }}>{{ old($name, $value) }}</textarea>
        @else
            <input {{ $attributes->merge($inputAttributes) }} />
        @endif
        
        {{-- 右側後綴或圖標 --}}
        @if($suffix || ($icon && $iconPosition === 'right'))
            <div class="absolute inset-y-0 right-0 pr-nexus-3 flex items-center pointer-events-none">
                @if($icon && $iconPosition === 'right')
                    @if(str_starts_with($icon, 'heroicon-'))
                        <x-dynamic-component 
                            :component="$icon" 
                            class="{{ $iconSizes[$size] }} text-nexus-text-tertiary" 
                            aria-hidden="true"
                        />
                    @else
                        <i class="{{ $icon }} {{ $iconSizes[$size] }} text-nexus-text-tertiary" 
                           aria-hidden="true"></i>
                    @endif
                @elseif($suffix)
                    <span class="text-nexus-text-secondary text-nexus-sm font-nexus-medium">
                        {{ $suffix }}
                    </span>
                @endif
            </div>
        @endif
        
        {{-- 狀態圖標 --}}
        @if($error || $success)
            <div class="absolute inset-y-0 right-0 pr-nexus-3 flex items-center pointer-events-none">
                @if($error)
                    <svg class="w-5 h-5 text-nexus-error-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                @elseif($success)
                    <svg class="w-5 h-5 text-nexus-success-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                @endif
            </div>
        @endif
    </div>
    
    {{-- 錯誤訊息 --}}
    @if($error)
        <p id="{{ $inputId }}_error" 
           class="mt-nexus-1 text-nexus-sm text-nexus-error-600" 
           role="alert">
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
        <p id="{{ $inputId }}_help" 
           class="mt-nexus-1 text-nexus-sm text-nexus-text-tertiary">
            {{ $help }}
        </p>
    @endif
</div>

{{-- 組件樣式增強 --}}
@once
@push('styles')
<style>
    /* 輸入框焦點增強 */
    .nexus-input:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    /* 錯誤狀態焦點 */
    .nexus-input[aria-invalid="true"]:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
    
    /* 文件輸入特殊樣式 */
    .nexus-input[type="file"] {
        padding: var(--nexus-space-2);
    }
    
    .nexus-input[type="file"]::-webkit-file-upload-button {
        background: var(--nexus-primary-500);
        color: white;
        border: none;
        padding: var(--nexus-space-1) var(--nexus-space-3);
        border-radius: var(--nexus-radius-sm);
        margin-right: var(--nexus-space-3);
        cursor: pointer;
        font-size: var(--nexus-text-sm);
        font-weight: var(--nexus-font-medium);
        transition: all var(--nexus-transition-fast);
    }
    
    .nexus-input[type="file"]::-webkit-file-upload-button:hover {
        background: var(--nexus-primary-600);
    }
    
    /* 數字輸入框按鈕樣式 */
    .nexus-input[type="number"]::-webkit-outer-spin-button,
    .nexus-input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    .nexus-input[type="number"] {
        -moz-appearance: textfield;
    }
    
    /* 搜尋輸入框清除按鈕 */
    .nexus-input[type="search"]::-webkit-search-cancel-button {
        -webkit-appearance: none;
        height: 16px;
        width: 16px;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'%3E%3C/path%3E%3C/svg%3E") no-repeat center;
        background-size: 16px 16px;
        cursor: pointer;
    }
    
    /* Textarea 自動調整高度 */
    .nexus-input.auto-resize {
        resize: none;
        overflow: hidden;
    }
    
    /* 密碼強度指示器容器 */
    .password-strength-container {
        margin-top: var(--nexus-space-2);
    }
    
    .password-strength-bar {
        height: 4px;
        background: var(--nexus-gray-200);
        border-radius: var(--nexus-radius-full);
        overflow: hidden;
    }
    
    .password-strength-fill {
        height: 100%;
        transition: all var(--nexus-transition-normal);
        border-radius: var(--nexus-radius-full);
    }
    
    .password-strength-weak { background: var(--nexus-error-500); width: 25%; }
    .password-strength-fair { background: var(--nexus-warning-500); width: 50%; }
    .password-strength-good { background: var(--nexus-info-500); width: 75%; }
    .password-strength-strong { background: var(--nexus-success-500); width: 100%; }
    
    /* 高對比度模式支援 */
    @media (prefers-contrast: high) {
        .nexus-input {
            border-width: 2px;
        }
        
        .nexus-input:focus {
            border-width: 3px;
        }
    }
    
    /* 暗色主題特殊處理 */
    [data-theme="dark"] .nexus-input[type="file"]::-webkit-file-upload-button {
        background: var(--nexus-primary-400);
    }
    
    [data-theme="dark"] .nexus-input[type="file"]::-webkit-file-upload-button:hover {
        background: var(--nexus-primary-500);
    }
</style>
@endpush
@endonce

{{-- JavaScript 增強功能 --}}
@once
@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Textarea 自動調整高度功能
        function autoResizeTextarea(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
        
        // 為所有標記為自動調整的 textarea 添加功能
        document.querySelectorAll('textarea.auto-resize').forEach(textarea => {
            autoResizeTextarea(textarea);
            
            textarea.addEventListener('input', function() {
                autoResizeTextarea(this);
            });
        });
        
        // 密碼強度檢查
        function checkPasswordStrength(password) {
            let strength = 0;
            
            // 長度檢查
            if (password.length >= 8) strength += 1;
            if (password.length >= 12) strength += 1;
            
            // 複雜度檢查
            if (/[a-z]/.test(password)) strength += 1;
            if (/[A-Z]/.test(password)) strength += 1;
            if (/[0-9]/.test(password)) strength += 1;
            if (/[^A-Za-z0-9]/.test(password)) strength += 1;
            
            return Math.min(strength, 4);
        }
        
        function getStrengthClass(strength) {
            switch(strength) {
                case 1: return 'password-strength-weak';
                case 2: return 'password-strength-fair';
                case 3: return 'password-strength-good';
                case 4: return 'password-strength-strong';
                default: return '';
            }
        }
        
        function getStrengthText(strength) {
            switch(strength) {
                case 1: return '弱';
                case 2: return '普通';
                case 3: return '良好';
                case 4: return '強';
                default: return '';
            }
        }
        
        // 為密碼輸入框添加強度指示器
        document.querySelectorAll('input[type="password"].nexus-input').forEach(passwordInput => {
            if (passwordInput.hasAttribute('data-password-strength')) {
                const container = document.createElement('div');
                container.className = 'password-strength-container';
                
                const bar = document.createElement('div');
                bar.className = 'password-strength-bar';
                
                const fill = document.createElement('div');
                fill.className = 'password-strength-fill';
                
                const text = document.createElement('div');
                text.className = 'text-nexus-sm text-nexus-text-tertiary mt-nexus-1';
                
                bar.appendChild(fill);
                container.appendChild(bar);
                container.appendChild(text);
                
                passwordInput.parentNode.insertBefore(container, passwordInput.nextSibling);
                
                passwordInput.addEventListener('input', function() {
                    const strength = checkPasswordStrength(this.value);
                    fill.className = 'password-strength-fill ' + getStrengthClass(strength);
                    text.textContent = this.value ? '密碼強度: ' + getStrengthText(strength) : '';
                });
            }
        });
        
        // 數字輸入框格式化
        document.querySelectorAll('input[type="number"].nexus-input').forEach(numberInput => {
            if (numberInput.hasAttribute('data-format-number')) {
                numberInput.addEventListener('blur', function() {
                    if (this.value && !isNaN(this.value)) {
                        this.value = parseFloat(this.value).toLocaleString();
                    }
                });
                
                numberInput.addEventListener('focus', function() {
                    this.value = this.value.replace(/,/g, '');
                });
            }
        });
        
        // 即時驗證支援
        document.querySelectorAll('.nexus-input[data-validate]').forEach(input => {
            const validateType = input.getAttribute('data-validate');
            
            input.addEventListener('blur', function() {
                validateInput(this, validateType);
            });
            
            input.addEventListener('input', function() {
                // 清除錯誤狀態
                this.classList.remove('border-nexus-error-500');
                this.setAttribute('aria-invalid', 'false');
                
                const errorElement = document.getElementById(this.id + '_error');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            });
        });
        
        function validateInput(input, type) {
            let isValid = true;
            let errorMessage = '';
            
            switch(type) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    isValid = emailRegex.test(input.value);
                    errorMessage = '請輸入有效的電子郵件地址';
                    break;
                    
                case 'phone':
                    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
                    isValid = phoneRegex.test(input.value);
                    errorMessage = '請輸入有效的電話號碼';
                    break;
                    
                case 'url':
                    try {
                        new URL(input.value);
                    } catch {
                        isValid = false;
                        errorMessage = '請輸入有效的網址';
                    }
                    break;
            }
            
            if (!isValid && input.value) {
                input.classList.add('border-nexus-error-500');
                input.setAttribute('aria-invalid', 'true');
                
                let errorElement = document.getElementById(input.id + '_error');
                if (!errorElement) {
                    errorElement = document.createElement('p');
                    errorElement.id = input.id + '_error';
                    errorElement.className = 'mt-nexus-1 text-nexus-sm text-nexus-error-600';
                    errorElement.setAttribute('role', 'alert');
                    input.parentNode.appendChild(errorElement);
                }
                
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            }
        }
    });
</script>
@endpush
@endonce