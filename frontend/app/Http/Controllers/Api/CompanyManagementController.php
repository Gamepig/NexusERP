<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use App\Models\UserCompany;
use App\Models\CompanyInvitation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * 多租戶公司管理控制器
 * 
 * 功能：
 * 1. 用戶邀請加入公司
 * 2. 公司切換功能
 * 3. 公司用戶管理
 * 4. 邀請接受處理
 * 
 * 安全級別：CRITICAL - 涉及多租戶數據隔離核心邏輯
 */
class CompanyManagementController extends Controller
{
    /**
     * 獲取當前用戶的公司列表
     */
    public function getUserCompanies(): JsonResponse
    {
        try {
            $user = auth()->user();
            $currentCompanyId = session('current_company_id');
            
            $companies = $user->companies()
                ->wherePivot('is_active', true)
                ->with(['businessUnits' => function ($query) use ($user) {
                    $query->whereHas('users', function ($q) use ($user) {
                        $q->where('user_business_units.user_id', $user->id)
                          ->where('user_business_units.is_active', true);
                    });
                }])
                ->get()
                ->map(function ($company) use ($currentCompanyId) {
                    $pivot = $company->pivot;
                    return [
                        'id' => $company->id,
                        'name' => $company->name,
                        'display_name' => $company->display_name,
                        'code' => $company->code,
                        'role' => $pivot->role,
                        'is_primary' => $pivot->is_primary,
                        'is_current' => $company->id == $currentCompanyId,
                        'joined_at' => $pivot->joined_at,
                        'business_units' => $company->businessUnits->map(function ($unit) {
                            return [
                                'id' => $unit->id,
                                'name' => $unit->name,
                                'type' => $unit->type,
                            ];
                        }),
                    ];
                });

            return response()->json([
                'success' => true,
                'companies' => $companies,
                'current_company_id' => $currentCompanyId,
                'total_count' => $companies->count(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('獲取用戶公司列表失敗', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => '獲取公司列表失敗',
                'message' => config('app.debug') ? $e->getMessage() : '系統錯誤'
            ], 500);
        }
    }

    /**
     * 切換當前公司
     */
    public function switchCompany(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'company_id' => 'required|integer|min:1',
            ]);

            $user = auth()->user();
            $companyId = $request->company_id;

            // 檢查用戶是否屬於該公司
            $userCompany = $user->companies()
                ->where('companies.id', $companyId)
                ->wherePivot('is_active', true)
                ->first();

            if (!$userCompany) {
                return response()->json([
                    'success' => false,
                    'error' => '您不是此公司的成員或已被停用'
                ], 403);
            }

            // 更新會話中的公司ID
            $previousCompanyId = session('current_company_id');
            session(['current_company_id' => $companyId]);

            // 記錄公司切換事件
            Log::info('用戶切換公司', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'from_company_id' => $previousCompanyId,
                'to_company_id' => $companyId,
                'company_name' => $userCompany->name,
                'user_role' => $userCompany->pivot->role,
                'timestamp' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '已切換到 ' . $userCompany->display_name,
                'company' => [
                    'id' => $userCompany->id,
                    'name' => $userCompany->name,
                    'display_name' => $userCompany->display_name,
                    'code' => $userCompany->code,
                    'role' => $userCompany->pivot->role,
                    'is_primary' => $userCompany->pivot->is_primary,
                ],
                'previous_company_id' => $previousCompanyId,
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => '參數驗證失敗',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('切換公司失敗', [
                'user_id' => auth()->id(),
                'company_id' => $request->company_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => '切換公司失敗',
                'message' => config('app.debug') ? $e->getMessage() : '系統錯誤'
            ], 500);
        }
    }

