<div class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4" style="background-color: rgb(17, 24, 39) !important;">
    <div class="flex h-16 shrink-0 items-center">
        <h1 class="text-white font-bold text-lg" style="color: white !important;">🏢 NexusERP</h1>
    </div>
    <nav class="flex flex-1 flex-col">
        <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
                <ul role="list" class="-mx-2 space-y-1">
                    <!-- 主控台 -->
                    <li>
                        <a href="{{ route('admin.dashboard') }}" 
                           class="{{ request()->routeIs('admin.dashboard') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800' }} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                           style="{{ request()->routeIs('admin.dashboard') ? 'background-color: rgb(31, 41, 55) !important; color: white !important;' : 'color: rgb(209, 213, 219) !important;' }}">
                            <span class="text-lg">🏠</span>
                            主控台
                        </a>
                    </li>

                    <!-- 使用者管理 -->
                    <li>
                        <div class="text-xs font-semibold leading-6 text-gray-400 mt-8 mb-2" style="color: rgb(156, 163, 175) !important;">使用者管理</div>
                        <ul role="list" class="-mx-2 space-y-1">
                            <li>
                                <a href="{{ route('admin.users.index') }}" 
                                   class="{{ request()->routeIs('admin.users.*') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800' }} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                   style="{{ request()->routeIs('admin.users.*') ? 'background-color: rgb(31, 41, 55) !important; color: white !important;' : 'color: rgb(209, 213, 219) !important;' }}">
                                    <span class="text-lg">👥</span>
                                    使用者列表
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('admin.users.create') }}" 
                                   class="{{ request()->routeIs('admin.users.create') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800' }} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                   style="{{ request()->routeIs('admin.users.create') ? 'background-color: rgb(31, 41, 55) !important; color: white !important;' : 'color: rgb(209, 213, 219) !important;' }}">
                                    <span class="text-lg">➕</span>
                                    新增使用者
                                </a>
                            </li>
                        </ul>
                    </li>

                    <!-- 訂單管理 -->
                    <li>
                        <div class="text-xs font-semibold leading-6 text-gray-400 mt-8 mb-2" style="color: rgb(156, 163, 175) !important;">訂單管理</div>
                        <ul role="list" class="-mx-2 space-y-1">
                            <li>
                                <a href="{{ route('admin.orders.index') }}" 
                                   class="{{ request()->routeIs('admin.orders.*') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800' }} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                   style="{{ request()->routeIs('admin.orders.*') ? 'background-color: rgb(31, 41, 55) !important; color: white !important;' : 'color: rgb(209, 213, 219) !important;' }}">
                                    <span class="text-lg">📦</span>
                                    訂單列表
                                </a>
                            </li>
                        </ul>
                    </li>

                    <!-- 財務管理 -->
                    <li>
                        <div class="text-xs font-semibold leading-6 text-gray-400 mt-8 mb-2" style="color: rgb(156, 163, 175) !important;">財務管理</div>
                        <ul role="list" class="-mx-2 space-y-1">
                            <li>
                                <a href="{{ route('admin.finance.receivables') }}" 
                                   class="{{ request()->routeIs('admin.finance.receivables') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800' }} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                   style="{{ request()->routeIs('admin.finance.receivables') ? 'background-color: rgb(31, 41, 55) !important; color: white !important;' : 'color: rgb(209, 213, 219) !important;' }}">
                                    <span class="text-lg">💰</span>
                                    應收帳款
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('admin.finance.payables') }}" 
                                   class="{{ request()->routeIs('admin.finance.payables') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800' }} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                   style="{{ request()->routeIs('admin.finance.payables') ? 'background-color: rgb(31, 41, 55) !important; color: white !important;' : 'color: rgb(209, 213, 219) !important;' }}">
                                    <span class="text-lg">💳</span>
                                    應付帳款
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('admin.finance.invoices') }}" 
                                   class="{{ request()->routeIs('admin.finance.invoices') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800' }} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                   style="{{ request()->routeIs('admin.finance.invoices') ? 'background-color: rgb(31, 41, 55) !important; color: white !important;' : 'color: rgb(209, 213, 219) !important;' }}">
                                    <span class="text-lg">📄</span>
                                    發票管理
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('admin.finance.payments') }}" 
                                   class="{{ request()->routeIs('admin.finance.payments') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800' }} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                   style="{{ request()->routeIs('admin.finance.payments') ? 'background-color: rgb(31, 41, 55) !important; color: white !important;' : 'color: rgb(209, 213, 219) !important;' }}">
                                    <span class="text-lg">💵</span>
                                    付款記錄
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </li>

            <!-- 底部區域 -->
            <li class="mt-auto">
                <div class="border-t border-gray-700 pt-4">
                    <!-- 使用者資訊 -->
                    <div class="flex items-center gap-x-3 px-2 py-3">
                        <div class="flex-shrink-0">
                            <div class="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                                <span class="text-sm text-white" style="color: white !important;">
                                    {{ session('admin_user') === 'DEMO' ? '👁️' : '👤' }}
                                </span>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-white" style="color: white !important;">{{ session('admin_user') }}</p>
                            <p class="text-xs text-gray-400" style="color: rgb(156, 163, 175) !important;">
                                {{ session('admin_user') === 'DEMO' ? '展示帳號' : '管理員' }}
                            </p>
                        </div>
                    </div>

                    <!-- 登出 -->
                    <form method="POST" action="{{ route('admin.logout') }}">
                        @csrf
                        <button type="submit" class="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-300 hover:text-white hover:bg-gray-800" style="color: rgb(209, 213, 219) !important;">
                            <span class="text-lg">🚪</span>
                            登出
                        </button>
                    </form>

                    <!-- 返回前台 -->
                    <a href="{{ route('dashboard') }}" class="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-300 hover:text-white hover:bg-gray-800" style="color: rgb(209, 213, 219) !important;">
                        <span class="text-lg">🔄</span>
                        返回前台
                    </a>
                </div>
            </li>
        </ul>
    </nav>
</div>