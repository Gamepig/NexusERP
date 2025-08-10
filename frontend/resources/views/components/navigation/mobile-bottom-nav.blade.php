{{-- 行動版底部導航（簡版） --}}
<nav class="fixed bottom-0 left-0 right-0 lg:hidden" style="background: var(--nexus-bg-secondary); border-top: 1px solid var(--nexus-border-primary); z-index: 4000;">
  <ul class="grid grid-cols-4 text-center">
    <li><a href="{{ route('dashboard') }}" class="block py-2 text-sm" style="color: var(--nexus-text-secondary)">儀表</a></li>
    <li><a href="{{ route('quotes.index') }}" class="block py-2 text-sm" style="color: var(--nexus-text-secondary)">報價</a></li>
    <li><a href="{{ route('orders.sales.index') }}" class="block py-2 text-sm" style="color: var(--nexus-text-secondary)">訂單</a></li>
    <li><a href="{{ route('products.index') }}" class="block py-2 text-sm" style="color: var(--nexus-text-secondary)">產品</a></li>
  </ul>
</nav>


