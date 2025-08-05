<?php

/**
 * Customers Module Routes  
 * RESTful routes for customer management
 */

use Illuminate\Support\Facades\Route;

Route::prefix('customers')->name('customers.')->group(function () {
    // Customer listing page
    Route::get('/', [App\Http\Controllers\CustomerController::class, 'index'])->name('index');
    
    // Create new customer page
    Route::get('/create', function () {
        return view('customers.form', ['mode' => 'create']);
    })->name('create');
    
    // Store new customer (form submission)
    Route::post('/', [App\Http\Controllers\CustomerController::class, 'store'])->name('store');
    
    // Show customer detail page  
    Route::get('/{id}', [App\Http\Controllers\CustomerController::class, 'show'])->name('show')->where('id', '[0-9]+');
    
    // Edit customer page
    Route::get('/{id}/edit', [App\Http\Controllers\CustomerController::class, 'edit'])->name('edit')->where('id', '[0-9]+');
    
    // Update customer (form submission)
    Route::put('/{id}', [App\Http\Controllers\CustomerController::class, 'update'])->name('update')->where('id', '[0-9]+');
    
    // Delete customer
    Route::delete('/{id}', [App\Http\Controllers\CustomerController::class, 'destroy'])->name('destroy')->where('id', '[0-9]+');
    
    // Customer contacts management
    Route::prefix('{customerId}/contacts')->name('contacts.')->where(['customerId' => '[0-9]+'])->group(function () {
        Route::get('/', function ($customerId) {
            return view('customers.contacts.index', ['customerId' => $customerId]);
        })->name('index');
        
        Route::get('/create', function ($customerId) {
            return view('customers.contacts.form', ['mode' => 'create', 'customerId' => $customerId]);
        })->name('create');
        
        Route::get('/{contactId}/edit', function ($customerId, $contactId) {
            return view('customers.contacts.form', [
                'mode' => 'edit',
                'customerId' => $customerId,
                'contactId' => $contactId
            ]);
        })->name('edit')->where('contactId', '[0-9]+');
    });
    
    // Customer quotes management
    Route::prefix('{customerId}/quotes')->name('quotes.')->where(['customerId' => '[0-9]+'])->group(function () {
        Route::get('/', function ($customerId) {
            return view('customers.quotes.index', ['customerId' => $customerId]);
        })->name('index');
        
        Route::get('/create', [\App\Http\Controllers\Web\QuoteController::class, 'createForCustomer'])->name('create');
    });
    
    // Customer orders (sales orders)
    Route::prefix('{customerId}/orders')->name('orders.')->where(['customerId' => '[0-9]+'])->group(function () {
        Route::get('/', function ($customerId) {
            return view('customers.orders.index', ['customerId' => $customerId]);
        })->name('index');
        
        Route::get('/create', function ($customerId) {
            return view('orders.sales.form', [
                'mode' => 'create', 
                'customerId' => $customerId,
                'orderId' => null  // 新建模式沒有訂單ID
            ]);
        })->name('create');
    });
});