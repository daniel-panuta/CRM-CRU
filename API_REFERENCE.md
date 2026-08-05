# API Reference - CRMContacte

Complete API endpoint documentation with request/response examples.

## Base URL
```
http://localhost:8000
```

## Authentication
All endpoints except `/auth/*` require JWT token in header:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### GET /auth/me
Get current authenticated user.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### POST /auth/reset-request
Request password reset (email sending not implemented yet).

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "If email exists, password reset link will be sent"
}
```

---

## Contact Endpoints

### GET /contacts
List all contacts (shared across all users).

**Query Parameters:**
- `search` (optional): Search term (OR across name, firstname, phones, social)

**Example:**
```
GET /contacts?search=john
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Doe",
    "firstname": "John",
    "tel1": "+1-555-0101",
    "tel2": "+1-555-0102",
    "tel3": null,
    "social1": "https://twitter.com/johndoe",
    "social2": "https://linkedin.com/in/johndoe",
    "social3": null,
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "history": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "contact_id": "550e8400-e29b-41d4-a716-446655440001",
        "added_by": "550e8400-e29b-41d4-a716-446655440000",
        "added_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
]
```

### POST /contacts
Create a new contact.

**Request:**
```json
{
  "name": "Smith",
  "firstname": "Jane",
  "tel1": "+1-555-0201",
  "tel2": null,
  "tel3": null,
  "social1": "https://facebook.com/janesmith",
  "social2": "https://instagram.com/janesmith",
  "social3": null
}
```

**Validation:**
- At least `name` OR `firstname` required
- At least one of `tel1`, `tel2`, `tel3` required
- Social URLs are optional

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "name": "Smith",
  "firstname": "Jane",
  "tel1": "+1-555-0201",
  "tel2": null,
  "tel3": null,
  "social1": "https://facebook.com/janesmith",
  "social2": "https://instagram.com/janesmith",
  "social3": null,
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:35:00Z",
  "updated_at": "2024-01-15T10:35:00Z",
  "history": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "contact_id": "550e8400-e29b-41d4-a716-446655440003",
      "added_by": "550e8400-e29b-41d4-a716-446655440000",
      "added_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### GET /contacts/{contact_id}
Get a specific contact with full history.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Doe",
  "firstname": "John",
  "tel1": "+1-555-0101",
  "tel2": "+1-555-0102",
  "tel3": null,
  "social1": "https://twitter.com/johndoe",
  "social2": "https://linkedin.com/in/johndoe",
  "social3": null,
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "history": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "contact_id": "550e8400-e29b-41d4-a716-446655440001",
      "added_by": "550e8400-e29b-41d4-a716-446655440000",
      "added_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### PATCH /contacts/{contact_id}
Update a contact (all fields optional).

**Request:**
```json
{
  "tel2": "+1-555-0999"
}
```

**Response (200):**
Same as GET /contacts/{contact_id}

### DELETE /contacts/{contact_id}
Delete a contact and its history.

**Response (200):**
```json
{
  "message": "Contact deleted"
}
```

---

## User/Profile Endpoints

### GET /contacts/profile
Get current user's profile with contact count.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z",
  "personal_contacts_count": 5
}
```

### GET /contacts/profile/contacts
Get contacts created by current user.

**Query Parameters:**
- `search` (optional): Search in user's contacts only

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Smith",
    "firstname": "Jane",
    "tel1": "+1-555-0201",
    "tel2": null,
    "tel3": null,
    "social1": "https://facebook.com/janesmith",
    "social2": "https://instagram.com/janesmith",
    "social3": null,
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:35:00Z",
    "updated_at": "2024-01-15T10:35:00Z",
    "history": [...]
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Either name or firstname is required"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Contact not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

Current setup allows unlimited requests. To add rate limiting:

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/contacts")
@limiter.limit("100/minute")
async def get_contacts(...):
    ...
```

---

## Search Examples

Search across all contact fields using OR logic:

```bash
# Search by name
GET /contacts?search=john

# Search by phone
GET /contacts?search=555-0101

# Search by social URL
GET /contacts?search=twitter

# Case-insensitive, partial match
GET /contacts?search=smith
```

---

## Pagination

Currently not implemented (loads all results). To add:

```python
@app.get("/contacts")
async def get_contacts(skip: int = 0, limit: int = 10):
    # Add OFFSET and LIMIT to SQL query
```

---

## Timestamps

All timestamps are in ISO 8601 format with timezone:
```
2024-01-15T10:30:00Z
```

To sort results, use `DESC` on `created_at`:
```sql
ORDER BY created_at DESC
```

---

## Testing with cURL

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}' \
  | jq -r '.access_token')

curl -X GET http://localhost:8000/contacts \
  -H "Authorization: Bearer $TOKEN"
```

---

## Documentation

Interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Visit and test all endpoints directly!
