<!DOCTYPE html>
<html>
<head>
    <title>RLS 診斷頁面</title>
</head>
<body>
    <h1>🔐 RLS 多租戶隔離診斷</h1>
    
    <h2>資料庫連接資訊</h2>
    <ul>
        <li><strong>資料庫用戶:</strong> {{ DB::selectOne("SELECT current_user as user")->user }}</li>
        <li><strong>目前公司 ID:</strong> {{ DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id")->company_id ?: 'not set' }}</li>
        <li><strong>認證狀態:</strong> {{ auth()->check() ? '已登入 (ID: '.auth()->id().')' : '未登入' }}</li>
    </ul>
    
    <h2>資料統計</h2>
    <ul>
        <li><strong>客戶數量:</strong> {{ DB::table('customers')->count() }}</li>
        <li><strong>商品數量:</strong> {{ DB::table('products')->count() }}</li>
        <li><strong>供應商數量:</strong> {{ DB::table('suppliers')->count() }}</li>
        <li><strong>銷售訂單數量:</strong> {{ DB::table('sales_orders')->count() }}</li>
    </ul>
    
    <h2>RLS 狀態判斷</h2>
    @php
        $customerCount = DB::table('customers')->count();
        $productCount = DB::table('products')->count();
        $isRLSWorking = ($customerCount <= 10 && $productCount <= 50);
    @endphp
    
    @if($isRLSWorking)
        <p style="color: green; font-weight: bold;">✅ RLS 隔離正常運作</p>
    @else
        <p style="color: red; font-weight: bold;">❌ RLS 隔離可能異常</p>
    @endif
    
    <p><a href="{{ route('customers.index') }}">前往客戶管理</a></p>
</body>
</html>