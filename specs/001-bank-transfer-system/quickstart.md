# Quickstart Guide: Bank Transfer Management System

**Feature**: Bank Transfer Management System  
**Date**: 2026-07-22  
**Status**: Complete

## Overview

This guide provides runnable validation scenarios to verify the Bank Transfer Management System works end-to-end. It covers setup, testing core functionality, and validating key features.

## Prerequisites

### Software Requirements

- Node.js >= 22
- pnpm >= 10
- PostgreSQL >= 14
- Git

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd TransferFlow
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and other settings
```

4. Set up the database:
```bash
pnpm db:generate
pnpm db:migrate
```

5. Seed reference data (banks and currencies):
```bash
pnpm db:seed
```

6. Start the development server:
```bash
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api/v1

## Validation Scenarios

### Scenario 1: User Registration and Authentication

**Objective**: Verify users can register, login, and manage their account.

**Steps**:

1. **Register a new user**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "fullName": "Test User"
  }'
```

**Expected Response** (201):
```json
{
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

2. **Login with credentials**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "TestPass123"
  }'
```

**Expected Response** (200): Same as registration response

3. **Get user profile** (requires authentication):
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access-token>"
```

**Expected Response** (200):
```json
{
  "id": "uuid",
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "Test User",
  "createdAt": "2026-07-22T14:30:00Z",
  "lastLoginAt": "2026-07-22T14:35:00Z"
}
```

**Validation Criteria**:
- ✓ User can register with valid credentials
- ✓ User receives access and refresh tokens
- ✓ User can login with username or email
- ✓ User can access protected endpoints with valid token
- ✓ User profile data is correctly returned

---

### Scenario 2: Create and Initiate Transfer

**Objective**: Verify users can create transfers with proper validation.

**Steps**:

1. **Create a valid transfer**:
```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryName": "Jean Dupont",
    "beneficiaryEmail": "jean.dupont@example.com",
    "iban": "FR7630006000011234567890189",
    "bankName": "BNP Paribas",
    "amount": 1000.50,
    "currency": "EUR",
    "reference": "Invoice payment"
  }'
```

**Expected Response** (201):
```json
{
  "id": "uuid",
  "beneficiaryName": "Jean Dupont",
  "beneficiaryEmail": "jean.dupont@example.com",
  "iban": "FR7630006000011234567890189",
  "bankName": "BNP Paribas",
  "amount": 1000.50,
  "currency": "EUR",
  "reference": "Invoice payment",
  "status": "initiated",
  "createdAt": "2026-07-22T14:40:00Z"
}
```

2. **Test IBAN validation** (invalid IBAN):
```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryName": "Test",
    "beneficiaryEmail": "test@example.com",
    "iban": "INVALID_IBAN",
    "bankName": "Test Bank",
    "amount": 100.00,
    "currency": "EUR"
  }'
```

**Expected Response** (400):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid IBAN format",
    "details": {
      "field": "iban"
    }
  }
}
```

3. **Test email validation** (invalid email):
```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryName": "Test",
    "beneficiaryEmail": "invalid-email",
    "iban": "FR7630006000011234567890189",
    "bankName": "Test Bank",
    "amount": 100.00,
    "currency": "EUR"
  }'
```

**Expected Response** (400): Validation error for email field

4. **Test amount validation** (zero or negative):
```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryName": "Test",
    "beneficiaryEmail": "test@example.com",
    "iban": "FR7630006000011234567890189",
    "bankName": "Test Bank",
    "amount": 0,
    "currency": "EUR"
  }'
```

**Expected Response** (400): Validation error for amount field

**Validation Criteria**:
- ✓ Valid transfer is created with "initiated" status
- ✓ Transfer receives unique UUID
- ✓ Timestamp is automatically generated
- ✓ Invalid IBAN is rejected with clear error message
- ✓ Invalid email is rejected with clear error message
- ✓ Invalid amount is rejected with clear error message

---

### Scenario 3: Transfer History and Filtering

**Objective**: Verify users can view and filter their transfer history.

**Steps**:

1. **Create multiple test transfers** (repeat Scenario 2 with different data)

2. **Get all transfers**:
```bash
curl -X GET "http://localhost:3000/api/v1/transfers?page=1&limit=20" \
  -H "Authorization: Bearer <access-token>"
```

**Expected Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "beneficiaryName": "Jean Dupont",
      "beneficiaryEmail": "jean.dupont@example.com",
      "iban": "****7890****",
      "bankName": "BNP Paribas",
      "amount": 1000.50,
      "currency": "EUR",
      "reference": "Invoice payment",
      "status": "initiated",
      "createdAt": "2026-07-22T14:40:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

3. **Filter by status**:
```bash
curl -X GET "http://localhost:3000/api/v1/transfers?status=initiated" \
  -H "Authorization: Bearer <access-token>"
```

**Expected Response** (200): Only initiated transfers returned

4. **Filter by bank**:
```bash
curl -X GET "http://localhost:3000/api/v1/transfers?bank=BNP%20Paribas" \
  -H "Authorization: Bearer <access-token>"
