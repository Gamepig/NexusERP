<?php

// Navigate to Laravel frontend directory
chdir('/Users/gamepig/projects/NexusERP/frontend');

// Include Laravel bootstrap
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "🔍 Getting test user API token...\n";

$user = User::where('email', 'test@example.com')->first();

if ($user && $user->hasValidApiToken()) {
    // We need to generate a new token to get the plain text version
    // since the stored token is hashed
    echo "🔧 Generating new token for testing...\n";
    $plainToken = $user->generateApiToken();
    
    echo "✅ Plain text token: {$plainToken}\n";
    echo "💾 Hashed token: " . substr($user->api_token, 0, 30) . "...\n";
    echo "⏰ Expires: {$user->api_token_expires_at}\n";
    
    // Save token for API testing
    file_put_contents('/Users/gamepig/projects/NexusERP/plain_token.txt', $plainToken);
    echo "💾 Token saved to plain_token.txt\n";
    
    echo "\n🧪 Testing token hash...\n";
    $testHash = hash('sha256', $plainToken);
    echo "🔍 Generated hash: " . substr($testHash, 0, 30) . "...\n";
    echo "💾 Stored hash:    " . substr($user->api_token, 0, 30) . "...\n";
    echo "✅ Hashes match: " . ($testHash === $user->api_token ? 'YES' : 'NO') . "\n";
} else {
    echo "❌ No valid user or token found\n";
}