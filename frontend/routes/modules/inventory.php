<?php

/**
 * Inventory Module Routes
 * RESTful routes for inventory management and stocktaking
 */

use Illuminate\Support\Facades\Route;

// Keep existing inventory routes structure but make it more RESTful
Route::prefix('inventory')->name('inventory.')->group(function () {
    // Main inventory dashboard
    Route::get('/', function () {
        return view('inventory.index');
    })->name('index');
    
    // Inventory alerts
    Route::get('/alerts', function () {
        return view('inventory.alerts');
    })->name('alerts');
    
    // Inventory levels by warehouse
    Route::get('/levels', function () {
        return view('inventory.levels');
    })->name('levels');
    
    // Inventory transaction history
    Route::get('/transactions', function () {
        return view('inventory.transactions');
    })->name('transactions');
    
    // Inventory adjustments
    Route::prefix('adjustments')->name('adjustments.')->group(function () {
        Route::get('/', function () {
            return view('inventory.adjustments.index');
        })->name('index');
        
        Route::get('/create', function () {
            return view('inventory.adjustments.form', ['mode' => 'create']);
        })->name('create');
        
        Route::get('/{id}', function ($id) {
            return view('inventory.adjustments.show', ['adjustmentId' => $id]);
        })->name('show')->where('id', '[0-9]+');
    });
});

// Stocktaking routes - keep existing functionality
Route::prefix('stocktaking')->name('stocktaking.')->group(function () {
    Route::get('/', function () {
        return view('stocktaking.index');
    })->name('index');
    
    Route::get('/create', function () {
        return view('stocktaking.form', ['mode' => 'create']);
    })->name('create');
    
    Route::get('/{id}', function ($id) {
        return view('stocktaking.show', ['orderId' => $id]);
    })->name('show')->where('id', '[0-9]+');
    
    Route::get('/{id}/process', function ($id) {
        return view('stocktaking.process', ['orderId' => $id]);
    })->name('process')->where('id', '[0-9]+');
});