```

**Expected Response** (200): Only transfers to BNP Paribas

5. **Filter by date range**:
```bash
curl -X GET "http://localhost:3000/api/v1/transfers?dateFrom=2026-07-01&dateTo=2026-07-31" \
  -H "Authorization: Bearer <access-token>"
```

**Expected Response** (200): Only transfers in date range

6. **Search by beneficiary name**:
```bash
curl -X GET "http://localhost:3000/api/v1/transfers?search=Jean" \
  -H "Authorization: Bearer <access-token>"
```

**Expected Response** (200): Only transfers matching search term

**Validation Criteria**:
- ✓ Transfers are returned with pagination
- ✓ IBAN is masked in list views (****XXXX****)
- ✓ Status filter works correctly
- ✓ Bank filter works correctly
- ✓ Date range filter works correctly
- ✓ Search works across name, email, IBAN, reference
- ✓ Pagination metadata is accurate

---

### Scenario 4: Transfer Status Management

**Objective**: Verify users can reject and reset transfer status.

**Steps**:

1. **Reject a transfer**:
```bash
curl -X PUT http://localhost:3000/api/v1/transfers/<transfer-id>/reject \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Incorrect beneficiary information"
  }'
```

**Expected Response** (200):
```json
{
  "id": "uuid",
  "status": "rejected",
  "rejectedAt": "2026-07-22T14:45:00Z",
  "rejectionReason": "Incorrect beneficiary information"
}
```

2. **Reset transfer status**:
```bash
curl -X PUT http://localhost:3000/api/v1/transfers/<transfer-id>/reset \
  -H "Authorization: Bearer <access-token>"
```

**Expected Response** (200):
```json
{
  "id": "uuid",
  "status": "initiated",
  "rejectedAt": null,
  "rejectionReason": null
}
```

**Validation Criteria**:
- ✓ Transfer status changes to "rejected" with timestamp
- ✓ Rejection reason is saved when provided
- ✓ Transfer status can be reset to "initiated"
- ✓ Rejection timestamp and reason are cleared on reset

---

### Scenario 5: PDF Generation

**Objective**: Verify PDF documents can be generated for transfers.

**Steps**:

1. **Generate initiation PDF**:
```bash
curl -X GET http://localhost:3000/api/v1/transfers/<transfer-id>/pdf/initiation \
  -H "Authorization: Bearer <access-token>" \
  -o initiation.pdf
```

**Expected Response** (200): PDF file downloaded

2. **Generate rejection PDF** (after rejecting a transfer):
```bash
curl -X GET http://localhost:3000/api/v1/transfers/<transfer-id>/pdf/rejection \
  -H "Authorization: Bearer <access-token>" \
  -o rejection.pdf
```

**Expected Response** (200): PDF file downloaded

3. **Verify PDF content**:
- Open the PDF files
- Check for beneficiary information
- Check for IBAN (full, not masked)
- Check for amount and currency
- Check for appropriate watermark ("INITIÉ" or "REJETÉ")

**Validation Criteria**:
- ✓ Initiation PDF is generated successfully
- ✓ Rejection PDF is generated successfully
- ✓ PDFs contain correct transfer details
- ✓ PDFs have appropriate watermarks
- ✓ PDFs are downloadable files

---

### Scenario 6: Dashboard Statistics

**Objective**: Verify dashboard displays accurate statistics.

**Steps**:

1. **Get dashboard data**:
```bash
curl -X GET http://localhost:3000/api/v1/dashboard \
  -H "Authorization: Bearer <access-token>"
```

**Expected Response** (200):
```json
{
  "statistics": {
    "transfersInitiated": 4,
    "transfersRejected": 1,
    "totalTransfers": 5,
    "totalAmountProcessed": 5000.00,
    "monthlyTransfers": 5,
    "monthlyAmount": 5000.00
  },
  "recentTransfers": [
    {
      "id": "uuid",
      "beneficiaryName": "Jean Dupont",
      "amount": 1000.50,
      "currency": "EUR",
      "status": "initiated",
      "createdAt": "2026-07-22T14:40:00Z"
    }
  ]
}
```

**Validation Criteria**:
- ✓ Statistics are accurate based on created transfers
- ✓ Recent transfers are displayed (max 5)
- ✓ Amount calculations are correct
- ✓ Status counts are correct

---

### Scenario 7: Export Functionality

**Objective**: Verify transfer data can be exported in multiple formats.

**Steps**:

1. **Export as CSV**:
```bash
curl -X GET "http://localhost:3000/api/v1/transfers/export/csv?status=initiated" \
  -H "Authorization: Bearer <access-token>" \
  -o transfers.csv
```

**Expected Response** (200): CSV file downloaded

2. **Export as Excel**:
```bash
curl -X GET "http://localhost:3000/api/v1/transfers/export/excel?status=initiated" \
  -H "Authorization: Bearer <access-token>" \
  -o transfers.xlsx
```

**Expected Response** (200): Excel file downloaded

3. **Export as PDF**:
```bash
curl -X GET "http://localhost:3000/api/v1/transfers/export/pdf?status=initiated" \
  -H "Authorization: Bearer <access-token>" \
  -o transfers.pdf
