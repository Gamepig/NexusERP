<?php

/**
 * Suppliers Module Routes
 * RESTful routes for supplier management
 */

use Illuminate\Support\Facades\Route;

Route::prefix('suppliers')->name('suppliers.')->group(function () {
    // Supplier listing page
    Route::get('/', function () {
        return view('suppliers.index');
    })->name('index');
    
    // Create new supplier page
    Route::get('/create', function () {
        return view('suppliers.form', ['mode' => 'create']);
    })->name('create');
    
    // Show supplier detail page
    Route::get('/{id}', function ($id) {
        return view('suppliers.show', ['supplierId' => $id]);
    })->name('show')->where('id', '[0-9]+');
    
    // Edit supplier page
    Route::get('/{id}/edit', function ($id) {
        return view('suppliers.form', ['mode' => 'edit', 'supplierId' => $id]);
    })->name('edit')->where('id', '[0-9]+');
    
    // Supplier contacts management
    Route::prefix('{supplierId}/contacts')->name('contacts.')->where(['supplierId' => '[0-9]+'])->group(function () {
        Route::get('/', function ($supplierId) {
            return view('suppliers.contacts.index', ['supplierId' => $supplierId]);
        })->name('index');
        
        Route::get('/create', function ($supplierId) {
            return view('suppliers.contacts.form', ['mode' => 'create', 'supplierId' => $supplierId]);
        })->name('create');
        
        Route::get('/{contactId}/edit', function ($supplierId, $contactId) {
            return view('suppliers.contacts.form', [
                'mode' => 'edit', 
                'supplierId' => $supplierId, 
                'contactId' => $contactId
            ]);
        })->name('edit')->where('contactId', '[0-9]+');
    });
    
    // Purchase orders for supplier
    Route::prefix('{supplierId}/orders')->name('orders.')->where(['supplierId' => '[0-9]+'])->group(function () {
        Route::get('/', function ($supplierId) {
            return view('suppliers.orders.index', ['supplierId' => $supplierId]);
        })->name('index');
        
        Route::get('/create', function ($supplierId) {
            return view('orders.purchase.form', ['mode' => 'create', 'supplierId' => $supplierId]);
        })->name('create');
    });
});