@props(['value'])

<label {{ $attributes->merge(['class' => 'block font-medium text-sm nexus-text-primary']) }}>
    {{ $value ?? $slot }}
</label>
