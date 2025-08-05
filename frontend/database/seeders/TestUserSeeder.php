<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Company;
use App\Models\BusinessUnit;
use App\Models\UserCompany;
use App\Models\UserBusinessUnit;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        // 檢查測試用戶是否已存在
        $existingUser = User::where('email', 'test@nexuserp.com')->first();
        if ($existingUser) {
            $this->command->info('Test user already exists');
            
            // 檢查是否需要補充公司關聯
            if (!$existingUser->hasCompany()) {
                $this->command->info('Adding company association to existing test user');
                $this->createCompanyForUser($existingUser);
            } else {
                $this->command->info('Test user already has company association');
            }
            return;
        }

        // 創建測試用戶和公司
        DB::transaction(function () {
            // 創建測試用戶
            $user = User::create([
                'name' => '測試管理員',
                'email' => 'test@nexuserp.com',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
                'business_type' => 'retail',
                'role' => 'business_owner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 為用戶建立公司
            $this->createCompanyForUser($user);

            $this->command->info('Test user and company created successfully');
        });

        $this->command->info('Email: test@nexuserp.com');
        $this->command->info('Password: password123');
    }

    private function createCompanyForUser(User $user): void
    {
        // 建立測試公司
        $company = Company::create([
            'name' => '測試公司',
            'display_name' => '測試公司',
            'code' => 'TEST-COMPANY',
            'tax_number' => '12345678',
            'industry' => 'retail',
            'size' => '1-10',
            'phone' => '02-1234-5678',
            'address' => ['full' => '台北市測試區測試路123號'],
            'email' => 'test@testcompany.com',
            'is_active' => true,
            'created_by_user_id' => $user->id,
            'currency' => 'TWD',
            'timezone' => 'Asia/Taipei',
            'locale' => 'zh_TW',
        ]);

        // 建立用戶-公司關聯
        UserCompany::create([
            'user_id' => $user->id,
            'company_id' => $company->id,
            'role' => 'admin',
            'is_primary' => true,
            'is_active' => true,
            'joined_at' => now(),
        ]);

        // 建立預設業務單位
        $businessUnit = BusinessUnit::create([
            'company_id' => $company->id,
            'name' => '測試總部',
            'display_name' => '測試總部',
            'code' => 'TEST-HQ',
            'type' => 'headquarters',
            'is_active' => true,
            'created_by_user_id' => $user->id,
        ]);

        // 關聯用戶到業務單位
        UserBusinessUnit::create([
            'user_id' => $user->id,
            'business_unit_id' => $businessUnit->id,
            'role' => 'admin',
            'is_primary' => true,
            'is_active' => true,
            'joined_at' => now(),
        ]);

        $this->command->info("Company '{$company->name}' created and associated with user");
    }
}