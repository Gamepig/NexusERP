@extends('layouts.app')

@section('title', '商家首頁 - NexusERP 市集')

@section('content')
<div class="min-h-screen" style="background-color: var(--nexus-primary-bg);">
  <div class="container mx-auto px-4 py-6">
    <!-- 麵包屑 -->
    <nav class="text-xs mb-3" aria-label="Breadcrumb" style="color: var(--nexus-text-secondary);">
      <ol class="inline-flex items-center space-x-1">
        <li><a href="/marketplace" class="hover:underline" style="color: var(--nexus-text-secondary);">市集</a></li>
        <li>/</li>
        <li><a href="/marketplace/products" class="hover:underline" style="color: var(--nexus-text-secondary);">商品列表</a></li>
        <li>/</li>
        <li class="text-xs" style="color: var(--nexus-text-primary);">商家首頁</li>
      </ol>
    </nav>
    <div id="supplier-header" class="nx-card overflow-hidden mb-6">
      <div id="supplier-banner" class="w-full h-40 bg-cover bg-center"></div>
      <div class="p-5 flex items-center gap-4">
        <img id="supplier-logo" src="" alt="logo" class="w-16 h-16 rounded object-cover border" style="border-color: var(--nexus-border-primary);"/>
        <div class="flex-1">
          <h1 id="supplier-name" class="text-2xl font-bold" style="color: var(--nexus-text-primary);"></h1>
          <p id="supplier-desc" class="text-sm mt-1" style="color: var(--nexus-text-secondary);"></p>
          <div id="supplier-meta" class="text-xs mt-2" style="color: var(--nexus-text-muted);"></div>
        </div>
      </div>
    </div>

    <div class="nx-card p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold" style="color: var(--nexus-text-primary);">所有商品</h2>
        <select id="page-size" class="nx-input w-28">
          <option value="12">12</option>
          <option value="24">24</option>
          <option value="36">36</option>
        </select>
      </div>

      <div id="products-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      <div id="pagination" class="mt-4 flex justify-center">
        <nav id="pagination-nav" class="inline-flex gap-1"></nav>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const apiBase = '/api/marketplace';
  const supplierId = {{ (int)($supplierId ?? request()->route('id')) }};
  let currentPage = 1; let pageSize = 12; let totalPages = 1;

  const el = {
    banner: document.getElementById('supplier-banner'),
    logo: document.getElementById('supplier-logo'),
    name: document.getElementById('supplier-name'),
    desc: document.getElementById('supplier-desc'),
    meta: document.getElementById('supplier-meta'),
    grid: document.getElementById('products-grid'),
    pageSize: document.getElementById('page-size'),
    pagination: document.getElementById('pagination-nav')
  };

  fetch(`${apiBase}/suppliers/${supplierId}`)
    .then(r => r.json()).then(d => {
      el.banner.style.backgroundImage = `url('${d.banner_url}')`;
      el.logo.src = d.logo_url; el.name.textContent = d.company_name;
      el.desc.textContent = d.description || '';
      el.meta.textContent = `商品數 ${d.statistics?.product_count || 0} ・ 評分 ${d.statistics?.rating || 0} ・ 評論 ${d.statistics?.reviews_count || 0}`;
    }).catch(() => {});

  function renderProducts(data){
    const items = data.data || [];
    el.grid.innerHTML = items.map(p => {
      const img = (p.images && p.images[0] && p.images[0].url) || `https://picsum.photos/seed/fallback-${p.id}/400/300`;
      return `
      <div class="nx-card overflow-hidden">
        <img src="${img}" alt="${p.name}" class="w-full h-40 object-cover" onerror="this.src='https://picsum.photos/seed/fb-${p.id}/400/300'">
        <div class="p-3">
          <div class="text-sm font-medium mb-1" style="color: var(--nexus-text-primary);">${p.name}</div>
          <div class="text-xs mb-2" style="color: var(--nexus-text-secondary);">${p.category}</div>
          <div class="text-base font-semibold" style="color: var(--nexus-accent-blue);">$${Number(p.price).toFixed(2)}</div>
        </div>
      </div>`;
    }).join('');
  }

  function renderPagination(meta){
    totalPages = meta.last_page || Math.ceil((meta.total||0) / (meta.per_page||pageSize)) || 1;
    el.pagination.innerHTML = '';
    if(totalPages <= 1) return;
    const mkBtn = (p, t, active=false)=>{ const b=document.createElement('button');
      b.textContent=t; b.className='px-3 py-1 text-sm rounded border';
      b.style.cssText = `border-color: var(--nexus-border-primary); background:${active?'var(--nexus-accent-purple)':'var(--nexus-card-bg)'}; color:${active?'#fff':'var(--nexus-text-secondary)'};`;
      if(!active){ b.onclick=()=>{ currentPage=p; load(); }; }
      return b; };
    const cur = currentPage; const start = Math.max(1, cur-2); const end = Math.min(totalPages, cur+2);
    if(cur>1) el.pagination.appendChild(mkBtn(cur-1,'上一頁'));
    if(start>1) el.pagination.appendChild(mkBtn(1,'1'));
    for(let i=start;i<=end;i++) el.pagination.appendChild(mkBtn(i,String(i), i===cur));
    if(end<totalPages) el.pagination.appendChild(mkBtn(totalPages,String(totalPages)));
    if(cur<totalPages) el.pagination.appendChild(mkBtn(cur+1,'下一頁'));
  }

  function load(){
    fetch(`${apiBase}/suppliers/${supplierId}/products?page=${currentPage}&page_size=${pageSize}`)
      .then(r=>r.json()).then(d=>{ renderProducts(d); renderPagination(d); })
      .catch(()=>{});
  }

  el.pageSize.addEventListener('change', e=>{ pageSize = parseInt(e.target.value); currentPage=1; load();});
  load();
});
</script>
@endsection


