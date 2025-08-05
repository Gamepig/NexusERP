@props(['active'])

@php
$classes = ($active ?? false)
            ? 'inline-flex items-center px-1 pt-1 border-b-2 border-indigo-400 dark:border-indigo-600 text-xs lg:text-sm font-medium leading-5 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-700 transition duration-150 ease-in-out whitespace-nowrap'
            : 'inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-xs lg:text-sm font-medium leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:text-gray-700 dark:focus:text-gray-300 focus:border-gray-300 dark:focus:border-gray-700 transition duration-150 ease-in-out whitespace-nowrap';
@endphp

<a {{ $attributes->merge(['class' => $classes]) }} 
   style="{{ ($active ?? false) ? 'color: var(--nexus-text-primary); border-color: var(--nexus-accent-purple);' : 'color: var(--nexus-text-secondary);' }}"
   onmouseover="{{ ($active ?? false) ? '' : 'this.style.color=\'var(--nexus-text-primary)\'; this.style.borderColor=\'var(--nexus-border-secondary)\';' }}"
   onmouseout="{{ ($active ?? false) ? '' : 'this.style.color=\'var(--nexus-text-secondary)\'; this.style.borderColor=\'transparent\';' }}">
    {{ $slot }}
</a>
