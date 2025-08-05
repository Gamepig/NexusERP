{{-- 庫存調整表單視圖 --}}
<div class="inventory-adjust-form">
    {{-- 頁面標題 --}}
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="h4 mb-0">庫存調整</h2>
            <p class="text-muted mb-0">手動調整產品庫存數量</p>
        </div>
        <div>
            <button type="button" class="btn btn-outline-secondary btn-sm" id="view-adjustment-history">
                <i class="fas fa-history"></i> 調整歷史
            </button>
        </div>
    </div>

    {{-- 產品搜尋與選擇 --}}
    <div class="card mb-4">
        <div class="card-header">
            <h5 class="card-title mb-0">
                <i class="fas fa-search me-2"></i>產品選擇
            </h5>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-8">
                    <label for="product-search" class="form-label">搜尋產品</label>
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="fas fa-search"></i>
                        </span>
                        <input type="text" class="form-control" id="product-search" 
                               placeholder="輸入產品名稱或 SKU 進行搜尋..." autocomplete="off">
                        <button type="button" class="btn btn-outline-secondary" id="scan-barcode">
                            <i class="fas fa-barcode"></i> 掃描條碼
                        </button>
                    </div>
                    
                    {{-- 搜尋結果下拉選單 --}}
                    <div class="dropdown-menu w-100" id="product-search-results" style="display: none;">
                        {{-- 搜尋結果將由 JavaScript 動態填充 --}}
                    </div>
                </div>
                <div class="col-md-4">
                    <label for="warehouse-select" class="form-label">倉庫</label>
                    <select class="form-select" id="warehouse-select" required>
                        <option value="">選擇倉庫...</option>
                        {{-- 倉庫選項將由 JavaScript 動態載入 --}}
                    </select>
                </div>
            </div>
        </div>
    </div>

    {{-- 選中產品資訊 --}}
    <div class="card mb-4" id="selected-product-info" style="display: none;">
        <div class="card-header bg-light">
            <h5 class="card-title mb-0">
                <i class="fas fa-box me-2"></i>選中產品資訊
            </h5>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-2 text-center">
                    <img id="product-image" src="" alt="產品圖片" class="img-thumbnail" style="max-width: 100px; max-height: 100px;">
                </div>
                <div class="col-md-5">
                    <table class="table table-sm table-borderless">
                        <tbody>
                            <tr>
                                <td class="fw-bold">產品名稱：</td>
                                <td id="product-name">-</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">SKU：</td>
                                <td id="product-sku">-</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">分類：</td>
                                <td id="product-category">-</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">單位：</td>
                                <td id="product-unit">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-md-5">
                    <table class="table table-sm table-borderless">
                        <tbody>
                            <tr>
                                <td class="fw-bold">現有庫存：</td>
                                <td id="current-stock" class="fw-bold text-primary">-</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">保留數量：</td>
                                <td id="reserved-stock">-</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">可用庫存：</td>
                                <td id="available-stock" class="text-success">-</td>
                            </tr>
                            <tr>
                                <td class="fw-bold">單位成本：</td>
                                <td id="unit-cost">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    {{-- 調整詳情表單 --}}
    <form id="inventory-adjustment-form" style="display: none;">
        <input type="hidden" id="selected-product-id">
        <input type="hidden" id="selected-warehouse-id">
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-edit me-2"></i>調整詳情
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="adjustment-type" class="form-label">調整類型</label>
                            <select class="form-select" id="adjustment-type" required>
                                <option value="">請選擇調整類型...</option>
                                <option value="in">入庫 (+)</option>
                                <option value="out">出庫 (-)</option>
                                <option value="recount">重新盤點</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label for="adjustment-quantity" class="form-label">
                                調整數量
                                <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <input type="number" class="form-control" id="adjustment-quantity" 
                                       min="1" step="1" required>
                                <span class="input-group-text" id="quantity-unit">件</span>
                            </div>
                            <div class="form-text" id="quantity-help">
                                入庫和出庫請輸入變動數量，重新盤點請輸入實際數量
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="adjustment-reason" class="form-label">
                                調整原因
                                <span class="text-danger">*</span>
                            </label>
                            <select class="form-select" id="adjustment-reason" required>
                                <option value="">請選擇調整原因...</option>
                                <option value="purchase">採購入庫</option>
                                <option value="return">退貨入庫</option>
                                <option value="production">生產完成</option>
                                <option value="sale">銷售出庫</option>
                                <option value="damage">損壞報廢</option>
                                <option value="loss">盤點短少</option>
                                <option value="transfer">庫間調撥</option>
                                <option value="recount">盤點調整</option>
                                <option value="other">其他原因</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label for="adjustment-notes" class="form-label">備註說明</label>
                            <textarea class="form-control" id="adjustment-notes" rows="3" 
                                      placeholder="請描述調整的具體原因或相關資訊..."></textarea>
                        </div>

                        {{-- 相關單據 --}}
                        <div class="mb-3">
                            <label for="reference-document" class="form-label">相關單據號</label>
                            <input type="text" class="form-control" id="reference-document" 
                                   placeholder="採購單、銷售單或其他相關單據編號">
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-calculator me-2"></i>調整預覽
                        </h5>
                    </div>
                    <div class="card-body">
                        {{-- 庫存變動預覽 --}}
                        <div class="row mb-3">
                            <div class="col-12">
                                <div class="alert alert-info">
                                    <h6 class="alert-heading">
                                        <i class="fas fa-info-circle me-2"></i>庫存變動預覽
                                    </h6>
                                    <div class="row text-center">
                                        <div class="col-4">
                                            <div class="h5 mb-0" id="preview-current">0</div>
                                            <small class="text-muted">調整前數量</small>
                                        </div>
                                        <div class="col-4">
                                            <div class="h5 mb-0" id="preview-change">0</div>
                                            <small class="text-muted">變動數量</small>
                                        </div>
                                        <div class="col-4">
                                            <div class="h5 mb-0 text-primary" id="preview-result">0</div>
                                            <small class="text-muted">調整後數量</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {{-- 成本影響 --}}
                        <div class="mb-3">
                            <label class="form-label">成本影響</label>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <tbody>
                                        <tr>
                                            <td>單位成本：</td>
                                            <td class="text-end" id="preview-unit-cost">$0.00</td>
                                        </tr>
                                        <tr>
                                            <td>調整前總值：</td>
                                            <td class="text-end" id="preview-before-value">$0.00</td>
                                        </tr>
                                        <tr>
                                            <td>變動金額：</td>
                                            <td class="text-end" id="preview-change-value">$0.00</td>
                                        </tr>
                                        <tr class="table-primary">
                                            <td><strong>調整後總值：</strong></td>
                                            <td class="text-end"><strong id="preview-after-value">$0.00</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {{-- 警告訊息 --}}
                        <div id="adjustment-warnings" style="display: none;">
                            <div class="alert alert-warning">
                                <h6 class="alert-heading">
                                    <i class="fas fa-exclamation-triangle me-2"></i>注意事項
                                </h6>
                                <ul id="warning-list" class="mb-0">
                                    {{-- 警告項目將由 JavaScript 動態填充 --}}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- 提交按鈕 --}}
        <div class="row mt-4">
            <div class="col-12 text-center">
                <button type="button" class="btn btn-secondary me-2" id="reset-form">
                    <i class="fas fa-undo"></i> 重設
                </button>
                <button type="button" class="btn btn-success me-2" id="save-draft">
                    <i class="fas fa-save"></i> 儲存草稿
                </button>
                <button type="submit" class="btn btn-primary" id="submit-adjustment">
                    <i class="fas fa-check"></i> 確認調整
                </button>
            </div>
        </div>
    </form>
