# Accounts Receivable API Documentation

## Overview

This document describes the Accounts Receivable (AR) API endpoints implemented in Task 16.5. The API provides comprehensive functionality for querying AR records, customer balances, and generating aging reports.

## Endpoints

### 1. List Accounts Receivable Records

**GET** `/api/accounts-receivable`

Retrieves a paginated list of accounts receivable records with optional filtering.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Records per page (default: 20, max: 100) |
| `customer_id` | integer | No | Filter by specific customer ID |
| `status` | string | No | Filter by AR status (`open`, `partially_paid`, `overdue`, `paid`) |
| `start_date` | string | No | Filter by due date >= start_date (YYYY-MM-DD) |
| `end_date` | string | No | Filter by due date <= end_date (YYYY-MM-DD) |

#### Response

```json
{
  "data": [
    {
      "id": 1,
      "invoice_id": 123,
      "customer_id": 456,
      "amount_due": 1500.00,
      "balance_due": 750.00,
      "currency_id": 1,
      "due_date": "2024-01-15T00:00:00Z",
      "status": "partially_paid",
      "aging_bucket": "current",
      "terms": "Net 30",
      "created_at": "2023-12-15T10:00:00Z",
      "updated_at": "2024-01-10T15:30:00Z",
      "invoice": {
        "invoice_number": "INV-2023-001",
        "invoice_date": "2023-12-15T00:00:00Z",
        "total_amount": 1500.00
      },
      "customer": {
        "customer_code": "CUST001",
        "company_name": "Acme Corporation",
        "name": "John Doe"
      },
      "currency": {
        "code": "USD",
        "symbol": "$"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "filters": {
    "customer_id": null,
    "status": "partially_paid",
    "start_date": null,
    "end_date": null
  }
}
```

### 2. Get Specific AR Record

**GET** `/api/accounts-receivable/{id}`

Retrieves detailed information for a specific accounts receivable record.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | AR record ID |

#### Response

```json
{
  "data": {
    "id": 1,
    "invoice_id": 123,
    "customer_id": 456,
    "amount_due": 1500.00,
    "balance_due": 750.00,
    "currency_id": 1,
    "due_date": "2024-01-15T00:00:00Z",
    "status": "partially_paid",
    "aging_bucket": "current",
    "terms": "Net 30",
    "created_at": "2023-12-15T10:00:00Z",
    "updated_at": "2024-01-10T15:30:00Z",
    "invoice": {
      "invoice_number": "INV-2023-001",
      "invoice_date": "2023-12-15T00:00:00Z",
      "total_amount": 1500.00,
      "invoice_type": "sales",
      "description": "Professional services"
    },
    "customer": {
      "customer_code": "CUST001",
      "company_name": "Acme Corporation",
      "name": "John Doe",
      "primary_email": "billing@acme.com",
      "primary_phone": "+1-555-0123",
      "address_line1": "123 Business Ave",
      "address_line2": "Suite 100",
      "credit_limit": 10000.00
    },
    "currency": {
      "code": "USD",
      "symbol": "$",
      "name": "US Dollar"
    }
  }
}
```

### 3. Get Customer Balance

**GET** `/api/customers/{id}/balance`

Retrieves balance information for a specific customer.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Customer ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `detailed` | boolean | No | Return detailed balance info (default: false) |

#### Response (Summary)

```json
{
  "data": {
    "customer_id": 456,
    "total_balance": 2250.00,
    "overdue_balance": 500.00,
    "available_credit": 7750.00,
    "currency": "USD"
  }
}
```

#### Response (Detailed)

```json
{
  "data": {
    "customer_id": 456,
    "customer_name": "Acme Corporation",
    "customer_code": "CUST001",
    "total_balance": 2250.00,
    "current_balance": 1750.00,
    "overdue_balance": 500.00,
    "credit_limit": 10000.00,
    "available_credit": 7750.00,
    "currency": "USD",
    "last_payment_date": "2024-01-05",
    "last_payment_amount": 750.00,
    "outstanding_invoices": 3,
    "oldest_invoice_date": "2023-11-15"
  }
}
```

### 4. Get Outstanding AR for Customer

**GET** `/api/customers/{id}/outstanding-ar`

Retrieves all outstanding accounts receivable records for a specific customer.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Customer ID |

#### Response

```json
{
  "data": [
    {
      "id": 1,
      "invoice_id": 123,
      "customer_id": 456,
      "amount_due": 1500.00,
      "balance_due": 750.00,
      "due_date": "2024-01-15T00:00:00Z",
      "status": "partially_paid",
      "aging_bucket": "current",
      "invoice": {
        "invoice_number": "INV-2023-001",
        "invoice_date": "2023-12-15T00:00:00Z"
      }
    }
  ]
}
```

### 5. Generate AR Aging Report

**GET** `/api/accounts-receivable/aging-report`

Generates an aging report for accounts receivable.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customer_id` | integer | No | Generate report for specific customer only |

#### Response

```json
{
  "data": {
    "generated_at": "2024-01-20T10:00:00Z",
    "summary": {
      "total_customers": 25,
      "current": 15000.00,
      "days_1_to_30": 8500.00,
      "days_31_to_60": 3200.00,
      "days_61_to_90": 1800.00,
      "over_90_days": 2500.00,
      "total_balance": 31000.00
    },
    "items": [
      {
        "customer_id": 456,
        "customer_name": "Acme Corporation",
        "customer_code": "CUST001",
        "currency_code": "USD",
        "current": 1750.00,
        "days_1_to_30": 500.00,
        "days_31_to_60": 0.00,
        "days_61_to_90": 0.00,
        "over_90_days": 0.00,
        "total_balance": 2250.00
      }
    ]
  }
}
```

### 6. Update Aging Buckets

**POST** `/api/accounts-receivable/update-aging`

Updates the aging buckets for all AR records based on current dates.

#### Response

```json
{
  "message": "Aging buckets updated successfully"
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "error": "Error message",
  "details": "Detailed error information (optional)"
}
```

### Common HTTP Status Codes

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Data Models

### AR Status Values

- `open`: Invoice is open and unpaid
- `partially_paid`: Invoice has been partially paid
- `paid`: Invoice is fully paid
- `overdue`: Invoice is past due date
- `disputed`: Invoice amount is being disputed
- `written_off`: Invoice has been written off

### Aging Buckets

- `current`: Due date is today or in the future
- `1-30_days`: Due date is 1-30 days past
- `31-60_days`: Due date is 31-60 days past
- `61-90_days`: Due date is 61-90 days past
- `over_90_days`: Due date is more than 90 days past

## Performance Optimizations

The following database indexes have been created for optimal query performance:

- Customer + Status queries
- Due date + Status queries
- Balance-based filtering
- Aging bucket calculations
- Outstanding AR retrieval
- Customer balance calculations

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Rate Limiting

Standard API rate limiting applies to all endpoints. High-volume integrations should implement appropriate caching strategies.

## Usage Examples

### Get all open invoices for a customer

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/accounts-receivable?customer_id=456&status=open"
```

### Get detailed customer balance

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/customers/456/balance?detailed=true"
```

### Generate aging report

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/accounts-receivable/aging-report"
```

### Update aging buckets (scheduled maintenance)

```bash
curl -X POST -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/accounts-receivable/update-aging"
```