    /**
     * 邀請用戶加入公司
     */
    public function inviteUser(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email|max:255',
                'role' => 'required|string|in:admin,manager,member',
                'business_unit_ids' => 'nullable|array',
                'business_unit_ids.*' => 'exists:business_units,id',
                'message' => 'nullable|string|max:500',
            ]);

            $currentCompanyId = $this->getCurrentCompanyId();
            $inviterUser = auth()->user();
            
            // 檢查邀請權限
            if (!$this->canInviteUsers($inviterUser, $currentCompanyId)) {
                return response()->json([
                    'success' => false,
                    'error' => '您沒有邀請用戶的權限'
                ], 403);
            }

            // 檢查用戶是否已是公司成員
            $existingUser = User::where('email', $request->email)->first();
            if ($existingUser && $existingUser->companies()->where('company_id', $currentCompanyId)->exists()) {
                return response()->json([
                    'success' => false,
                    'error' => '該用戶已是公司成員'
                ], 422);
            }

            // 檢查是否已有未過期的邀請
            $existingInvitation = CompanyInvitation::where('company_id', $currentCompanyId)
                ->where('email', $request->email)
                ->where('expires_at', '>', now())
                ->whereNull('accepted_at')
                ->first();

            if ($existingInvitation) {
                return response()->json([
                    'success' => false,
                    'error' => '該用戶已有未過期的邀請，請等待處理或重新發送'
                ], 422);
            }

            // 建立邀請記錄
            $invitation = CompanyInvitation::create([
                'company_id' => $currentCompanyId,
                'email' => $request->email,
                'role' => $request->role,
                'invited_by_user_id' => $inviterUser->id,
                'token' => Str::random(32),
                'expires_at' => now()->addDays(7),
                'business_unit_ids' => $request->business_unit_ids ?? [],
                'message' => $request->message,
            ]);

            // TODO: 發送邀請郵件
            // Mail::to($request->email)->send(new CompanyInvitationMail($invitation));

            Log::info('用戶邀請已發送', [
                'invitation_id' => $invitation->id,
                'company_id' => $currentCompanyId,
                'inviter_id' => $inviterUser->id,
                'invitee_email' => $request->email,
                'role' => $request->role,
            ]);

            return response()->json([
                'success' => true,
                'message' => '邀請已發送至 ' . $request->email,
                'invitation' => [
                    'id' => $invitation->id,
                    'email' => $invitation->email,
                    'role' => $invitation->role,
                    'expires_at' => $invitation->expires_at,
                    'invitation_url' => route('company.invitation.accept', $invitation->token),
                ],
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => '參數驗證失敗',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('邀請用戶失敗', [
                'user_id' => auth()->id(),
                'company_id' => $this->getCurrentCompanyId(),
                'email' => $request->email ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => '邀請發送失敗',
                'message' => config('app.debug') ? $e->getMessage() : '系統錯誤'
            ], 500);
        }
    }

    /**
     * 獲取公司用戶列表
     */
    public function getCompanyUsers(): JsonResponse
    {
        try {
            $companyId = $this->getCurrentCompanyId();
            
            if (!$this->canManageUsers(auth()->user(), $companyId)) {
                return response()->json([
                    'success' => false,
                    'error' => '您沒有查看用戶列表的權限'
                ], 403);
            }
            
            $users = User::whereHas('companies', function ($query) use ($companyId) {
                    $query->where('user_companies.company_id', $companyId)
                          ->where('user_companies.is_active', true);
                })
                ->with(['companies' => function ($query) use ($companyId) {
                    $query->where('company_id', $companyId);
                }])
                ->get()
                ->map(function ($user) {
                    $pivot = $user->companies->first()->pivot;
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $pivot->role,
                        'is_primary' => $pivot->is_primary,
                        'joined_at' => $pivot->joined_at,
                        'last_login_at' => $user->last_login_at,
                        'is_active' => $pivot->is_active,
                        'created_at' => $user->created_at,
                    ];
                });

            // 獲取待處理邀請
            $pendingInvitations = CompanyInvitation::where('company_id', $companyId)
                ->where('expires_at', '>', now())
                ->whereNull('accepted_at')
                ->with('invitedBy:id,name,email')
                ->get()
                ->map(function ($invitation) {
                    return [
                        'id' => $invitation->id,
                        'email' => $invitation->email,
                        'role' => $invitation->role,
                        'invited_by' => $invitation->invitedBy->name ?? '未知',
                        'invited_at' => $invitation->created_at,
                        'expires_at' => $invitation->expires_at,
                        'status' => 'pending',
                    ];
                });

            return response()->json([
                'success' => true,
                'users' => $users,
                'pending_invitations' => $pendingInvitations,
                'total_users' => $users->count(),
                'total_pending' => $pendingInvitations->count(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('獲取公司用戶列表失敗', [
                'user_id' => auth()->id(),
                'company_id' => $this->getCurrentCompanyId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => '獲取用戶列表失敗',
                'message' => config('app.debug') ? $e->getMessage() : '系統錯誤'
            ], 500);
        }
    }

    /**
     * 更新用戶角色
     */
    public function updateUserRole(Request $request, int $userId): JsonResponse
    {
        try {
            $request->validate([
                'role' => 'required|string|in:admin,manager,member',
            ]);

            $companyId = $this->getCurrentCompanyId();
            $currentUser = auth()->user();

            // 檢查權限
            if (!$this->canManageUsers($currentUser, $companyId)) {
                return response()->json([
                    'success' => false,
                    'error' => '您沒有管理用戶的權限'
                ], 403);
            }

            // 檢查目標用戶是否屬於當前公司
            $targetUser = User::find($userId);
            if (!$targetUser || !$targetUser->companies()->where('company_id', $companyId)->exists()) {
                return response()->json([
                    'success' => false,
                    'error' => '用戶不存在或不屬於當前公司'
                ], 404);
            }

            // 不能修改自己的角色
            if ($userId === $currentUser->id) {
                return response()->json([
                    'success' => false,
                    'error' => '不能修改自己的角色'
                ], 422);
            }

            // 更新用戶角色
            UserCompany::where('user_id', $userId)
                ->where('company_id', $companyId)
                ->update(['role' => $request->role]);

            Log::info('用戶角色已更新', [
                'updated_by' => $currentUser->id,
                'target_user_id' => $userId,
                'company_id' => $companyId,
                'old_role' => $targetUser->companies()->where('company_id', $companyId)->first()->pivot->role ?? 'unknown',
                'new_role' => $request->role,
            ]);

            return response()->json([
                'success' => true,
                'message' => '用戶角色已更新為 ' . $request->role,
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'role' => $request->role,
                ],
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => '參數驗證失敗',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('更新用戶角色失敗', [
                'user_id' => auth()->id(),
                'target_user_id' => $userId ?? null,
                'company_id' => $this->getCurrentCompanyId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => '更新用戶角色失敗',
                'message' => config('app.debug') ? $e->getMessage() : '系統錯誤'
            ], 500);
        }
    }

    /**
     * 接受邀請 (Web 路由使用)
     */
    public function acceptInvitation(string $token)
    {
        try {
            // 尋找有效的邀請
            $invitation = CompanyInvitation::where('token', $token)
                ->where('expires_at', '>', now())
                ->whereNull('accepted_at')
                ->with(['company', 'invitedBy'])
                ->first();

            if (!$invitation) {
                return response()->json([
                    'success' => false,
                    'error' => '邀請無效、已過期或已被接受'
                ], 404);
            }

            $user = auth()->user();
            
            // 如果用戶未登入，返回邀請資訊以供前端處理
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'requires_auth' => true,
                    'invitation' => [
                        'company_name' => $invitation->company->display_name,
                        'role' => $invitation->role,
                        'invited_by' => $invitation->invitedBy->name,
                        'expires_at' => $invitation->expires_at,
                    ]
                ], 401);
            }

            // 檢查邀請的 email 是否與當前用戶匹配
            if ($invitation->email !== $user->email) {
                return response()->json([
                    'success' => false,
                    'error' => '此邀請不適用於您的帳號'
                ], 403);
            }

            // 檢查用戶是否已是公司成員
            if ($user->companies()->where('company_id', $invitation->company_id)->exists()) {
                return response()->json([
                    'success' => false,
                    'error' => '您已是此公司的成員'
                ], 422);
            }

            // 開始資料庫事務
            DB::beginTransaction();

            try {
                // 建立用戶-公司關聯
                $user->companies()->attach($invitation->company_id, [
                    'role' => $invitation->role,
                    'is_primary' => false,
                    'is_active' => true,
                    'joined_at' => now(),
                ]);

                // 如果有指定業務單位，建立關聯
                if (!empty($invitation->business_unit_ids)) {
                    foreach ($invitation->business_unit_ids as $businessUnitId) {
                        $user->businessUnits()->attach($businessUnitId, [
                            'role' => $invitation->role,
                            'is_primary' => false,
                            'is_active' => true,
                            'joined_at' => now(),
                        ]);
                    }
                }

                // 標記邀請為已接受
                $invitation->update([
                    'accepted_at' => now(),
                    'accepted_by_user_id' => $user->id,
                ]);

                DB::commit();

                // 記錄邀請接受事件
                Log::info('用戶接受邀請', [
                    'invitation_id' => $invitation->id,
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'company_id' => $invitation->company_id,
                    'company_name' => $invitation->company->name,
                    'role' => $invitation->role,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => '邀請已成功接受，歡迎加入 ' . $invitation->company->display_name,
                    'company' => [
                        'id' => $invitation->company->id,
                        'name' => $invitation->company->name,
                        'display_name' => $invitation->company->display_name,
                        'role' => $invitation->role,
                    ],
                    'redirect_url' => route('dashboard'),
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('接受邀請失敗', [
                'token' => $token,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => '接受邀請失敗',
                'message' => config('app.debug') ? $e->getMessage() : '系統錯誤'
            ], 500);
        }
    }

    /**
     * 獲取邀請資訊 (供前端顯示)
     */
    public function getInvitation(string $token)
    {
        try {
            $invitation = CompanyInvitation::where('token', $token)
                ->where('expires_at', '>', now())
                ->whereNull('accepted_at')
                ->with(['company', 'invitedBy'])
                ->first();

            if (!$invitation) {
                return response()->json([
                    'success' => false,
                    'error' => '邀請無效、已過期或已被接受'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'invitation' => [
                    'company_name' => $invitation->company->display_name,
                    'company_code' => $invitation->company->code,
                    'role' => $invitation->role,
                    'invited_by' => $invitation->invitedBy->name,
                    'invited_at' => $invitation->created_at,
                    'expires_at' => $invitation->expires_at,
                    'message' => $invitation->message,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('獲取邀請資訊失敗', [
                'token' => $token,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => '獲取邀請資訊失敗',
                'message' => config('app.debug') ? $e->getMessage() : '系統錯誤'
            ], 500);
        }
    }

    /**
     * 獲取當前公司ID
     */
    protected function getCurrentCompanyId(): ?int
    {
        $user = auth()->user();
        
        if (!$user) {
            return null;
        }

        // 1. 檢查會話中的公司ID
        $sessionCompanyId = session('current_company_id');
        if ($sessionCompanyId && $user->companies()->where('companies.id', $sessionCompanyId)->wherePivot('is_active', true)->exists()) {
            return (int) $sessionCompanyId;
        }

        // 2. 獲取用戶的主要公司
        $primaryCompany = $user->companies()
            ->wherePivot('is_primary', true)
            ->wherePivot('is_active', true)
            ->first();
            
        if ($primaryCompany) {
            return $primaryCompany->id;
        }

        // 3. 獲取用戶的第一個有效公司
        $firstCompany = $user->companies()
            ->wherePivot('is_active', true)
            ->first();
            
        return $firstCompany?->id;
    }

    /**
     * 檢查用戶是否可以邀請其他用戶
     */
    protected function canInviteUsers($user, $companyId): bool
    {
        return $user->companies()
            ->where('company_id', $companyId)
            ->wherePivot('role', 'admin')
            ->wherePivot('is_active', true)
            ->exists();
    }

    /**
     * 檢查用戶是否可以管理其他用戶
     */
    protected function canManageUsers($user, $companyId): bool
    {
        return $user->companies()
            ->where('company_id', $companyId)
            ->whereIn('user_companies.role', ['admin', 'manager'])
            ->wherePivot('is_active', true)
            ->exists();
    }
}