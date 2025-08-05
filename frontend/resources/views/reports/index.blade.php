@extends('layouts.app')

@section('title', '報表中心')

@push('meta')
<meta name="csrf-token" content="{{ csrf_token() }}">
@endpush

@section('content')
@include('components.reports-style')

<div class="container-fluid mx-auto p-6">
    <!-- 頁面標題 -->
    <div class="mb-8 text-center">
        <h1 class="text-4xl font-bold mb-4" style="color: var(--nexus-text-primary);">📊 報表分析中心</h1>
        <p class="text-lg nx-text-accent">全方位業務數據分析與決策支援系統</p>
    </div>

    <!-- 銷售報表類別 -->
    <div class="report-category">
        <h2 class="category-title">💰 銷售報表</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- 銷售總覽 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-green), var(--nexus-accent-blue)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">銷售總覽</h3>
                <p class="text-sm nx-text-muted mb-4">綜合銷售統計與趨勢分析</p>
                <a href="{{ route('reports.sales.index') }}" class="nx-btn nx-btn-success w-full">查看報表</a>
            </div>

            <!-- 產品銷售分析 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-purple), var(--nexus-accent-blue)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">產品分析</h3>
                <p class="text-sm nx-text-muted mb-4">產品銷售排行與分類統計</p>
                <a href="{{ route('reports.sales.by-product') }}" class="nx-btn nx-btn-info w-full">查看報表</a>
            </div>

            <!-- 客戶銷售分析 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-blue), var(--nexus-accent-green)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">客戶分析</h3>
                <p class="text-sm nx-text-muted mb-4">客戶消費行為與價值分析</p>
                <a href="{{ route('reports.sales.by-customer') }}" class="nx-btn nx-btn-primary w-full">查看報表</a>
            </div>

            <!-- 銷售趨勢 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-orange), var(--nexus-accent-red)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">趨勢分析</h3>
                <p class="text-sm nx-text-muted mb-4">歷史趨勢與未來預測分析</p>
                <a href="{{ route('reports.sales.trends') }}" class="nx-btn nx-btn-warning w-full">查看報表</a>
            </div>
        </div>
    </div>

    <!-- 庫存報表類別 -->
    <div class="report-category">
        <h2 class="category-title">📦 庫存報表</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- 庫存總覽 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-blue), var(--nexus-accent-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">庫存總覽</h3>
                <p class="text-sm nx-text-muted mb-4">庫存水平與庫存分佈</p>
                <a href="{{ route('reports.inventory.index') }}" class="nx-btn nx-btn-info w-full">查看報表</a>
            </div>

            <!-- 庫存週轉率 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-green), var(--nexus-accent-orange)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">週轉率</h3>
                <p class="text-sm nx-text-muted mb-4">庫存週轉率與效率分析</p>
                <a href="{{ route('reports.inventory.turnover') }}" class="nx-btn nx-btn-success w-full">查看報表</a>
            </div>

            <!-- 庫存老化 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-orange), var(--nexus-accent-red)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">庫存老化</h3>
                <p class="text-sm nx-text-muted mb-4">長期庫存與老化分析</p>
                <a href="{{ route('reports.inventory.aging') }}" class="nx-btn nx-btn-warning w-full">查看報表</a>
            </div>

            <!-- 庫存異動 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-purple), var(--nexus-accent-green)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">異動記錄</h3>
                <p class="text-sm nx-text-muted mb-4">庫存進出異動追蹤</p>
                <a href="{{ route('reports.inventory.movements') }}" class="nx-btn nx-btn-primary w-full">查看報表</a>
            </div>
        </div>
    </div>

    <!-- 財務報表類別 -->
    <div class="report-category">
        <h2 class="category-title">💼 財務報表</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- 財務總覽 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-green), var(--nexus-accent-blue)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">財務總覽</h3>
                <p class="text-sm nx-text-muted mb-4">整體財務狀況概覽</p>
                <a href="{{ route('reports.financial.index') }}" class="nx-btn nx-btn-success w-full">查看報表</a>
            </div>

            <!-- 損益表 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-purple), var(--nexus-accent-orange)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">損益表</h3>
                <p class="text-sm nx-text-muted mb-4">收入支出與獲利分析</p>
                <a href="{{ route('reports.financial.profit-loss') }}" class="nx-btn nx-btn-info w-full">查看報表</a>
            </div>

            <!-- 應收帳款 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-blue), var(--nexus-accent-green)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">應收帳款</h3>
                <p class="text-sm nx-text-muted mb-4">客戶應收帳款管理</p>
                <a href="{{ route('reports.financial.accounts-receivable') }}" class="nx-btn nx-btn-primary w-full">查看報表</a>
            </div>

            <!-- 應付帳款 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-orange), var(--nexus-accent-red)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">應付帳款</h3>
                <p class="text-sm nx-text-muted mb-4">供應商應付帳款管理</p>
                <a href="{{ route('reports.financial.accounts-payable') }}" class="nx-btn nx-btn-warning w-full">查看報表</a>
            </div>
        </div>
    </div>

    <!-- 採購報表類別 -->
    <div class="report-category">
        <h2 class="category-title">🛒 採購報表</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 採購總覽 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-purple), var(--nexus-accent-blue)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 3H3m4 10v6a1 1 0 001 1h9a1 1 0 001-1v-6"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">採購總覽</h3>
                <p class="text-sm nx-text-muted mb-4">採購訂單統計與分析</p>
                <a href="{{ route('reports.purchase.index') }}" class="nx-btn nx-btn-info w-full">查看報表</a>
            </div>

            <!-- 供應商分析 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-green), var(--nexus-accent-orange)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">供應商分析</h3>
                <p class="text-sm nx-text-muted mb-4">供應商採購統計分析</p>
                <a href="{{ route('reports.purchase.by-supplier') }}" class="nx-btn nx-btn-success w-full">查看報表</a>
            </div>

            <!-- 採購商品分析 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-orange), var(--nexus-accent-red)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">商品分析</h3>
                <p class="text-sm nx-text-muted mb-4">採購商品統計與分析</p>
                <a href="{{ route('reports.purchase.by-product') }}" class="nx-btn nx-btn-primary w-full">查看報表</a>
            </div>
        </div>
    </div>

    <!-- 人事報表類別 -->
    <div class="report-category">
        <h2 class="category-title">👥 人事報表</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 出勤統計 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-blue), var(--nexus-accent-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">出勤統計</h3>
                <p class="text-sm nx-text-muted mb-4">員工出勤時間統計分析</p>
                <a href="{{ route('reports.employees.attendance') }}" class="nx-btn nx-btn-info w-full">查看報表</a>
            </div>

            <!-- 績效分析 -->
            <div class="nx-card text-center">
                <div class="report-icon mx-auto" style="background: linear-gradient(135deg, var(--nexus-accent-green), var(--nexus-accent-blue)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--nexus-text-primary);">績效分析</h3>
                <p class="text-sm nx-text-muted mb-4">員工績效評估與分析</p>
                <a href="{{ route('reports.employees.performance') }}" class="nx-btn nx-btn-success w-full">查看報表</a>
            </div>
        </div>
    </div>

    <!-- 快速統計摘要 -->
    <div class="mt-12 nx-card">
        <div class="text-center">
            <h3 class="text-2xl font-bold mb-4" style="color: var(--nexus-text-primary);">📈 系統快速統計</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div class="text-center">
                    <div class="text-3xl font-bold" style="color: var(--nexus-accent-green);">18</div>
                    <div class="text-sm nx-text-muted">報表類型</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold" style="color: var(--nexus-accent-blue);">5</div>
                    <div class="text-sm nx-text-muted">業務模組</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold" style="color: var(--nexus-accent-purple);">100%</div>
                    <div class="text-sm nx-text-muted">即時更新</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold" style="color: var(--nexus-accent-orange);">24/7</div>
                    <div class="text-sm nx-text-muted">全天候服務</div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// 頁面載入動畫
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.nx-card');
    
    // 漸進式載入動畫
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});
</script>
@endsection