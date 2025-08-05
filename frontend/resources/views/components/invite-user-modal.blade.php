@props(['show' => false])

<div x-data="inviteUserModal()" x-show="show" x-cloak 
     class="fixed inset-0 z-50 overflow-y-auto"
     @keydown.escape.window="$dispatch('close-invite-modal')">
    
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
         @click="$dispatch('close-invite-modal')"></div>
    
    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative transform overflow-hidden rounded-lg bg-base-100 shadow-xl transition-all sm:w-full sm:max-w-lg">
            
            <!-- Header -->
            <div class="bg-base-100 px-6 py-4 border-b border-base-300">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-base-content">邀請用戶加入公司</h3>
                    <button @click="$dispatch('close-invite-modal')" 
                            class="btn btn-sm btn-circle btn-ghost">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="submitInvitation()" class="bg-base-100">
                <div class="px-6 py-4 space-y-4">
                    
                    <!-- Email Field -->
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-medium">電子郵件 <span class="text-error">*</span></span>
                        </label>
                        <input type="email" 
                               x-model="form.email"
                               placeholder="輸入邀請對象的電子郵件"
                               class="input input-bordered w-full"
                               :class="{ 'input-error': errors.email }"
                               required>
                        <label class="label" x-show="errors.email">
                            <span class="label-text-alt text-error" x-text="errors.email"></span>
                        </label>
                    </div>

                    <!-- Role Field -->
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-medium">角色 <span class="text-error">*</span></span>
                        </label>
                        <select x-model="form.role" 
                                class="select select-bordered w-full"
                                :class="{ 'select-error': errors.role }"
                                required>
                            <option value="">選擇角色</option>
                            <option value="admin">管理員 - 完全權限</option>
                            <option value="manager">經理 - 管理權限</option>
                            <option value="member">成員 - 基本權限</option>
                        </select>
                        <label class="label" x-show="errors.role">
                            <span class="label-text-alt text-error" x-text="errors.role"></span>
                        </label>
                    </div>

                    <!-- Business Units Field (Optional) -->
                    <div class="form-control" x-show="businessUnits.length > 0">
                        <label class="label">
                            <span class="label-text font-medium">業務單位 (可選)</span>
                        </label>
                        <div class="space-y-2 max-h-32 overflow-y-auto border border-base-300 rounded-lg p-2">
                            <template x-for="unit in businessUnits" :key="unit.id">
                                <label class="cursor-pointer label justify-start gap-2">
                                    <input type="checkbox" 
                                           :value="unit.id"
                                           x-model="form.business_unit_ids"
                                           class="checkbox checkbox-sm">
                                    <span class="label-text" x-text="unit.name"></span>
                                    <span class="badge badge-ghost badge-xs" x-text="unit.type"></span>
                                </label>
                            </template>
                        </div>
                        <label class="label">
                            <span class="label-text-alt">選擇用戶將加入的業務單位</span>
                        </label>
                    </div>

                    <!-- Message Field -->
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-medium">邀請訊息 (可選)</span>
                        </label>
                        <textarea x-model="form.message"
                                  placeholder="添加個人化的邀請訊息..."
                                  class="textarea textarea-bordered w-full h-20"
                                  :class="{ 'textarea-error': errors.message }"
                                  maxlength="500"></textarea>
                        <label class="label">
                            <span class="label-text-alt" x-text="`${form.message.length}/500 字元`"></span>
                            <span class="label-text-alt text-error" x-show="errors.message" x-text="errors.message"></span>
                        </label>
                    </div>

                    <!-- Error Display -->
                    <div x-show="generalError" class="alert alert-error">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span x-text="generalError"></span>
                    </div>

                    <!-- Success Display -->
                    <div x-show="success" class="alert alert-success">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span x-text="success"></span>
                    </div>
                </div>

                <!-- Footer -->
                <div class="bg-base-200 px-6 py-4 flex justify-end gap-2">
                    <button type="button" 
                            @click="$dispatch('close-invite-modal')"
                            class="btn btn-ghost">
                        取消
                    </button>
                    <button type="submit" 
                            class="btn btn-primary"
                            :class="{ 'loading': loading }"
                            :disabled="loading">
                        <span x-show="!loading">發送邀請</span>
                        <span x-show="loading">發送中...</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function inviteUserModal() {
    return {
        form: {
            email: '',
            role: '',
            business_unit_ids: [],
            message: ''
        },
        businessUnits: [],
        errors: {},
        generalError: '',
        success: '',
        loading: false,

        init() {
            this.loadBusinessUnits();
            
            // Reset form when modal opens
            this.$watch('show', (value) => {
                if (value) {
                    this.resetForm();
                }
            });
        },

        async loadBusinessUnits() {
            try {
                const response = await fetch('/api/company-management/business-units', {
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.businessUnits = data.business_units || [];
                    }
                }
            } catch (error) {
                console.error('Error loading business units:', error);
            }
        },

        async submitInvitation() {
            this.loading = true;
            this.errors = {};
            this.generalError = '';
            this.success = '';

            try {
                const response = await fetch('/api/company-management/invite-user', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify(this.form)
                });

                const data = await response.json();

                if (data.success) {
                    this.success = data.message;
                    this.resetForm();
                    
                    // Close modal after 2 seconds
                    setTimeout(() => {
                        this.$dispatch('close-invite-modal');
                        this.$dispatch('invitation-sent', data.invitation);
                    }, 2000);
                } else {
                    if (data.errors) {
                        this.errors = data.errors;
                    } else {
                        this.generalError = data.error || '發送邀請失敗';
                    }
                }
            } catch (error) {
                console.error('Error sending invitation:', error);
                this.generalError = '網路錯誤，請稍後再試';
            } finally {
                this.loading = false;
            }
        },

        resetForm() {
            this.form = {
                email: '',
                role: '',
                business_unit_ids: [],
                message: ''
            };
            this.errors = {};
            this.generalError = '';
            this.success = '';
        }
    }
}
</script>