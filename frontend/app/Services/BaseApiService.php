<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\RequestException;

/**
 * 基礎 API 服務類別
 * 提供與 Go 後端 API 通訊的基礎功能
 */
abstract class BaseApiService
{
    /**
     * Go 後端 API 基礎 URL
     */
    protected string $baseUrl;

    /**
     * HTTP 請求超時時間（秒）
     */
    protected int $timeout = 30;

    /**
     * HTTP 連接超時時間（秒）
     */
    protected int $connectTimeout = 10;

    /**
     * 預設 HTTP 標頭
     */
    protected array $defaultHeaders = [];

    /**
     * 快取前綴
     */
    protected string $cachePrefix = 'api_cache_';

    /**
     * 建構子
     */
    public function __construct()
    {
        $this->baseUrl = config('services.go_backend.url', 'http://localhost:8082');
        $this->timeout = config('services.go_backend.timeout', 30);
        $this->connectTimeout = config('services.go_backend.connect_timeout', 10);
        
        $this->defaultHeaders = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'User-Agent' => 'NexusERP-Laravel/' . app()->version(),
            'X-API-Version' => config('services.go_backend.api_version', 'v1'),
        ];
    }

    /**
     * 發送 HTTP 請求到 Go 後端
     * 
     * @param string $method HTTP 方法 (GET, POST, PUT, DELETE)
     * @param string $endpoint API 端點
     * @param array $data 請求資料
     * @param array $headers 額外的 HTTP 標頭
     * @param array $options 額外的請求選項
     * @return array API 回應資料
     * @throws \Exception 當 API 請求失敗時
     */
    protected function makeRequest(
        string $method, 
        string $endpoint, 
        array $data = [], 
        array $headers = [],
        array $options = []
    ): array {
        $url = rtrim($this->baseUrl, '/') . '/' . ltrim($endpoint, '/');
        $allHeaders = array_merge($this->defaultHeaders, $this->getAuthHeaders(), $headers);

        // 記錄 API 請求開始
        $startTime = microtime(true);
        $requestId = uniqid('req_', true);
        
        Log::info('API Request Started', [
            'request_id' => $requestId,
            'method' => $method,
            'url' => $url,
            'data_keys' => array_keys($data),
            'headers' => array_keys($allHeaders)
        ]);

        try {
            $httpClient = Http::withHeaders($allHeaders)
                ->timeout($this->timeout)
                ->connectTimeout($this->connectTimeout);

            // 應用額外選項
            if (isset($options['retry'])) {
                $httpClient = $httpClient->retry($options['retry'], 100);
            }

            if (isset($options['throw']) && $options['throw'] === false) {
                // 不自動拋出例外
            } else {
                $httpClient = $httpClient->throw();
            }

            // 根據方法發送請求
            $response = match (strtoupper($method)) {
                'GET' => $httpClient->get($url, $data),
                'POST' => $httpClient->post($url, $data),
                'PUT' => $httpClient->put($url, $data),
                'PATCH' => $httpClient->patch($url, $data),
                'DELETE' => $httpClient->delete($url, $data),
                default => throw new \InvalidArgumentException("不支援的 HTTP 方法: {$method}")
            };

            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            if ($response->successful()) {
                Log::info('API Request Successful', [
                    'request_id' => $requestId,
                    'status' => $response->status(),
                    'duration_ms' => $duration
                ]);

                return $response->json() ?? [];
            }

            // 處理 HTTP 錯誤狀態
            $this->handleErrorResponse($response, $requestId, $duration);
            
        } catch (RequestException $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            Log::error('API Request Exception', [
                'request_id' => $requestId,
                'method' => $method,
                'url' => $url,
                'duration_ms' => $duration,
                'error' => $e->getMessage(),
                'response' => $e->response?->body()
            ]);

            throw new \Exception(
                "API 請求失敗 ({$e->getCode()}): " . $this->getErrorMessage($e),
                $e->getCode(),
                $e
            );
            
        } catch (\Exception $e) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);
            
            Log::error('API Request Unexpected Error', [
                'request_id' => $requestId,
                'method' => $method,
                'url' => $url,
                'duration_ms' => $duration,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception(
                "API 請求發生未預期錯誤: " . $e->getMessage(),
                0,
                $e
            );
        }
    }

    /**
     * 處理錯誤回應
     */
    private function handleErrorResponse(Response $response, string $requestId, float $duration): void
    {
        $status = $response->status();
        $body = $response->body();
        
        Log::warning('API Request Failed', [
            'request_id' => $requestId,
            'status' => $status,
            'duration_ms' => $duration,
            'body' => $body
        ]);

        $message = match ($status) {
            400 => '請求參數錯誤',
            401 => '認證失敗，請重新登入',
            403 => '沒有權限執行此操作',
            404 => '請求的資源不存在',
            422 => '資料驗證失敗',
            429 => 'API 請求頻率過高，請稍後再試',
            500 => '伺服器內部錯誤',
            502 => 'API 服務暫時無法使用',
            503 => 'API 服務維護中',
            504 => 'API 請求超時',
            default => "API 請求失敗 (HTTP {$status})"
        };

        // 嘗試解析錯誤訊息
        try {
            $errorData = $response->json();
            if (isset($errorData['message'])) {
                $message = $errorData['message'];
            } elseif (isset($errorData['error']['message'])) {
                $message = $errorData['error']['message'];
            }
        } catch (\Exception $e) {
            // 無法解析 JSON，使用預設訊息
        }

        throw new \Exception($message, $status);
    }

    /**
     * 從例外中獲取錯誤訊息
     */
    private function getErrorMessage(\Exception $e): string
    {
        if ($e instanceof RequestException && $e->response) {
            try {
                $errorData = $e->response->json();
                return $errorData['message'] ?? $errorData['error']['message'] ?? $e->getMessage();
            } catch (\Exception $jsonError) {
                return $e->getMessage();
            }
        }
        
        return $e->getMessage();
    }

    /**
     * 獲取認證標頭
     */
    protected function getAuthHeaders(): array
    {
        $user = auth()->user();
        if (!$user) {
            return [];
        }

        // 生成或取得 API 金鑰
        $apiKey = $this->getOrCreateApiKey($user);
        
        return [
            'X-API-Key' => $apiKey,
            'X-User-ID' => $user->id,
            'X-User-Email' => $user->email,
        ];
    }

    /**
     * 獲取或建立 API 金鑰
     */
    private function getOrCreateApiKey($user): string
    {
        $cacheKey = "api_key_user_{$user->id}";
        
        return Cache::remember($cacheKey, 3600, function () use ($user) {
            // 這裡可以實作真正的 API 金鑰生成邏輯
            // 目前使用簡單的方式生成
            return hash('sha256', $user->id . $user->email . config('app.key'));
        });
    }

    /**
     * 生成快取鍵
     */
    protected function generateCacheKey(string $identifier, array $params = []): string
    {
        $user = auth()->user();
        $keyData = [
            'service' => get_class($this),
            'identifier' => $identifier,
            'user_id' => $user?->id,
            'params' => $params
        ];
        
        return $this->cachePrefix . md5(serialize($keyData));
    }

    /**
     * 清除快取
     */
    public function clearCache(?string $pattern = null): bool
    {
        try {
            if ($pattern) {
                // 清除特定模式的快取
                $keys = Cache::getRedis()->keys($this->cachePrefix . $pattern . '*');
                if ($keys) {
                    Cache::getRedis()->del($keys);
                }
            } else {
                // 清除所有相關快取
                $keys = Cache::getRedis()->keys($this->cachePrefix . '*');
                if ($keys) {
                    Cache::getRedis()->del($keys);
                }
            }
            
            Log::info('Cache cleared', [
                'service' => get_class($this),
                'pattern' => $pattern
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear cache', [
                'service' => get_class($this),
                'pattern' => $pattern,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    /**
     * 檢查 API 服務狀態
     */
    public function checkHealth(): array
    {
        try {
            $healthEndpoint = config('services.go_backend.health_check_endpoint', '/health');
            $response = $this->makeRequest('GET', $healthEndpoint, [], [], ['throw' => false]);
            
            return [
                'status' => 'healthy',
                'timestamp' => now()->toISOString(),
                'base_url' => $this->baseUrl,
                'response' => $response
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'timestamp' => now()->toISOString(),
                'base_url' => $this->baseUrl,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * 獲取 API 基礎 URL
     */
    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * 設定請求超時時間
     */
    public function setTimeout(int $timeout): self
    {
        $this->timeout = $timeout;
        return $this;
    }

    /**
     * 設定連接超時時間
     */
    public function setConnectTimeout(int $timeout): self
    {
        $this->connectTimeout = $timeout;
        return $this;
    }
}