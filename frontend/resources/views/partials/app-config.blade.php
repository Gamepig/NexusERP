<!-- Application Configuration for JavaScript -->
<script>
    // Make configuration available to JavaScript
    window.APP_CONFIG = {
        // Backend API URL (default to Go backend)
        BACKEND_URL: '{{ env('BACKEND_URL', 'http://localhost:8080') }}',
        
        // Frontend URL
        FRONTEND_URL: '{{ config('app.url') }}',
        
        // Environment
        APP_ENV: '{{ config('app.env') }}',
        
        // CSRF Token
        CSRF_TOKEN: '{{ csrf_token() }}',
        
        // API endpoints
        API: {
            UPLOAD_INVOICE: '{{ env('BACKEND_URL', 'http://localhost:8080') }}/api/invoices/upload',
            PROCESS_DOCUMENT: '{{ env('BACKEND_URL', 'http://localhost:8080') }}/api/ocr/process',
            GET_DOCUMENT: '{{ env('BACKEND_URL', 'http://localhost:8080') }}/api/ocr/documents',
            GET_OCR_RESULT: '{{ env('BACKEND_URL', 'http://localhost:8080') }}/api/ocr/documents/{id}/result',
            VERIFY_OCR: '{{ env('BACKEND_URL', 'http://localhost:8080') }}/api/ocr/verify'
        }
    };
    
    // For backward compatibility
    window.BACKEND_URL = window.APP_CONFIG.BACKEND_URL;
</script>