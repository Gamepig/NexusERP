@extends('layouts.app')

@section('title', '盤點管理')

@section('content')
<div id="stocktaking-list-container" class="container mx-auto px-4 py-6">
    <!-- Content will be rendered by JavaScript -->
</div>
@endsection

@push('scripts')
<script>
    document.body.dataset.page = 'stocktaking-list';
</script>
@endpush