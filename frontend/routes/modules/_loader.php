<?php

/**
 * Route Module Loader
 * Automatically loads all route modules from the modules directory
 */

use Illuminate\Support\Facades\Route;

/**
 * Load all route modules with proper middleware and permissions
 */
if (!function_exists('loadRouteModules')) {
function loadRouteModules() {
    $modulesPath = __DIR__;
    $authMiddleware = ['auth', 'verified', \App\Http\Middleware\SetCompanyContext::class, \App\Http\Middleware\EnsureCompanySetup::class];
    
    // Core business modules that require authentication and company context
    $coreModules = [
        'products' => ['permission' => 'products.view'],
        'suppliers' => ['permission' => 'suppliers.view'], 
        'customers' => ['permission' => 'customers.view'],
        'orders' => ['permission' => 'orders.view'],
        'inventory' => ['permission' => 'inventory.view'],
        'reports' => ['permission' => 'reports.view'],
        'settings' => ['permission' => 'settings.view'],
    ];
    
    // Load core modules with authentication middleware
    Route::middleware($authMiddleware)->group(function () use ($modulesPath, $coreModules) {
        foreach ($coreModules as $module => $config) {
            $filePath = $modulesPath . '/' . $module . '.php';
            
            if (file_exists($filePath)) {
                // TODO: Add permission middleware if specified (currently disabled until PermissionMiddleware is implemented)
                // if (isset($config['permission'])) {
                //     Route::middleware(['permission:' . $config['permission']])->group(function () use ($filePath) {
                //         require $filePath;
                //     });
                // } else {
                    require $filePath;
                // }
            }
        }
    });
    
    // Load authentication module (has its own middleware configuration)
    $authModule = 'auth';
    $authFilePath = $modulesPath . '/' . $authModule . '.php';
    if (file_exists($authFilePath)) {
        require $authFilePath;
    }
    
    // Load other modules without specific middleware (if any)
    $otherModules = [
        // Add any modules that don't need authentication here
    ];
    
    foreach ($otherModules as $module) {
        $filePath = $modulesPath . '/' . $module . '.php';
        if (file_exists($filePath)) {
            require $filePath;
        }
    }
}
}

/**
 * Get all available route modules
 */
if (!function_exists('getAvailableRouteModules')) {
function getAvailableRouteModules() {
    $modulesPath = __DIR__;
    $modules = [];
    
    $files = glob($modulesPath . '/*.php');
    foreach ($files as $file) {
        $filename = basename($file, '.php');
        if ($filename !== '_loader') {
            $modules[] = $filename;
        }
    }
    
    return $modules;
}
}

// Auto-load all modules
loadRouteModules();