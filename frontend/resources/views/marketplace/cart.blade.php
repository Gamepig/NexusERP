@extends('layouts.app')

@section('title', '購物車 - NexusERP 市集')

@section('content')
<div class="min-h-screen" style="background-color: var(--nexus-primary-bg);">
  <div class="container mx-auto px-4 py-6">
    <nav class="text-xs mb-3" aria-label="Breadcrumb" style="color: var(--nexus-text-secondary);">
      <ol class="inline-flex items-center space-x-1">
        <li><a href="/marketplace" class="hover:underline" style="color: var(--nexus-text-secondary);">市集</a></li>
        <li>/</li>
        <li class="text-xs" style="color: var(--nexus-text-primary);">購物車</li>
      </ol>
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 nx-card p-5">
        <h1 class="text-xl font-semibold mb-4" style="color: var(--nexus-text-primary);">購物車</h1>
        <div id="cart-items" class="space-y-3"></div>
      </div>
      <div class="nx-card p-5">
        <h2 class="text-lg font-semibold mb-4" style="color: var(--nexus-text-primary);">結帳</h2>
        <div class="flex justify-between mb-2" style="color: var(--nexus-text-secondary);">
          <span>小計</span>
          <span id="cart-subtotal">$0.00</span>
        </div>
        <button class="w-full nx-btn nx-btn-primary mt-4" onclick="window.location.href='/marketplace/checkout'">前往結帳（DEMO）</button>
        <button class="w-full nx-btn nx-btn-secondary mt-2" onclick="demoCart.clear(); demoCart.renderCart('cart-items','cart-subtotal')">清空購物車</button>
      </div>
    </div>
  </div>
</div>

<script src="{{ asset('js/components/marketplace/Cart.js') }}"></script>
<script>
document.addEventListener('DOMContentLoaded', ()=>{
  demoCart.renderCart('cart-items','cart-subtotal');
});
</script>
@endsection


