<nav x-data="{ open: false }" class="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700" style="background-color: var(--nexus-bg-secondary); border-color: var(--nexus-border-primary);">
    <!-- Primary Navigation Menu -->
    <div class="max-w-none mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16" style="min-width: 1024px;">
            <div class="flex flex-1 min-w-0">
                <!-- Logo -->
                <div class="shrink-0 flex items-center">
                    <a href="{{ route('dashboard') }}">
                        <x-application-logo class="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200" style="color: var(--nexus-text-primary);" />
                    </a>
                </div>

                <!-- Navigation Links -->
                <div class="hidden lg:flex space-x-1 lg:space-x-2 xl:space-x-3 sm:-my-px sm:ms-10 flex-1" style="min-width: 0;">
                    @php
                        $navigationService = app(\App\Services\NavigationService::class);
                        $mainNavigation = $navigationService->getMainNavigation(request()->route()->getName() ?? '');
                    @endphp
                    
                    @foreach($mainNavigation as $navItem)
                        @if($navItem['hasChildren'] ?? false)
                            <!-- 多層級導航項目（下拉選單） -->
                            <x-nav-dropdown 
                                :navigation="$navItem" 
                                :active="$navItem['isActive'] ?? false" 
                            />
                        @else
                            <!-- 單層導航項目 -->
                            <x-nav-link 
                                :href="$navItem['route'] ?? '#'" 
                                :active="$navItem['isActive'] ?? false"
                            >
                                @if(isset($navItem['icon']))
                                    <span class="mr-2">{!! $navItem['icon'] !!}</span>
                                @endif
                                {{ $navItem['title'] }}
                                @if(isset($navItem['badge']) && $navItem['badge'])
                                    <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                        {{ $navItem['badge'] }}
                                    </span>
                                @endif
                            </x-nav-link>
                        @endif
                    @endforeach
                </div>
            </div>

            <!-- Settings Dropdown -->
            <div class="hidden sm:flex sm:items-center sm:ms-6">
                <!-- Theme Toggle Button -->
                <button 
                    data-theme-toggle 
                    class="theme-toggle mr-4 inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                    style="color: var(--nexus-text-secondary);"
                    aria-label="切換主題"
                    title="切換主題 (Ctrl+Shift+T)"
                    onmouseover="this.style.color='var(--nexus-text-primary)'; this.style.backgroundColor='var(--nexus-bg-tertiary)';"
                    onmouseout="this.style.color='var(--nexus-text-secondary)'; this.style.backgroundColor='transparent';"
                    >
                    <!-- 太陽圖標（淺色主題） -->
                    <svg class="theme-toggle-sun w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                    <!-- 月亮圖標（暗色主題） -->
                    <svg class="theme-toggle-moon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                    </svg>
                </button>
                <!-- 現代化用戶下拉選單 -->
                <div class="relative" x-data="{ open: false }" @click.outside="open = false" @close.stop="open = false">
                    <!-- 觸發器按鈕 -->
                    <button @click="open = ! open" class="nexus-user-trigger-modern">
                        <!-- 用戶頭像 -->
                        <div class="nexus-user-avatar">
                            {{ Auth::user() ? substr(Auth::user()->name, 0, 1) : 'T' }}
                        </div>
                        
                        <!-- 用戶資訊 -->
                        <div>
                            <div class="text-sm font-medium">{{ Auth::user() ? Auth::user()->name : '測試用戶' }}</div>
                            <div class="text-xs opacity-75">{{ Auth::user() ? Auth::user()->email : 'test@example.com' }}</div>
                        </div>

                        <!-- 下拉箭頭 -->
                        <svg class="fill-current h-4 w-4 transition-transform duration-200" :class="{'rotate-180': open}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>

                    <!-- 下拉選單 -->
                    <div x-show="open"
                         x-transition:enter="transition ease-out duration-200"
                         x-transition:enter-start="opacity-0 scale-95"
                         x-transition:enter-end="opacity-100 scale-100"
                         x-transition:leave="transition ease-in duration-75"
                         x-transition:leave-start="opacity-100 scale-100"
                         x-transition:leave-end="opacity-0 scale-95"
                         class="nexus-user-dropdown-modern"
                         style="display: none;"
                         @click="open = false">
                        
                        <!-- 個人資料連結 -->
                        <a href="{{ route('profile.edit') }}" class="nexus-user-menu-item-modern">
                            <svg class="nexus-user-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span>{{ __('Profile') }}</span>
                        </a>

                        <!-- 分隔線 -->
                        <div class="nexus-user-menu-divider"></div>

                        <!-- 登出 -->
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="nexus-user-menu-item-modern w-full">
                                <svg class="nexus-user-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                                <span>{{ __('Log Out') }}</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Hamburger -->
            <div class="-me-2 flex items-center lg:hidden">
                <button @click="open = ! open" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-500 dark:focus:bg-gray-900 dark:focus:text-gray-400 transition duration-150 ease-in-out"
                style="color: var(--nexus-text-secondary);"
                onmouseover="this.style.color='var(--nexus-text-primary)'; this.style.backgroundColor='var(--nexus-bg-tertiary)';"
                onmouseout="this.style.color='var(--nexus-text-secondary)'; this.style.backgroundColor='transparent';"
                >
                    <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                        <path :class="{'hidden': open, 'inline-flex': ! open }" class="inline-flex" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        <path :class="{'hidden': ! open, 'inline-flex': open }" class="hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Responsive Navigation Menu -->
    <div :class="{'block': open, 'hidden': ! open}" class="hidden lg:hidden">
        <div class="pt-2 pb-3 space-y-1">
            @foreach($mainNavigation as $navItem)
                @if($navItem['hasChildren'] ?? false)
                    <!-- 響應式多層級導航（展開顯示） -->
                    <div class="px-4 py-2">
                        <div class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" 
                             style="color: var(--nexus-text-secondary);">
                            {{ $navItem['title'] }}
                        </div>
                        <div class="mt-2 space-y-1 pl-4">
                            @foreach($navItem['children'] as $child)
                                <x-responsive-nav-link 
                                    :href="$child['route'] ?? '#'" 
                                    :active="$child['isActive'] ?? false"
                                >
                                    @if(isset($child['icon']))
                                        <span class="mr-3 w-4 h-4">{!! $child['icon'] !!}</span>
                                    @endif
                                    {{ $child['title'] }}
                                    @if(isset($child['badge']) && $child['badge'])
                                        <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                            {{ $child['badge'] }}
                                        </span>
                                    @endif
                                </x-responsive-nav-link>
                            @endforeach
                        </div>
                    </div>
                @else
                    <!-- 響應式單層導航 -->
                    <x-responsive-nav-link 
                        :href="$navItem['route'] ?? '#'" 
                        :active="$navItem['isActive'] ?? false"
                    >
                        @if(isset($navItem['icon']))
                            <span class="mr-3 w-4 h-4">{!! $navItem['icon'] !!}</span>
                        @endif
                        {{ $navItem['title'] }}
                        @if(isset($navItem['badge']) && $navItem['badge'])
                            <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                {{ $navItem['badge'] }}
                            </span>
                        @endif
                    </x-responsive-nav-link>
                @endif
            @endforeach
        </div>

        <!-- Responsive Settings Options -->
        <div class="pt-4 pb-1 border-t border-gray-200 dark:border-gray-600" style="border-color: var(--nexus-border-secondary);">
            <div class="px-4">
                <div class="font-medium text-base text-gray-800 dark:text-gray-200" style="color: var(--nexus-text-primary);">{{ Auth::user() ? Auth::user()->name : '測試用戶' }}</div>
                <div class="font-medium text-sm text-gray-500 dark:text-gray-400" style="color: var(--nexus-text-secondary);">{{ Auth::user() ? Auth::user()->email : 'test@example.com' }}</div>
            </div>

            <div class="mt-3 space-y-1">
                <!-- Theme Toggle for Mobile -->
                <div class="px-4 py-2">
                    <button 
                        data-theme-toggle 
                        class="theme-toggle w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition duration-150 ease-in-out"
                        style="color: var(--nexus-text-secondary);"
                        onmouseover="this.style.color='var(--nexus-text-primary)'; this.style.backgroundColor='var(--nexus-bg-tertiary)';"
                        onmouseout="this.style.color='var(--nexus-text-secondary)'; this.style.backgroundColor='transparent';"
                        aria-label="切換主題">
                        <span class="text-sm font-medium">主題設定</span>
                        <div class="flex items-center space-x-2">
                            <!-- 太陽圖標（淺色主題） -->
                            <svg class="theme-toggle-sun w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                            <!-- 月亮圖標（暗色主題） -->
                            <svg class="theme-toggle-moon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                            </svg>
                        </div>
                    </button>
                </div>
                
                <x-responsive-nav-link :href="route('profile.edit')">
                    {{ __('Profile') }}
                </x-responsive-nav-link>

                <!-- Authentication -->
                <form method="POST" action="{{ route('logout') }}">
                    @csrf

                    <x-responsive-nav-link :href="route('logout')"
                            onclick="event.preventDefault();
                                        this.closest('form').submit();">
                        {{ __('Log Out') }}
                    </x-responsive-nav-link>
                </form>
            </div>
        </div>
    </div>
</nav>
