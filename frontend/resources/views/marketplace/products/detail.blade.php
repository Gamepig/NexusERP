@extends('layouts.app')

@section('title', '商品詳情 - NexusERP 市集')

@section('content')
<div class="min-h-screen" style="background-color: var(--nexus-primary-bg);">
    <div class="container mx-auto px-4 py-6">
        <div class="mb-4">
            <a href="{{ route('marketplace.products.browse') }}" class="text-sm" style="color: var(--nexus-accent-blue);">← 返回列表</a>
        </div>

        <div class="nx-card p-6">
            <div class="flex items-center justify-between mb-4">
                <h1 class="text-2xl font-semibold" style="color: var(--nexus-text-primary);">商品詳情</h1>
                <span class="text-xs px-2 py-1 rounded" style="background: var(--nexus-accent-orange); color: #fff;">DEMO</span>
            </div>
            <p class="text-sm mb-6" style="color: var(--nexus-text-secondary);">此頁為展示用途，購物相關操作已停用。</p>

            <div id="product-detail" class="text-sm" style="color: var(--nexus-text-secondary);">
                載入中...
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', async () => {
    const productId = @json($productId ?? null);
    if (!productId) return;
    try {
        const res = await fetch(`/api/marketplace/products/${productId}`);
        if (!res.ok) throw new Error('load failed');
        const p = await res.json();
        const el = document.getElementById('product-detail');
        el.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    ${p.images && p.images.length ? `<img src="${p.images[0].url}" alt="${p.name}" class="w-full h-64 object-cover rounded"/>` : `<div class="w-full h-64 rounded flex items-center justify-center" style="background: var(--nexus-border-primary);">無圖片</div>`}
                </div>
                <div class="space-y-3">
                    <h2 class="text-xl font-semibold" style="color: var(--nexus-text-primary);">${p.name}</h2>
                    <div style="color: var(--nexus-text-secondary);">品牌：${p.brand || '無品牌'}</div>
                    <div style="color: var(--nexus-accent-blue);" class="text-2xl font-bold">$${Number(p.price).toFixed(2)}</div>
                    <div class="text-sm" style="color: var(--nexus-text-secondary);">最小訂購量：${p.minimum_order_quantity || 1}</div>
                    <div class="text-sm" style="color: var(--nexus-text-secondary);">供應商：${p.supplier?.company_name || '供應商'}</div>
                    ${p.description ? `<p class="mt-2" style="color: var(--nexus-text-primary);">${p.description}</p>` : ''}
                    <button type="button" class="nx-btn nx-btn-primary" onclick="alert('DEMO：詢價功能未啟用')">詢價</button>
                </div>
            </div>
        `;
    } catch (e) {
        document.getElementById('product-detail').textContent = '載入失敗，請稍後再試';
    }
});
</script>
@endsection


