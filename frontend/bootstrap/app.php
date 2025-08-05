<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        App\Providers\NavigationServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // 註冊全域中介層（必須在 StartSession 之後執行）
        $middleware->web(append: [
            \App\Http\Middleware\SetCompanyContext::class,
        ]);
        
        // 註冊中介層別名
        $middleware->alias([
            // 後台管理員認證中介層
            'admin' => \App\Http\Middleware\AdminAuthMiddleware::class,
            
            // RBAC 權限系統中介層
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'role' => \App\Http\Middleware\CheckRole::class,
            
            // 公司上下文中介層別名
            'company.context' => \App\Http\Middleware\SetCompanyContext::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
