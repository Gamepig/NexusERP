@extends('layouts.app')

@section('header')
<h2 class="font-semibold text-xl text-base-content leading-tight">
    {{ __('公司用戶管理') }}
</h2>
@endsection

@section('content')
<div class="py-6" x-data="userManagement()">
    <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
        
        <!-- Header Actions -->
        <div class="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6 border-b border-base-300">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-semibold text-base-content">用戶列表</h3>
                        <p class="text-sm text-base-content/70">管理公司內的用戶和權限</p>
                    </div>
                    <button @click="showInviteModal = true" 
                            class="btn btn-primary">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        邀請用戶
                    </button>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                    </div>
                    <div class="stat-title">總用戶數</div>
                    <div class="stat-value text-primary" x-text="stats.total_users"></div>
                </div>
            </div>
            
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-success">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="stat-title">活躍用戶</div>
                    <div class="stat-value text-success" x-text="stats.active_users"></div>
                </div>
            </div>
            
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-warning">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="stat-title">待處理邀請</div>
                    <div class="stat-value text-warning" x-text="stats.pending_invitations"></div>
                </div>
            </div>
            
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-info">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                    </div>
                    <div class="stat-title">管理員</div>
                    <div class="stat-value text-info" x-text="stats.admin_count"></div>
                </div>
            </div>
        </div>

        <!-- Users Table -->
        <div class="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-lg font-semibold text-base-content">公司成員</h4>
                    <div class="flex gap-2">
                        <input type="text" 
                               x-model="searchTerm"
                               placeholder="搜尋用戶..."
                               class="input input-bordered input-sm">
                        <select x-model="roleFilter" class="select select-bordered select-sm">
                            <option value="">所有角色</option>
                            <option value="admin">管理員</option>
                            <option value="manager">經理</option>
                            <option value="member">成員</option>
                        </select>
                    </div>
                </div>

                <!-- Loading State -->
                <div x-show="loading" class="text-center py-8">
                    <span class="loading loading-spinner loading-lg"></span>
                    <p class="mt-2 text-base-content/70">載入用戶資料中...</p>
                </div>

                <!-- Users Table -->
                <div x-show="!loading" class="overflow-x-auto">
                    <table class="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>用戶</th>
                                <th>角色</th>
                                <th>加入時間</th>
                                <th>最後登入</th>
                                <th>狀態</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template x-for="user in filteredUsers" :key="user.id">
                                <tr>
                                    <td>
                                        <div class="flex items-center gap-3">
                                            <div class="avatar placeholder">
                                                <div class="bg-neutral-focus text-neutral-content rounded-full w-12">
                                                    <span class="text-xs" x-text="getUserInitials(user.name)"></span>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="font-bold" x-text="user.name"></div>
                                                <div class="text-sm opacity-50" x-text="user.email"></div>
                                                <div x-show="user.is_primary" class="badge badge-primary badge-xs">主要公司</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="badge" 
                                             :class="{
                                                 'badge-error': user.role === 'admin',
                                                 'badge-warning': user.role === 'manager',
                                                 'badge-info': user.role === 'member'
                                             }"
                                             x-text="getRoleDisplayName(user.role)">
                                        </div>
                                    </td>
                                    <td x-text="formatDate(user.joined_at)"></td>
                                    <td x-text="user.last_login_at ? formatDate(user.last_login_at) : '從未登入'"></td>
                                    <td>
                                        <div class="badge" 
                                             :class="user.is_active ? 'badge-success' : 'badge-error'"
                                             x-text="user.is_active ? '活躍' : '停用'">
                                        </div>
                                    </td>
                                    <td>
                                        <div class="dropdown dropdown-end">
                                            <div tabindex="0" role="button" class="btn btn-ghost btn-xs">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                                </svg>
                                            </div>
                                            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                                <li><a @click="editUser(user)">編輯角色</a></li>
                                                <li x-show="user.is_active"><a @click="deactivateUser(user)" class="text-warning">停用用戶</a></li>
                                                <li x-show="!user.is_active"><a @click="activateUser(user)" class="text-success">啟用用戶</a></li>
                                                <li><a @click="removeUser(user)" class="text-error">移除用戶</a></li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>

                    <!-- Empty State -->
                    <div x-show="filteredUsers.length === 0 && !loading" class="text-center py-8">
                        <svg class="w-12 h-12 mx-auto text-base-content/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                        <p class="text-base-content/70">沒有找到符合條件的用戶</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pending Invitations -->
        <div x-show="pendingInvitations.length > 0" class="bg-base-100 overflow-hidden shadow-sm sm:rounded-lg">
            <div class="p-6">
                <h4 class="text-lg font-semibold text-base-content mb-4">待處理邀請</h4>
                
                <div class="overflow-x-auto">
                    <table class="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>電子郵件</th>
                                <th>角色</th>
                                <th>邀請者</th>
                                <th>邀請時間</th>
                                <th>到期時間</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template x-for="invitation in pendingInvitations" :key="invitation.id">
                                <tr>
                                    <td x-text="invitation.email"></td>
                                    <td>
                                        <div class="badge badge-outline" x-text="getRoleDisplayName(invitation.role)"></div>
                                    </td>
                                    <td x-text="invitation.invited_by"></td>
                                    <td x-text="formatDate(invitation.invited_at)"></td>
                                    <td x-text="formatDate(invitation.expires_at)"></td>
                                    <td>
                                        <button @click="resendInvitation(invitation)" 
                                                class="btn btn-ghost btn-xs">
                                            重新發送
                                        </button>
                                        <button @click="cancelInvitation(invitation)" 
                                                class="btn btn-ghost btn-xs text-error">
                                            取消
                                        </button>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Invite User Modal -->
    <x-invite-user-modal :show="showInviteModal" 
                         @close-invite-modal="showInviteModal = false"
                         @invitation-sent="handleInvitationSent" />
