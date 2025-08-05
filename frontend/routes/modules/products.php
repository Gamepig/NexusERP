<?php

/**
 * Products Module Routes
 * RESTful routes for product management
 */

use Illuminate\Support\Facades\Route;

Route::prefix('products')->name('products.')->group(function () {
    // Product listing page
    Route::get('/', function () {
        return view('products.index');
    })->name('index');
    
    // Create new product page
    Route::get('/create', function () {
        return view('products.form', ['mode' => 'create']);
    })->name('create');
    
    // Show product detail page
    Route::get('/{id}', function ($id) {
        return view('products.show', ['productId' => $id]);
    })->name('show')->where('id', '[0-9]+');
    
    // Edit product page  
    Route::get('/{id}/edit', function ($id) {
        return view('products.form', ['mode' => 'edit', 'productId' => $id]);
    })->name('edit')->where('id', '[0-9]+');
    
    // Product categories management
    Route::prefix('categories')->name('categories.')->group(function () {
        Route::get('/', function () {
            return view('products.categories.index');
        })->name('index');
        
        Route::get('/create', function () {
            return view('products.categories.form', ['mode' => 'create']);
        })->name('create');
        
        Route::get('/{id}/edit', function ($id) {
            return view('products.categories.form', ['mode' => 'edit', 'categoryId' => $id]);
        })->name('edit')->where('id', '[0-9]+');
    });
    
    // Product units management
    Route::prefix('units')->name('units.')->group(function () {
        Route::get('/', function () {
            return view('products.units.index');
        })->name('index');
        
        Route::get('/create', function () {
            return view('products.units.form', ['mode' => 'create']);
        })->name('create');
        
        Route::get('/{id}/edit', function ($id) {
            return view('products.units.form', ['mode' => 'edit', 'unitId' => $id]);
        })->name('edit')->where('id', '[0-9]+');
    });
});