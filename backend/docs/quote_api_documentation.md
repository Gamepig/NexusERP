# Quote Management API Documentation

## Overview

The Quote Management API provides endpoints for creating, managing, and converting sales quotes to sales orders. This implements the Quote-to-Order process as specified in PRD 3.5.3.

## Base URL

```
/api/quotes
```

All endpoints require authentication via Bearer token.

## Endpoints

### 1. Create Quote

**POST** `/api/quotes`

Creates a new sales quote.

#### Request Body

```json
{
  "customer_id": 1,
  "business_unit_id": 1,
  "quote_date": "2025-07-19T10:00:00Z",
  "expiry_date": "2025-08-19T10:00:00Z",
  "currency_id": 1,
  "notes": "Special pricing for bulk order",
  "terms_and_conditions": "Standard terms apply",
  "items": [
    {
      "product_id": 1,
      "quantity": 10,
      "unit_price": 100.00,
      "description": "Premium widget"
    }
  ]
}
```

#### Response (201 Created)

```json
{
  "message": "Quote created successfully",
  "quote": {
    "id": 1,
    "quote_number": "QT2025000001",
    "customer_id": 1,
    "status": "draft",
    "quote_date": "2025-07-19T10:00:00Z",
    "expiry_date": "2025-08-19T10:00:00Z",
    "total_amount": 1000.00,
    "notes": "Special pricing for bulk order",
    "terms_and_conditions": "Standard terms apply",
    "customer": {
      "id": 1,
      "name": "Acme Corp"
    },
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 10,
        "unit_price": 100.00,
        "total_price": 1000.00,
        "description": "Premium widget",
        "product": {
          "id": 1,
          "name": "Premium Widget"
        }
      }
    ],
    "created_at": "2025-07-19T10:00:00Z",
    "updated_at": "2025-07-19T10:00:00Z"
  }
}
```

### 2. Get Quote

**GET** `/api/quotes/{id}`

Retrieves a specific quote by ID.

#### Response (200 OK)

```json
{
  "quote": {
    "id": 1,
    "quote_number": "QT2025000001",
    "customer_id": 1,
    "status": "draft",
    "total_amount": 1000.00,
    "customer": {...},
    "items": [...],
    "created_at": "2025-07-19T10:00:00Z",
    "updated_at": "2025-07-19T10:00:00Z"
  }
}
```

### 3. Update Quote

**PUT** `/api/quotes/{id}`

Updates an existing quote. Converted quotes cannot be updated.

#### Request Body

```json
{
  "status": "pending",
  "notes": "Updated pricing",
  "items": [
    {
      "product_id": 1,
      "quantity": 15,
      "unit_price": 95.00,
      "description": "Premium widget - bulk discount"
    }
  ]
}
```

#### Response (200 OK)

```json
{
  "message": "Quote updated successfully",
  "quote": {...}
}
```

### 4. Delete Quote

**DELETE** `/api/quotes/{id}`

Deletes a quote. Converted quotes cannot be deleted.

#### Response (200 OK)

```json
{
  "message": "Quote deleted successfully"
}
```

### 5. List Quotes

**GET** `/api/quotes`

Retrieves a paginated list of quotes with filtering options.

#### Query Parameters

- `customer_id` (optional): Filter by customer ID
- `status` (optional): Filter by quote status
- `business_unit_id` (optional): Filter by business unit ID
- `date_from` (optional): Filter quotes from this date (YYYY-MM-DD)
- `date_to` (optional): Filter quotes to this date (YYYY-MM-DD)
- `expiry_from` (optional): Filter by expiry date from (YYYY-MM-DD)
- `expiry_to` (optional): Filter by expiry date to (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20, max: 100)
- `sort_by` (optional): Sort field (default: created_at)
- `sort_order` (optional): Sort order - asc/desc (default: desc)

#### Response (200 OK)

```json
{
  "quotes": [...],
  "total": 25,
  "page": 1,
  "page_size": 20,
  "total_pages": 2
}
```

### 6. Approve Quote

**POST** `/api/quotes/{id}/approve`

Approves a quote, changing its status to "approved".

#### Response (200 OK)

```json
{
  "message": "Quote approved successfully",
  "quote": {
    "id": 1,
    "status": "approved",
    ...
  }
}
```

### 7. Reject Quote

**POST** `/api/quotes/{id}/reject`

Rejects a quote, changing its status to "rejected".

#### Response (200 OK)

```json
{
  "message": "Quote rejected successfully",
  "quote": {
    "id": 1,
    "status": "rejected",
    ...
  }
}
```

### 8. Convert Quote to Sales Order

**POST** `/api/quotes/{id}/convert`

Converts an approved quote to a sales order. This is the core functionality of the Quote-to-Order process.

#### Request Body

```json
{
  "order_date": "2025-07-19T12:00:00Z",
  "notes": "Rush order requested"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "quote successfully converted to sales order",
  "sales_order_id": 123,
  "sales_order": {
    "id": 123,
    "order_number": "SO2025000045",
    "customer_id": 1,
    "status": "draft",
    "total_amount": 1000.00,
    "items": [...],
    "created_at": "2025-07-19T12:00:00Z"
  }
}
```

#### Conversion Rules

- Quote must have status "approved"
- Quote must not be expired
- Quote must not already be converted
- All quote items are copied to the sales order
- Quote status is updated to "converted"

## Quote Status Values

- `draft`: Initial status when quote is created
- `pending`: Quote is under review
- `approved`: Quote is approved and can be converted
- `rejected`: Quote has been rejected
- `expired`: Quote has passed its expiry date
- `converted`: Quote has been converted to sales order

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": "validation error details"
}
```

### 401 Unauthorized
```json
{
  "error": "User not authenticated"
}
```

### 404 Not Found
```json
{
  "error": "quote not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create quote",
  "details": "internal error details"
}
```

## Business Logic

### Quote Validation

1. Customer must exist and be active
2. All products must exist and be active
3. Business unit must exist if specified
4. Currency must be active if specified
5. Quantities must be positive
6. Unit prices must be non-negative

### Conversion Logic

1. Only approved quotes can be converted
2. Expired quotes cannot be converted
3. Already converted quotes cannot be converted again
4. Sales order inherits all quote data:
   - Customer information
   - Business unit
   - Currency
   - All line items with quantities and prices
   - Total amount

### Security

- All endpoints require authentication
- User context is passed to service layer
- Business unit access control (if implemented)
- Audit trail for all quote operations

## Integration Testing

Use the provided integration test script:

```bash
go run test_quote_integration.go
```

This tests the complete workflow:
1. Create quote
2. Update quote
3. Approve quote
4. Convert to sales order
5. Verify conversion

## Database Schema

Quotes are stored in two main tables:

- `quotes`: Main quote information
- `quote_items`: Line items for each quote

Both tables include audit fields (created_at, updated_at) and foreign key constraints to ensure data integrity.