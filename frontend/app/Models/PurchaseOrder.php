<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * 採購單模型
 * 
 * 對應資料表：purchase_orders
 * 主要功能：採購單管理、流程控制、審核管理
 */
class PurchaseOrder extends Model
{
    use HasFactory;

    protected $table = 'purchase_orders';

    /**
     * 可大量賦值的欄位
     */
    protected $fillable = [
        'po_number',
        'supplier_id',
        'status',
        'order_date',
        'expected_delivery_date',
        'delivery_address',
        'subtotal',
        'tax_amount',
        'total_amount',
        'currency',
        'payment_terms',
        'notes',
        'created_by_user_id',
        'approved_by_user_id',
        'approved_at',
        'company_id',
    ];

    /**
     * 欄位型別轉換
     */
    protected $casts = [
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'delivery_address' => 'array',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 採購單狀態常數
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING_APPROVAL = 'pending_approval';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PARTIALLY_RECEIVED = 'partially_received';
    public const STATUS_RECEIVED = 'received';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * 所有可用狀態
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT => '草稿',
            self::STATUS_PENDING_APPROVAL => '待核准',
            self::STATUS_APPROVED => '已核准',
            self::STATUS_PARTIALLY_RECEIVED => '部分收貨',
            self::STATUS_RECEIVED => '已完成',
            self::STATUS_CANCELLED => '已取消',
        ];
    }

    /**
     * 供應商關聯
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * 建立者關聯
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * 審核者關聯
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    /**
     * 採購單明細關聯
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * 檢查是否為草稿狀態
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * 檢查是否已送出 (待核准狀態)
     */
    public function isSubmitted(): bool
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }

    /**
     * 檢查是否已核准
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /**
     * 檢查是否已完成
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_RECEIVED;
    }

    /**
     * 檢查是否已取消
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * 檢查是否可以編輯
     */
    public function canEdit(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING_APPROVAL]);
    }

    /**
     * 檢查是否可以審核
     */
    public function canApprove(): bool
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }

    /**
     * 檢查是否可以刪除
     */
    public function canDelete(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_CANCELLED]);
    }

    /**
     * 檢查是否可以取消
     */
    public function canCancel(): bool
    {
        return !in_array($this->status, [self::STATUS_RECEIVED, self::STATUS_CANCELLED]);
    }

    /**
     * 送出採購單審核
     */
    public function submit(): bool
    {
        if (!$this->isDraft()) {
            return false;
        }

        $this->status = self::STATUS_PENDING_APPROVAL;
        return $this->save();
    }

    /**
     * 核准採購單
     */
    public function approve(User $approver): bool
    {
        if (!$this->canApprove()) {
            return false;
        }

        $this->status = self::STATUS_APPROVED;
        $this->approved_by_user_id = $approver->id;
        $this->approved_at = now();
        return $this->save();
    }

    /**
     * 取消採購單
     */
    public function cancel(): bool
    {
        if (!$this->canCancel()) {
            return false;
        }

        $this->status = self::STATUS_CANCELLED;
        return $this->save();
    }

    /**
     * 自動產生採購單號
     */
    public static function generatePoNumber(): string
    {
        $prefix = 'PO';
        $date = now()->format('Ymd');
        
        // 取得今日最後一筆採購單號
        $lastOrder = static::where('po_number', 'like', $prefix . $date . '%')
            ->orderBy('po_number', 'desc')
            ->first();

        if ($lastOrder) {
            // 提取序號並加1
            $lastNumber = (int) substr($lastOrder->po_number, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . $date . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * 計算採購單總額
     */
    public function calculateTotals(): void
    {
        $subtotal = $this->items()->sum('line_total');
        $taxAmount = $subtotal * 0.05; // 假設稅率為5%
        $totalAmount = $subtotal + $taxAmount;

        $this->subtotal = $subtotal;
        $this->tax_amount = $taxAmount;
        $this->total_amount = $totalAmount;
    }

    /**
     * 取得收貨進度百分比
     */
    public function getReceiveProgressAttribute(): float
    {
        $totalQuantity = $this->items()->sum('quantity');
        if ($totalQuantity == 0) {
            return 0;
        }

        $receivedQuantity = $this->items()->sum('quantity_received');
        return ($receivedQuantity / $totalQuantity) * 100;
    }

    /**
     * 檢查是否完全收貨
     */
    public function isFullyReceived(): bool
    {
        return $this->items()->where('quantity', '>', 'quantity_received')->doesntExist();
    }

    /**
     * 更新收貨狀態
     */
    public function updateReceiveStatus(): void
    {
        if ($this->isFullyReceived()) {
            $this->status = self::STATUS_RECEIVED;
        } else {
            $this->status = self::STATUS_PARTIALLY_RECEIVED;
        }
        $this->save();
    }

    /**
     * Scope: 依狀態篩選
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: 依供應商篩選
     */
    public function scopeBySupplier($query, int $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    /**
     * Scope: 依建立者篩選
     */
    public function scopeByCreator($query, int $userId)
    {
        return $query->where('created_by_user_id', $userId);
    }

    /**
     * Scope: 依日期範圍篩選
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('order_date', [$startDate, $endDate]);
    }
}