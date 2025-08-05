<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;

class ApiService
{
    protected $baseUrl;
    protected $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('app.backend_api_url', 'http://127.0.0.1:8082'), '/') . '/api';
        $this->timeout = config('app.api_timeout', 10); // Reduced timeout for faster failure detection
    }

    /**
     * Get authorization headers
     */
    protected function getHeaders()
    {
        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        // Add authorization token if user is authenticated
        if (Auth::check()) {
            $token = $this->getOrGenerateApiToken();
            if ($token) {
                $headers['Authorization'] = 'Bearer ' . $token;
            }
        }

        return $headers;
    }

    /**
     * Get or generate API token for current Laravel user
     */
    protected function getOrGenerateApiToken()
    {
        // Check if we have a plain text token in session first
        $sessionToken = Session::get('laravel_api_token');
        $sessionTokenExpiry = Session::get('laravel_api_token_expiry');
        
        if ($sessionToken && $sessionTokenExpiry && time() < $sessionTokenExpiry) {
            Log::info('Using cached Laravel API token for user: ' . Auth::user()->email);
            return $sessionToken;
        }
        
        // Generate new Laravel API token
        $user = Auth::user();
        if ($user) {
            try {
                Log::info('Generating new Laravel API token for user: ' . $user->email);
                $plainToken = $user->generateApiToken();
                
                // Store plain token in session (since we can't retrieve it later)
                Session::put('laravel_api_token', $plainToken);
                Session::put('laravel_api_token_expiry', time() + 3600); // 1 hour
                
                return $plainToken;
            } catch (\Exception $e) {
                Log::error('Failed to generate Laravel API token: ' . $e->getMessage());
            }
        }

        // Check if token exists in session and is not expired
        $token = Session::get('api_token');
        $tokenExpiry = Session::get('api_token_expiry');

        if ($token && $tokenExpiry && time() < $tokenExpiry) {
            return $token;
        }

        // Generate new token by syncing current Laravel user with Go backend
        try {
            $user = Auth::user();
            if (!$user) {
                Log::warning('No authenticated user found for API token generation');
                return null;
            }
            
            // First, try to ensure the user exists in Go backend
            $this->ensureUserExistsInGoBackend($user);
            
            // Then login using Laravel user's credentials
            $loginData = [
                'name' => $user->name,  // Use Laravel user's name as username (not email)
                'password' => $this->getGoBackendPasswordForUser($user)
            ];

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->withOptions(['verify' => false])
            ->timeout(10)
            ->post($this->baseUrl . '/auth/login', $loginData);

            if ($response->successful()) {
                $data = $response->json();
                $token = $data['token'] ?? null;
                
                if ($token) {
                    // Store token in session (JWT tokens typically expire in 1 hour)
                    Session::put('api_token', $token);
                    Session::put('api_token_expiry', time() + 3600); // 1 hour
                    return $token;
                }
            }

            Log::warning('Failed to generate API token', ['status' => $response->status()]);
        } catch (\Exception $e) {
            Log::error('API token generation failed: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Ensure Laravel user exists in Go backend
     */
    protected function ensureUserExistsInGoBackend($user)
    {
        try {
            // First, try to login with existing credentials to check if user exists
            $testLogin = [
                'name' => $user->name,  // Use Laravel user's name as username (not email)
                'password' => $this->getGoBackendPasswordForUser($user)
            ];

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->withOptions(['verify' => false])
            ->timeout(5)
            ->post($this->baseUrl . '/auth/login', $testLogin);

            if ($response->successful()) {
                // User already exists and can login
                Log::info('Go backend user already exists', ['email' => $user->email]);
                return true;
            }

            // User doesn't exist or password is wrong, try to create user
            Log::info('Creating Go backend user for Laravel user', ['email' => $user->email]);
            
            $createUserData = [
                'name' => $user->name,  // Use Laravel user's name as username (not email)
                'email' => $user->email,
                'password' => $this->getGoBackendPasswordForUser($user),
                'first_name' => $user->first_name ?? null,
                'last_name' => $user->last_name ?? null,
                'registration_method' => 'laravel_sync'
            ];

            $createResponse = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->withOptions(['verify' => false])
            ->timeout(10)
            ->post($this->baseUrl . '/auth/register', $createUserData);

            if ($createResponse->successful()) {
                Log::info('Successfully created Go backend user', ['email' => $user->email]);
                
                // Set up company association for the new user
                $this->setupCompanyAssociationForGoUser($user);
                
                return true;
            } else {
                Log::warning('Failed to create Go backend user', [
                    'email' => $user->email,
                    'status' => $createResponse->status(),
                    'response' => $createResponse->json()
                ]);
                return false;
            }

        } catch (\Exception $e) {
            Log::error('Error ensuring Go backend user exists: ' . $e->getMessage(), [
                'email' => $user->email ?? 'unknown'
            ]);
            return false;
        }
    }

    /**
     * Generate consistent password for Go backend based on Laravel user
     */
    protected function getGoBackendPasswordForUser($user)
    {
        // For the test user, use the known password
        if ($user->email === 'test@example.com') {
            return 'password123';
        }
        
        // Generate a consistent password based on user's email and a secret
        // This ensures the same password is always generated for the same user
        $secret = config('app.key') ?? 'default-secret';
        return 'sync_' . hash('sha256', $user->email . $secret);
    }

    /**
     * Set up company association for Go backend user
     */
    protected function setupCompanyAssociationForGoUser($laravelUser)
    {
        try {
            // Get current company from Laravel user
            $currentCompany = $laravelUser->currentCompany();
            if (!$currentCompany) {
                Log::warning('No current company found for Laravel user', ['email' => $laravelUser->email]);
                return false;
            }

            Log::info('Setting up company association for Go user', [
                'email' => $laravelUser->email,
                'company_id' => $currentCompany->id,
                'company_name' => $currentCompany->name ?? 'Unknown'
            ]);

            // For now, we'll use direct database connection to Go backend
            // TODO: Create proper API endpoint for user-company association
            $this->insertUserCompanyAssociation($laravelUser->name, $currentCompany->id);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to setup company association for Go user: ' . $e->getMessage(), [
                'name' => $laravelUser->name ?? 'unknown',
                'email' => $laravelUser->email ?? 'unknown'
            ]);
            return false;
        }
    }

    /**
     * Insert user-company association directly into Go backend database
     * This is a temporary solution until proper API endpoints are available
     */
    protected function insertUserCompanyAssociation($userName, $companyId)
    {
        try {
            // Get Go backend database configuration
            $goDbConfig = config('go_backend.database', [
                'host' => '127.0.0.1',
                'port' => '5432',
                'database' => 'nexus_erp',
                'username' => 'nexus_user',
                'password' => 'nexus_password'
            ]);

            $dsn = sprintf(
                'pgsql:host=%s;port=%s;dbname=%s',
                $goDbConfig['host'],
                $goDbConfig['port'],
                $goDbConfig['database']
            );

            $pdo = new \PDO($dsn, $goDbConfig['username'], $goDbConfig['password'], [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION
            ]);

            // First, get the Go user ID
            $getUserStmt = $pdo->prepare('SELECT id FROM users WHERE name = ?');
            $getUserStmt->execute([$userName]);
            $goUserId = $getUserStmt->fetchColumn();

            if (!$goUserId) {
                Log::warning('Go user not found for company association', ['name' => $userName]);
                return false;
            }

            // Check if association already exists
            $checkStmt = $pdo->prepare('SELECT id FROM user_companies WHERE user_id = ? AND company_id = ?');
            $checkStmt->execute([$goUserId, $companyId]);
            
            if ($checkStmt->fetchColumn()) {
                Log::info('User-company association already exists', [
                    'user_id' => $goUserId,
                    'company_id' => $companyId
                ]);
                return true;
            }

            // Insert user-company association
            $insertStmt = $pdo->prepare('
                INSERT INTO user_companies (user_id, company_id, is_primary, is_active, joined_at)
                VALUES (?, ?, true, true, NOW())
            ');
            $insertStmt->execute([$goUserId, $companyId]);

            Log::info('Successfully created user-company association', [
                'user_id' => $goUserId,
                'company_id' => $companyId
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to insert user-company association: ' . $e->getMessage(), [
                'name' => $userName,
                'company_id' => $companyId
            ]);
            return false;
        }
    }

    /**
     * Handle API response
     */
    protected function handleResponse($response)
    {
        try {
            $statusCode = $response->status();
            $body = $response->json();

            if ($statusCode >= 200 && $statusCode < 300) {
                return [
                    'success' => true,
                    'data' => $body,
                    'status' => $statusCode
                ];
            } else {
                // Check if this is a token-related error
                $errorMessage = $body['error'] ?? $body['message'] ?? 'API request failed';
                $isTokenError = $statusCode === 401 || 
                               stripos($errorMessage, 'invalid token') !== false ||
                               stripos($errorMessage, 'token expired') !== false ||
                               stripos($errorMessage, 'unauthorized') !== false;
                
                if ($isTokenError) {
                    Log::warning('Token error detected, clearing session token', [
                        'status' => $statusCode,
                        'message' => $errorMessage
                    ]);
                    
                    // Clear invalid token from session
                    Session::forget('api_token');
                    Session::forget('api_token_expiry');
                }
                
                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'details' => $body['details'] ?? null,
                    'status' => $statusCode,
                    'is_token_error' => $isTokenError
                ];
            }
        } catch (\Exception $e) {
            Log::error('API response parsing failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to parse API response',
                'status' => $response->status()
            ];
        }
    }

    /**
     * Make GET request with automatic token retry
     */
    public function get($endpoint, $params = [])
    {
        return $this->makeRequestWithRetry('GET', $endpoint, null, $params);
    }
    
    /**
     * Make request with automatic token retry
     */
    protected function makeRequestWithRetry($method, $endpoint, $data = null, $params = [])
    {
        $attempts = 0;
        $maxAttempts = 2; // Original request + 1 retry
        
        while ($attempts < $maxAttempts) {
            try {
                $url = $this->baseUrl . $endpoint;
                $headers = $this->getHeaders();
                
                $response = null;
                switch (strtoupper($method)) {
                    case 'GET':
                        $response = Http::withHeaders($headers)
                            ->timeout($this->timeout)
                            ->get($url, $params);
                        break;
                    case 'POST':
                        $response = Http::withHeaders($headers)
                            ->timeout($this->timeout)
                            ->withOptions([
                                'allow_redirects' => [
                                    'max' => 5,
                                    'strict' => false,
                                    'referer' => true,
                                    'protocols' => ['http', 'https'],
                                    'track_redirects' => true
                                ]
                            ])
                            ->post($url, $data);
                        break;
                    case 'PUT':
                        $response = Http::withHeaders($headers)
                            ->timeout($this->timeout)
                            ->put($url, $data);
                        break;
                    case 'DELETE':
                        $response = Http::withHeaders($headers)
                            ->timeout($this->timeout)
                            ->delete($url);
                        break;
                    case 'PATCH':
                        $response = Http::withHeaders($headers)
                            ->timeout($this->timeout)
                            ->patch($url, $data);
                        break;
                }
                
                if (!$response) {
                    throw new \Exception("Unsupported HTTP method: {$method}");
                }

                $result = $this->handleResponse($response);
                
                // If this is a token error and we haven't retried yet, try again
                if (isset($result['is_token_error']) && $result['is_token_error'] && $attempts < ($maxAttempts - 1)) {
                    Log::info("Token error detected, retrying request", [
                        'endpoint' => $endpoint,
                        'attempt' => $attempts + 1
                    ]);
                    $attempts++;
                    continue;
                }
                
                return $result;

            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                Log::error("API connection failed ({$method} {$endpoint}): " . $e->getMessage());
                return [
                    'success' => false,
                    'message' => '無法連接到後端服務，請檢查網路連接'
                ];
            } catch (\Exception $e) {
                Log::error("API {$method} request failed ({$endpoint}): " . $e->getMessage());
                return [
                    'success' => false,
                    'message' => '系統錯誤，請稍後重試'
                ];
            }
        }
        
        // This should never be reached, but just in case
        return [
            'success' => false,
            'message' => 'Maximum retry attempts exceeded'
        ];
    }

    /**
     * Make POST request with automatic token retry
     */
    public function post($endpoint, $data = [])
    {
        return $this->makeRequestWithRetry('POST', $endpoint, $data);
    }

    /**
     * Make PUT request with automatic token retry
     */
    public function put($endpoint, $data = [])
    {
        return $this->makeRequestWithRetry('PUT', $endpoint, $data);
    }

    /**
     * Make DELETE request with automatic token retry
     */
    public function delete($endpoint)
    {
        return $this->makeRequestWithRetry('DELETE', $endpoint);
    }

    /**
     * Make PATCH request with automatic token retry
     */
    public function patch($endpoint, $data = [])
    {
        return $this->makeRequestWithRetry('PATCH', $endpoint, $data);
    }

    /**
     * Health check endpoint
     */
    public function healthCheck()
    {
        return $this->get('/health');
    }

    /**
     * Get API base URL
     */
    public function getBaseUrl()
    {
        return $this->baseUrl;
    }
}