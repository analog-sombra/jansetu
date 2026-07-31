# Complaint Webhook API Documentation

## Overview

The Complaint Webhook API (`/api/webhook/complaint`) receives complaint data from external systems and automatically creates complaints in the database, including user management and category mapping.

## Endpoint

- **URL**: `/api/webhook/complaint`
- **Method**: `POST`
- **Content-Type**: `application/json`

## Request Format

```json
{
  "data": [
    {
      "id": "145a3716-0cac-4e94-b1e4-40afd7e82f75",
      "ticket_number": "INC-00005",
      "customer_name": "Mudassir",
      "customer_phone": "7666664545",
      "category": "service_issue",
      "subject": "No Electricity in Area",
      "description": "Contact Number||7666664545||Service Issue - Electricity||No electricity supply since 5 days||402/Karam Niwas, Near Garden, Punjabi Bagh||Gully 43||Punjabi Bagh||Rajouri Garden Constituency",
      "status": "open",
      "priority": "high",
      "preferred_resolution": null,
      "order_reference": null,
      "created_at": "2026-07-28T09:33:11.446Z",
      "updated_at": "2026-07-28T09:33:11.446Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

## Response Format

### Success Response (201)

```json
{
  "success": true,
  "message": "Processed 3 complaints",
  "created": 3,
  "failed": 0,
  "createdComplaints": [
    {
      "id": 1,
      "externalId": "145a3716-0cac-4e94-b1e4-40afd7e82f75",
      "ticketNumber": "INC-00005",
      "status": "created"
    }
  ]
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "Invalid payload format. Expected \"data\" array.",
  "errors": [
    {
      "ticketNumber": "INC-00005",
      "error": "Error message"
    }
  ]
}
```

## Features

### 1. User Management
- Checks if customer exists by phone number
- If user doesn't exist, creates new user with:
  - Role: CITIZEN (default)
  - Name: Customer name from complaint
  - Mobile: Customer phone number

### 2. Category & Subcategory Mapping
- Maps external category to internal categories
- Creates missing categories under "General" department
- Creates subcategories if they don't exist
- Uses complaint subject as subcategory name if needed

### 3. Description Parsing
- Parses pipe-separated (`||`) description data
- Automatically extracts address components
- Heuristics to identify location-related information
- Stores full parsed data for reference

### 4. Complaint Creation
- Creates complaint with status: `PENDING`
- Sets latitude/longitude to 0 (default)
- Parses priority levels: `urgent` (1), `high` (5), `medium` (10), `low` (20)
- Links complaint to user, category, and subcategory
- Sets affected citizens count to 1

## Testing

### Using cURL

```bash
curl -X POST http://localhost:3000/api/webhook/complaint \
  -H "Content-Type: application/json" \
  -d @complaint-data.json
```

### Using JavaScript/Fetch

```javascript
const complaintData = {
  data: [
    {
      id: "145a3716-0cac-4e94-b1e4-40afd7e82f75",
      ticket_number: "INC-00005",
      customer_name: "Mudassir",
      customer_phone: "7666664545",
      category: "service_issue",
      subject: "No Electricity in Area",
      description: "Contact Number||7666664545||Service Issue - Electricity||No electricity supply since 5 days||402/Karam Niwas, Near Garden, Punjabi Bagh||Gully 43||Punjabi Bagh||Rajouri Garden Constituency",
      status: "open",
      priority: "high",
      preferred_resolution: null,
      order_reference: null,
      created_at: "2026-07-28T09:33:11.446Z",
      updated_at: "2026-07-28T09:33:11.446Z"
    }
  ],
  total: 1,
  limit: 50,
  offset: 0
};

fetch('/api/webhook/complaint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(complaintData)
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Using Postman

1. Create new POST request
2. URL: `http://localhost:3000/api/webhook/complaint`
3. Headers: `Content-Type: application/json`
4. Body: (raw JSON with complaint data)
5. Send

## Health Check

```bash
GET /api/webhook/complaint
```

Returns endpoint status and usage information.

## Error Handling

The endpoint handles various error scenarios:

- **Invalid JSON**: Returns 400 with format error
- **Missing data array**: Returns 400 with validation error
- **Database errors**: Returns 500 with error details
- **Individual complaint errors**: Continues processing, reports errors in response

If one complaint fails, others continue to be processed. Check the `errors` array in response for specific failures.

## Data Flow

```
Incoming Webhook Data
    ↓
Parse & Validate Payload
    ↓
For Each Complaint:
    ├─ Get or Create User (by phone)
    ├─ Get or Create Category
    ├─ Get or Create Subcategory
    ├─ Parse Description (pipe-separated)
    └─ Create Complaint in Database
    ↓
Return Response with Created/Failed Count
```

## Field Mapping

| External Field | Internal Field | Notes |
| --- | --- | --- |
| `id` | External reference | Stored in response |
| `ticket_number` | External reference | For tracking |
| `customer_name` | user.name | Creates user if doesn't exist |
| `customer_phone` | user.mobile | Unique identifier for user |
| `category` | category.name | Creates if doesn't exist |
| `subject` | subcategory.name | Used as subcategory |
| `description` | complaint.description | Parsed and stored |
| `priority` | complaint.priority | Converted to numeric priority |
| `status` | Always PENDING | Internal status |

## Future Enhancements

- [ ] Webhook authentication/validation
- [ ] Rate limiting
- [ ] Batch processing optimization
- [ ] Automatic location geocoding (lat/lng)
- [ ] Email/SMS notifications on complaint creation
- [ ] Webhook signature verification
- [ ] Audit logging
