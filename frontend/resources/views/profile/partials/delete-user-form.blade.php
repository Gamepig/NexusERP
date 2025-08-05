<section class="space-y-6">
    <header>
        <h2 class="text-lg font-medium nexus-text-primary">
            {{ __('Delete Account') }}
        </h2>

        <p class="mt-1 text-sm nexus-text-secondary">
            {{ __('Once your account is deleted, all of its resources and data will be permanently deleted. Before deleting your account, please download any data or information that you wish to retain.') }}
        </p>
    </header>

    <button
        x-data=""
        x-on:click.prevent="$dispatch('open-modal', 'confirm-user-deletion')"
        class="nexus-btn-secondary bg-red-600 hover:bg-red-700 text-white border-red-600"
    >{{ __('Delete Account') }}</button>

    <x-modal name="confirm-user-deletion" :show="$errors->userDeletion->isNotEmpty()" focusable>
        <form method="post" action="{{ route('profile.destroy') }}" class="p-6 nexus-bg-secondary">
            @csrf
            @method('delete')

            <h2 class="text-lg font-medium nexus-text-primary">
                {{ __('Are you sure you want to delete your account?') }}
            </h2>

            <p class="mt-1 text-sm nexus-text-secondary">
                {{ __('Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.') }}
            </p>

            <div class="mt-6">
                <x-input-label for="password" value="{{ __('Password') }}" class="sr-only" />

                <x-text-input
                    id="password"
                    name="password"
                    type="password"
                    class="nexus-input mt-1 block w-3/4"
                    placeholder="{{ __('Password') }}"
                />

                <x-input-error :messages="$errors->userDeletion->get('password')" class="mt-2 text-red-500" />
            </div>

            <div class="mt-6 flex justify-end">
                <button type="button" x-on:click="$dispatch('close')" class="nexus-btn-secondary mr-3">
                    {{ __('Cancel') }}
                </button>

                <button type="submit" class="nexus-btn-secondary bg-red-600 hover:bg-red-700 text-white border-red-600">
                    {{ __('Delete Account') }}
                </button>
            </div>
        </form>
    </x-modal>
</section>
