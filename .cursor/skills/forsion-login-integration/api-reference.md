# API Quick Reference

## Base Configuration

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001/auth';
```

## Authentication Endpoints

### POST /api/auth/login
**Purpose:** Username/email/phone + password login

**Request:**
```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "user_123456",
    "email": "user@example.com",
    "phone": "13800138000",
    "role": "USER",
    "status": "active"
  }
}
```

**Errors:**
- `400`: Missing required fields
- `401`: Invalid credentials
- `403`: Account inactive/banned

---

### POST /api/auth/login-sms
**Purpose:** Phone + verification code login (auto-registers if new)

**Request:**
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "phone_13800138000_1234567890",
    "phone": "13800138000",
    "phoneVerified": true,
    "role": "USER"
  }
}
```

**Errors:**
- `400`: Missing phone or code
- `401`: Invalid or expired code

---

### POST /api/auth/register
**Purpose:** Register new user (requires invite code)

**Request (Email):**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "invite_code": "INVITE123"
}
```

**Request (Phone):**
```json
{
  "phone": "13800138000",
  "password": "password123",
  "invite_code": "INVITE123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "user_123456",
    "email": "newuser@example.com",
    "role": "USER"
  }
}
```

**Errors:**
- `400`: Missing required fields or invalid invite code
- `409`: Email/phone already registered

---

### POST /api/auth/send-code
**Purpose:** Send SMS verification code

**Request:**
```json
{
  "target": "13800138000",
  "type": "phone",
  "purpose": "login"
}
```

**Purpose values:**
- `register`: Registration verification
- `login`: Verification code login
- `reset_password`: Password reset
- `bind`: Bind phone number

**Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

**Errors:**
- `400`: Invalid phone format
- `429`: "Please wait before requesting another code" (60s cooldown)

**Rate Limits:**
- 60 seconds between requests for same phone + purpose
- Code valid for 5 minutes
- Code can only be used once

---

### POST /api/auth/reset-password
**Purpose:** Reset password via SMS verification

**Request:**
```json
{
  "phone": "13800138000",
  "code": "123456",
  "newPassword": "newPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Errors:**
- `400`: Missing fields or password too short
- `401`: Invalid or expired code
- `404`: Phone number not registered

---

### GET /api/auth/me
**Purpose:** Get current user information

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "username": "user_123456",
  "email": "user@example.com",
  "phone": "13800138000",
  "phoneVerified": false,
  "emailVerified": false,
  "registerType": "email",
  "role": "USER",
  "status": "active",
  "avatar": "https://...",
  "nickname": "User Nickname",
  "lastLoginAt": "2026-01-12T10:00:00.000Z",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**Errors:**
- `401`: Invalid or expired token

---

### PUT /api/auth/password
**Purpose:** Change password (requires old password)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "oldPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

**Errors:**
- `400`: Missing fields or password too short
- `401`: Invalid old password or token

---

## User Data Fields

### User Object Structure

```typescript
interface User {
  id: string;                    // UUID
  username: string;              // Unique username
  email?: string;                // Email (nullable)
  phone?: string;                // Phone number (nullable)
  phoneVerified: boolean;        // Phone verification status
  emailVerified: boolean;        // Email verification status
  registerType: 'username' | 'email' | 'phone';  // How user registered
  role: 'USER' | 'ADMIN';        // User role
  status: 'active' | 'inactive' | 'banned';  // Account status
  avatar?: string;               // Avatar URL (nullable)
  nickname?: string;             // Display nickname (nullable)
  lastLoginAt?: string;          // Last login timestamp
  createdAt: string;             // Account creation timestamp
  updatedAt: string;             // Last update timestamp
}
```

---

## Token Management

### JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;      // User ID
  username: string;    // Username
  role: 'USER' | 'ADMIN';  // User role
  iat: number;         // Issued at (timestamp)
  exp: number;         // Expires at (timestamp)
}
```

### Token Expiration
- Default: 7 days from issuance
- Configurable via backend `JWT_EXPIRES_IN` env var
- No automatic refresh (user must re-login)

### Token Storage
- Recommended: `localStorage` with key `auth_token`
- Alternative: `sessionStorage` (session-only)
- Not recommended: Cookies (CORS complexity)

---

## Error Response Format

All errors follow this format:

```json
{
  "detail": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400` Bad Request: Invalid input
- `401` Unauthorized: Invalid/expired token or credentials
- `403` Forbidden: Account inactive or insufficient permissions
- `404` Not Found: Resource doesn't exist
- `409` Conflict: Resource already exists
- `429` Too Many Requests: Rate limit exceeded
- `500` Internal Server Error: Server error

---

## Request Headers

### Required Headers

**For JSON requests:**
```
Content-Type: application/json
```

**For authenticated requests:**
```
Authorization: Bearer <token>
```

### Optional Headers

**Project identification (for analytics):**
```
X-Project-Source: ai-studio
```

---

## Environment Variables

### Frontend .env Configuration

```env
# API Base URL
VITE_API_URL=http://localhost:3001

# Auth Page URL
VITE_AUTH_URL=http://localhost:3001/auth

# App Identifier (optional)
VITE_APP_NAME=your-app-name
```

### Environment-Specific URLs

**Development:**
- API: `http://localhost:3001`
- Auth: `http://localhost:3001/auth`

**Production:**
- API: `https://api.forsion.com`
- Auth: `https://api.forsion.com/auth`

---

## Rate Limits

### SMS Verification Codes
- 1 request per 60 seconds per phone + purpose
- Codes expire after 5 minutes
- Each code can only be used once

### Login Attempts
- No hard limit currently
- Best practice: Implement client-side throttling after 3 failed attempts

### API Requests
- No global rate limit currently
- Backend may implement per-user limits in future

---

## Response Times

**Expected response times (ms):**
- Login/Register: 200-500ms
- Token validation (`/auth/me`): 50-150ms
- Send SMS code: 500-2000ms (depends on SMS provider)

**Timeouts:**
- Recommended client timeout: 10 seconds
- SMS operations: 15 seconds

---

## CORS Configuration

### Allowed Origins

Backend must whitelist your frontend origin in `.env`:

```env
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.com
```

### Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS

### Allowed Headers
- Content-Type, Authorization, X-Project-Source

### Credentials
- Supported: `credentials: true` in fetch/axios

---

## Quick Code Snippets

### Fetch with Auth
```typescript
const response = await fetch(`${API_URL}/api/auth/me`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});
```

### Axios with Auth
```typescript
const response = await axios.get('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});
```

### Check Token Validity
```typescript
async function isTokenValid(): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;
  
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}
```
