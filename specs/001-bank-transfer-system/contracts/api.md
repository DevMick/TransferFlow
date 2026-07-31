# API Contract: Bank Transfer Management System

**Feature**: Bank Transfer Management System  
**Date**: 2026-07-22  
**Version**: 1.0  
**Status**: Complete

## Overview

This document defines the REST API contracts for the Bank Transfer Management System. The API follows RESTful conventions and uses JSON for request/response bodies. All endpoints require authentication except for registration and login.

## Base URL

```
/api/v1
```

## Authentication

### Authentication Method

JWT (JSON Web Tokens) with Bearer authentication.

### Headers

```
Authorization: Bearer <access_token>
```

### Token Endpoints

#### POST /auth/register

Register a new user account.

**Request Body**:
```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, letters + digits)",
  "fullName": "string (1-100 chars)"
}
```

**Response (201)**:
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "fullName": "string"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
```

**Error (400)**: Invalid input data
**Error (409)**: Username or email already exists

#### POST /auth/login

Authenticate a user and receive tokens.

**Request Body**:
```json
{
  "identifier": "string (username or email)",
  "password": "string"
}
```

**Response (200)**:
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "fullName": "string"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
```

**Error (401)**: Invalid credentials

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Response (200)**:
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

**Error (401)**: Invalid or expired refresh token

#### POST /auth/logout

Invalidate refresh token.

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Response (204)**: No content

#### POST /auth/reset-password

Request password reset via email.

**Request Body**:
```json
{
  "email": "string"
}
```

**Response (200)**:
```json
{
  "message": "Password reset email sent"
}
```

#### POST /auth/confirm-reset

Confirm password reset with token.

**Request Body**:
```json
{
  "token": "string",
  "newPassword": "string (min 8 chars, letters + digits)"
}
```

**Response (200)**:
```json
{
  "message": "Password reset successful"
}
```

## User Endpoints

#### GET /users/me

Get current user profile.

**Response (200)**:
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "fullName": "string",
  "createdAt": "ISO8601 timestamp",
  "lastLoginAt": "ISO8601 timestamp or null"
}
```

#### PUT /users/me

Update current user profile.

**Request Body**:
```json
{
  "fullName": "string (1-100 chars)",
  "email": "string (valid email)"
}
```

**Response (200)**:
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "fullName": "string",
  "createdAt": "ISO8601 timestamp",
  "lastLoginAt": "ISO8601 timestamp or null"
}
```

#### PUT /users/me/password

Change current user password.

