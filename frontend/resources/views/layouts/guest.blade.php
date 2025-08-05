<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/css/nexus-theme.css', 'resources/js/app.js', 'resources/js/theme-toggle.js'])
    </head>
    <body class="font-sans nexus-text-primary antialiased nexus-bg-primary">
        <div class="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 nexus-bg-primary">
            <div>
                <a href="/">
                    <x-application-logo class="w-20 h-20 fill-current nexus-text-secondary" />
                </a>
            </div>

            <div class="w-full sm:max-w-md mt-6 px-6 py-4 nexus-card nexus-shadow-md overflow-hidden sm:rounded-lg">
                @isset($slot)
                    {{ $slot }}
                @else
                    @yield('content')
                @endisset
            </div>
        </div>
    </body>
</html>
