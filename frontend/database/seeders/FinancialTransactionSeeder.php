<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinancialTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $currentMonth = $now->startOfMonth()->copy();
        $previousMonth = $now->copy()->subMonth()->startOfMonth();
        
        // 清空現有數據
        DB::table('financial_transactions')->truncate();
        DB::table('financial_accounts')->truncate();
        
        // 建立現金帳戶
        DB::table('financial_accounts')->insert([
            'account_code' => 'CASH001',
            'account_name' => '現金帳戶',
            'account_type' => 'cash',
            'currency' => 'TWD',
            'balance' => 2500000,
            'date' => $previousMonth->toDateString(),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // 當月營業活動交易
        $operatingTransactions = [
            // 收入相關
            ['date' => $currentMonth->copy()->addDays(5), 'type' => 'income', 'category' => 'sales_revenue', 'amount' => 3500000, 'description' => '產品銷售收入'],
            ['date' => $currentMonth->copy()->addDays(10), 'type' => 'income', 'category' => 'service_revenue', 'amount' => 850000, 'description' => '服務收入'],
            ['date' => $currentMonth->copy()->addDays(15), 'type' => 'income', 'category' => 'other_revenue', 'amount' => 120000, 'description' => '其他營業收入'],
            
            // 費用相關
            ['date' => $currentMonth->copy()->addDays(3), 'type' => 'expense', 'category' => 'cost_of_goods', 'amount' => 1800000, 'description' => '銷貨成本'],
            ['date' => $currentMonth->copy()->addDays(7), 'type' => 'expense', 'category' => 'salary', 'amount' => 650000, 'description' => '員工薪資'],
            ['date' => $currentMonth->copy()->addDays(12), 'type' => 'expense', 'category' => 'rent', 'amount' => 180000, 'description' => '辦公室租金'],
            ['date' => $currentMonth->copy()->addDays(20), 'type' => 'expense', 'category' => 'utilities', 'amount' => 45000, 'description' => '水電費'],
            ['date' => $currentMonth->copy()->addDays(25), 'type' => 'expense', 'category' => 'marketing', 'amount' => 120000, 'description' => '行銷費用'],
            
            // 折舊
            ['date' => $currentMonth->copy()->endOfMonth(), 'type' => 'expense', 'category' => 'depreciation', 'amount' => 85000, 'description' => '設備折舊'],
            
            // 應收帳款增加
            ['date' => $currentMonth->copy()->addDays(8), 'type' => 'expense', 'category' => 'accounts_receivable', 'amount' => 320000, 'description' => '應收帳款增加'],
            
            // 存貨增加
            ['date' => $currentMonth->copy()->addDays(6), 'type' => 'expense', 'category' => 'inventory_increase', 'amount' => 450000, 'description' => '存貨採購'],
            
            // 應付帳款增加
            ['date' => $currentMonth->copy()->addDays(9), 'type' => 'income', 'category' => 'accounts_payable', 'amount' => 280000, 'description' => '應付帳款增加'],
            
            // 稅務支付
            ['date' => $currentMonth->copy()->addDays(15), 'type' => 'expense', 'category' => 'tax_payment', 'amount' => 754000, 'description' => '所得稅支付'],
            
            // 其他營業項目
            ['date' => $currentMonth->copy()->addDays(18), 'type' => 'expense', 'category' => 'other_operating', 'amount' => 176000, 'description' => '其他營業費用'],
        ];
        
        // 投資活動交易
        $investingTransactions = [
            ['date' => $currentMonth->copy()->addDays(10), 'type' => 'expense', 'category' => 'fixed_assets_purchase', 'amount' => 1200000, 'description' => '購置生產設備'],
            ['date' => $currentMonth->copy()->addDays(14), 'type' => 'expense', 'category' => 'investment', 'amount' => 500000, 'description' => '投資理財產品'],
            ['date' => $currentMonth->copy()->addDays(20), 'type' => 'income', 'category' => 'asset_disposal', 'amount' => 80000, 'description' => '處分舊設備收入'],
            ['date' => $currentMonth->copy()->addDays(22), 'type' => 'income', 'category' => 'investment_return', 'amount' => 120000, 'description' => '投資收回'],
        ];
        
        // 籌資活動交易
        $financingTransactions = [
            ['date' => $currentMonth->copy()->addDays(5), 'type' => 'expense', 'category' => 'loan', 'amount' => 300000, 'description' => '償還銀行貸款'],
            ['date' => $currentMonth->copy()->addDays(25), 'type' => 'expense', 'category' => 'dividends', 'amount' => 200000, 'description' => '股利發放'],
            ['date' => $currentMonth->copy()->addDays(15), 'type' => 'income', 'category' => 'other_financing', 'amount' => 50000, 'description' => '其他籌資收入'],
        ];
        
        // 上月交易（用於比較）
        $previousMonthTransactions = [
            // 營業活動
            ['date' => $previousMonth->copy()->addDays(5), 'type' => 'income', 'category' => 'sales_revenue', 'amount' => 2800000, 'description' => '產品銷售收入'],
            ['date' => $previousMonth->copy()->addDays(10), 'type' => 'income', 'category' => 'service_revenue', 'amount' => 750000, 'description' => '服務收入'],
            ['date' => $previousMonth->copy()->addDays(3), 'type' => 'expense', 'category' => 'cost_of_goods', 'amount' => 1200000, 'description' => '銷貨成本'],
            ['date' => $previousMonth->copy()->endOfMonth(), 'type' => 'expense', 'category' => 'depreciation', 'amount' => 82000, 'description' => '設備折舊'],
            ['date' => $previousMonth->copy()->addDays(8), 'type' => 'expense', 'category' => 'accounts_receivable', 'amount' => 180000, 'description' => '應收帳款增加'],
            ['date' => $previousMonth->copy()->addDays(6), 'type' => 'expense', 'category' => 'inventory_increase', 'amount' => 280000, 'description' => '存貨採購'],
            ['date' => $previousMonth->copy()->addDays(9), 'type' => 'income', 'category' => 'accounts_payable', 'amount' => 150000, 'description' => '應付帳款增加'],
            ['date' => $previousMonth->copy()->addDays(15), 'type' => 'expense', 'category' => 'tax_payment', 'amount' => 470000, 'description' => '所得稅支付'],
            ['date' => $previousMonth->copy()->addDays(18), 'type' => 'expense', 'category' => 'other_operating', 'amount' => 120000, 'description' => '其他營業費用'],
            
            // 投資活動
            ['date' => $previousMonth->copy()->addDays(10), 'type' => 'expense', 'category' => 'fixed_assets_purchase', 'amount' => 800000, 'description' => '購置設備'],
            ['date' => $previousMonth->copy()->addDays(14), 'type' => 'expense', 'category' => 'investment', 'amount' => 300000, 'description' => '投資理財產品'],
            ['date' => $previousMonth->copy()->addDays(20), 'type' => 'income', 'category' => 'asset_disposal', 'amount' => 50000, 'description' => '處分資產收入'],
            
            // 籌資活動
            ['date' => $previousMonth->copy()->addDays(5), 'type' => 'income', 'category' => 'loan', 'amount' => 500000, 'description' => '銀行借款'],
            ['date' => $previousMonth->copy()->addDays(25), 'type' => 'expense', 'category' => 'dividends', 'amount' => 150000, 'description' => '股利發放'],
            ['date' => $previousMonth->copy()->addDays(15), 'type' => 'income', 'category' => 'other_financing', 'amount' => 20000, 'description' => '其他籌資收入'],
        ];
        
        // 插入所有交易
        $allTransactions = array_merge(
            $operatingTransactions,
            $investingTransactions,
            $financingTransactions,
            $previousMonthTransactions
        );
        
        foreach ($allTransactions as $index => $transaction) {
            DB::table('financial_transactions')->insert([
                'transaction_code' => 'FT' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                'transaction_date' => $transaction['date']->toDateString(),
                'type' => $transaction['type'],
                'category' => $transaction['category'],
                'amount' => $transaction['amount'],
                'currency' => 'TWD',
                'description' => $transaction['description'],
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}