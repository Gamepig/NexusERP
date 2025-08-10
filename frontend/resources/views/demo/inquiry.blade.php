@extends('layouts.app')
@section('title', 'DEMO｜新客戶詢價')
@section('content')
<div class="container mx-auto px-4 py-6">
  <x-ui.card>
    <h2 class="text-xl font-bold mb-2">新客戶詢價</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-4">示範從詢價快速產出報價單的流程（暫以靜態假資料展示）。</p>
    <div class="mb-4 text-sm text-gray-700 dark:text-gray-200">
      <div>客戶：<span class="font-semibold">{{ $data['customer']['name'] ?? '-' }}</span>（{{ $data['customer']['contact'] ?? '-' }}）</div>
      <div>備註：{{ $data['notes'] ?? '-' }}</div>
    </div>
    <div class="overflow-x-auto mb-4">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500">
            <th class="pr-4">品項</th>
            <th class="pr-4">數量</th>
            <th class="pr-4">單價</th>
          </tr>
        </thead>
        <tbody>
          @foreach(($data['items'] ?? []) as $it)
          <tr>
            <td class="pr-4">{{ $it['name'] }}</td>
            <td class="pr-4">{{ $it['quantity'] }}</td>
            <td class="pr-4">{{ number_format($it['unit_price'], 0) }}</td>
          </tr>
          @endforeach
        </tbody>
      </table>
    </div>
    <a href="{{ route('quotes.create.multi-step') }}" class="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">開始多步驟建立</a>
  </x-ui.card>
  <script type="module">
    import { runDemoGuide, scrollToSelector } from '/resources/js/demo-autoplay.js';
    document.addEventListener('DOMContentLoaded', () => {
      runDemoGuide([
        { highlight: 'a[href*="quotes/create/multi-step"]', action: () => scrollToSelector('a[href*="quotes/create/multi-step"]') }
      ]);
    });
  </script>
</div>
@endsection


