@extends('layouts.app')
@section('title', 'DEMO｜財務分析')
@section('content')
<div class="container mx-auto px-4 py-6">
  <x-ui.card>
    <h2 class="text-xl font-bold mb-2">財務分析</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-4">展示關鍵指標圖卡與趨勢（將串接 Dashboard/ChartManager）。</p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      @foreach(($data['kpis'] ?? []) as $k)
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div class="text-sm text-gray-500">{{ $k['label'] }}</div>
          <div class="text-xl font-semibold">{{ is_numeric($k['value']) && $k['value'] < 1 ? number_format($k['value']*100, 0).'%' : number_format($k['value'], 0) }}</div>
        </div>
      @endforeach
    </div>
    <div>
      <canvas id="demoFinanceTrend" height="120"></canvas>
    </div>
  </x-ui.card>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.Charts && document.getElementById('demoFinanceTrend')) {
        const trendData = {!! json_encode($data['trend'] ?? [120,132,101,134,90,230,210]) !!};
        window.Charts.create('demoFinanceTrend', {
          type: 'line',
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
          datasets: [{ label: 'Revenue', data: trendData }]
        });
      }
    });
  </script>
  <script type="module">
    import { runDemoGuide } from '/resources/js/demo-autoplay.js';
    document.addEventListener('DOMContentLoaded', () => {
      runDemoGuide([{ highlight: '#demoFinanceTrend' }]);
    });
  </script>
</div>
@endsection


