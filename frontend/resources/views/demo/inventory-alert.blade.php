@extends('layouts.app')
@section('title', 'DEMO｜庫存警示')
@section('content')
<div class="container mx-auto px-4 py-6">
  <x-ui.card>
    <h2 class="text-xl font-bold mb-2">庫存警示</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-4">展示低庫存提醒與補貨流程（後續串接報表與通知）。</p>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500">
            <th class="pr-4">SKU</th>
            <th class="pr-4">產品</th>
            <th class="pr-4">可用</th>
            <th class="pr-4">補貨點</th>
          </tr>
        </thead>
        <tbody>
          @foreach(($data['low_stock'] ?? []) as $it)
          <tr>
            <td class="pr-4">{{ $it['sku'] }}</td>
            <td class="pr-4">{{ $it['product'] }}</td>
            <td class="pr-4">{{ $it['available'] }}</td>
            <td class="pr-4">{{ $it['reorder_point'] }}</td>
          </tr>
          @endforeach
        </tbody>
      </table>
    </div>
    <p class="mt-3 text-sm text-amber-600 dark:text-amber-300">{{ $data['suggestion'] ?? '' }}</p>
  </x-ui.card>
  <script type="module">
    import { runDemoGuide, scrollToSelector } from '/resources/js/demo-autoplay.js';
    document.addEventListener('DOMContentLoaded', () => {
      runDemoGuide([
        { highlight: 'table', action: () => scrollToSelector('table') }
      ]);
    });
  </script>
</div>
@endsection


