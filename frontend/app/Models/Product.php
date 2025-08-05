<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * 產品模型
 * 
 * 對應資料表：products
 * 主要功能：產品基本資訊管理、庫存管理、採購單明細關聯
 */
class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    /**
     * 可大量賦值的欄位 (基於實際資料庫結構)
     */
    protected $fillable = [
        'name',
        'sku',
        'description',
        'category_id',
        'unit_of_measure',
        'unit_of_measure_id',
        'weight',
        'dimensions',
        'cost_price',
        'selling_price',
        'barcode',
        'image_url',
        'is_active',
        'attributes',
        'supplier_id',
        'reorder_point',
        'created_by_user_id',
        'owned_by_user_id',
        'company_id',
    ];

    /**
     * 欄位型別轉換 (基於實際資料庫結構)
     */
    protected $casts = [
        'selling_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'weight' => 'decimal:2',
        'dimensions' => 'array',
        'attributes' => 'array',
        'reorder_point' => 'integer',
        'is_active' => 'boolean',
        'category_id' => 'integer',
        'unit_of_measure_id' => 'integer',
        'supplier_id' => 'integer',
        'created_by_user_id' => 'integer',
        'owned_by_user_id' => 'integer',
        'company_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 產品狀態常數
     */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_DISCONTINUED = 'discontinued';

    /**
     * 所有可用狀態
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_ACTIVE => '啟用',
            self::STATUS_INACTIVE => '停用',
            self::STATUS_DISCONTINUED => '停產',
        ];
    }

    /**
     * 關聯：所屬公司
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * 採購單明細關聯
     */
    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * 庫存水準關聯
     */
    public function inventoryLevels(): HasMany
    {
        return $this->hasMany(InventoryLevel::class);
    }

    /**
     * 獲取總庫存數量（智能多租戶庫存計算，繞過 RLS 限制）
     */
    public function getTotalStockQuantity(): int
    {
        // 檢查 company_id 是否有效
        if (empty($this->company_id) || !is_numeric($this->company_id)) {
            \Log::warning("Product getTotalStockQuantity called with invalid company_id", [
                'product_id' => $this->id,
                'company_id' => $this->company_id,
                'company_id_type' => gettype($this->company_id)
            ]);
            return 0;
        }
        
        try {
            // 優先查詢產品所屬公司的倉庫庫存（需要 JOIN warehouses 來篩選公司）
            $companyTotal = (int) \DB::table('inventory_levels')
                ->join('warehouses', 'warehouses.id', '=', 'inventory_levels.warehouse_id')
                ->where('inventory_levels.product_id', $this->id)
                ->where('warehouses.company_id', (int) $this->company_id)
                ->whereNotNull('warehouses.company_id')
                ->sum('inventory_levels.quantity_on_hand');
            
            // 如果同公司倉庫有庫存，直接返回
            if ($companyTotal > 0) {
                return $companyTotal;
            }
            
            // 如果同公司倉庫沒有庫存，直接查詢 inventory_levels（不 JOIN warehouses，避免 RLS 限制）
            // inventory_levels 表沒有啟用 RLS，可以自由查詢跨公司庫存數據
            $allTotal = (int) \DB::table('inventory_levels')
                ->where('product_id', $this->id)
                ->whereNotNull('quantity_on_hand')
                ->sum('quantity_on_hand');
            
            if ($allTotal > 0) {
                \Log::debug("Product has inventory in other company warehouses", [
                    'product_id' => $this->id,
                    'product_company_id' => $this->company_id,
                    'same_company_total' => $companyTotal,
                    'all_warehouses_total' => $allTotal
                ]);
            }
            
            return $allTotal;
            
        } catch (\Exception $e) {
            \Log::error("Error in getTotalStockQuantity", [
                'product_id' => $this->id,
                'company_id' => $this->company_id,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * 獲取總可用庫存數量（只計算當前公司的倉庫）
     */
    public function getTotalAvailableQuantity(): int
    {
        // 檢查 company_id 是否有效
        if (empty($this->company_id) || !is_numeric($this->company_id)) {
            return 0;
        }
        
        // 使用 Query Builder 避免 Eloquent 關聯的潛在問題
        $result = \DB::table('inventory_levels')
            ->join('warehouses', 'warehouses.id', '=', 'inventory_levels.warehouse_id')
            ->where('inventory_levels.product_id', $this->id)
            ->where('warehouses.company_id', (int) $this->company_id)
            ->sum('inventory_levels.quantity_available');
            
        return (int) ($result ?? 0);
    }

    /**
     * 獲取最低補貨點（只考慮當前公司倉庫中的最大值）
     */
    public function getMinimumReorderPoint(): int
    {
        // 檢查 company_id 是否有效
        if (empty($this->company_id) || !is_numeric($this->company_id)) {
            return 0;
        }
        
        try {
            // 優先查詢當前公司的倉庫補貨點
            $companyResult = \DB::table('inventory_levels')
                ->join('warehouses', 'warehouses.id', '=', 'inventory_levels.warehouse_id')
                ->where('inventory_levels.product_id', $this->id)
                ->where('warehouses.company_id', (int) $this->company_id)
                ->whereNotNull('warehouses.company_id')
                ->max('inventory_levels.reorder_point');
                
            $companyMax = (int) ($companyResult ?? 0);
            
            // 如果當前公司沒有補貨點設定，檢查其他公司的倉庫
            if ($companyMax === 0) {
                $allResult = \DB::table('inventory_levels')
                    ->join('warehouses', 'warehouses.id', '=', 'inventory_levels.warehouse_id')
                    ->where('inventory_levels.product_id', $this->id)
                    ->whereNotNull('warehouses.company_id')
                    ->max('inventory_levels.reorder_point');
                    
                return (int) ($allResult ?? 0);
            }
            
            return $companyMax;
            
        } catch (\Exception $e) {
            \Log::error("Error in getMinimumReorderPoint", [
                'product_id' => $this->id,
                'company_id' => $this->company_id,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * 檢查是否為低庫存（任一倉庫低於補貨點）
     */
    public function isLowStock(): bool
    {
        return $this->inventoryLevels()
            ->whereColumn('quantity_available', '<=', 'reorder_point')
            ->exists();
    }

    /**
     * 建立或更新庫存水準
     */
    public function createOrUpdateInventoryLevel(int $warehouseId, array $data): InventoryLevel
    {
        return $this->inventoryLevels()->updateOrCreate(
            [
                'product_id' => $this->id,
                'warehouse_id' => $warehouseId
            ],
            $data
        );
    }

    /**
     * 檢查是否為啟用狀態
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * 檢查是否為停用狀態
     */
    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    /**
     * 檢查是否已停產
     */
    public function isDiscontinued(): bool
    {
        return $this->status === self::STATUS_DISCONTINUED;
    }

    /**
     * 檢查是否需要補貨 (基於 reorder_point)
     */
    public function needsReorder(): bool
    {
        return $this->isLowStock();
    }

    /**
     * Scope: 依狀態篩選
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: 依狀態篩選
     */
    public function scopeInactive($query)
    {
        return $query->where('status', self::STATUS_INACTIVE);
    }

    /**
     * Scope: 低庫存產品
     */
    public function scopeLowStock($query)
    {
        return $query->whereRaw('stock_quantity <= minimum_stock');
    }

    /**
     * Scope: 依分類篩選
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * 產生產品代碼
     */
    public static function generateCode(): string
    {
        $prefix = 'PRD';
        $count = static::count() + 1;
        return $prefix . str_pad($count, 6, '0', STR_PAD_LEFT);
    }

    /**
     * 產生 SKU
     */
    public static function generateSku(string $category = 'GEN'): string
    {
        $prefix = strtoupper(substr($category, 0, 3));
        $timestamp = now()->format('ymd');
        $count = static::whereDate('created_at', today())->count() + 1;
        return $prefix . $timestamp . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}