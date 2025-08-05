<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap the Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

$user = User::where('email', 'test@example.com')->first();

if ($user) {
    echo "Found user: {$user->name} ({$user->email})\n";
    
    // Use the same logic as ApiService
    $secret = config('app.key') ?? 'default-secret';
    $password = 'sync_' . hash('sha256', $user->email . $secret);
    
    echo "Generated password: {$password}\n";
    echo "Testing Go backend login...\n";
    
    $loginData = [
        'name' => $user->name,
        'password' => $password
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8082/api/auth/login');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Status: {$httpCode}\n";
    echo "Response: {$response}\n";
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (isset($data['token'])) {
            echo "✅ Login successful! Token received\n";
            
            // Test customers API with token
            echo "\nTesting customers API...\n";
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8082/api/customers/');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $data['token']
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $customersResponse = curl_exec($ch);
            $customersHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            echo "Customers API Status: {$customersHttpCode}\n";
            echo "Customers Response: {$customersResponse}\n";
        }
    } else {
        echo "❌ Login failed\n";
    }
} else {
    echo "User not found\n";
}