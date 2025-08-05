<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Collection;

/**
 * NavigationService
 * 
 * 處理導航結構的載入、權限檢查、狀態管理等功能
 */
class NavigationService
{
    /**
     * 快取鍵前綴
     */
    const CACHE_PREFIX = 'nexus_nav_';

    /**
     * 獲取主導航結構
     * 
     * @param string|null $activeRoute 當前活動路由
     * @return array
     */
    public function getMainNavigation(?string $activeRoute = null): array
    {
        $user = Auth::user();
        $cacheKey = self::CACHE_PREFIX . 'main_' . ($user->id ?? 'guest');
        
        $navigation = Cache::remember($cacheKey, $this->getCacheDuration(), function () use ($user) {
            $rawNavigation = Config::get('navigation.main_navigation', []);
            return $this->processNavigation($rawNavigation, $user);
        });

        // 設定活動狀態
        if ($activeRoute) {
            $navigation = $this->setActiveStates($navigation, $activeRoute);
        }

        return $navigation;
    }

    /**
     * 獲取快速操作選單
     * 
     * @return array
     */
    public function getQuickActions(): array
    {
        $user = Auth::user();
        $cacheKey = self::CACHE_PREFIX . 'quick_' . ($user->id ?? 'guest');
        
        return Cache::remember($cacheKey, $this->getCacheDuration(), function () use ($user) {
            $rawActions = Config::get('navigation.quick_actions', []);
            return $this->processNavigation($rawActions, $user);
        });
    }

    /**
     * 獲取使用者選單
     * 
     * @return array
     */
    public function getUserMenu(): array
    {
        $user = Auth::user();
        $cacheKey = self::CACHE_PREFIX . 'user_' . ($user->id ?? 'guest');
        
        return Cache::remember($cacheKey, $this->getCacheDuration(), function () use ($user) {
            $rawMenu = Config::get('navigation.user_menu', []);
            return $this->processNavigation($rawMenu, $user);
        });
    }

    /**
     * 處理導航結構
     * 
     * @param array $navigation
     * @param mixed $user
     * @return array
     */
    protected function processNavigation(array $navigation, $user): array
    {
        $processed = [];

        foreach ($navigation as $item) {
            // 跳過分隔線
            if ($item === 'divider') {
                $processed[] = ['type' => 'divider'];
                continue;
            }

            // 權限檢查
            if (!$this->checkPermissions($item, $user)) {
                continue;
            }

            // 處理基本項目資料
            $processedItem = $this->processNavigationItem($item);

            // 處理子項目
            if (isset($item['children']) && is_array($item['children'])) {
                $processedChildren = [];
                foreach ($item['children'] as $child) {
                    if ($this->checkPermissions($child, $user)) {
                        $processedChildren[] = $this->processNavigationItem($child);
                    }
                }
                
                // 如果沒有可訪問的子項目，跳過此項目
                if (empty($processedChildren)) {
                    continue;
                }
                
                $processedItem['children'] = $processedChildren;
                $processedItem['hasChildren'] = true;
            } else {
                $processedItem['hasChildren'] = false;
            }

            $processed[] = $processedItem;
        }

        // 按優先級排序
        usort($processed, function ($a, $b) {
            $priorityA = $a['priority'] ?? 999;
            $priorityB = $b['priority'] ?? 999;
            return $priorityA <=> $priorityB;
        });

        return $processed;
    }

    /**
     * 處理單個導航項目
     * 
     * @param array $item
     * @return array
     */
    protected function processNavigationItem(array $item): array
    {
        $processedItem = [
            'id' => $item['id'] ?? uniqid('nav_'),
            'title' => $item['title'] ?? '未命名',
            'route' => $this->processRoute($item['route'] ?? null),
            'icon' => $item['icon'] ?? null,
            'description' => $item['description'] ?? null,
            'badge' => $this->processBadge($item),
            'badgeType' => $item['badgeType'] ?? 'default',
            'activePattern' => $item['activePattern'] ?? null,
            'permissions' => $item['permissions'] ?? [],
            'priority' => $item['priority'] ?? 999,
            'type' => $item['type'] ?? 'link',
            'isActive' => false,
        ];

        // 處理特殊動作
        if (isset($item['actions'])) {
            $processedItem['actions'] = $item['actions'];
        }

        return $processedItem;
    }

    /**
     * 處理路由
     * 
     * @param string|null $route
     * @return string|null
     */
    protected function processRoute(?string $route): ?string
    {
        if (!$route) {
            return null;
        }

        // 如果是完整 URL，直接返回
        if (str_starts_with($route, 'http')) {
            return $route;
        }

        // 嘗試生成路由 URL
        try {
            return route($route);
        } catch (\Exception $e) {
            // 如果路由不存在，返回 #
            \Log::warning("Navigation route '{$route}' not found", ['exception' => $e->getMessage()]);
            return '#';
        }
    }

