@extends('layouts.app')

@section('title', 'DEMO 場景導覽 - NexusERP')

@section('content')
<div class="container mx-auto px-4 py-6">
  @if(session('success'))
    <div class="mb-4 rounded-lg bg-green-500 text-white px-4 py-3">{{ session('success') }}</div>
  @endif
  <x-ui.card>
    <h1 class="text-2xl font-bold mb-4">DEMO 場景導覽</h1>
    <p class="text-gray-600 dark:text-gray-300 mb-6">選擇一個情境進入示範。</p>
    <div id="demoSummary" class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 opacity-0 transition-opacity"></div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <a href="{{ route('demo.inquiry') }}" class="block p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition">
        <div class="font-semibold">新客戶詢價</div>
        <div class="text-sm text-gray-500">詢價 → 產出報價</div>
      </a>
      <a href="{{ route('demo.vip') }}" class="block p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition">
        <div class="font-semibold">VIP 採購</div>
        <div class="text-sm text-gray-500">會員價/折扣流程</div>
      </a>
      <a href="{{ route('demo.inventory') }}" class="block p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition">
        <div class="font-semibold">庫存警示</div>
        <div class="text-sm text-gray-500">低庫存提醒與補貨</div>
      </a>
      <a href="{{ route('demo.finance') }}" class="block p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition">
        <div class="font-semibold">財務分析</div>
        <div class="text-sm text-gray-500">指標圖卡與趨勢</div>
      </a>
    </div>
  </x-ui.card>
  <form method="POST" action="{{ route('demo.reset') }}" class="mt-4">
    @csrf
    <button type="submit" class="px-3 py-2 text-sm rounded-lg bg-gray-600 text-white hover:bg-gray-700">重置 DEMO 假資料（本機）</button>
  </form>
</div>
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('/demo/summary', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('summary');
      const s = await res.json();
      const el = document.getElementById('demoSummary');
      el.innerHTML = `
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"><div class="text-xs text-gray-500">Customers</div><div class="text-xl font-semibold">${s.customers ?? '-'}</div></div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"><div class="text-xs text-gray-500">Products</div><div class="text-xl font-semibold">${s.products ?? '-'}</div></div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"><div class="text-xs text-gray-500">Orders</div><div class="text-xl font-semibold">${s.orders ?? '-'}</div></div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"><div class="text-xs text-gray-500">Order Items</div><div class="text-xl font-semibold">${s.order_items ?? '-'}</div></div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"><div class="text-xs text-gray-500">Inventory</div><div class="text-xl font-semibold">${s.inventory ?? '-'}</div></div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"><div class="text-xs text-gray-500">Low Stock</div><div class="text-xl font-semibold text-amber-600">${s.low_stock ?? '-'}</div></div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"><div class="text-xs text-gray-500">Quotes</div><div class="text-xl font-semibold">${s.quotes ?? '—'}</div></div>`;
      el.style.opacity = '1';
    } catch (e) {
      // 靜默失敗，不影響 DEMO 使用
    }
  });
</script>
@endsection


