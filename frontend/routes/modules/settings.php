<?php

/**
 * Settings Module Routes
 * RESTful routes for system settings and configuration
 */

use Illuminate\Support\Facades\Route;

Route::prefix('settings')->name('settings.')->group(function () {
    // Default redirect to company settings
    Route::get('/', function () {
        return redirect()->route('settings.company');
    });
    
    // Company Information Settings
    Route::get('/company', function () {
        return view('settings.company');
    })->name('company');
    
    // Units of Measure Settings
    Route::get('/units', function () {
        return view('settings.units');
    })->name('units');
    
    // Product Categories Settings
    Route::get('/categories', function () {
        return view('settings.categories');
    })->name('categories');
    
    // User Roles and Permissions Settings
    Route::prefix('permissions')->name('permissions.')->group(function () {
        Route::get('/', function () {
            return view('settings.permissions.index');
        })->name('index');
        
        Route::get('/roles', function () {
            return view('settings.permissions.roles');
        })->name('roles');
        
        Route::get('/roles/create', function () {
            return view('settings.permissions.roles-form', ['mode' => 'create']);
        })->name('roles.create');
        
        Route::get('/roles/{id}/edit', function ($id) {
            return view('settings.permissions.roles-form', ['mode' => 'edit', 'roleId' => $id]);
        })->name('roles.edit')->where('id', '[0-9]+');
        
        Route::get('/users', function () {
            return view('settings.permissions.users');
        })->name('users');
    });
    
    // System Settings
    Route::prefix('system')->name('system.')->group(function () {
        Route::get('/general', function () {
            return view('settings.system.general');
        })->name('general');
        
        Route::get('/email', function () {
            return view('settings.system.email');
        })->name('email');
        
        Route::get('/notifications', function () {
            return view('settings.system.notifications');
        })->name('notifications');
        
        Route::get('/integrations', function () {
            return view('settings.system.integrations');
        })->name('integrations');
    });
    
    // Warehouses Settings
    Route::prefix('warehouses')->name('warehouses.')->group(function () {
        Route::get('/', function () {
            return view('settings.warehouses.index');
        })->name('index');
        
        Route::get('/create', function () {
            return view('settings.warehouses.form', ['mode' => 'create']);
        })->name('create');
        
        Route::get('/{id}/edit', function ($id) {
            return view('settings.warehouses.form', ['mode' => 'edit', 'warehouseId' => $id]);
        })->name('edit')->where('id', '[0-9]+');
    });
    
    // Tax Settings
    Route::get('/taxes', function () {
        return view('settings.taxes');
    })->name('taxes');
    
    // Payment Methods Settings  
    Route::get('/payment-methods', function () {
        return view('settings.payment-methods');
    })->name('payment-methods');
});