<?php
/**
 * Dashboard Authentication Test Script
 * Tests the complete authentication flow for dashboard API
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🔐 Dashboard Authentication Test\n";
echo "=" . str_repeat("=", 40) . "\n\n";

// 1. Check if test user exists
echo "1. Checking Test User:\n";
$testUser = App\Models\User::where('email', 'test@example.com')->first();
if ($testUser) {
    echo "   ✅ Test user exists: {$testUser->name} ({$testUser->email})\n";
    echo "   - User ID: {$testUser->id}\n";
    echo "   - Created: {$testUser->created_at}\n";
} else {
    echo "   ❌ Test user not found\n";
    echo "   - Run: php artisan db:seed --class=TestUserSeeder\n";
    exit(1);
}

// 2. Test authentication manually
echo "\n2. Manual Authentication Test:\n";
if (Auth::attempt(['email' => 'test@example.com', 'password' => 'password123'])) {
    echo "   ✅ Authentication successful\n";
    echo "   - Authenticated user: " . Auth::user()->name . "\n";
    echo "   - Auth check: " . (Auth::check() ? 'true' : 'false') . "\n";
} else {
    echo "   ❌ Authentication failed\n";
    echo "   - Check password in TestUserSeeder\n";
}

// 3. Test company context
echo "\n3. Company Context Test:\n";
$companies = $testUser->companies;
if ($companies->count() > 0) {
    $company = $companies->first();
    echo "   ✅ User has company association\n";
    echo "   - Company: {$company->name} (ID: {$company->id})\n";
    
    // Simulate session setup
    session(['current_company_id' => $company->id]);
    echo "   - Session company_id set: " . session('current_company_id') . "\n";
} else {
    echo "   ❌ User has no company association\n";
    echo "   - This may cause dashboard API to fail\n";
}

// 4. Test API endpoint directly
echo "\n4. Direct API Test:\n";
try {
    // Create a request with authentication
    $request = Illuminate\Http\Request::create('/api/dashboard', 'GET', [], [], [], [
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
        'HTTP_X_CSRF_TOKEN' => csrf_token()
    ]);
    
    // Manually authenticate the request
    Auth::login($testUser);
    $request->setUserResolver(function () use ($testUser) {
        return $testUser;
    });
    
    $controller = new App\Http\Controllers\Api\DashboardController();
    $response = $controller->index($request);
    
    echo "   ✅ API call successful\n";
    echo "   - Response status: 200\n";
    $responseData = json_decode($response->getContent(), true);
    echo "   - Success: " . ($responseData['success'] ? 'true' : 'false') . "\n";
    if (isset($responseData['statistics'])) {
        echo "   - Statistics keys: " . implode(', ', array_keys($responseData['statistics'])) . "\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ API call failed\n";
    echo "   - Error: " . $e->getMessage() . "\n";
    echo "   - File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

// 5. Recommendations
echo "\n5. Debugging Recommendations:\n";
echo "   📋 Next Steps:\n";
echo "   1. Login as test@example.com / password123\n";
echo "   2. Check browser console for JavaScript errors\n";
echo "   3. Check Network tab for 401/403 responses\n";
echo "   4. Verify CSRF token is being sent correctly\n";
echo "   5. Check if middleware is properly configured\n\n";

echo "🏁 Authentication test complete!\n";