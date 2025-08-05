<?php

/**
 * NexusERP Web Routes
 * Modular route structure with automatic loading
 */

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Api\CompanyManagementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('landing');
});

Route::get('/test', function () {
    return view('test');
});

Route::get('/test-cash-flow-colors', function () {
    return view('test-cash-flow');
});

// Temporary test routes for inventory pages (bypass authentication)
Route::get('/test-inventory-levels', function () {
    try {
        return view('inventory.levels');
    } catch (\Exception $e) {
        return response('<h1>View Error: ' . $e->getMessage() . '</h1>', 500);
    }
})->name('test.inventory.levels');

Route::get('/test-inventory-transactions', function () {
    try {
        return view('inventory.transactions');
    } catch (\Exception $e) {
        return response('<h1>View Error: ' . $e->getMessage() . '</h1>', 500);
    }
})->name('test.inventory.transactions');

// Raw HTML test for inventory levels
Route::get('/test-inventory-raw', function () {
    return '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="csrf-token" content="' . csrf_token() . '">
    <title>庫存水準測試</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-4">
        <h1>庫存水準</h1>
        <div class="table-responsive">
            <table class="table table-hover" id="inventory-levels-table">
                <thead class="table-light">
                    <tr>
                        <th>SKU</th>
                        <th>產品名稱</th>
                        <th>類別</th>
                        <th>倉庫位置</th>
                        <th>現有數量</th>
                        <th>保留數量</th>
                        <th>可用數量</th>
                        <th>狀態</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="inventory-levels-tbody">
                    <!-- 資料將由 JavaScript 動態填充 -->
                </tbody>
            </table>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
    // 簡化版的表格載入
    document.addEventListener("DOMContentLoaded", function() {
        fetch("/api/inventory/levels")
            .then(response => response.json())
            .then(data => {
                const tbody = document.getElementById("inventory-levels-tbody");
                let html = "";
                
                data.data.forEach(item => {
                    html += `<tr>
                        <td>${item.sku}</td>
                        <td>${item.product_name}</td>
                        <td>${item.category_name}</td>
                        <td>${item.warehouse_location}</td>
                        <td>${item.current_quantity}</td>
                        <td>${item.reserved_quantity}</td>
                        <td>${item.available_quantity}</td>
                        <td><span class="badge bg-${item.status === "normal" ? "success" : item.status === "low" ? "warning" : "danger"}">${item.status}</span></td>
                        <td><button class="btn btn-sm btn-primary">編輯</button></td>
                    </tr>`;
                });
                
                tbody.innerHTML = html;
            })
            .catch(error => {
                console.error("Error loading data:", error);
                document.getElementById("inventory-levels-tbody").innerHTML = 
                    `<tr><td colspan="9" class="text-center text-danger">載入數據時發生錯誤: ${error.message}</td></tr>`;
            });
    });
    </script>
</body>
</html>';
})->name('test.inventory.raw');

Route::get('/debug-session', function () {
    return response()->json([
        'current_company_id' => session('current_company_id'),
        'user_id' => auth()->id(),
        'all_session' => session()->all()
    ]);
})->middleware('auth');

/*
|--------------------------------------------------------------------------
| Dashboard Route
|--------------------------------------------------------------------------
*/

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified', \App\Http\Middleware\SetCompanyContext::class, \App\Http\Middleware\EnsureCompanySetup::class])->name('dashboard');

