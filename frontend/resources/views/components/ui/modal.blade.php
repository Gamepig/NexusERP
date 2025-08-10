{{-- Simple Modal (Alpine.js required) --}}
@props([
  'open' => false,
  'title' => null,
])

<div x-data="{ open: @js($open) }" @keydown.escape.window="open = false">
  <div @click="open = true">
    {{ $trigger ?? '' }}
  </div>

  <div x-show="open" class="fixed inset-0 z-[var(--nexus-z-modal,500)]" style="display:none">
    <div class="absolute inset-0" style="background: rgba(0,0,0,0.5)"></div>

    <div class="relative mx-auto mt-20 max-w-lg" @click.outside="open = false">
      <div class="nexus-card">
        @if($title)
          <div class="mb-3 text-lg font-semibold" style="color: var(--nexus-text-primary)">{{ $title }}</div>
        @endif
        <div>
          {{ $slot }}
        </div>
        <div class="mt-4 text-right">
          <x-ui.button variant="secondary" @click="open = false">關閉</x-ui.button>
        </div>
      </div>
    </div>
  </div>
</div>


