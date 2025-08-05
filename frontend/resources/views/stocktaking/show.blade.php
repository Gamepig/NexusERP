@extends('layouts.app')

@section('title', '盤點詳情')

@section('content')
<div id="stocktaking-detail-container" 
     class="container mx-auto px-4 py-6"
     data-order-id="{{ $orderId }}">
    <!-- Content will be rendered by JavaScript -->
</div>
@endsection

@push('scripts')
<script>
    document.body.dataset.page = 'stocktaking-detail';
</script>
@endpush