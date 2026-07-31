# Complaint Webhook Implementation Guide

## Quick Start

### 1. What Was Created

The webhook system consists of:

- **API Endpoint**: `/app/api/webhook/complaint/route.ts`
- **Documentation**: `/WEBHOOK_COMPLAINT_API.md`
- **Sample Data**: `/__tests__/webhook-complaint-sample.json`
- **Test Script**: `/__tests__/webhook-complaint-test.js`

### 2. How It Works

```
External System (Complaint Source)
    ↓ Sends POST Request
    ↓
Webhook Endpoint (/api/webhook/complaint)
    ↓ Processes Each Complaint:
    ├─ Check/Create User by phone number
    ├─ Check/Create Category
    ├─ Check/Create Subcategory
    ├─ Parse Description (extract address)
    └─ Create Complaint in Database
    ↓ Returns Response
    ↓
Response (Created/Failed Counts)
```

## Setup Instructions

### Step 1: Ensure Database is Synced

```bash
npx prisma migrate dev
# or
npx prisma db push
```

### Step 2: Start Your Application

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application should be running on `http://localhost:3000`

### Step 3: Test the Webhook

#### Option A: Using the Test Script

```bash
node __tests__/webhook-complaint-test.js
```

This will run 4 tests:
1. ✓ Health check
2. ✓ Send multiple complaints
3. ✓ Validate error handling
4. ✓ Send single complaint

#### Option B: Using cURL

```bash
curl -X POST http://localhost:3000/api/webhook/complaint \
  -H "Content-Type: application/json" \
  -d @__tests__/webhook-complaint-sample.json
```

#### Option C: Using Postman

1. Open Postman
2. Create new POST request
3. URL: `http://localhost:3000/api/webhook/complaint`
4. Headers: `Content-Type: application/json`
5. Body: Copy content from `__tests__/webhook-complaint-sample.json`
6. Send

#### Option D: Using JavaScript

```javascript
const complaintData = {
  data: [{
    id: "145a3716-0cac-4e94-b1e4-40afd7e82f75",
    ticket_number: "INC-00005",
    customer_name: "Mudassir",
    customer_phone: "7666664545",
    category: "service_issue",
    subject: "No Electricity in Area",
    description: "Contact Number||7666664545||...",
    status: "open",
    priority: "high",
    // ... other fields
  }],
  total: 1,
  limit: 50,
  offset: 0
};

fetch('http://localhost:3000/api/webhook/complaint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(complaintData)
})
  .then(res => res.json())
  .then(data => console.log('Response:', data));
```

## Understanding the Response

### Success Response

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
    },
    // ... more complaints
  ]
}
```

### Partial Success Response

```json
{
  "success": true,
  "message": "Processed 3 complaints",
  "created": 2,
  "failed": 1,
  "createdComplaints": [
    // ... successfully created
  ],
  "errors": [
    {
      "ticketNumber": "INC-00003",
      "error": "Error message describing what went wrong"
    }
  ]
}
```

## Data Processing Flow

### 1. User Management

The webhook automatically creates users if they don't exist:

```javascript
// If user with this phone doesn't exist, create one
const user = await getOrCreateUser(
  "9988776606",  // customer_phone
  "Mudassir"     // customer_name
);

// Created user will have:
// - mobile: "9988776606" (unique)
// - name: "Mudassir"
// - role: CITIZEN
// - firstLoginComplete: false
```

### 2. Category & Subcategory Mapping

External categories are mapped to internal system:

```javascript
// Input: category = "service_issue"
// ↓
// Looks for category named "service_issue"
// If not found, creates it under "General" department
// ↓
// Then creates subcategory based on subject
```

### 3. Description Parsing

The pipe-separated (`||`) description is intelligently parsed:

```
Raw: "Contact Number||7666664545||Service Issue - Electricity||No electricity supply since 5 days||402/Karam Niwas, Near Garden, Punjabi Bagh||Gully 43||Punjabi Bagh||Rajouri Garden Constituency"

↓ Parsed into:

Address: "402/Karam Niwas, Near Garden, Punjabi Bagh, Gully 43, Punjabi Bagh, Rajouri Garden Constituency"

Description: "Contact Number | 7666664545 | Service Issue - Electricity | No electricity supply since 5 days | 402/Karam Niwas, Near Garden, Punjabi Bagh | Gully 43 | Punjabi Bagh | Rajouri Garden Constituency"
```

### 4. Priority Mapping

Priority levels are converted to numeric values:

```javascript
"urgent" → 1 (highest)
"high"   → 5
"medium" → 10
"low"    → 20 (lowest)
```

### 5. Complaint Creation

Final complaint created with:

```javascript
{
  userId: user.id,              // Linked to user
  categoryId: category.id,      // Linked to category
  subcategoryId: subcategory.id, // Linked to subcategory
  description: "parsed data",   // Extracted/parsed
  address: "parsed address",    // Extracted from description
  lat: 0,                       // Default
  lng: 0,                       // Default
  area: customer_name,          // Area/locality
  status: "PENDING",            // Initial status
  priority: 5,                  // Numeric priority
  affectedCitizensCount: 1      // Default 1
}
```

## Integration with External Systems

### Send Data from Your System

```python
# Python Example
import requests
import json