</div>

{{-- 調整確認模態框 --}}
<div class="modal fade" id="confirmAdjustmentModal" tabindex="-1" aria-labelledby="confirmAdjustmentModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="confirmAdjustmentModalLabel">確認庫存調整</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    請確認以下調整資訊無誤，調整提交後將無法撤銷。
                </div>
                
                <table class="table table-sm">
                    <tbody>
                        <tr>
                            <td class="fw-bold">產品：</td>
                            <td id="confirm-product">-</td>
                        </tr>
                        <tr>
                            <td class="fw-bold">倉庫：</td>
                            <td id="confirm-warehouse">-</td>
                        </tr>
                        <tr>
                            <td class="fw-bold">調整類型：</td>
                            <td id="confirm-type">-</td>
                        </tr>
                        <tr>
                            <td class="fw-bold">調整數量：</td>
                            <td id="confirm-quantity">-</td>
                        </tr>
                        <tr>
                            <td class="fw-bold">調整原因：</td>
                            <td id="confirm-reason">-</td>
                        </tr>
                        <tr>
                            <td class="fw-bold">庫存變化：</td>
                            <td>
                                <span id="confirm-before">0</span> → 
                                <span id="confirm-after" class="fw-bold text-primary">0</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-primary" id="final-confirm-adjustment">
                    <i class="fas fa-check"></i> 確認提交
                </button>
            </div>
        </div>
    </div>
