<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Go Backend API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for communication with Go backend API
    |
    */

    'base_url' => env('GO_BACKEND_URL', 'http://localhost:8082'),
    'timeout' => env('GO_BACKEND_TIMEOUT', 30),
    
    /*
    |--------------------------------------------------------------------------
    | Go Backend Database Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for direct database access to Go backend.
    | This is used for temporary operations like user-company association
    | until proper API endpoints are available.
    |
    */

    'database' => [
        'host' => env('GO_DB_HOST', '127.0.0.1'),
        'port' => env('GO_DB_PORT', '5432'),
        'database' => env('GO_DB_DATABASE', 'nexus_erp'),
        'username' => env('GO_DB_USERNAME', 'nexus'),
        'password' => env('GO_DB_PASSWORD', 'securepassword'),
    ],
];