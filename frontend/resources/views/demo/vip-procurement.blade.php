@extends('layouts.app')
@section('title', 'DEMO｜VIP 採購')
@section('content')
<div class="container mx-auto px-4 py-6">
  <x-ui.card>
    <h2 class="text-xl font-bold mb-2">VIP 採購</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-4">展示會員價/折扣邏輯（後續串接實際定價規則）。</p>
    <div class="mb-2">客戶：<span class="font-semibold">{{ $data['customer']['name'] ?? '-' }}</span></div>
    <div class="mb-4">等級：<span class="font-semibold">{{ $data['currentTier'] ?? 'Gold' }}</span></div>
    <ul class="mb-4 list-disc pl-6 text-sm">
      @foreach(($data['cart'] ?? []) as $row)
        <li>{{ $row['name'] }} — ${{ number_format($row['price'], 0) }}</li>
      @endforeach
    </ul>
    <p class="text-xs text-gray-500">提示：實作時以等級折扣自動計算總價。</p>
  </x-ui.card>
  <script type="module">
    import { runDemoGuide } from '/resources/js/demo-autoplay.js';
    document.addEventListener('DOMContentLoaded', () => {
      runDemoGuide([{ highlight: '.list-disc' }]);
    });
  </script>
</div>
@endsection


