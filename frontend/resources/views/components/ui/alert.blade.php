{{--
  NexusERP Alert Component
  variant: info | success | warning | danger
--}}

@props([
  'variant' => 'info',
  'title' => null,
])

@php
  $bg = [
    'info' => 'var(--nexus-info-50)',
    'success' => 'var(--nexus-success-50)',
    'warning' => 'var(--nexus-warning-50)',
    'danger' => 'var(--nexus-error-50)'
  ][$variant] ?? 'var(--nexus-info-50)';

  $border = [
    'info' => 'var(--nexus-info-500)',
    'success' => 'var(--nexus-success-500)',
    'warning' => 'var(--nexus-warning-500)',
    'danger' => 'var(--nexus-error-500)'
  ][$variant] ?? 'var(--nexus-info-500)';

  $text = 'var(--nexus-text-secondary)';
@endphp

<div {{ $attributes->merge(['class' => 'nexus-card']) }} style="background-color: {{ $bg }}; border-color: {{ $border }}; color: {{ $text }};">
  @if($title)
    <div class="mb-2 font-semibold" style="color: var(--nexus-text-primary)">{{ $title }}</div>
  @endif
  <div>
    {{ $slot }}
  </div>
</div>


