<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class SalesOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_id',
        'business_unit_id',
        'status',
        'user_id',
        'order_date',
        'total_amount',
        'currency_id',
    ];

    protected $casts = [
        'order_date' => 'date',
        'total_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 銷售訂單關聯到客戶
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * 銷售訂單關聯到業務單位
     */
    public function businessUnit(): BelongsTo
    {
        return $this->belongsTo(BusinessUnit::class);
    }

    /**
     * 銷售訂單關聯到建立者
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 銷售訂單包含多個訂單項目
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    /**
     * 獲取銷售統計
     */
    public static function getSalesStatistics($dateFrom, $dateTo, $status = null)
    {
        $query = static::whereBetween('order_date', [$dateFrom, $dateTo]);
        
        if ($status) {
            $query->where('status', $status);
        }

        return [
            'total_sales' => $query->sum('total_amount'),
            'order_count' => $query->count(),
            'average_order_size' => $query->avg('total_amount'),
        ];
    }

    /**
     * 獲取月份銷售數據
     */
    public static function getMonthlySales($dateFrom, $dateTo)
    {
        // 使用 PostgreSQL 語法
        return static::selectRaw('TO_CHAR(order_date, \'YYYY-MM\') as month, SUM(total_amount) as sales')
            ->whereBetween('order_date', [$dateFrom, $dateTo])
            ->where('status', '!=', 'cancelled')
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }

    /**
     * 獲取前五大客戶
     */
    public static function getTopCustomers($dateFrom, $dateTo, $limit = 5)
    {
        return static::with('customer')
            ->selectRaw('customer_id, SUM(total_amount) as total_amount')
            ->whereBetween('order_date', [$dateFrom, $dateTo])
            ->where('status', '!=', 'cancelled')
            ->groupBy('customer_id')
            ->orderByDesc('total_amount')
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'customer_name' => $order->customer->name ?? '未知客戶',
                    'total_amount' => $order->total_amount,
                ];
            });
    }

    /**
     * 獲取銷售詳細列表
     */
    public static function getSalesDetails($dateFrom, $dateTo, $status = null, $limit = 100)
    {
        $query = static::with('customer')
            ->whereBetween('order_date', [$dateFrom, $dateTo]);
            
        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderByDesc('order_date')
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer->name ?? '未知客戶',
                    'order_date' => $order->order_date->format('Y-m-d'),
                    'status' => $order->status,
                    'total_amount' => $order->total_amount,
                ];
            });
    }
}