</div>

<script>
function userManagement() {
    return {
        users: [],
        pendingInvitations: [],
        stats: {
            total_users: 0,
            active_users: 0,
            pending_invitations: 0,
            admin_count: 0
        },
        loading: false,
        showInviteModal: false,
        searchTerm: '',
        roleFilter: '',

        init() {
            this.loadUsers();
        },

        get filteredUsers() {
            return this.users.filter(user => {
                const matchesSearch = user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                                    user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
                const matchesRole = !this.roleFilter || user.role === this.roleFilter;
                return matchesSearch && matchesRole;
            });
        },

        async loadUsers() {
            this.loading = true;
            
            try {
                const response = await fetch('/api/company-management/users', {
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.users = data.users;
                        this.pendingInvitations = data.pending_invitations;
                        this.updateStats();
                    }
                }
            } catch (error) {
                console.error('Error loading users:', error);
            } finally {
                this.loading = false;
            }
        },

        updateStats() {
            this.stats.total_users = this.users.length;
            this.stats.active_users = this.users.filter(u => u.is_active).length;
            this.stats.pending_invitations = this.pendingInvitations.length;
            this.stats.admin_count = this.users.filter(u => u.role === 'admin').length;
        },

        getUserInitials(name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        },

        getRoleDisplayName(role) {
            const roleNames = {
                'admin': '管理員',
                'manager': '經理',
                'member': '成員'
            };
            return roleNames[role] || role;
        },

        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        handleInvitationSent(invitation) {
            this.pendingInvitations.push(invitation);
            this.updateStats();
        },

        async editUser(user) {
            // Implementation for editing user role
            console.log('Edit user:', user);
        },

        async deactivateUser(user) {
            // Implementation for deactivating user
            console.log('Deactivate user:', user);
        },

        async activateUser(user) {
            // Implementation for activating user
            console.log('Activate user:', user);
        },

        async removeUser(user) {
            // Implementation for removing user
            console.log('Remove user:', user);
        },

        async resendInvitation(invitation) {
            // Implementation for resending invitation
            console.log('Resend invitation:', invitation);
        },

        async cancelInvitation(invitation) {
            // Implementation for canceling invitation
            console.log('Cancel invitation:', invitation);
        }
    }
}
</script>
@endsection