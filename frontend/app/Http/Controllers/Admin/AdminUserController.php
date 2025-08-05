<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    /**
     * 顯示使用者列表
     */
    public function index(Request $request): View
    {
        $query = User::query();

        // 搜尋功能
        if ($request->filled('name')) {
            $query->where('name', 'ILIKE', '%' . $request->name . '%');
        }

        if ($request->filled('email')) {
            $query->where('email', 'ILIKE', '%' . $request->email . '%');
        }

        if ($request->filled('business_type')) {
            $query->where('business_type', $request->business_type);
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(15);
        
        return view('admin.users.index', compact('users'));
    }

    /**
     * 顯示建立使用者表單
     */
    public function create(): View
    {
        return view('admin.users.create');
    }

    /**
     * 儲存新使用者
     */
    public function store(Request $request): RedirectResponse
    {
        // 檢查 DEMO 帳號權限
        if ($this->isDemoAccount()) {
            return $this->demoAccountDenied('建立使用者');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'business_type' => 'nullable|string|in:restaurant,retail,manufacturing,service,technology,agriculture,other',
            'role' => 'nullable|string|in:admin,restaurant_owner,shop_owner,factory_owner,service_provider,farmer,business_owner,accountant,employee',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'business_type' => $request->business_type,
            'role' => $request->role,
            'email_verified_at' => now(), // 管理員建立的帳號預設為已驗證
        ]);

        return redirect()->route('admin.users.index')
            ->with('success', '使用者已成功建立');
    }

    /**
     * 顯示使用者詳細資訊
     */
    public function show(string $id): View
    {
        $user = User::findOrFail($id);
        
        return view('admin.users.show', compact('user'));
    }

    /**
     * 顯示編輯使用者表單
     */
    public function edit(string $id): View
    {
        $user = User::findOrFail($id);
        
        return view('admin.users.edit', compact('user'));
    }

    /**
     * 更新使用者資訊
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        // 檢查 DEMO 帳號權限
        if ($this->isDemoAccount()) {
            return $this->demoAccountDenied('編輯使用者');
        }

        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8|confirmed',
            'business_type' => 'nullable|string|in:restaurant,retail,manufacturing,service,technology,agriculture,other',
            'role' => 'nullable|string|in:admin,restaurant_owner,shop_owner,factory_owner,service_provider,farmer,business_owner,accountant,employee',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'business_type' => $request->business_type,
            'role' => $request->role,
        ];

        // 如果有提供新密碼才更新
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return redirect()->route('admin.users.index')
            ->with('success', '使用者資訊已成功更新');
    }

    /**
     * 刪除使用者
     */
    public function destroy(string $id): RedirectResponse
    {
        // 檢查 DEMO 帳號權限
        if ($this->isDemoAccount()) {
            return $this->demoAccountDenied('刪除使用者');
        }

        $user = User::findOrFail($id);
        
        // 防止刪除自己 (雖然這是管理員系統，但還是加個保護)
        $currentAdminUser = Session::get('admin_user');
        if ($user->email === $currentAdminUser) {
            return redirect()->route('admin.users.index')
                ->with('error', '無法刪除當前登入的管理員帳號');
        }

        $userName = $user->name;
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', "使用者 「{$userName}」 已成功刪除");
    }

    /**
     * 檢查是否為 DEMO 帳號
     */
    private function isDemoAccount(): bool
    {
        return Session::get('admin_user') === 'DEMO';
    }

    /**
     * DEMO 帳號權限不足時的回應
     */
    private function demoAccountDenied(string $action): RedirectResponse
    {
        return back()->with('error', "DEMO 帳號沒有「{$action}」的權限，此功能僅供展示");
    }

    /**
     * AJAX - 檢查 DEMO 帳號權限
     */
    public function checkDemoPermission(): JsonResponse
    {
        return response()->json([
            'is_demo' => $this->isDemoAccount(),
            'message' => 'DEMO 帳號沒有刪除的權限'
        ]);
    }
}