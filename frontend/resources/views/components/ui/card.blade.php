{{--
  NexusERP Card Component
  用途：作為統一的內容容器（列表卡、資訊卡、表單區塊）

  範例：
  <x-ui.card title="標題" subtitle="說明文字">
    卡片內容...
  </x-ui.card>
--}}

@props([
    'title' => null,
    'subtitle' => null,
    'footer' => null,
])

<div {{ $attributes->merge(['class' => 'nexus-card']) }}>
  @if($title || $subtitle)
    <div class="mb-3">
      @if($title)
        <h3 class="text-lg font-semibold" style="color: var(--nexus-text-primary)">{{ $title }}</h3>
      @endif
      @if($subtitle)
        <p class="text-sm" style="color: var(--nexus-text-tertiary)">{{ $subtitle }}</p>
      @endif
    </div>
  @endif

  <div class="card-body">
    {{ $slot }}
  </div>

  @if($footer)
    <div class="mt-4 pt-3" style="border-top: 1px solid var(--nexus-border-primary)">
      {{ $footer }}
    </div>
  @endif
</div>