/*
|--------------------------------------------------------------------------
| Authenticated User Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', \App\Http\Middleware\SetCompanyContext::class])->group(function () {
    
    // Business Setup Routes (for OAuth users)
    Route::get('/auth/business-setup', [\App\Http\Controllers\Auth\BusinessSetupController::class, 'show'])->name('auth.business-setup');
    Route::post('/auth/business-setup', [\App\Http\Controllers\Auth\BusinessSetupController::class, 'store'])->name('auth.business-setup.store');
    Route::post('/auth/business-setup/ai-analyze', [\App\Http\Controllers\Auth\BusinessSetupController::class, 'analyzeBusinessWithAI'])->name('auth.business-setup.ai-analyze');

    // Profile Routes  
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /*
    |--------------------------------------------------------------------------
    | Legacy Routes (To be migrated)
    |--------------------------------------------------------------------------
    | These routes will eventually be moved to their respective modules
    */
    
    // Employee Management Routes (legacy - to be moved to HR module)
    Route::prefix('employees')->group(function () {
        Route::get('/', function () {
            return view('employees.index');
        })->name('employees.index');
        
        Route::get('/create', function () {
            return view('employees.create');
        })->name('employees.create');
        
        Route::get('/{id}', function ($id) {
            return view('employees.show', ['employeeId' => $id]);
        })->name('employees.show');
        
        Route::get('/{id}/edit', function ($id) {
            return view('employees.edit', ['employeeId' => $id]);
        })->name('employees.edit');
    });

    // Attendance Management Routes (legacy - to be moved to HR module)
    Route::prefix('attendance')->group(function () {
        Route::get('/', function () {
            return view('attendance.index');
        })->name('attendance.index');
        
        Route::get('/clock', function () {
            return view('attendance.clock');
        })->name('attendance.clock');
        
        Route::get('/reports', function () {
            return view('attendance.reports');
        })->name('attendance.reports');
    });

    // Marketplace Routes (legacy - to be moved to marketplace module)
    Route::prefix('marketplace')->name('marketplace.')->group(function () {
        Route::get('/', function () {
            return view('marketplace.products.browse');
        })->name('index');
        
        Route::get('/products', function () {
            return view('marketplace.products.browse');
        })->name('products.browse');
        
        Route::get('/products/{id}', function ($id) {
            return view('marketplace.products.detail', ['productId' => $id]);
        })->name('products.detail');

        Route::prefix('supplier')->name('supplier.')->group(function () {
            Route::get('/register', function () {
                return view('marketplace.supplier.register');
            })->name('register');
            
            Route::get('/register/step/{step}', function ($step) {
                return view('marketplace.supplier.register', ['currentStep' => (int)$step]);
            })->name('register.step')->where('step', '[1-4]');
            
            Route::get('/register/success', function () {
                return view('marketplace.supplier.success');
            })->name('register.success');

            Route::get('/dashboard', function () {
                return view('marketplace.supplier.dashboard');
            })->name('dashboard');
            
            Route::get('/products', function () {
                return view('marketplace.supplier.dashboard');
            })->name('products');
        });
    });

    // Invoice OCR Routes (legacy - to be moved to finance module)
    Route::prefix('invoice')->group(function () {
        Route::get('/upload', function () {
            return view('invoice.upload');
        })->name('invoice.upload');
        
        Route::get('/ocr', function () {
            return view('invoice.upload');
        })->name('invoice.ocr');
    });

    // Test Routes (temporary)
    Route::get('/test-stocktaking', function () {
        return view('test-stocktaking');
    })->name('test.stocktaking');
});

/*
|--------------------------------------------------------------------------
| Load Modular Routes
|--------------------------------------------------------------------------
| This automatically loads all route modules from routes/modules/
*/

require __DIR__ . '/modules/_loader.php';