</div>

{{-- 條碼掃描模態框 --}}
<div class="modal fade" id="barcodeScanModal" tabindex="-1" aria-labelledby="barcodeScanModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="barcodeScanModalLabel">掃描產品條碼</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
                <div id="barcode-scanner">
                    <video id="barcode-video" style="width: 100%; max-width: 400px;"></video>
                </div>
                <div class="mt-3">
                    <p class="text-muted">將產品條碼對準鏡頭進行掃描</p>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            </div>
        </div>
    </div>
</div>

@push('styles')
<style>
    .inventory-adjust-form .card {
        border: 1px solid #e3e6f0;
        box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
    }
    
    .inventory-adjust-form .card-header {
        background-color: #f8f9fc;
        border-bottom: 1px solid #e3e6f0;
    }
    
    #product-search-results {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        max-height: 300px;
        overflow-y: auto;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
    
    .product-search-item {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background-color 0.15s ease-in-out;
    }
    
    .product-search-item:hover {
        background-color: #f8f9fa;
    }
    
    .product-search-item:last-child {
        border-bottom: none;
    }
    
    .product-search-item .product-info {
        display: flex;
        align-items: center;
    }
    
    .product-search-item .product-info img {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 0.75rem;
    }
    
    .adjustment-type-icon {
        font-size: 1.2em;
        margin-right: 0.5rem;
    }
    
    .adjustment-in {
        color: #1cc88a;
    }
    
    .adjustment-out {
        color: #e74a3b;
    }
    
    .adjustment-recount {
        color: #f6c23e;
    }
    
    #preview-change.positive {
        color: #1cc88a;
    }
    
    #preview-change.negative {
        color: #e74a3b;
    }
    
    #preview-change.neutral {
        color: #858796;
    }
    
    .form-control:focus,
    .form-select:focus {
        border-color: #4e73df;
        box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
    }
    
    .btn-primary {
        background-color: #4e73df;
        border-color: #4e73df;
    }
    
    .btn-primary:hover {
        background-color: #2e59d9;
        border-color: #2653d4;
    }
    
    #barcode-video {
        border: 2px solid #e3e6f0;
        border-radius: 0.35rem;
    }
</style>
@endpush

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 初始化庫存調整表單
    if (typeof InventoryAdjustmentForm !== 'undefined') {
        new InventoryAdjustmentForm();
    } else {
        console.warn('InventoryAdjustmentForm class not found. Please include the required JavaScript file.');
    }
});
</script>
@endpush