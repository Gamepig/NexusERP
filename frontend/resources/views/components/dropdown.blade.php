@props([
  'align' => 'right', 
  'width' => '48', 
  'contentClasses' => 'nexus-dropdown-list',
  'style' => 'background-color: var(--nexus-surface-primary); border: var(--nexus-border-1) solid var(--nexus-border-primary); color: var(--nexus-text-primary); box-shadow: var(--nexus-shadow-xl); border-radius: var(--nexus-radius-lg);'
])

@php
$alignmentClasses = match ($align) {
    'left' => 'ltr:origin-top-left rtl:origin-top-right start-0',
    'top' => 'origin-top',
    default => 'ltr:origin-top-right rtl:origin-top-left end-0',
};

$width = match ($width) {
    '48' => 'w-48',
    default => $width,
};
@endphp

<div class="relative" x-data="{ open: false }" @click.outside="open = false" @close.stop="open = false">
    <div @click="open = ! open">
        {{ $trigger }}
    </div>

    <div x-show="open"
            x-transition:enter="transition ease-out duration-200"
            x-transition:enter-start="opacity-0 scale-95"
            x-transition:enter-end="opacity-100 scale-100"
            x-transition:leave="transition ease-in duration-75"
            x-transition:leave-start="opacity-100 scale-100"
            x-transition:leave-end="opacity-0 scale-95"
            class="absolute z-50 mt-2 {{ $width }} nexus-nav-dropdown {{ $alignmentClasses }}"
            style="display: none;"
            @click="open = false">
        <div class="{{ $contentClasses }}" style="{{ $style }}">
            {{ $content }}
        </div>
    </div>
</div>
