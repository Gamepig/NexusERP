<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Facades\Socialite;
use SocialiteProviders\Line\Provider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register LINE OAuth provider
        Socialite::extend('line', function ($app) {
            $config = $app['config']['services.line'];
            return Socialite::buildProvider(Provider::class, $config);
        });
    }
}
