class DemoCart {
  constructor() {
    this.storageKey = 'nx_cart_items';
    this.maxItems = 200;
  }

  getItems() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
  }

  saveItems(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items.slice(0, this.maxItems)));
  }

  addItem(product, quantity = 1) {
    const items = this.getItems();
    const id = Number(product.id);
    const index = items.findIndex(i => Number(i.id) === id);
    const img = (product.images && product.images[0] && product.images[0].url) || '';
    if (index >= 0) {
      items[index].quantity += Math.max(1, Number(quantity) || 1);
    } else {
      items.unshift({
        id,
        name: product.name,
        price: Number(product.price) || 0,
        image: img,
        supplier_id: product.supplier_id || null,
        quantity: Math.max(1, Number(quantity) || 1),
      });
    }
    this.saveItems(items);
  }

  updateQuantity(id, quantity) {
    const items = this.getItems();
    const idx = items.findIndex(i => Number(i.id) === Number(id));
    if (idx >= 0) {
      items[idx].quantity = Math.max(1, Number(quantity) || 1);
      this.saveItems(items);
    }
  }

  remove(id) {
    const items = this.getItems().filter(i => Number(i.id) !== Number(id));
    this.saveItems(items);
  }

  clear() {
    this.saveItems([]);
  }

  totals() {
    const items = this.getItems();
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { subtotal, count };
  }

  updateBadge(badgeId = 'nx-cart-count') {
    try {
      const badge = document.getElementById(badgeId);
      if (!badge) return;
      const c = this.totals().count;
      badge.textContent = c > 99 ? '99+' : String(c);
      if (c > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    } catch (_) {}
  }

  renderCart(containerId, totalsId) {
    const container = document.getElementById(containerId);
    const totalsEl = document.getElementById(totalsId);
    if (!container) return;
    const items = this.getItems();
    if (!items.length) {
      container.innerHTML = '<div class="text-sm" style="color: var(--nx-text-secondary);">購物車是空的</div>';
      if (totalsEl) totalsEl.textContent = '$0.00';
      return;
    }
    container.innerHTML = items.map(i => `
      <div class="nx-card p-3 flex items-center gap-3">
        <img src="${i.image || `https://picsum.photos/seed/cart-${i.id}/100/100`}" class="w-16 h-16 object-cover rounded" onerror="this.src='https://picsum.photos/seed/cart-${i.id}/100/100'" />
        <div class="flex-1">
          <div class="text-sm font-medium" style="color: var(--nx-text-primary);">${i.name}</div>
          <div class="text-xs" style="color: var(--nx-text-secondary);">$${i.price.toFixed(2)}</div>
        </div>
        <div class="flex items-center gap-2">
          <input type="number" min="1" value="${i.quantity}" class="nx-input w-20" onchange="demoCart.updateQuantity(${i.id}, this.value); demoCart.renderCart('${containerId}', '${totalsId}')" />
          <button class="nx-btn" style="background: var(--nx-accent-red); color:#fff;" onclick="demoCart.remove(${i.id}); demoCart.renderCart('${containerId}', '${totalsId}')">移除</button>
        </div>
      </div>
    `).join('');
    if (totalsEl) totalsEl.textContent = '$' + this.totals().subtotal.toFixed(2);
  }
}

window.demoCart = new DemoCart();


