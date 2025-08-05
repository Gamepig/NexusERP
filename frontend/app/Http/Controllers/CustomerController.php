<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\ApiService;

class CustomerController extends Controller
{
    protected $apiService;

    public function __construct(ApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Display the customer listing page with data
     */
    public function index(Request $request)
    {
        try {
            // Get query parameters for search and filtering
            $params = [
                'search' => $request->get('search'),
                'customer_type' => $request->get('customer_type'),
                'status' => $request->get('status'),
                'page' => $request->get('page', 1),
                'page_size' => $request->get('page_size', 20),
            ];

            // Remove null values
            $params = array_filter($params, function($value) {
                return $value !== null && $value !== '';
            });

            // Get customers from Go backend API
            $response = $this->apiService->get('/customers/', $params);

            if ($response['success']) {
                $customers = $response['data']['customers'] ?? [];
                $pagination = [
                    'total' => $response['data']['total'] ?? 0,
                    'page' => $response['data']['page'] ?? 1,
                    'page_size' => $response['data']['page_size'] ?? 20,
                    'total_pages' => $response['data']['total_pages'] ?? 1,
                ];

                return view('customers.index', [
                    'customers' => $customers,
                    'pagination' => $pagination,
                    'filters' => $params
                ]);
            } else {
                return view('customers.index', [
                    'customers' => [],
                    'pagination' => ['total' => 0, 'page' => 1, 'page_size' => 20, 'total_pages' => 0],
                    'filters' => $params,
                    'error' => $response['message'] ?? '載入客戶資料失敗'
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Customer listing failed: ' . $e->getMessage());
            return view('customers.index', [
                'customers' => [],
                'pagination' => ['total' => 0, 'page' => 1, 'page_size' => 20, 'total_pages' => 0],
                'filters' => [],
                'error' => '系統錯誤，請稍後重試'
            ]);
        }
    }

    /**
     * Store a newly created customer in storage.
     */
    public function store(Request $request)
    {
        try {
            // Validate the request with form field names
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:128',
                'phone' => 'nullable|string|max:32',
                'type' => 'required|in:individual,company',
                'company' => 'nullable|string|max:255',
                'country' => 'nullable|string|max:64',
                'city' => 'nullable|string|max:128',
                'postal_code' => 'nullable|string|max:32',
                'address' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ]);

            // Map form fields to API fields
            $apiData = [
                'customer_code' => 'CUST-' . time(), // Generate a customer code
                'name' => $validated['name'],
                'company_name' => $validated['company'] ?? null,
                'customer_type' => $validated['type'] === 'company' ? 'business' : 'individual',
                'status' => $validated['status'] ?? 'active',
                'primary_email' => $validated['email'],
                'primary_phone' => $validated['phone'] ?? null,
                'address_line1' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'country' => $validated['country'] ?? 'Taiwan',
                'notes' => $validated['notes'] ?? null,
                'credit_limit' => 0.00,
                'payment_terms' => 30,
                'discount_percentage' => 0.00,
            ];

            // Send request to Go backend API
            $response = $this->apiService->post('/customers', $apiData);

            if ($response['success']) {
                return redirect()
                    ->route('customers.index')
                    ->with('success', '客戶新增成功！');
            } else {
                return back()
                    ->withErrors(['api' => $response['message'] ?? '新增客戶失敗'])
                    ->withInput();
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Customer creation failed: ' . $e->getMessage());
            return back()
                ->withErrors(['api' => '系統錯誤，請稍後重試'])
                ->withInput();
        }
    }

    /**
     * Update the specified customer in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            // Validate the request with form field names
            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'company' => 'nullable|string|max:255', // Form uses 'company' not 'company_name'
                'type' => 'nullable|in:individual,company', // Form uses 'type' not 'customer_type'
                'status' => 'nullable|in:active,inactive',
                'email' => 'nullable|email|max:128', // Form uses 'email' not 'primary_email'
                'phone' => 'nullable|string|max:32', // Form uses 'phone' not 'primary_phone'
                'address' => 'nullable|string|max:255', // Form uses 'address' not 'address_line1'
                'city' => 'nullable|string|max:128',
                'postal_code' => 'nullable|string|max:32',
                'country' => 'nullable|string|max:64',
                'notes' => 'nullable|string',
            ]);

            // Map form fields to API fields
            $apiData = [];
            if (isset($validated['name'])) $apiData['name'] = $validated['name'];
            if (isset($validated['company'])) $apiData['company_name'] = $validated['company'];
            if (isset($validated['type'])) {
                $apiData['customer_type'] = $validated['type'] === 'company' ? 'business' : 'individual';
            }
            if (isset($validated['status'])) $apiData['status'] = $validated['status'];
            if (isset($validated['email'])) $apiData['primary_email'] = $validated['email'];
            if (isset($validated['phone'])) $apiData['primary_phone'] = $validated['phone'];
            if (isset($validated['address'])) $apiData['address_line1'] = $validated['address'];
            if (isset($validated['city'])) $apiData['city'] = $validated['city'];
            if (isset($validated['postal_code'])) $apiData['postal_code'] = $validated['postal_code'];
            if (isset($validated['country'])) $apiData['country'] = $validated['country'];
            if (isset($validated['notes'])) $apiData['notes'] = $validated['notes'];

            // Remove empty values to avoid updating fields that shouldn't change
            $apiData = array_filter($apiData, function($value) {
                return $value !== null && $value !== '';
            });

            // Send request to Go backend API
            $response = $this->apiService->put("/customers/{$id}", $apiData);

            if ($response['success']) {
                return redirect()
                    ->route('customers.show', $id)
                    ->with('success', '客戶資訊更新成功！');
            } else {
                return back()
                    ->withErrors(['api' => $response['message'] ?? '更新客戶失敗'])
                    ->withInput();
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Customer update failed: ' . $e->getMessage());
            return back()
                ->withErrors(['api' => '系統錯誤，請稍後重試'])
                ->withInput();
        }
    }

    /**
     * Remove the specified customer from storage (soft delete).
     */
    public function destroy($id)
    {
        try {
            // Send delete request to Go backend API
            $response = $this->apiService->delete("/customers/{$id}");

            if ($response['success']) {
                return redirect()
                    ->route('customers.index')
                    ->with('success', '客戶已成功刪除！');
            } else {
                return back()
                    ->withErrors(['api' => $response['message'] ?? '刪除客戶失敗']);
            }

        } catch (\Exception $e) {
            Log::error('Customer deletion failed: ' . $e->getMessage());
            return back()
                ->withErrors(['api' => '系統錯誤，請稍後重試']);
        }
    }

    /**
     * Get customer data for AJAX requests
     */
    public function show($id)
    {
        try {
            $response = $this->apiService->get("/customers/{$id}");
            
            if ($response['success']) {
                // Fix data extraction - API response uses 'customer_data' structure
                $customer = null;
                if (isset($response['customer_data']['customer'])) {
                    $customer = $response['customer_data']['customer'];
                } elseif (isset($response['data']['customer'])) {
                    $customer = $response['data']['customer'];
                } elseif (isset($response['data'])) {
                    $customer = $response['data'];
                }
                
                if (!$customer) {
                    Log::warning("Customer data not found in API response for ID: {$id}");
                    return redirect()
                        ->route('customers.index')
                        ->withErrors(['api' => '找不到指定的客戶']);
                }

                // Get navigation data for previous/next customer
                $navigation = $this->getCustomerNavigation($id);
                
                return view('customers.show', [
                    'customer' => $customer,
                    'customerId' => $id,
                    'navigation' => $navigation
                ]);
            } else {
                return redirect()
                    ->route('customers.index')
                    ->withErrors(['api' => '找不到指定的客戶']);
            }

        } catch (\Exception $e) {
            Log::error('Customer fetch failed: ' . $e->getMessage());
            return redirect()
                ->route('customers.index')
                ->withErrors(['api' => '系統錯誤，請稍後重試']);
        }
    }

    /**
     * Get navigation data for customer browsing
     */
    private function getCustomerNavigation($currentId)
    {
        try {
            // Get all customers list to determine navigation (sorted by ID)
            $response = $this->apiService->get('/customers/', [
                'page_size' => 1000,
                'sort' => 'id',
                'order' => 'asc'
            ]);
            
            if ($response['success']) {
                // Handle different response structures
                $customers = [];
                if (isset($response['data']['customers'])) {
                    $customers = $response['data']['customers'];
                } elseif (isset($response['data']) && is_array($response['data'])) {
                    $customers = $response['data'];
                }
                
                if (!empty($customers)) {
                    $currentIndex = null;
                    
                    // Find current customer index
                    foreach ($customers as $index => $customer) {
                        if ($customer['id'] == $currentId) {
                            $currentIndex = $index;
                            break;
                        }
                    }
                    
                    if ($currentIndex !== null) {
                        $navigation = [
                            'current_position' => $currentIndex + 1,
                            'total_customers' => count($customers),
                            'previous' => $currentIndex > 0 ? $customers[$currentIndex - 1] : null,
                            'next' => $currentIndex < count($customers) - 1 ? $customers[$currentIndex + 1] : null
                        ];
                        
                        return $navigation;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to get customer navigation: ' . $e->getMessage());
        }
        
        return null;
    }

    /**
     * Show the form for editing the specified customer.
     */
    public function edit($id)
    {
        try {
            $response = $this->apiService->get("/customers/{$id}");
            
            if ($response['success']) {
                // Fix data extraction - API response uses 'customer_data' structure
                $customer = null;
                if (isset($response['customer_data']['customer'])) {
                    $customer = $response['customer_data']['customer'];
                } elseif (isset($response['data']['customer'])) {
                    $customer = $response['data']['customer'];
                } elseif (isset($response['data'])) {
                    $customer = $response['data'];
                }
                
                if (!$customer) {
                    return redirect()
                        ->route('customers.index')
                        ->withErrors(['api' => '客戶數據格式錯誤']);
                }

                // Get navigation data for previous/next customer
                $navigation = $this->getCustomerNavigation($id);
                
                return view('customers.form', [
                    'mode' => 'edit',
                    'customer' => $customer,
                    'customerId' => $id,
                    'navigation' => $navigation
                ]);
            } else {
                return redirect()
                    ->route('customers.index')
                    ->withErrors(['api' => '找不到指定的客戶']);
            }

        } catch (\Exception $e) {
            Log::error('Customer edit fetch failed: ' . $e->getMessage());
            return redirect()
                ->route('customers.index')
                ->withErrors(['api' => '系統錯誤，請稍後重試']);
        }
    }
}