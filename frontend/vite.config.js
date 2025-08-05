import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css', 
                'resources/css/nexus-theme.css',
                'resources/js/app.js',
                'resources/js/theme-toggle.js'
            ],
            refresh: true,
        }),
    ],
});