**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 chars, letters + digits)"
}
```

**Response (204)**: No content

**Error (401)**: Current password incorrect

## Transfer Endpoints

#### GET /transfers

Get user's transfer history with filtering and pagination.

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `search`: string (search across name, email, IBAN, reference)
- `status`: 'initiated' | 'rejected' | 'all' (default: 'all')
- `period`: 'all' | '7d' | '30d' | '90d' | '1y' (default: 'all')
- `dateFrom`: ISO8601 date (custom period start)
- `dateTo`: ISO8601 date (custom period end)
- `bank`: string (bank name filter)
- `currency`: string[] (array of currency codes)
- `amountMin`: number (minimum amount)
- `amountMax`: number (maximum amount)

**Response (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "beneficiaryName": "string",
      "beneficiaryEmail": "string",
      "iban": "string (masked: ****XXXX****XXXX)",
      "bankName": "string",
      "amount": "number",
      "currency": "string",
      "reference": "string or null",
      "status": "initiated | rejected",
      "createdAt": "ISO8601 timestamp",
      "rejectedAt": "ISO8601 timestamp or null",
      "rejectionReason": "string or null"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### POST /transfers

Create a new transfer.

**Request Body**:
```json
{
  "beneficiaryName": "string (1-100 chars)",
  "beneficiaryEmail": "string (valid email)",
  "iban": "string (valid IBAN)",
  "bankName": "string",
  "amount": "number (> 0)",
  "currency": "string (supported currency code)",
  "reference": "string (optional, max 500 chars)"
}
```

**Response (201)**:
```json
{
  "id": "uuid",
  "beneficiaryName": "string",
  "beneficiaryEmail": "string",
  "iban": "string",
  "bankName": "string",
  "amount": "number",
  "currency": "string",
  "reference": "string or null",
  "status": "initiated",
  "createdAt": "ISO8601 timestamp"
}
```

**Error (400)**: Validation error (invalid IBAN, email, amount, etc.)
**Error (422)**: Unprocessable entity (business logic validation)

#### GET /transfers/:id

Get transfer details by ID.

**Response (200)**:
```json
{
  "id": "uuid",
  "beneficiaryName": "string",
  "beneficiaryEmail": "string",
  "iban": "string",
  "bankName": "string",
  "amount": "number",
  "currency": "string",
  "reference": "string or null",
  "status": "initiated | rejected",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp",
  "rejectedAt": "ISO8601 timestamp or null",
  "rejectionReason": "string or null"
}
```

**Error (404)**: Transfer not found or access denied

#### PUT /transfers/:id/reject

Reject a transfer.

**Request Body**:
```json
{
  "reason": "string (optional)"
}
```

**Response (200)**:
```json
{
  "id": "uuid",
  "status": "rejected",
  "rejectedAt": "ISO8601 timestamp",
  "rejectionReason": "string or null"
}
```

**Error (404)**: Transfer not found
**Error (400)**: Transfer already rejected

#### PUT /transfers/:id/reset

Reset transfer status from rejected to initiated.

**Response (200)**:
```json
{
  "id": "uuid",
  "status": "initiated",
  "rejectedAt": null,
  "rejectionReason": null
}
```

**Error (404)**: Transfer not found
**Error (400)**: Transfer not in rejected status

#### DELETE /transfers/:id

Delete a transfer (optional feature).

**Response (204)**: No content

**Error (404)**: Transfer not found

## PDF Endpoints

#### GET /transfers/:id/pdf/initiation

Download PDF document for initiated transfer.

**Response (200)**: PDF file (application/pdf)
**Response (404)**: Transfer not found or not in initiated status

#### GET /transfers/:id/pdf/rejection

Download PDF document for rejected transfer.

**Response (200)**: PDF file (application/pdf)
**Response (404)**: Transfer not found or not in rejected status

## Dashboard Endpoints

#### GET /dashboard

Get dashboard statistics and recent transfers.

**Response (200)**:
```json
{
  "statistics": {
    "transfersInitiated": 45,
    "transfersRejected": 3,
    "totalTransfers": 48,
    "totalAmountProcessed": 125000.50,
    "monthlyTransfers": 12,
    "monthlyAmount": 35000.00
  },
  "recentTransfers": [
    {
      "id": "uuid",
      "beneficiaryName": "string",
      "amount": "number",
      "currency": "string",
      "status": "initiated | rejected",
      "createdAt": "ISO8601 timestamp"
    }
  ]
}
```

## Statistics Endpoints

#### GET /statistics

Get detailed statistics and analytics.

**Query Parameters**:
- `period`: 'all' | '7d' | '30d' | '90d' | '1y' (default: '30d')

**Response (200)**:
```json
{
  "byMonth": [
    {
      "month": "2026-01",
      "count": 15,
      "amount": 45000.00
    }
  ],
  "byStatus": [
    {
      "status": "initiated",
      "count": 45,
      "percentage": 93.75
    },
    {
      "status": "rejected",
      "count": 3,
      "percentage": 6.25
    }
  ],
  "byBank": [
    {
      "bankName": "BNP Paribas",
      "count": 20,
      "amount": 60000.00,
      "averageAmount": 3000.00
    }
  ],
  "byCurrency": [
    {
      "currency": "EUR",
      "count": 40,
      "amount": 100000.00
    }
  ],
  "topBeneficiaries": [
    {
      "beneficiaryName": "Jean Dupont",
      "count": 5,
      "amount": 15000.00
    }
  ],
  "rejectionRate": 6.25
}
```

## Export Endpoints

#### GET /transfers/export/csv

Export filtered transfers as CSV.

**Query Parameters**: Same as GET /transfers

**Response (200)**: CSV file (text/csv)

#### GET /transfers/export/excel

Export filtered transfers as Excel.

**Query Parameters**: Same as GET /transfers

**Response (200)**: Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

#### GET /transfers/export/pdf

Export filtered transfers as PDF.

**Query Parameters**: Same as GET /transfers

**Response (200)**: PDF file (application/pdf)

## Reference Data Endpoints

#### GET /banks

Get list of available banks.

**Response (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "country": "string"
    }
  ]
}
```

#### GET /currencies

Get list of available currencies.

**Response (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "string",
      "name": "string",
      "symbol": "string",
      "isActive": true
    }
  ]
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Authentication required or invalid
- `FORBIDDEN`: Access denied to resource
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `CONFLICT`: Resource conflict (e.g., duplicate)
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `204 No Content`: Successful request with no response body
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Business logic validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

## Rate Limiting

- Authentication endpoints: 10 requests per minute per IP
- API endpoints: 100 requests per minute per user
- Export endpoints: 5 requests per minute per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

## Pagination

All list endpoints support pagination using `page` and `limit` query parameters.

Default: `page=1`, `limit=20`
Maximum: `limit=100`

Pagination response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Data Types

- `uuid`: String in UUID format (e.g., "550e8400-e29b-41d4-a716-446655440000")
- `ISO8601 timestamp`: String in ISO 8601 format (e.g., "2026-07-22T14:30:00Z")
- `number`: Numeric value (integer or decimal)
- `boolean`: true or false
- `string`: Text string
- `enum`: One of the specified string values

## Security Considerations

1. **HTTPS Only**: All API calls must use HTTPS in production
2. **Input Validation**: All inputs are validated before processing
3. **SQL Injection Prevention**: Parameterized queries via Prisma ORM
4. **XSS Prevention**: Output encoding and Content Security Policy
5. **CSRF Protection**: CSRF tokens for state-changing operations
6. **IBAN Masking**: IBANs are masked in list responses, full IBAN only in detail views
7. **Password Security**: Passwords are never returned in API responses
8. **Rate Limiting**: Prevents brute-force attacks and API abuse