complaint_data = {
    "data": [
        {
            "id": "unique-id-123",
            "ticket_number": "INC-00001",
            "customer_name": "John Doe",
            "customer_phone": "1234567890",
            "category": "water_supply",
            "subject": "No water supply",
            "description": "Issue||Details||Address",
            "status": "open",
            "priority": "high",
            "preferred_resolution": None,
            "order_reference": None,
            "created_at": "2026-07-28T09:33:11.446Z",
            "updated_at": "2026-07-28T09:33:11.446Z"
        }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
}

response = requests.post(
    'http://your-domain.com/api/webhook/complaint',
    json=complaint_data,
    headers={'Content-Type': 'application/json'}
)

print(response.json())
```

### Scheduled Sync

```bash
# Run cron job every hour to sync complaints
0 * * * * curl -X POST http://your-domain.com/api/webhook/complaint \
  -H "Content-Type: application/json" \
  -d @complaints.json

# Or with error logging
0 * * * * curl -X POST http://your-domain.com/api/webhook/complaint \
  -H "Content-Type: application/json" \
  -d @complaints.json >> /var/log/webhook.log 2>&1
```

## Database Schema Reference

### User Table Fields

```prisma
model user {
  id: String (CUID)
  name: String?
  mobile: String @unique          // Key field for webhook
  role: ROLE @default(CITIZEN)
  address: String?
  // ... other fields
}
```

### Complaint Table Fields

```prisma
model complaint {
  id: Int @id @default(autoincrement())
  userId: String                  // Links to user
  categoryId: Int                 // Links to category
  subcategoryId: Int              // Links to subcategory
  description: String @db.LongText
  address: String?
  status: COMPLAINTSTATUS @default(PENDING)
  lat: Float                      // Default: 0
  lng: Float                      // Default: 0
  area: String?
  priority: Int
  // ... other fields
}
```

## Troubleshooting

### Issue: "User already exists with this email"

**Solution**: The webhook uses phone number, not email. Check if the phone number already exists in the database.

### Issue: "Category not found"

**Solution**: Webhook automatically creates missing categories under "General" department. Check the category was created in the admin panel.

### Issue: Endpoint returns 404

**Solution**: 
1. Verify Next.js server is running on http://localhost:3000
2. Check the route file exists at `app/api/webhook/complaint/route.ts`
3. Restart the dev server: `npm run dev`

### Issue: "Invalid JSON" error

**Solution**: Ensure the POST body is valid JSON and includes the `data` array with at least one complaint object.

### Issue: Database connection error

**Solution**:
1. Verify DATABASE_URL is set in .env.local
2. Run migrations: `npx prisma migrate dev`
3. Check database is accessible

### Issue: Endpoint takes too long / times out

**Solution**: 
- Processing multiple large complaints can take time
- Ensure database is optimized with proper indexes (already set in schema)
- Consider processing in batches

## Performance Considerations

### Batch Size Recommendations

- **Small batches**: 1-10 complaints (< 1 second)
- **Medium batches**: 10-100 complaints (1-5 seconds)
- **Large batches**: 100+ complaints (5-30 seconds)

### Optimization Tips

1. **Reuse connections**: Keep webhook URL alive between requests
2. **Batch requests**: Send multiple complaints in one request rather than individual requests
3. **Async processing**: For very large batches, consider adding a queue system
4. **Index optimization**: Verify database indexes are properly created

## Security Considerations

### For Production

Currently, the webhook has **no authentication**. For production, consider:

1. **API Key Authentication**
   ```typescript
   const apiKey = request.headers.get('x-api-key');
   if (apiKey !== process.env.WEBHOOK_SECRET_KEY) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

2. **IP Whitelisting**
   ```typescript
   const allowedIPs = process.env.WEBHOOK_ALLOWED_IPS?.split(',');
   const clientIP = request.headers.get('x-forwarded-for');
   ```

3. **Signature Verification**
   - Use HMAC to verify request is from trusted source

4. **Rate Limiting**
   - Implement rate limiting to prevent abuse

## Next Steps

1. ✅ Test webhook with sample data
2. ✅ Verify complaints are created in database
3. ⏭️ Set up authentication/security
4. ⏭️ Configure external system to send data
5. ⏭️ Set up monitoring and alerts
6. ⏭️ Add more detailed error logging
7. ⏭️ Implement automatic geocoding for lat/lng

## Support & Questions

For questions or issues, check:
- `WEBHOOK_COMPLAINT_API.md` - Detailed API documentation
- `__tests__/webhook-complaint-test.js` - Working examples
- Prisma schema in `prisma/schema.prisma` - Database structure
