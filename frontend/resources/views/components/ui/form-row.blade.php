{{-- Form Row: label + control + help --}}
@props([
  'label' => null,
  'for' => null,
  'help' => null,
  'required' => false,
])

<div {{ $attributes->merge(['class' => 'mb-4']) }}>
  @if($label)
    <label @if($for) for="{{ $for }}" @endif class="block mb-1 text-sm" style="color: var(--nexus-text-secondary)">
      {{ $label }} @if($required)<span class="text-red-600">*</span>@endif
    </label>
  @endif
  <div>
    {{ $slot }}
  </div>
  @if($help)
    <p class="mt-1 text-xs" style="color: var(--nexus-text-tertiary)">{{ $help }}</p>
  @endif
</div>


