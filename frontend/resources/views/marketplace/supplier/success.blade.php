@extends('layouts.app')

@section('title', '註冊成功 - NexusERP')

@push('styles')
<style>
.success-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
}

.success-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 2rem;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.success-icon svg {
    width: 40px;
    height: 40px;
    color: white;
}

.success-card {
    background: white;
    border-radius: 0.75rem;
    padding: 3rem 2rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0.5rem;
}

.btn-primary {
    background: #3b82f6;
    color: white;
}

.btn-primary:hover {
    background: #2563eb;
}

.btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
}

.btn-secondary:hover {
    background: #e5e7eb;
}

.info-box {
    background: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 2rem 0;
    text-align: left;
}

.info-box h4 {
    color: #0c4a6e;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.info-box ul {
    color: #0c4a6e;
    margin: 0;
    padding-left: 1.5rem;
}

.info-box li {
    margin-bottom: 0.25rem;
}
</style>
@endpush

@section('content')
<div class="success-container">
    <div class="success-card">
        <!-- 成功圖示 -->
        <div class="success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>

        <!-- 成功標題 -->
        <h1 class="text-2xl font-bold text-gray-900 mb-4">註冊申請提交成功！</h1>
        
        <!-- 成功訊息 -->
        <p class="text-gray-600 mb-6">
            感謝您申請成為 NexusERP 的供應商合作夥伴。我們已收到您的註冊申請，將在 1-3 個工作天內進行審核。
        </p>

        <!-- 審核流程說明 -->
        <div class="info-box">
            <h4>接下來會發生什麼？</h4>
            <ul>
                <li>我們的團隊將審核您提供的資料</li>
                <li>審核結果將透過電子郵件通知您</li>
                <li>通過審核後，您將收到登入帳號設定信件</li>
                <li>您可以開始在平台上展示產品和服務</li>
            </ul>
        </div>

        <!-- 聯絡資訊 -->
        <div class="text-sm text-gray-500 mb-8">
            如有任何問題，請聯絡我們：
            <br>
            電子郵件：<a href="mailto:supplier@nexuserp.com" class="text-blue-600 hover:text-blue-700">supplier@nexuserp.com</a>
            <br>
            電話：(02) 1234-5678
        </div>

        <!-- 操作按鈕 -->
        <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a href="/" class="btn btn-primary">
                返回首頁
            </a>
            <a href="/marketplace/supplier/register" class="btn btn-secondary">
                再次註冊
            </a>
        </div>
    </div>
</div>
@endsection