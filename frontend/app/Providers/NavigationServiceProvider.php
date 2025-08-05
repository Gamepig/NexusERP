<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\NavigationService;

class NavigationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(NavigationService::class, function ($app) {
            return new NavigationService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}