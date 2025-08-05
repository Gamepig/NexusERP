@props(['disabled' => false])

<input @disabled($disabled) {{ $attributes->merge(['class' => 'nexus-input nexus-border-secondary focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm', 'style' => 'background-color: var(--nexus-bg-secondary) !important; color: var(--nexus-text-primary) !important; border: 1px solid var(--nexus-border-secondary) !important;']) }}>
