<?php

/**
 * NexusERP 導航配置文件
 * 定義多層級導航結構、權限和路由映射
 */

return [
    /*
    |--------------------------------------------------------------------------
    | 主導航結構
    |--------------------------------------------------------------------------
    |
    | 定義應用程式的主要導航結構，支援多層級分組
    | 每個項目可包含：title, route, icon, children, permissions, badge 等
    |
    */

    'main_navigation' => [
        [
            'id' => 'dashboard',
            'title' => '儀表板',
            'route' => 'dashboard',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>',
            'activePattern' => '^dashboard.*',
            'permissions' => ['view_dashboard'],
            'priority' => 1,
        ],

        [
            'id' => 'crm',
            'title' => '客戶關係管理',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
            'activePattern' => '^(customers|quotes).*',
            'permissions' => ['view_customers', 'view_quotes'],
            'priority' => 2,
            'children' => [
                [
                    'id' => 'customers',
                    'title' => '客戶管理',
                    'route' => 'customers.index',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>',
                    'description' => '管理客戶資料、聯絡資訊與交易記錄',
                    'activePattern' => '^customers.*',
                    'permissions' => ['view_customers'],
                ],
                [
                    'id' => 'quotes',
                    'title' => '報價管理',
                    'route' => 'quotes.index',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
                    'description' => '建立和管理客戶報價單',
                    'activePattern' => '^quotes.*',
                    'permissions' => ['view_quotes'],
                    'badge' => '2',
                    'badgeType' => 'warning',
                ],
            ],
        ],

        [
            'id' => 'inventory',
            'title' => '產品與庫存',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>',
            'activePattern' => '^(products|inventory).*',
            'permissions' => ['view_products', 'view_inventory'],
            'priority' => 3,
            'children' => [
                [
                    'id' => 'products',
                    'title' => '商品管理',
                    'route' => 'products.index',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>',
                    'description' => '產品資料、分類、定價與規格管理',
                    'activePattern' => '^products.*',
                    'permissions' => ['view_products'],
                ],
                [
                    'id' => 'inventory-levels',
                    'title' => '庫存水準',
                    'route' => 'inventory.levels',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
                    'description' => '即時庫存數量、安全庫存與補貨提醒',
                    'activePattern' => '^inventory\.levels.*',
                    'permissions' => ['view_inventory'],
                    'badge' => '5',
                    'badgeType' => 'danger',
                ],
                [
                    'id' => 'inventory-transactions',
                    'title' => '庫存異動',
                    'route' => 'inventory.transactions',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>',
                    'description' => '入庫、出庫、調撥等庫存異動記錄',
                    'activePattern' => '^inventory\.transactions.*',
                    'permissions' => ['view_inventory'],
                ],
            ],
        ],

        [
            'id' => 'procurement',
            'title' => '採購管理',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-8m-9 4h6"></path></svg>',
            'activePattern' => '^(suppliers|orders\.purchase).*',
            'permissions' => ['view_suppliers', 'view_purchase_orders'],
            'priority' => 4,
            'children' => [
                [
                    'id' => 'suppliers',
                    'title' => '供應商管理',
                    'route' => 'suppliers.index',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>',
                    'description' => '供應商資料、合約與績效管理',
                    'activePattern' => '^suppliers.*',
                    'permissions' => ['view_suppliers'],
                ],
                [
                    'id' => 'purchase-orders',
                    'title' => '採購訂單',
                    'route' => 'orders.purchase.index',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>',
                    'description' => '採購需求、訂單建立與收貨管理',
                    'activePattern' => '^orders\.purchase.*',
                    'permissions' => ['view_purchase_orders'],
                    'badge' => '3',
                    'badgeType' => 'info',
                ],
            ],
        ],

        [
            'id' => 'sales',
            'title' => '銷售管理',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            'activePattern' => '^(orders\.sales|invoices).*',
            'permissions' => ['view_sales_orders', 'view_invoices'],
            'priority' => 5,
            'children' => [
                [
                    'id' => 'sales-orders',
                    'title' => '銷售訂單',
                    'route' => 'orders.sales.index',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
                    'description' => '客戶訂單建立、追蹤與出貨管理',
                    'activePattern' => '^orders\.sales.*',
                    'permissions' => ['view_sales_orders'],
                    'badge' => '8',
                    'badgeType' => 'success',
                ],
                [
                    'id' => 'invoices',
                    'title' => '發票管理',
                    'route' => 'invoices.index',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
                    'description' => '發票開立、付款追蹤與帳務管理',
                    'activePattern' => '^invoices.*',
                    'permissions' => ['view_invoices'],
                ],
            ],
        ],

        [
            'id' => 'reports',
            'title' => '分析與報表',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
            'activePattern' => '^(reports|analytics).*',
            'permissions' => ['view_reports', 'view_analytics'],
            'priority' => 6,
            'children' => [
                [
                    'id' => 'reports-overview',
                    'title' => '報表分析',
                    'route' => 'reports.index',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
                    'description' => '財務、銷售、庫存等各類營運報表',
                    'activePattern' => '^reports.*',
                    'permissions' => ['view_reports'],
                ],
                [
                    'id' => 'analytics',
                    'title' => '業績統計',
                    'route' => 'analytics.index',
                    'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>',
                    'description' => '業績趨勢、KPI 監控與數據分析',
                    'activePattern' => '^analytics.*',
                    'permissions' => ['view_analytics'],
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | 快速操作選單
    |--------------------------------------------------------------------------
    |
    | 常用功能的快速存取
    |
    */

    'quick_actions' => [
        [
            'id' => 'new-order',
            'title' => '新增訂單',
            'route' => 'orders.sales.create',
            'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>',
            'permissions' => ['create_sales_orders'],
            'type' => 'primary',
        ],
        [
            'id' => 'new-quote',
            'title' => '建立報價',
            'route' => 'quotes.create',
            'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>',
            'permissions' => ['create_quotes'],
            'type' => 'secondary',
        ],
        [
            'id' => 'new-product',
            'title' => '新增產品',
            'route' => 'products.create',
            'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>',
            'permissions' => ['create_products'],
            'type' => 'secondary',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | 使用者選單
    |--------------------------------------------------------------------------
    |
    | 使用者帳戶相關操作
    |
    */

    'user_menu' => [
        [
            'id' => 'profile',
            'title' => '個人資料',
            'route' => 'profile.edit',
            'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>',
        ],
        'divider',
        [
            'id' => 'logout',
            'title' => '登出',
            'route' => 'logout',
            'icon' => '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>',
            'type' => 'logout',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | 導航設定
    |--------------------------------------------------------------------------
    |
    | 導航行為和外觀設定
    |
    */

    'settings' => [
        // 是否啟用權限檢查
        'enable_permissions' => false,
        // 允許訪客訪問
        'allow_guest_access' => true,
        // 允許沒有權限系統的訪問
        'allow_without_permissions' => true,

        // 是否顯示徽章
        'show_badges' => true,

        // 是否顯示圖示
        'show_icons' => true,

        // 預設導航大小
        'default_size' => 'default', // compact | default | large

        // 行動版導航模式
        'mobile_mode' => 'bottom', // bottom | sidebar | overlay

        // 是否啟用導航分析
        'enable_analytics' => true,

        // 快取設定
        'cache_duration' => 3600, // 秒

        // 是否在開發模式下重新載入配置
        'reload_in_debug' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | 權限映射
    |--------------------------------------------------------------------------
    |
    | 定義導航項目與權限的對應關係
    |
    */

    'permissions' => [
        'view_dashboard' => '查看儀表板',
        'view_customers' => '查看客戶',
        'view_quotes' => '查看報價',
        'view_products' => '查看產品',
        'view_inventory' => '查看庫存',
        'view_suppliers' => '查看供應商',
        'view_purchase_orders' => '查看採購訂單',
        'view_sales_orders' => '查看銷售訂單',
        'view_invoices' => '查看發票',
        'view_reports' => '查看報表',
        'view_analytics' => '查看分析',
        'create_sales_orders' => '建立銷售訂單',
        'create_quotes' => '建立報價',
        'create_products' => '建立產品',
        'access_settings' => '存取設定',
    ],
];