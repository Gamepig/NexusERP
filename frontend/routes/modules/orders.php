<?php

/**
 * Orders Module Routes
 * RESTful routes for order management (both sales and purchase)
 */  

use Illuminate\Support\Facades\Route;

// Sales Orders
Route::prefix('orders/sales')->name('orders.sales.')->group(function () {
    // Sales order listing page
    Route::get('/', [\App\Http\Controllers\Web\SalesOrderController::class, 'index'])->name('index');
    
    // Create new sales order page
    Route::get('/create', [\App\Http\Controllers\Web\SalesOrderController::class, 'create'])->name('create');
    
    // Show sales order detail page
    Route::get('/{id}', [\App\Http\Controllers\Web\SalesOrderController::class, 'show'])->name('show')->where('id', '[0-9]+');
    
    // Edit sales order page
    Route::get('/{id}/edit', [\App\Http\Controllers\Web\SalesOrderController::class, 'edit'])->name('edit')->where('id', '[0-9]+');
    
    // Sales order fulfillment/shipping
    Route::get('/{id}/ship', [\App\Http\Controllers\Web\SalesOrderController::class, 'ship'])->name('ship')->where('id', '[0-9]+');
});

// Purchase Orders  
Route::prefix('orders/purchase')->name('orders.purchase.')->group(function () {
    // Purchase order listing page
    Route::get('/', [\App\Http\Controllers\Web\PurchaseOrderController::class, 'index'])->name('index');
    
    // Create new purchase order page
    Route::get('/create', [\App\Http\Controllers\Web\PurchaseOrderController::class, 'create'])->name('create');
    
    // Show purchase order detail page
    Route::get('/{id}', [\App\Http\Controllers\Web\PurchaseOrderController::class, 'show'])->name('show')->where('id', '[0-9]+');
    
    // Edit purchase order page
    Route::get('/{id}/edit', [\App\Http\Controllers\Web\PurchaseOrderController::class, 'edit'])->name('edit')->where('id', '[0-9]+');
    
    // Purchase order receiving
    Route::get('/{id}/receive', [\App\Http\Controllers\Web\PurchaseOrderController::class, 'receive'])->name('receive')->where('id', '[0-9]+');
    
    // Delete purchase order
    Route::delete('/{id}', [\App\Http\Controllers\Web\PurchaseOrderController::class, 'destroy'])->name('destroy')->where('id', '[0-9]+');
});

// Quotes Management
Route::prefix('quotes')->name('quotes.')->group(function () {
    // Quote listing page
    Route::get('/', [\App\Http\Controllers\Web\QuoteController::class, 'index'])->name('index');
    
    // Create new quote page (traditional single-page form)
    Route::get('/create', [\App\Http\Controllers\Web\QuoteController::class, 'create'])->name('create');
    
    // Create new quote page (multi-step form)
    Route::get('/create/multi-step', [\App\Http\Controllers\Web\QuoteController::class, 'createMultiStep'])->name('create.multi-step');
    
    // Store new quote
    Route::post('/', [\App\Http\Controllers\Web\QuoteController::class, 'store'])->name('store');
    
    // Show quote detail page
    Route::get('/{id}', [\App\Http\Controllers\Web\QuoteController::class, 'show'])->name('show')->where('id', '[0-9]+');
    
    // Edit quote page
    Route::get('/{id}/edit', [\App\Http\Controllers\Web\QuoteController::class, 'edit'])->name('edit')->where('id', '[0-9]+');
    
    // Edit quote page (multi-step form)
    Route::get('/{id}/edit/multi-step', [\App\Http\Controllers\Web\QuoteController::class, 'editMultiStep'])->name('edit.multi-step')->where('id', '[0-9]+');
    
    // Update quote
    Route::put('/{id}', [\App\Http\Controllers\Web\QuoteController::class, 'update'])->name('update')->where('id', '[0-9]+');
    
    // Delete quote
    Route::delete('/{id}', [\App\Http\Controllers\Web\QuoteController::class, 'destroy'])->name('destroy')->where('id', '[0-9]+');
    
    // Quote actions
    Route::post('/{id}/approve', [\App\Http\Controllers\Web\QuoteController::class, 'approve'])->name('approve')->where('id', '[0-9]+');
    Route::post('/{id}/reject', [\App\Http\Controllers\Web\QuoteController::class, 'reject'])->name('reject')->where('id', '[0-9]+');
    Route::post('/{id}/convert', [\App\Http\Controllers\Web\QuoteController::class, 'convert'])->name('convert')->where('id', '[0-9]+');
});