```

**Expected Response** (200): PDF file downloaded

4. **Verify export content**:
- Open CSV file in spreadsheet application
- Open Excel file
- Open PDF file
- Verify data matches filtered transfers

**Validation Criteria**:
- ✓ CSV export works and contains correct data
- ✓ Excel export works and contains correct data
- ✓ PDF export works and contains correct data
- ✓ Filters are applied to exported data
- ✓ All formats are downloadable files

---

### Scenario 8: Statistics and Analytics

**Objective**: Verify detailed statistics are calculated correctly.

**Steps**:

1. **Get detailed statistics**:
```bash
curl -X GET "http://localhost:3000/api/v1/statistics?period=30d" \
  -H "Authorization: Bearer <access-token>"
```

**Expected Response** (200):
```json
{
  "byMonth": [
    {
      "month": "2026-07",
      "count": 5,
      "amount": 5000.00
    }
  ],
  "byStatus": [
    {
      "status": "initiated",
      "count": 4,
      "percentage": 80.0
    },
    {
      "status": "rejected",
      "count": 1,
      "percentage": 20.0
    }
  ],
  "byBank": [
    {
      "bankName": "BNP Paribas",
      "count": 3,
      "amount": 3000.00,
      "averageAmount": 1000.00
    }
  ],
  "byCurrency": [
    {
      "currency": "EUR",
      "count": 5,
      "amount": 5000.00
    }
  ],
  "topBeneficiaries": [
    {
      "beneficiaryName": "Jean Dupont",
      "count": 2,
      "amount": 2000.00
    }
  ],
  "rejectionRate": 20.0
}
```

**Validation Criteria**:
- ✓ Monthly breakdown is accurate
- ✓ Status distribution is accurate
- ✓ Bank breakdown is accurate
- ✓ Currency breakdown is accurate
- ✓ Top beneficiaries are correctly ranked
- ✓ Rejection rate is calculated correctly

---

## UI Validation (Browser Testing)

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Application running at http://localhost:3000

### UI Test Scenarios

1. **Registration Flow**:
   - Navigate to registration page
   - Fill in valid credentials
   - Submit form
   - Verify redirect to dashboard

2. **Login Flow**:
   - Navigate to login page
   - Enter credentials
   - Submit form
   - Verify redirect to dashboard

3. **Create Transfer Flow**:
   - Navigate to "New Transfer" page
   - Fill in transfer details
   - Verify real-time validation (IBAN, email, amount)
   - Submit form
   - Verify redirect to history page

4. **Transfer History Flow**:
   - Navigate to history page
   - Verify pagination works
   - Apply filters (status, bank, date)
   - Verify search functionality
   - Test export buttons

5. **Dashboard Flow**:
   - Navigate to dashboard
   - Verify statistics display
   - Verify recent transfers list
   - Verify quick action buttons

6. **Statistics Flow**:
   - Navigate to statistics page
   - Verify charts render correctly
   - Verify data accuracy
   - Test period filters

## Performance Validation

### Load Testing

Use a tool like Apache Bench or k6 to test performance:

```bash
# Test transfer creation endpoint
ab -n 1000 -c 10 -p transfer.json -T application/json \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/transfers
```

**Expected Results**:
- Transfer creation: < 2s average response time
- Transfer search: < 1s average response time
- PDF generation: < 3s average response time
- Support 10,000 concurrent transfers without degradation

## Security Validation

### Security Tests

1. **Authentication Test**:
   - Try accessing protected endpoint without token → 401 error
   - Try using expired token → 401 error
   - Try using invalid token → 401 error

2. **Authorization Test**:
   - User A tries to access User B's transfers → 403 error
   - User A tries to modify User B's transfer → 403 error

3. **Input Validation Test**:
   - Try SQL injection in search field → sanitized/rejected
   - Try XSS in beneficiary name → sanitized
   - Try invalid IBAN format → validation error

4. **Rate Limiting Test**:
   - Make 11 requests in 1 minute to auth endpoint → 429 error
   - Verify rate limit headers are present

## Cleanup

After testing, clean up test data:

```bash
# Drop test database
pnpm db:reset

# Or manually delete test user and transfers via API
```

## Troubleshooting

### Common Issues

**Database Connection Error**:
- Verify PostgreSQL is running
- Check .env database credentials
- Ensure database exists

**Migration Errors**:
- Run `pnpm db:generate` to sync Prisma schema
- Run `pnpm db:migrate` to apply migrations

**Authentication Errors**:
- Verify JWT secret is set in .env
- Check token expiration time
- Ensure refresh token storage is working

**PDF Generation Errors**:
- Verify PDF library dependencies are installed
- Check file system permissions for temp directory

## Next Steps

After successful validation:
1. Review [API Contract](contracts/api.md) for full API documentation
2. Review [Data Model](data-model.md) for database schema details
3. Proceed to `/speckit-tasks` to generate implementation tasks
4. Begin implementation following the generated task list
