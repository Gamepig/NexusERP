<?php

// Navigate to Laravel frontend directory
chdir('/Users/gamepig/projects/NexusERP/frontend');

// Include Laravel bootstrap
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "🔍 Checking API token for test user...\n";

$user = User::where('email', 'test@example.com')->first();

if ($user) {
    echo "✅ User found: {$user->name}\n";
    echo "📧 Email: {$user->email}\n";
    echo "🔑 Has API token: " . ($user->api_token ? 'YES' : 'NO') . "\n";
    
    if ($user->api_token_expires_at) {
        echo "⏰ Token expires: {$user->api_token_expires_at}\n";
        echo "⏰ Token valid: " . ($user->hasValidApiToken() ? 'YES' : 'NO') . "\n";
    } else {
        echo "⏰ Token expires: NULL\n";
    }
    
    if (!$user->hasValidApiToken()) {
        echo "\n🔧 Generating new API token...\n";
        $token = $user->generateApiToken();
        echo "✅ Generated new API token: " . substr($token, 0, 20) . "...\n";
        echo "💾 Token stored as hash: " . substr($user->api_token, 0, 20) . "...\n";
        echo "⏰ Token expires: {$user->api_token_expires_at}\n";
        
        // Store the plain token for testing
        file_put_contents('/Users/gamepig/projects/NexusERP/test_api_token.txt', $token);
        echo "💾 Plain token saved to test_api_token.txt for testing\n";
    } else {
        echo "\n✅ User already has valid API token\n";
        echo "💾 Token hash: " . substr($user->api_token, 0, 20) . "...\n";
    }
} else {
    echo "❌ Test user not found!\n";
    echo "🔧 Creating test user...\n";
    
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => bcrypt('password123'),
        'email_verified_at' => now(),
    ]);
    
    echo "✅ Test user created: {$user->name}\n";
    
    $token = $user->generateApiToken();
    echo "✅ Generated API token: " . substr($token, 0, 20) . "...\n";
    
    // Store the plain token for testing
    file_put_contents('/Users/gamepig/projects/NexusERP/test_api_token.txt', $token);
    echo "💾 Plain token saved to test_api_token.txt for testing\n";
}

echo "\n🎯 Summary:\n";
echo "📧 User email: {$user->email}\n";
echo "🔑 Has valid token: " . ($user->hasValidApiToken() ? 'YES' : 'NO') . "\n";
echo "⏰ Expires: {$user->api_token_expires_at}\n";