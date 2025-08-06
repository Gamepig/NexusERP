# Third-Party Integrations Guide

This document provides comprehensive guidance on configuring and using the third-party integrations in NexusERP, including QuickBooks accounting and shipment tracking services.

## Table of Contents

1. [Overview](#overview)
2. [QuickBooks Integration](#quickbooks-integration)
3. [Shipment Tracking Integration](#shipment-tracking-integration)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

## Overview

NexusERP supports integration with external services to enhance functionality:

- **QuickBooks**: Sync customers, invoices, and payments with QuickBooks Online
- **Shipment Tracking**: Track shipments across multiple logistics providers (DHL, FedEx, UPS, USPS)

All integrations support both sandbox and production environments for safe testing and deployment.

## QuickBooks Integration

### Features

- **Customer Sync**: Automatically sync customer data between NexusERP and QuickBooks
- **Invoice Sync**: Create and update invoices in QuickBooks from NexusERP sales orders
- **Payment Sync**: Record customer payments in QuickBooks
- **OAuth 2.0 Authentication**: Secure authentication flow with token refresh

### Setup

1. **Create QuickBooks App**:
   - Go to [QuickBooks Developer Dashboard](https://developer.intuit.com/)
   - Create a new app and get your Client ID and Client Secret
   - Set redirect URI to: `http://your-domain.com/auth/quickbooks/callback`

2. **Configure Environment Variables**:
   ```bash
   QUICKBOOKS_ENABLED=true
   QUICKBOOKS_SANDBOX=true  # false for production
   QUICKBOOKS_BASE_URL=https://sandbox-quickbooks.api.intuit.com
   QUICKBOOKS_CLIENT_ID=your_client_id
   QUICKBOOKS_CLIENT_SECRET=your_client_secret
   QUICKBOOKS_REDIRECT_URI=http://localhost:8080/auth/quickbooks/callback
   QUICKBOOKS_COMPANY_ID=your_company_id
   ```

3. **Authentication Flow**:
   - Navigate to `/auth/quickbooks` to start OAuth flow
   - Grant permissions in QuickBooks
   - System will store access and refresh tokens automatically

### Usage Examples

```go
// Create QuickBooks service
config, _ := config.LoadIntegrationConfig()
qbService, _ := config.CreateQuickBooksService()

// Sync customer
customer := &models.Customer{
    Name: "Test Customer",
    PrimaryEmail: stringPtr("test@example.com"),
}
qbCustomer, err := qbService.SyncCustomer(customer)

// Sync invoice
invoice := &models.InvoiceWithDetails{
    InvoiceNumber: "INV-001",
    TotalAmount: 1000.00,
    Customer: customer,
}
qbInvoice, err := qbService.SyncInvoice(invoice)
```

### API Endpoints

- `POST /api/integrations/quickbooks/customers` - Sync customer
- `POST /api/integrations/quickbooks/invoices` - Sync invoice
- `POST /api/integrations/quickbooks/payments` - Sync payment
- `GET /api/integrations/quickbooks/test` - Test connection

## Shipment Tracking Integration

### Supported Providers

- **DHL**: Express and standard shipping
- **FedEx**: Ground, Express, and International
- **UPS**: Ground and Air services
- **USPS**: Priority and Ground services

### Features

- **Real-time Tracking**: Get current shipment status and location
- **Batch Tracking**: Track multiple shipments simultaneously
- **Status Updates**: Automatic status updates with webhooks
- **Event Timeline**: Complete shipment event history
- **Multi-provider Support**: Switch between providers seamlessly

### Setup

1. **Provider Registration**:
   - Register with logistics providers for API access
   - Obtain API keys and credentials
   - Enable sandbox mode for testing

2. **Configure Environment Variables**:
   ```bash
   SHIPMENT_TRACKING_ENABLED=true
   SHIPMENT_TRACKING_DEFAULT_PROVIDER=dhl
   
   # DHL Configuration
   DHL_ENABLED=true
   DHL_SANDBOX=true
   DHL_BASE_URL=https://api-test.dhl.com
   DHL_API_KEY=your_dhl_api_key
   
   # FedEx Configuration
   FEDEX_ENABLED=true
   FEDEX_SANDBOX=true
   FEDEX_BASE_URL=https://apis-sandbox.fedex.com
   FEDEX_API_KEY=your_fedex_api_key
   ```

### Usage Examples

```go
// Create tracking service
config, _ := config.LoadIntegrationConfig()
trackingService, _ := config.CreateShipmentTrackingService("dhl")

// Track single shipment
trackingInfo, err := trackingService.TrackShipment("DHL123456789")

// Track multiple shipments
trackingNumbers := []string{"DHL123456789", "FEDEX987654321"}
results, err := trackingService.TrackMultipleShipments(trackingNumbers)

// Update shipment status
shipment := &services.Shipment{
    TrackingNumber: "DHL123456789",
}
err = trackingService.UpdateShipmentStatus(shipment)
```

### Frontend Components

The system includes React components for shipment tracking:

```javascript
// Full tracking component
<ShipmentTracking 
    trackingNumber="DHL123456789" 
    salesOrderId={1001} 
/>

// Compact tracking card
<ShipmentTrackingCard 
    shipment={shipment} 
    onTrackingUpdate={handleUpdate} 
/>

// Dashboard with multiple shipments
<ShipmentTrackingDashboard 
    customerId={123} 
    salesOrderId={1001} 
/>
```

### API Endpoints

- `GET /api/shipments/track/{tracking_number}` - Track single shipment
- `POST /api/shipments/track/batch` - Track multiple shipments
- `GET /api/shipments` - List shipments with filters
- `POST /api/shipments/{id}/track/update` - Update shipment tracking
- `GET /api/shipments/carriers` - Get supported carriers
- `POST /api/shipments/test-connection` - Test provider connection

## Configuration

### Environment Files

Create `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with your actual API keys and settings
```

For sandbox testing:
```bash
cp .env.example .env.sandbox
# Configure with sandbox API keys
```

### Integration Configuration

The system uses `internal/config/integration_config.go` to manage all integration settings:

```go
// Load configuration
config, err := config.LoadIntegrationConfig()

// Validate configuration
err = config.Validate()

// Check if in sandbox mode
if config.IsSandboxMode() {
    // Use sandbox APIs
}
```

### Runtime Configuration

Update integration settings without restart:

```bash
# Disable QuickBooks temporarily
curl -X POST /api/admin/integrations/quickbooks/disable

# Switch tracking provider
curl -X POST /api/admin/integrations/tracking/provider -d '{"provider":"fedex"}'
```

## Testing

### Integration Tests

Run comprehensive integration tests:

```bash
# Full integration tests
./scripts/run-integration-tests.sh

# Quick tests (no external API calls)
./scripts/run-integration-tests.sh --quick

# With cleanup
./scripts/run-integration-tests.sh --cleanup

# Generate detailed report
./scripts/run-integration-tests.sh --report
```

### Sandbox Environment

Use Docker Compose for isolated testing:

```bash
# Start sandbox environment
docker-compose -f docker-compose.sandbox.yml up -d

# Run specific service tests
docker-compose -f docker-compose.sandbox.yml run integration-tests

# View logs
docker-compose -f docker-compose.sandbox.yml logs -f nexus-erp-backend-sandbox
```

### Manual Testing

Test individual components:

```bash
# Test QuickBooks connection
curl -X POST http://localhost:8080/api/integrations/quickbooks/test

# Test shipment tracking
curl -X GET http://localhost:8080/api/shipments/track/TEST123456789

# Test batch tracking
curl -X POST http://localhost:8080/api/shipments/track/batch \
  -H "Content-Type: application/json" \
  -d '{"tracking_numbers":["TEST123456789","TEST987654321"]}'
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   ```
   Error: QuickBooks authentication failed
   ```
   - Verify Client ID and Client Secret
   - Check redirect URI configuration
   - Ensure tokens haven't expired
   - Re-authenticate using OAuth flow

2. **API Rate Limiting**:
   ```
   Error: Rate limit exceeded
   ```
   - Check provider rate limits in configuration
   - Implement exponential backoff
   - Use batch operations where possible

3. **Network Connectivity**:
   ```
   Error: Connection timeout
   ```
   - Verify internet connectivity
   - Check firewall settings
   - Validate API endpoints
   - Test with curl commands

4. **Invalid Tracking Numbers**:
   ```
   Error: Tracking number not found
   ```
   - Verify tracking number format
   - Check with correct provider
   - Ensure shipment exists in provider system

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=debug
export DEBUG_HTTP=true
export DEBUG_SQL=true
```

View detailed logs:

```bash
# Backend logs
docker-compose logs -f nexus-erp-backend

# Integration service logs
docker-compose logs -f integration-tests
```

### Health Checks

Monitor integration health:

```bash
# Check all integrations
curl -X GET http://localhost:8080/api/health/integrations

# Check specific provider
curl -X POST http://localhost:8080/api/shipments/test-connection
curl -X POST http://localhost:8080/api/integrations/quickbooks/test
```

## API Reference

### Authentication

All API requests require authentication:

```bash
# Get JWT token
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# Use token in requests
curl -X GET http://localhost:8080/api/shipments \
  -H "Authorization: Bearer $TOKEN"
```

### Error Responses

Standard error format:

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": {
    "field": "Additional error context"
  }
}
```

### Rate Limiting

API rate limits:
- QuickBooks: 100 requests/minute
- DHL: 60 requests/minute
- FedEx: 120 requests/minute
- UPS: 60 requests/minute
- USPS: 30 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Webhooks

Configure webhooks for automatic updates:

```bash
# Register webhook
curl -X POST http://localhost:8080/api/webhooks/shipment-tracking \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhooks/tracking",
    "events": ["status_update", "delivery_confirmed"],
    "provider": "dhl"
  }'
```

## Security Considerations

1. **API Keys**: Store securely in environment variables, never in code
2. **HTTPS**: Always use HTTPS in production
3. **Token Rotation**: Implement automatic token refresh
4. **Access Control**: Limit integration access to authorized users
5. **Audit Logging**: Log all integration activities
6. **Data Privacy**: Follow provider data usage policies

## Performance Optimization

1. **Caching**: Cache tracking results for 5-10 minutes
2. **Batch Operations**: Use batch APIs where available
3. **Async Processing**: Process updates in background
4. **Connection Pooling**: Reuse HTTP connections
5. **Circuit Breaker**: Implement circuit breaker pattern

## Support

For integration support:

1. **Documentation**: Review provider API documentation
2. **Sandbox Testing**: Test thoroughly in sandbox environment
3. **Error Logs**: Check application logs for detailed errors
4. **Provider Support**: Contact provider technical support
5. **Community**: Check GitHub issues and discussions

---

*Last updated: 2025-07-20*
*Version: 1.0.0*