@extends('layouts.app')

@section('title', '結帳 - NexusERP 市集')

@section('content')
<div class="min-h-screen" style="background-color: var(--nexus-primary-bg);">
  <div class="container mx-auto px-4 py-6">
    <nav class="text-xs mb-3" aria-label="Breadcrumb" style="color: var(--nexus-text-secondary);">
      <ol class="inline-flex items-center space-x-1">
        <li><a href="/marketplace" class="hover:underline" style="color: var(--nexus-text-secondary);">市集</a></li>
        <li>/</li>
        <li><a href="/marketplace/cart" class="hover:underline" style="color: var(--nexus-text-secondary);">購物車</a></li>
        <li>/</li>
        <li class="text-xs" style="color: var(--nexus-text-primary);">結帳</li>
      </ol>
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 nx-card p-5">
        <h1 class="text-xl font-semibold mb-4" style="color: var(--nexus-text-primary);">收件與發票資料（DEMO）</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input class="nx-input" placeholder="收件人姓名" />
          <input class="nx-input" placeholder="連絡電話" />
          <input class="nx-input md:col-span-2" placeholder="收件地址" />
          <input class="nx-input" placeholder="發票抬頭" />
          <input class="nx-input" placeholder="統一編號（選填）" />
        </div>
        <p class="text-xs mt-3" style="color: var(--nexus-text-secondary);">此頁為 DEMO，資料不會送出。</p>
      </div>
      <div class="nx-card p-5">
        <h2 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">訂單摘要</h2>
        <div id="summary-list" class="space-y-2 mb-3"></div>
        <div class="flex justify-between mb-2" style="color: var(--nexus-text-secondary);">
          <span>小計</span>
          <span id="summary-subtotal">$0.00</span>
        </div>
        <button class="w-full nx-btn nx-btn-primary mt-4" onclick="alert('DEMO：尚未串接金流/下單流程');">送出訂單（DEMO）</button>
      </div>
    </div>
  </div>
</div>

<script src="{{ asset('js/components/marketplace/Cart.js') }}"></script>
<script>
document.addEventListener('DOMContentLoaded', ()=>{
  const list = document.getElementById('summary-list');
  const sub = document.getElementById('summary-subtotal');
  const items = demoCart.getItems();
  list.innerHTML = items.map(i=>`
    <div class="flex justify-between text-sm">
      <span style="color: var(--nexus-text-secondary);">${i.name} × ${i.quantity}</span>
      <span style="color: var(--nexus-text-primary);">$${(i.price*i.quantity).toFixed(2)}</span>
    </div>
  `).join('');
  sub.textContent = '$'+demoCart.totals().subtotal.toFixed(2);
});
</script>
@endsection


