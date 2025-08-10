{{-- 全域搜尋觸發與面板（簡版，占位） --}}
<div x-data="{ open: false, q: '' }" @open-global-search.window="open = true" class="relative">
  <button @click="open = true" class="nexus-search-trigger" aria-label="搜尋" title="搜尋 (⌘K)">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" /></svg>
  </button>
  <div x-show="open" x-transition @keydown.escape.window="open=false" class="fixed inset-0 z-[6000]" style="display:none">
    <div class="absolute inset-0" style="background: rgba(0,0,0,0.5)" @click="open=false"></div>
    <div class="relative mx-auto mt-24 max-w-2xl w-full p-4">
      <div class="nexus-card">
        <input type="text" x-model="q" placeholder="輸入關鍵字..." class="w-full px-3 py-2 border rounded" style="border-color: var(--nexus-border-primary); color: var(--nexus-text-primary); background: var(--nexus-surface-primary)" />
        <div class="mt-3 text-sm" style="color: var(--nexus-text-secondary)">按 Enter 送出（暫以導向列表頁帶參數）</div>
        <div class="mt-4 text-right">
          <a :href="'/quotes?search=' + encodeURIComponent(q)" class="nexus-btn nexus-btn-primary">搜尋報價</a>
        </div>
      </div>
    </div>
  </div>
</div>