    /**
     * 處理徽章
     * 
     * @param array $item
     * @return string|null
     */
    protected function processBadge(array $item): ?string
    {
        if (!isset($item['badge'])) {
            return null;
        }

        $badge = $item['badge'];

        // 如果是動態徽章，嘗試獲取實際值
        if (is_string($badge) && str_starts_with($badge, 'dynamic:')) {
            $method = substr($badge, 8);
            return $this->getDynamicBadgeValue($method);
        }

        return (string) $badge;
    }

    /**
     * 獲取動態徽章值
     * 
     * @param string $method
     * @return string|null
     */
    protected function getDynamicBadgeValue(string $method): ?string
    {
        try {
            switch ($method) {
                case 'pending_quotes':
                    return $this->getPendingQuotesCount();
                case 'low_stock_items':
                    return $this->getLowStockItemsCount();
                case 'pending_orders':
                    return $this->getPendingOrdersCount();
                default:
                    return null;
            }
        } catch (\Exception $e) {
            \Log::warning("Failed to get dynamic badge value for '{$method}'", ['exception' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 權限檢查
     * 
     * @param array $item
     * @param mixed $user
     * @return bool
     */
    protected function checkPermissions(array $item, $user): bool
    {
        // 如果未啟用權限檢查
        if (!Config::get('navigation.settings.enable_permissions', false)) {
            return true;
        }

        // 如果沒有定義權限要求
        if (!isset($item['permissions']) || empty($item['permissions'])) {
            return true;
        }

        // 如果用戶未登入但配置允許公開訪問
        if (!$user) {
            return Config::get('navigation.settings.allow_guest_access', true);
        }

        $permissions = $item['permissions'];
        
        // 檢查用戶是否擁有任一所需權限
        foreach ($permissions as $permission) {
            // 如果用戶沒有權限系統，暫時允許訪問（開發階段）
            try {
                if (method_exists($user, 'can') && $user->can($permission)) {
                    return true;
                }
            } catch (\Exception $e) {
                // 權限系統尚未完全實現，暫時允許訪問
                return Config::get('navigation.settings.allow_without_permissions', true);
            }
        }

        return Config::get('navigation.settings.allow_without_permissions', true);
    }

    /**
     * 設定活動狀態
     * 
     * @param array $navigation
     * @param string $activeRoute
     * @return array
     */
    protected function setActiveStates(array $navigation, string $activeRoute): array
    {
        foreach ($navigation as &$item) {
            $item['isActive'] = $this->isItemActive($item, $activeRoute);

            if (isset($item['children'])) {
                foreach ($item['children'] as &$child) {
                    $child['isActive'] = $this->isItemActive($child, $activeRoute);
                    
                    // 如果子項目是活動的，父項目也標記為活動
                    if ($child['isActive']) {
                        $item['isActive'] = true;
                    }
                }
            }
        }

        return $navigation;
    }

    /**
     * 判斷項目是否為活動狀態
     * 
     * @param array $item
     * @param string $activeRoute
     * @return bool
     */
    protected function isItemActive(array $item, string $activeRoute): bool
    {
        // 精確路由匹配
        if (isset($item['route'])) {
            $itemRoute = $item['route'];
            if (is_string($itemRoute) && !str_starts_with($itemRoute, 'http')) {
                try {
                    if (route($itemRoute) === url()->current()) {
                        return true;
                    }
                } catch (\Exception $e) {
                    // 忽略路由錯誤
                }
            }
        }

        // 模式匹配
        if (isset($item['activePattern'])) {
            $pattern = $item['activePattern'];
            if (preg_match('/^' . str_replace('/', '\/', $pattern) . '$/', $activeRoute)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 清除導航快取
     * 
     * @param int|null $userId
     * @return bool
     */
    public function clearCache(?int $userId = null): bool
    {
        $patterns = [
            self::CACHE_PREFIX . 'main_',
            self::CACHE_PREFIX . 'quick_',
            self::CACHE_PREFIX . 'user_',
        ];

        if ($userId) {
            foreach ($patterns as $pattern) {
                Cache::forget($pattern . $userId);
            }
        } else {
            // 清除所有導航快取（開發模式用）
            Cache::flush();
        }

        return true;
    }

    /**
     * 獲取快取持續時間
     * 
     * @return int
     */
    protected function getCacheDuration(): int
    {
        if (Config::get('navigation.settings.reload_in_debug') && config('app.debug')) {
            return 60; // 開發模式下短快取
        }

        return Config::get('navigation.settings.cache_duration', 3600);
    }

    /**
     * 記錄導航點擊事件
     * 
     * @param string $itemId
     * @param array $context
     * @return void
     */
    public function trackNavigation(string $itemId, array $context = []): void
    {
        if (!Config::get('navigation.settings.enable_analytics', true)) {
            return;
        }

        try {
            // 記錄到日誌或分析服務
            \Log::info('Navigation clicked', [
                'item_id' => $itemId,
                'user_id' => Auth::id(),
                'timestamp' => now(),
                'context' => $context,
            ]);

            // 在這裡可以整合外部分析服務
            // event(new NavigationClicked($itemId, Auth::user(), $context));

        } catch (\Exception $e) {
            \Log::warning('Failed to track navigation', ['exception' => $e->getMessage()]);
        }
    }

    /**
     * 獲取待處理報價數量
     * 
     * @return string
     */
    protected function getPendingQuotesCount(): string
    {
        // 這裡應該查詢實際的資料庫
        // return Quote::where('status', 'pending')->count();
        return '2'; // 示例值
    }

    /**
     * 獲取低庫存商品數量
     * 
     * @return string
     */
    protected function getLowStockItemsCount(): string
    {
        // 這裡應該查詢實際的資料庫
        // return Product::whereRaw('stock_quantity <= reorder_level')->count();
        return '5'; // 示例值
    }

    /**
     * 獲取待處理訂單數量
     * 
     * @return string
     */
    protected function getPendingOrdersCount(): string
    {
        // 這裡應該查詢實際的資料庫
        // return Order::where('status', 'pending')->count();
        return '3'; // 示例值
    }

    /**
     * 生成麵包屑導航
     * 
     * @param string|null $routeName
     * @param \Illuminate\Http\Request $request
     * @return array
     */
    public function generateBreadcrumbs(?string $routeName, $request): array
    {
        if (!$routeName) {
            return [];
        }

        $breadcrumbs = [];
        
        // 始終包含首頁
        $breadcrumbs[] = [
            'title' => '首頁',
            'url' => route('dashboard'),
            'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path></svg>'
        ];

        // 根據路由名稱生成麵包屑
        $breadcrumbMap = $this->getBreadcrumbMap();
        
        if (isset($breadcrumbMap[$routeName])) {
            $routeBreadcrumbs = $breadcrumbMap[$routeName];
            
            // 如果是回調函數，執行它
            if (is_callable($routeBreadcrumbs)) {
                $routeBreadcrumbs = $routeBreadcrumbs($request);
            }
            
            $breadcrumbs = array_merge($breadcrumbs, $routeBreadcrumbs);
        } else {
            // 嘗試根據路由名稱自動生成
            $breadcrumbs = array_merge($breadcrumbs, $this->generateAutoBreadcrumbs($routeName, $request));
        }

        return $breadcrumbs;
    }

    /**
     * 獲取麵包屑映射表
     * 
     * @return array
     */
    protected function getBreadcrumbMap(): array
    {
        return [
            // 客戶管理
            'customers.index' => [
                ['title' => '客戶管理', 'url' => null]
            ],
            'customers.show' => function($request) {
                $customer = $request->route('customer');
                return [
                    ['title' => '客戶管理', 'url' => route('customers.index')],
                    ['title' => $customer ? $customer->name : '客戶詳情', 'url' => null]
                ];
            },
            'customers.create' => [
                ['title' => '客戶管理', 'url' => route('customers.index')],
                ['title' => '新增客戶', 'url' => null]
            ],
            'customers.edit' => function($request) {
                $customer = $request->route('customer');
                return [
                    ['title' => '客戶管理', 'url' => route('customers.index')],
                    ['title' => $customer ? $customer->name : '客戶', 'url' => $customer ? route('customers.show', $customer) : null],
                    ['title' => '編輯', 'url' => null]
                ];
            },

            // 產品管理
            'products.index' => [
                ['title' => '產品管理', 'url' => null]
            ],
            'products.show' => function($request) {
                $product = $request->route('product');
                return [
                    ['title' => '產品管理', 'url' => route('products.index')],
                    ['title' => $product ? $product->name : '產品詳情', 'url' => null]
                ];
            },
            'products.create' => [
                ['title' => '產品管理', 'url' => route('products.index')],
                ['title' => '新增產品', 'url' => null]
            ],
            'products.edit' => function($request) {
                $product = $request->route('product');
                return [
                    ['title' => '產品管理', 'url' => route('products.index')],
                    ['title' => $product ? $product->name : '產品', 'url' => $product ? route('products.show', $product) : null],
                    ['title' => '編輯', 'url' => null]
                ];
            },

            // 供應商管理
            'suppliers.index' => [
                ['title' => '供應商管理', 'url' => null]
            ],
            'suppliers.show' => function($request) {
                $supplier = $request->route('supplier');
                return [
                    ['title' => '供應商管理', 'url' => route('suppliers.index')],
                    ['title' => $supplier ? $supplier->name : '供應商詳情', 'url' => null]
                ];
            },
            'suppliers.create' => [
                ['title' => '供應商管理', 'url' => route('suppliers.index')],
                ['title' => '新增供應商', 'url' => null]
            ],
            'suppliers.edit' => function($request) {
                $supplier = $request->route('supplier');
                return [
                    ['title' => '供應商管理', 'url' => route('suppliers.index')],
                    ['title' => $supplier ? $supplier->name : '供應商', 'url' => $supplier ? route('suppliers.show', $supplier) : null],
                    ['title' => '編輯', 'url' => null]
                ];
            },

            // 訂單管理
            'orders.purchase.index' => [
                ['title' => '採購訂單', 'url' => null]
            ],
            'orders.sales.index' => [
                ['title' => '銷售訂單', 'url' => null]
            ],
            'orders.purchase.show' => function($request) {
                $order = $request->route('order');
                return [
                    ['title' => '採購訂單', 'url' => route('orders.purchase.index')],
                    ['title' => $order ? "訂單 #{$order->id}" : '訂單詳情', 'url' => null]
                ];
            },
            'orders.sales.show' => function($request) {
                $order = $request->route('order');
                return [
                    ['title' => '銷售訂單', 'url' => route('orders.sales.index')],
                    ['title' => $order ? "訂單 #{$order->id}" : '訂單詳情', 'url' => null]
                ];
            },

            // 報價管理
            'quotes.index' => [
                ['title' => '報價管理', 'url' => null]
            ],
            'quotes.show' => function($request) {
                $quote = $request->route('quote');
                return [
                    ['title' => '報價管理', 'url' => route('quotes.index')],
                    ['title' => $quote ? "報價 #{$quote->id}" : '報價詳情', 'url' => null]
                ];
            },
            'quotes.create' => [
                ['title' => '報價管理', 'url' => route('quotes.index')],
                ['title' => '新增報價', 'url' => null]
            ],
            'quotes.edit' => function($request) {
                $quote = $request->route('quote');
                return [
                    ['title' => '報價管理', 'url' => route('quotes.index')],
                    ['title' => $quote ? "報價 #{$quote->id}" : '報價', 'url' => $quote ? route('quotes.show', $quote) : null],
                    ['title' => '編輯', 'url' => null]
                ];
            },

            // 報表分析
            'reports.index' => [
                ['title' => '報表分析', 'url' => null]
            ],

            // 個人資料
            'profile.edit' => [
                ['title' => '個人資料', 'url' => null]
            ],
        ];
    }

    /**
     * 自動生成麵包屑（用於未預定義的路由）
     * 
     * @param string $routeName
     * @param \Illuminate\Http\Request $request
     * @return array
     */
    protected function generateAutoBreadcrumbs(string $routeName, $request): array
    {
        $breadcrumbs = [];
        $routeParts = explode('.', $routeName);
        
        // 嘗試根據路由部分生成麵包屑
        $routeTranslations = [
            'customers' => '客戶管理',
            'products' => '產品管理',
            'suppliers' => '供應商管理',
            'orders' => '訂單管理',
            'quotes' => '報價管理',
            'reports' => '報表分析',
            'profile' => '個人資料',
            'purchase' => '採購',
            'sales' => '銷售',
            'index' => '列表',
            'show' => '詳情',
            'create' => '新增',
            'edit' => '編輯',
        ];

        $url = null;
        for ($i = 0; $i < count($routeParts); $i++) {
            $part = $routeParts[$i];
            
            if (isset($routeTranslations[$part])) {
                $title = $routeTranslations[$part];
                
                // 對於最後一部分，不生成 URL
                if ($i === count($routeParts) - 1) {
                    $url = null;
                } else {
                    // 嘗試生成中間路由的 URL
                    $intermediateRoute = implode('.', array_slice($routeParts, 0, $i + 1));
                    if ($intermediateRoute !== $routeName) {
                        try {
                            $url = route($intermediateRoute . '.index');
                        } catch (\Exception $e) {
                            $url = null;
                        }
                    } else {
                        $url = null;
                    }
                }
                
                $breadcrumbs[] = [
                    'title' => $title,
                    'url' => $url
                ];
            }
        }

        return $breadcrumbs;
    }
}