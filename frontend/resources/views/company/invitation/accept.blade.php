@extends('layouts.guest')

@section('content')
<div class="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-base-200">
    <div class="w-full sm:max-w-md mt-6 px-6 py-4 bg-base-100 shadow-md overflow-hidden sm:rounded-lg">
        <!-- Loading State -->
        <div id="loading-state" class="text-center">
            <div class="loading loading-spinner loading-lg text-primary"></div>
            <p class="mt-4 text-base-content">載入邀請資訊中...</p>
        </div>

        <!-- Error State -->
        <div id="error-state" class="hidden">
            <div class="alert alert-error mb-4">
                <div>
                    <h3 class="font-bold">邀請無效</h3>
                    <div class="text-xs" id="error-message"></div>
                </div>
            </div>
            <div class="text-center">
                <a href="{{ route('login') }}" class="btn btn-primary">回到登入頁面</a>
            </div>
        </div>

        <!-- Invitation Display -->
        <div id="invitation-display" class="hidden">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-base-content">公司邀請</h2>
                <p class="text-base-content/70">您收到了加入公司的邀請</p>
            </div>

            <div class="card bg-base-200">
                <div class="card-body">
                    <h3 class="card-title text-primary" id="company-name"></h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="font-medium">角色:</span>
                            <span id="role" class="badge badge-primary"></span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">邀請者:</span>
                            <span id="invited-by"></span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">到期時間:</span>
                            <span id="expires-at"></span>
                        </div>
                    </div>
                    
                    <div id="invitation-message" class="mt-4 p-3 bg-base-300 rounded-lg hidden">
                        <p class="text-sm italic" id="message-content"></p>
                    </div>
                </div>
            </div>

            <!-- Authentication Required -->
            <div id="auth-required" class="mt-6">
                <div class="alert alert-info mb-4">
                    <div>
                        <h3 class="font-bold">需要登入</h3>
                        <div class="text-xs">請登入或註冊以接受邀請</div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="redirectToLogin()" class="btn btn-primary flex-1">登入</button>
                    <button onclick="redirectToRegister()" class="btn btn-outline flex-1">註冊</button>
                </div>
            </div>

            <!-- Accept Invitation (For Authenticated Users) -->
            <div id="accept-invitation" class="mt-6 hidden">
                <div class="alert alert-success mb-4">
                    <div>
                        <h3 class="font-bold">確認接受邀請</h3>
                        <div class="text-xs">點擊下方按鈕接受邀請並加入公司</div>
                    </div>
                </div>
                <button onclick="acceptInvitation()" class="btn btn-primary w-full" id="accept-btn">
                    接受邀請
                </button>
            </div>
        </div>

        <!-- Success State -->
        <div id="success-state" class="hidden text-center">
            <div class="alert alert-success mb-4">
                <div>
                    <h3 class="font-bold">邀請已接受</h3>
                    <div class="text-xs" id="success-message"></div>
                </div>
            </div>
            <button onclick="redirectToDashboard()" class="btn btn-primary w-full">前往控制台</button>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const token = '{{ $token }}';
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const invitationDisplay = document.getElementById('invitation-display');
    const authRequired = document.getElementById('auth-required');
    const acceptInvitation = document.getElementById('accept-invitation');
    const successState = document.getElementById('success-state');

    // Load invitation information
    loadInvitationInfo();

    async function loadInvitationInfo() {
        try {
            const response = await fetch(`/api/invitations/${token}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });

            const data = await response.json();

            if (!data.success) {
                showError(data.error || '載入邀請資訊失敗');
                return;
            }

            displayInvitation(data.invitation);
            checkAuthenticationStatus();

        } catch (error) {
            console.error('Error loading invitation:', error);
            showError('網路錯誤，請稍後再試');
        }
    }

    function displayInvitation(invitation) {
        document.getElementById('company-name').textContent = invitation.company_name;
        document.getElementById('role').textContent = getRoleDisplayName(invitation.role);
        document.getElementById('invited-by').textContent = invitation.invited_by;
        document.getElementById('expires-at').textContent = formatDate(invitation.expires_at);

        if (invitation.message) {
            document.getElementById('invitation-message').classList.remove('hidden');
            document.getElementById('message-content').textContent = invitation.message;
        }

        loadingState.classList.add('hidden');
        invitationDisplay.classList.remove('hidden');
    }

    async function checkAuthenticationStatus() {
        try {
            const response = await fetch('/api/auth/token', {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });

            if (response.ok) {
                // User is authenticated
                authRequired.classList.add('hidden');
                acceptInvitation.classList.remove('hidden');
            } else {
                // User needs to authenticate
                authRequired.classList.remove('hidden');
                acceptInvitation.classList.add('hidden');
            }
        } catch (error) {
            // Assume not authenticated on error
            authRequired.classList.remove('hidden');
            acceptInvitation.classList.add('hidden');
        }
    }

    window.acceptInvitation = async function() {
        const acceptBtn = document.getElementById('accept-btn');
        acceptBtn.classList.add('loading');
        acceptBtn.disabled = true;

        try {
            const response = await fetch(`/api/invitations/accept/${token}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('success-message').textContent = data.message;
                invitationDisplay.classList.add('hidden');
                successState.classList.remove('hidden');
            } else {
                showError(data.error || '接受邀請失敗');
            }

        } catch (error) {
            console.error('Error accepting invitation:', error);
            showError('網路錯誤，請稍後再試');
        } finally {
            acceptBtn.classList.remove('loading');
            acceptBtn.disabled = false;
        }
    };

    window.redirectToLogin = function() {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?redirect=${currentUrl}`;
    };

    window.redirectToRegister = function() {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `/register?redirect=${currentUrl}`;
    };

    window.redirectToDashboard = function() {
        window.location.href = '/dashboard';
    };

    function showError(message) {
        document.getElementById('error-message').textContent = message;
        loadingState.classList.add('hidden');
        invitationDisplay.classList.add('hidden');
        errorState.classList.remove('hidden');
    }

    function getRoleDisplayName(role) {
        const roleNames = {
            'admin': '管理員',
            'manager': '經理',
            'member': '成員'
        };
        return roleNames[role] || role;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});
</script>
@endsection