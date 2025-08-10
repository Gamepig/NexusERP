@extends('layouts.app')
@section('title', '報表｜客戶概覽')
@section('content')
@include('components.reports-style')
<div class="container mx-auto px-4 py-6">
  <x-ui.card>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">客戶概覽</h2>
      <div class="flex items-center space-x-2">
        <input type="date" id="dateFrom" class="nx-input" />
        <input type="date" id="dateTo" class="nx-input" />
        <button id="apply" class="nx-btn nx-btn-primary">套用</button>
        <button id="exportCsv" class="nx-btn nx-btn-secondary">匯出 CSV</button>
      </div>
    </div>
    <canvas id="customersOverviewChart" height="140"></canvas>
  </x-ui.card>
</div>
<script>
let customersChart;
function toCsv(rows){
  const header='Customer,TotalSpent,Orders';
  return header+'\n'+rows.map(r=>`${r.customer_name},${r.total_spent},${r.order_count}`).join('\n');
}
async function loadCustomers(){
  const df=document.getElementById('dateFrom').value;
  const dt=document.getElementById('dateTo').value;
  const params=new URLSearchParams({date_from:df,date_to:dt});
  const resp=await fetch(`/api/reports/sales/by-customer?${params.toString()}`,{
    headers:{'X-Requested-With':'XMLHttpRequest','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content||''},
    credentials:'same-origin'
  });
  if(!resp.ok) throw new Error('載入客戶報表失敗');
  const json=await resp.json();
  const rows=(json.customers||[]).map(c=>({customer_name:c.customer_name,total_spent:c.total_spent,order_count:c.order_count}));
  const labels=rows.map(r=>r.customer_name);
  const data=rows.map(r=>r.total_spent);
  const ctx=document.getElementById('customersOverviewChart').getContext('2d');
  if(customersChart) customersChart.destroy();
  customersChart=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'銷售額',data}]},options:{responsive:true,maintainAspectRatio:false}});
  // 綁 CSV
  const btn=document.getElementById('exportCsv');
  btn.onclick=()=>{const blob=new Blob([toCsv(rows)],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='customers-overview.csv';a.click();URL.revokeObjectURL(url)};
}
document.addEventListener('DOMContentLoaded',()=>{
  const today=new Date(); const ago=new Date(); ago.setDate(today.getDate()-30);
  document.getElementById('dateFrom').value=ago.toISOString().split('T')[0];
  document.getElementById('dateTo').value=today.toISOString().split('T')[0];
  document.getElementById('apply').addEventListener('click',loadCustomers);
  loadCustomers();
});
</script>
@endsection
