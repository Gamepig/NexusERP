<?php

/**
 * Dashboard Debug Script
 * Tests dashboard functionality step by step
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🔍 Dashboard Debug Analysis\n";
echo "=" . str_repeat("=", 50) . "\n\n";

// 1. Check route registration
echo "1. Checking Dashboard Routes:\n";
echo "   - Web Route (dashboard): " . (Route::has('dashboard') ? "✅ EXISTS" : "❌ MISSING") . "\n";
echo "   - API Route (api.dashboard.data): " . (Route::has('api.dashboard.data') ? "✅ EXISTS" : "❌ MISSING") . "\n\n";

// 2. Check middleware configuration
echo "2. Checking Middleware:\n";
$route = Route::getRoutes()->getByName('dashboard');
if ($route) {
    $middleware = $route->gatherMiddleware();
    echo "   - Dashboard route middleware: " . implode(', ', $middleware) . "\n";
} else {
    echo "   - Dashboard route not found\n";
}

$apiRoute = Route::getRoutes()->getByName('api.dashboard.data');
if ($apiRoute) {
    $middleware = $apiRoute->gatherMiddleware();
    echo "   - API route middleware: " . implode(', ', $middleware) . "\n\n";
} else {
    echo "   - API route not found\n\n";
}

// 3. Check DashboardController
echo "3. Checking DashboardController:\n";
$controllerExists = class_exists('App\Http\Controllers\Api\DashboardController');
echo "   - Controller exists: " . ($controllerExists ? "✅ YES" : "❌ NO") . "\n";

if ($controllerExists) {
    $methods = get_class_methods('App\Http\Controllers\Api\DashboardController');
    echo "   - Available methods: " . implode(', ', $methods) . "\n";
}
echo "\n";

// 4. Check database models
echo "4. Checking Database Models:\n";
$models = [
    'Customer' => 'App\Models\Customer',
    'Product' => 'App\Models\Product', 
    'SalesOrder' => 'App\Models\SalesOrder',
    'InventoryLevel' => 'App\Models\InventoryLevel',
    'Supplier' => 'App\Models\Supplier'
];

foreach ($models as $name => $class) {
    echo "   - {$name}: " . (class_exists($class) ? "✅ EXISTS" : "❌ MISSING") . "\n";
}
echo "\n";

// 5. Test API endpoint without authentication
echo "5. Testing API Endpoint (No Auth):\n";
try {
    $response = app()->handle(
        Illuminate\Http\Request::create('/api/dashboard', 'GET', [], [], [], [
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest'
        ])
    );
    
    echo "   - Response Status: " . $response->getStatusCode() . "\n";
    echo "   - Response Body: " . substr($response->getContent(), 0, 100) . "...\n";
} catch (Exception $e) {
    echo "   - Error: " . $e->getMessage() . "\n";
}
echo "\n";

// 6. Check authentication setup
echo "6. Authentication Configuration:\n";
echo "   - Default guard: " . config('auth.defaults.guard') . "\n";
echo "   - Session driver: " . config('session.driver') . "\n";
echo "   - Session lifetime: " . config('session.lifetime') . " minutes\n\n";

// 7. Check file existence
echo "7. File System Check:\n";
$files = [
    'DashboardManager.js' => 'public/js/components/dashboard/DashboardManager.js',
    'dashboard.blade.php' => 'resources/views/dashboard.blade.php',
    'DashboardController.php' => 'app/Http/Controllers/Api/DashboardController.php'
];

foreach ($files as $name => $path) {
    $exists = file_exists(__DIR__ . '/' . $path);
    $size = $exists ? filesize(__DIR__ . '/' . $path) : 0;
    echo "   - {$name}: " . ($exists ? "✅ EXISTS ({$size} bytes)" : "❌ MISSING") . "\n";
}
echo "\n";

// 8. Recommendations
echo "8. Debug Recommendations:\n";
echo "   🔧 Steps to resolve dashboard loading issue:\n";
echo "   1. Test with authenticated user session\n";
echo "   2. Check browser console for JavaScript errors\n";
echo "   3. Verify CSRF token is being sent\n";
echo "   4. Test API endpoint with proper authentication headers\n";
echo "   5. Check database connections and model relationships\n\n";

echo "🏁 Debug analysis complete!\n";