/*
|--------------------------------------------------------------------------
| Dashboard API Routes (Moved from api.php)
|--------------------------------------------------------------------------
| These routes require full web middleware stack including sessions and 
| CSRF tokens for proper authentication.
*/
Route::prefix('api/dashboard')->middleware(['auth', \App\Http\Middleware\SetCompanyContext::class, \App\Http\Middleware\EnsureCompanySetup::class])->group(function () {
    Route::get('/', [App\Http\Controllers\Api\DashboardController::class, 'index'])->name('api.dashboard.data');
    Route::get('/stats', [App\Http\Controllers\Api\DashboardController::class, 'getStats'])->name('api.dashboard.stats');
    Route::get('/low-stock', [App\Http\Controllers\Api\DashboardController::class, 'getLowStockItems'])->name('api.dashboard.low-stock');
    Route::get('/realtime', [App\Http\Controllers\Api\DashboardController::class, 'realtime'])->name('api.dashboard.realtime');
    Route::get('/charts', [App\Http\Controllers\Api\DashboardController::class, 'getChartData'])->name('api.dashboard.charts');
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->name('admin.')->middleware(['admin'])->group(function () {
    // Admin Dashboard
    Route::get('/', function () {
        return view('admin.dashboard');
    })->name('dashboard');
    
    // User Management
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AdminUserController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\Admin\AdminUserController::class, 'create'])->name('create');
        Route::post('/store', [\App\Http\Controllers\Admin\AdminUserController::class, 'store'])->name('store');
        Route::get('/{id}', [\App\Http\Controllers\Admin\AdminUserController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [\App\Http\Controllers\Admin\AdminUserController::class, 'edit'])->name('edit');
        Route::put('/{id}', [\App\Http\Controllers\Admin\AdminUserController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\Admin\AdminUserController::class, 'destroy'])->name('destroy');
    });
    
    // Order Management
    Route::prefix('orders')->name('orders.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AdminOrderController::class, 'index'])->name('index');
        Route::get('/{id}', [\App\Http\Controllers\Admin\AdminOrderController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [\App\Http\Controllers\Admin\AdminOrderController::class, 'edit'])->name('edit');
        Route::put('/{id}', [\App\Http\Controllers\Admin\AdminOrderController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\Admin\AdminOrderController::class, 'destroy'])->name('destroy');
    });
    
    // Financial Management
    Route::prefix('finance')->name('finance.')->group(function () {
        Route::get('/receivables', [\App\Http\Controllers\Admin\AdminFinanceController::class, 'receivables'])->name('receivables');
        Route::get('/receivables/{id}', [\App\Http\Controllers\Admin\AdminFinanceController::class, 'showReceivable'])->name('receivables.show');
        Route::get('/payables', [\App\Http\Controllers\Admin\AdminFinanceController::class, 'payables'])->name('payables');
        Route::get('/payables/{id}', [\App\Http\Controllers\Admin\AdminFinanceController::class, 'showPayable'])->name('payables.show');
        Route::get('/invoices', [\App\Http\Controllers\Admin\AdminFinanceController::class, 'invoices'])->name('invoices');
        Route::get('/invoices/{id}', [\App\Http\Controllers\Admin\AdminFinanceController::class, 'showInvoice'])->name('invoices.show');
        Route::get('/payments', [\App\Http\Controllers\Admin\AdminFinanceController::class, 'payments'])->name('payments');
        Route::get('/payments/{id}', [\App\Http\Controllers\Admin\AdminFinanceController::class, 'showPayment'])->name('payments.show');
    });
});

/*
|--------------------------------------------------------------------------
| Admin Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [\App\Http\Controllers\Admin\AdminAuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [\App\Http\Controllers\Admin\AdminAuthController::class, 'login'])->name('login.submit');
    Route::post('/logout', [\App\Http\Controllers\Admin\AdminAuthController::class, 'logout'])->name('logout');
});

/*
|--------------------------------------------------------------------------
| OAuth Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->name('auth.')->group(function () {
    // Google OAuth
    Route::get('/google', [SocialAuthController::class, 'redirectToGoogle'])->name('google');
    Route::get('/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])->name('google.callback');
    
    // LINE OAuth  
    Route::get('/line', [SocialAuthController::class, 'redirectToLine'])->name('line');
    Route::get('/line/callback', [SocialAuthController::class, 'handleLineCallback'])->name('line.callback');
    
    // OAuth Error handling
    Route::get('/error', [SocialAuthController::class, 'handleOAuthError'])->name('error');
});

/*
|--------------------------------------------------------------------------
| AI API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('api/ai')->withoutMiddleware('web')->group(function () {
    Route::post('/analyze-business', [AIController::class, 'analyzeBusinessDescription']);
    Route::post('/chat', [AIController::class, 'generateChatResponse']);
    Route::get('/health', [AIController::class, 'healthCheck']);
    Route::get('/capabilities', [AIController::class, 'getCapabilities']);
    Route::get('/dashboard-insights', [AIController::class, 'getDashboardInsights']);
    Route::get('/business-types', [AIController::class, 'getBusinessTypes']);
    Route::get('/company-sizes', [AIController::class, 'getCompanySizes']);
});

/*
|--------------------------------------------------------------------------
| Company Invitation Routes
|--------------------------------------------------------------------------
*/

// Public invitation acceptance page (no auth required)
Route::get('/invitation/{token}', function ($token) {
    return view('company.invitation.accept', compact('token'));
})->name('company.invitation.page');

// Authenticated invitation acceptance (API endpoint handled in api.php)
Route::middleware(['web'])->group(function () {
    Route::post('/invitation/{token}/accept', [CompanyManagementController::class, 'acceptInvitation'])
         ->name('company.invitation.accept.web');
});

/*
|--------------------------------------------------------------------------
| Laravel Authentication Routes  
|--------------------------------------------------------------------------
| Authentication routes are now loaded via the modular system
| in routes/modules/auth.php through the _loader.php
*/

// require __DIR__.'/auth.php'; // Moved to routes/modules/auth.phpRoute::get("/debug-rls", function () { return view("debug-rls"); });
