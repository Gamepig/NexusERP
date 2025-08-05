<?php

/**
 * Reports Module Routes
 * RESTful routes for business reporting and analytics
 */

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Reports\CashFlowController;

Route::prefix('reports')->name('reports.')->group(function () {
    // Reports dashboard
    Route::get('/', function () {
        return view('reports.index');
    })->name('index');
    
    // Sales Reports
    Route::prefix('sales')->name('sales.')->group(function () {
        Route::get('/', function () {
            return view('reports.sales.index');
        })->name('index');
        
        Route::get('/summary', function () {
            return view('reports.sales.summary');
        })->name('summary');
        
        Route::get('/by-product', function () {
            return view('reports.sales.by-product');
        })->name('by-product');
        
        Route::get('/by-customer', function () {
            return view('reports.sales.by-customer');
        })->name('by-customer');
        
        Route::get('/trends', function () {
            return view('reports.sales.trends');
        })->name('trends');
    });
    
    // Inventory Reports
    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/', function () {
            return view('reports.inventory.index');
        })->name('index');
        
        Route::get('/valuation', function () {
            return view('reports.inventory.valuation');
        })->name('valuation');
        
        Route::get('/turnover', function () {
            return view('reports.inventory.turnover');
        })->name('turnover');
        
        Route::get('/aging', function () {
            return view('reports.inventory.aging');
        })->name('aging');
        
        Route::get('/movements', function () {
            return view('reports.inventory.movements');
        })->name('movements');
    });
    
    // Financial Reports
    Route::prefix('financial')->name('financial.')->group(function () {
        Route::get('/', function () {
            return view('reports.financial.index');
        })->name('index');
        
        Route::get('/profit-loss', function () {
            return view('reports.financial.profit-loss');
        })->name('profit-loss');
        
        Route::get('/cash-flow', [CashFlowController::class, 'index'])->name('cash-flow');
        
        // 測試路由（無需登入）
        Route::get('/cash-flow-test', function () {
            return view('reports.financial.cash-flow');
        })->withoutMiddleware(['auth']);
        
        Route::get('/accounts-receivable', function () {
            return view('reports.financial.accounts-receivable');
        })->name('accounts-receivable');
        
        Route::get('/accounts-payable', function () {
            return view('reports.financial.accounts-payable');
        })->name('accounts-payable');
    });
    
    // Purchase Reports
    Route::prefix('purchase')->name('purchase.')->group(function () {
        Route::get('/', function () {
            return view('reports.purchase.index');
        })->name('index');
        
        Route::get('/by-supplier', function () {
            return view('reports.purchase.by-supplier');
        })->name('by-supplier');
        
        Route::get('/by-product', function () {
            return view('reports.purchase.by-product');
        })->name('by-product');
    });
    
    // Employee Reports
    Route::prefix('employees')->name('employees.')->group(function () {
        Route::get('/attendance', function () {
            return view('reports.employees.attendance');
        })->name('attendance');
        
        Route::get('/performance', function () {
            return view('reports.employees.performance');
        })->name('performance');
    });
});