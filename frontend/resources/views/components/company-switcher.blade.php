@props(['currentCompany' => null])

<div class="dropdown dropdown-end" x-data="companySwitcher()">
    <div tabindex="0" role="button" class="btn btn-ghost flex items-center gap-2 company-switcher-btn">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span class="text-sm font-bold text-primary-content">{{ auth()->user()->name[0] ?? 'U' }}</span>
            </div>
            <div class="company-info-display">
                <div class="text-sm font-medium text-base-content">{{ auth()->user()->name ?? '用戶' }}</div>
                <div class="text-xs text-base-content/70" x-text="currentCompany?.display_name || '選擇公司'"></div>
            </div>
        </div>
        <svg class="w-4 h-4 text-base-content/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    </div>
    
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-72 max-h-96 overflow-y-auto">
        <!-- Loading State -->
        <li x-show="loading" class="text-center py-4">
            <span class="loading loading-spinner loading-sm"></span>
            <span class="ml-2 text-sm">載入中...</span>
        </li>

        <!-- Error State -->
        <li x-show="error && !loading" class="text-center py-4">
            <span class="text-error text-sm" x-text="error"></span>
        </li>

        <!-- Companies List -->
        <div x-show="!loading && !error">
            <!-- Current Company Header -->
            <li class="menu-title">
                <span>目前公司</span>
            </li>
            
            <li x-show="currentCompany">
                <div class="flex items-center justify-between bg-primary/10 rounded-lg">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span class="text-sm font-bold text-primary-content" x-text="getCompanyInitials(currentCompany)"></span>
                        </div>
                        <div>
                            <div class="font-medium" x-text="currentCompany?.display_name"></div>
                            <div class="text-xs text-base-content/70" x-text="currentCompany?.code"></div>
                        </div>
                    </div>
                    <div class="badge badge-primary badge-sm">目前</div>
                </div>
            </li>

            <!-- Other Companies -->
            <template x-if="otherCompanies.length > 0">
                <div>
                    <li class="menu-title">
                        <span>其他公司</span>
                    </li>
                    
                    <template x-for="company in otherCompanies" :key="company.id">
                        <li>
                            <a @click="switchCompany(company)" class="flex items-center gap-3 hover:bg-base-200">
                                <div class="w-8 h-8 bg-base-300 rounded-full flex items-center justify-center">
                                    <span class="text-sm font-bold text-base-content" x-text="getCompanyInitials(company)"></span>
                                </div>
                                <div class="flex-1">
                                    <div class="font-medium" x-text="company.display_name"></div>
                                    <div class="text-xs text-base-content/70" x-text="company.code"></div>
                                </div>
                                <div class="badge badge-ghost badge-sm" x-text="getRoleDisplayName(company.role)"></div>
                            </a>
                        </li>
                    </template>
                </div>
            </template>

            <!-- No Companies Message -->
            <template x-if="companies.length === 0 && !loading">
                <li class="text-center py-4">
                    <span class="text-base-content/70 text-sm">尚未加入任何公司</span>
                </li>
            </template>

            <!-- Action Buttons -->
            <div class="divider my-2"></div>
            
            <li>
                <a @click="openInviteModal()" class="flex items-center gap-2 text-primary">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    邀請用戶
                </a>
            </li>
            
            <li>
                <a @click="openManageModal()" class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    管理公司
                </a>
            </li>
        </div>
    </ul>
</div>

<script>
function companySwitcher() {
    return {
        companies: [],
        currentCompany: null,
        loading: false,
        error: null,
        
        init() {
            this.loadCompanies();
        },

        get otherCompanies() {
            return this.companies.filter(company => !company.is_current);
        },

        async loadCompanies() {
            this.loading = true;
            this.error = null;
            
            try {
                const response = await fetch('/api/company-management/companies', {
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                const data = await response.json();

                if (data.success) {
                    this.companies = data.companies;
                    this.currentCompany = data.companies.find(c => c.is_current);
                } else {
                    this.error = data.error || '載入公司列表失敗';
                }
            } catch (error) {
                console.error('Error loading companies:', error);
                this.error = '網路錯誤，請稍後再試';
            } finally {
                this.loading = false;
            }
        },

        async switchCompany(company) {
            if (company.is_current) return;

            const previousCompany = this.currentCompany;
            
            try {
                const response = await fetch('/api/company-management/switch-company', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({ company_id: company.id })
                });

                const data = await response.json();

                if (data.success) {
                    // Update current company
                    this.companies = this.companies.map(c => ({
                        ...c,
                        is_current: c.id === company.id
                    }));
                    this.currentCompany = company;
                    
                    // Show success message
                    this.showToast('success', data.message);
                    
                    // Reload page to refresh data with new company context
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    this.showToast('error', data.error || '切換公司失敗');
                }
            } catch (error) {
                console.error('Error switching company:', error);
                this.showToast('error', '網路錯誤，請稍後再試');
            }
        },

        getCompanyInitials(company) {
            if (!company) return '';
            return company.display_name.charAt(0).toUpperCase();
        },

        getRoleDisplayName(role) {
            const roleNames = {
                'admin': '管理員',
                'manager': '經理',
                'member': '成員'
            };
            return roleNames[role] || role;
        },

        openInviteModal() {
            // Will be implemented when modal component is created
            this.showToast('info', '邀請功能即將推出');
        },

        openManageModal() {
            // Will be implemented when modal component is created
            this.showToast('info', '管理功能即將推出');
        },

        showToast(type, message) {
            // Simple toast notification
            const toast = document.createElement('div');
            toast.className = `alert alert-${type} fixed top-4 right-4 w-auto z-50 shadow-lg`;
            toast.innerHTML = `<span>${message}</span>`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
    }
}
</script>