<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth', \App\Http\Middleware\SetCompanyContext::class])
    ->prefix('demo')
    ->name('demo.')
    ->group(function () {
        Route::get('/', [\App\Http\Controllers\DemoController::class, 'index'])->name('index');
        Route::get('/inquiry', [\App\Http\Controllers\DemoController::class, 'inquiry'])->name('inquiry');
        Route::get('/vip-procurement', [\App\Http\Controllers\DemoController::class, 'vipProcurement'])->name('vip');
        Route::get('/inventory-alert', [\App\Http\Controllers\DemoController::class, 'inventoryAlert'])->name('inventory');
        Route::get('/finance-analysis', [\App\Http\Controllers\DemoController::class, 'financeAnalysis'])->name('finance');
        Route::get('/summary', [\App\Http\Controllers\DemoController::class, 'summary'])->name('summary');
        if (app()->environment('local')) {
            Route::post('/reset', [\App\Http\Controllers\DemoController::class, 'reset'])->name('reset');
        }
    });


