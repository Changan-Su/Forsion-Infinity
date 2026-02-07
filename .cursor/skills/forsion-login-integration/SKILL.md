---
name: forsion-login-integration
description: Integrate frontend applications with the Forsion unified backend login system. Use when integrating authentication, setting up login flow, connecting to Forsion backend APIs, or implementing user authentication for any frontend project (React, Vue, Angular, etc.).
---

# Forsion Login Integration

This skill guides you through integrating frontend applications with the Forsion unified backend authentication system.

## When to Use This Skill

Use this skill when:
- Integrating a new frontend project with Forsion backend authentication
- Setting up login, registration, or password reset flows
- Implementing JWT token management
- Configuring API clients with authentication headers
- Troubleshooting authentication issues

## Important: JWT Token vs JWT Secret

**Frontend applications ONLY need JWT tokens, NOT the JWT_SECRET:**

| Concept | Who Uses | What Is It |
|---------|----------|------------|
| **JWT Token** | Frontend / All API clients | A string returned by `/api/auth/login` that must be sent in the `Authorization: Bearer <token>` header for all authenticated API calls |
| **JWT Secret (JWT_SECRET)** | Backend server only | A secret key stored in backend `.env` used to sign and verify tokens. **NEVER share with or configure in frontend** |

**Frontend Integration Summary:**
1. Call login API → Receive `token` string in response
2. Save token to localStorage
3. Send token in `Authorization: Bearer <token>` header for ALL authenticated API requests
4. Frontend does NOT need, and should NOT have access to, JWT_SECRET

**Which APIs need the token?**
- **Login/Register APIs**: No token needed (you call these to GET a token)
- **All other APIs**: Token required (user info, credits, payments, storage, AI chat, etc.)

If you are asked to configure "JWT_SECRET" in frontend, that is incorrect. Frontend only uses the token string.

## Quick Start Integration (3 Steps)

### Step 1: Create Auth Utility

Create `src/utils/authRedirect.ts` (or `.js` for JavaScript projects):

```typescript
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001/auth';
const TOKEN_KEY = 'auth_token';

export function initAuth(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  if (tokenFromUrl) {
    localStorage.setItem(TOKEN_KEY, tokenFromUrl);
    urlParams.delete('token');
    const newUrl = urlParams.toString() 
      ? `${window.location.pathname}?${urlParams}` 
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    return true;
  }
  
  const storedToken = localStorage.getItem(TOKEN_KEY);
  return !!storedToken;
}

export function redirectToLogin(appName?: string): void {
  const currentUrl = encodeURIComponent(window.location.href);
  let authUrl = `${AUTH_BASE_URL}?redirect=${currentUrl}`;
  
  if (appName) {
    authUrl += `&app=${appName}`;
  }
  
  window.location.href = authUrl;
}

export async function validateAndRedirect(apiBaseUrl: string, appName?: string): Promise<boolean> {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token) {
    redirectToLogin(appName);
    return false;
  }
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return true;
    }
    
    localStorage.removeItem(TOKEN_KEY);
    redirectToLogin(appName);
    return false;
  } catch (error) {
    console.error('Token validation failed:', error);
    return true; // Allow offline usage
  }
}

export function logout(appName?: string): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('current_username');
  redirectToLogin(appName);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
```

### Step 2: Initialize Authentication in App Entry

**For React (App.tsx/main.tsx):**

```typescript
import { useEffect, useState } from 'react';
import { initAuth, validateAndRedirect } from './utils/authRedirect';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      initAuth();
      const isValid = await validateAndRedirect(
        import.meta.env.VITE_API_URL,
        'your-app-name' // Replace with your app identifier
      );
      setIsAuthenticated(isValid);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null; // Redirecting to login

  return <YourApp />;
}
```

**For Vue (App.vue):**

```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <YourApp v-else-if="isAuthenticated" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { initAuth, validateAndRedirect } from './utils/authRedirect';

const isAuthenticated = ref(false);
const isLoading = ref(true);

onMounted(async () => {
  initAuth();
  const isValid = await validateAndRedirect(
    import.meta.env.VITE_API_URL,
    'your-app-name'
  );
  isAuthenticated.value = isValid;
  isLoading.value = false;
});
</script>
```

### Step 3: Configure Environment Variables

Create `.env` file:

```env
# Development
VITE_API_URL=http://localhost:3001
VITE_AUTH_URL=http://localhost:3001/auth

# Production (update with actual URLs)
# VITE_API_URL=https://api.forsion.com
# VITE_AUTH_URL=https://api.forsion.com/auth
```

## API Integration

**IMPORTANT**: All API calls (except login/register) require the JWT token in the Authorization header. The frontend uses the **token string** (not JWT_SECRET) returned from login.

### Setting Up API Client with Axios

```typescript
import axios from 'axios';
import { getToken, logout } from './utils/authRedirect';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: Add token
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout('your-app-name');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Setting Up API Client with Fetch

```typescript
import { getToken, logout } from './utils/authRedirect';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${endpoint}`,
      { ...options, headers }
    );

    if (response.status === 401) {
      logout('your-app-name');
      throw new Error('Unauthorized');
    }

    return response;
  } catch (error) {
    throw error;
  }
}
```

## Key API Endpoints

### Authentication Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/login` | POST | Username/email/phone + password login | No |
| `/api/auth/login-sms` | POST | Phone + verification code login | No |
| `/api/auth/register` | POST | Register new user (requires invite code) | No |
| `/api/auth/send-code` | POST | Send SMS verification code | No |
| `/api/auth/reset-password` | POST | Reset password via SMS code | No |
| `/api/auth/me` | GET | Get current user info | Yes |
| `/api/auth/password` | PUT | Change password | Yes |

### Login Request Examples

**Password Login:**
```typescript
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'user@example.com', // or username or phone
    password: 'password123'
  })
});
const { token, user } = await response.json();
```

**SMS Verification Code Login:**
```typescript
// 1. Send code
await fetch(`${API_URL}/api/auth/send-code`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target: '13800138000',
    type: 'phone',
    purpose: 'login'
  })
});

// 2. Login with code
const response = await fetch(`${API_URL}/api/auth/login-sms`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '13800138000',
    code: '123456'
  })
});
const { token, user } = await response.json();
```

**Registration:**
```typescript
const response = await fetch(`${API_URL}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'password123',
    invite_code: 'INVITE123'
  })
});
const { token, user } = await response.json();
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│ User visits your frontend app                           │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
          ┌─────────────────────────┐
          │ Check local token       │
          │ (localStorage)          │
          └─────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐             ┌─────────────────┐
│ Token exists  │             │ Token missing   │
└───────────────┘             └─────────────────┘
        │                               │
        ▼                               ▼
┌───────────────┐             ┌─────────────────────────────┐
│ Validate      │             │ Redirect to Forsion login   │
│ GET /auth/me  │             │ /auth?redirect=current_url  │
└───────────────┘             └─────────────────────────────┘
        │                               │
   ┌────┴────┐                          ▼
   │         │                  ┌─────────────────┐
   ▼         ▼                  │ User logs in    │
┌──────┐  ┌──────┐              └─────────────────┘
│Valid │  │Invalid                       │
└──────┘  └──────┘                       ▼
   │         │              ┌─────────────────────────────┐
   ▼         ▼              │ Redirect back with token    │
┌──────┐  ┌───────────┐    │ ?token=xxx                  │
│Enter │  │Clear token│    └─────────────────────────────┘
│ App  │  │Redirect   │                 │
└──────┘  └───────────┘                 ▼
                          ┌─────────────────────────────┐
                          │ App saves token             │
                          │ Clears URL param            │
                          └─────────────────────────────┘
```

## Common Issues & Solutions

### Issue: 401 Unauthorized on API Calls

**Symptoms:** API returns 401 even with token present

**Solutions:**
1. Check token is being sent in header: `Authorization: Bearer <token>` (use the token string from login response, NOT JWT_SECRET)
2. Verify token hasn't expired (default: 7 days)
3. Check token format (no extra spaces or quotes)
4. Verify API base URL is correct
5. Ensure you're using the token (e.g., `eyJhbGciOiJIUzI1NiIs...`), not the JWT_SECRET from backend

### Issue: Token Not Saved After Login

**Symptoms:** User redirected back but not authenticated

**Solutions:**
1. Verify `initAuth()` is called on app mount
2. Check URL parameter name is `token` (lowercase)
3. Check localStorage is accessible (not blocked by browser)
4. Verify `auth_token` key in localStorage

### Issue: CORS Errors

**Symptoms:** Network requests fail with CORS errors

**Solutions:**
1. Backend must include your frontend origin in CORS allowlist
2. Contact backend admin to add your domain
3. Development: Check `http://localhost:<port>` is allowed
4. Production: Ensure your domain is in backend's `ALLOWED_ORIGINS`

### Issue: Infinite Redirect Loop

**Symptoms:** App keeps redirecting between login and main app

**Solutions:**
1. Ensure `validateAndRedirect` only runs once on mount
2. Check token validation endpoint `/api/auth/me` is accessible
3. Verify network errors don't trigger unnecessary redirects
4. Add loading state to prevent re-execution

### Issue: SMS Verification Code Not Received

**Symptoms:** Code sending succeeds but SMS not received

**Solutions:**
1. Check phone number format (China: 11 digits, starts with 1)
2. Wait 60 seconds between requests (rate limiting)
3. Check spam/blocked messages on phone
4. Development: Check server logs for generated code
5. Verify backend SMS service (Aliyun) is configured

## Advanced Configurations

### Multi-Tab Synchronization

Sync login state across browser tabs:

```typescript
window.addEventListener('storage', (e) => {
  if (e.key === 'auth_token') {
    if (!e.newValue) {
      // Token removed in another tab, logout
      window.location.href = '/login';
    } else {
      // Token updated, refresh auth state
      validateAndRedirect(import.meta.env.VITE_API_URL, 'your-app');
    }
  }
});
```

### Custom Logout Handler

```typescript
export async function logoutWithCleanup(appName?: string) {
  // Call backend logout endpoint (optional)
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
  } catch (error) {
    console.error('Logout request failed:', error);
  }

  // Clear all local storage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_username');
  localStorage.removeItem('user_info');
  
  // Clear session storage
  sessionStorage.clear();
  
  // Redirect to login
  redirectToLogin(appName);
}
```

### Protected Route Component (React)

```typescript
import { Navigate } from 'react-router-dom';
import { getToken } from './utils/authRedirect';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Usage in router
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Protected Route (Vue Router)

```typescript
import { getToken } from './utils/authRedirect';

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const token = getToken();

  if (requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});
```

## App Identifiers

When calling auth functions, use these standard app identifiers:

| Application | Identifier | Description |
|-------------|------------|-------------|
| AI Studio | `ai-studio` | AI conversation app |
| Desktop | `desktop` | Desktop application |
| Calendar | `calendar` | Calendar app |
| Photo Studio | `photo-studio` | Photo editing app |
| Custom App | Use project name | Use kebab-case project name |

## Best Practices

1. **Error Handling**: Always wrap auth calls in try-catch
2. **Loading States**: Show loading UI during validation
3. **Offline Support**: Allow graceful degradation when API unavailable
4. **Security**: 
   - Never log tokens in production
   - Never store JWT_SECRET in frontend (it belongs only on backend)
   - Only use the token string from login response
5. **Token Refresh**: Implement token refresh if using long sessions
6. **Testing**: Test login flow in incognito/private mode

## Backend Configuration Requirements

For integration to work, backend admin must:

1. **Add your origin to CORS allowlist** in backend `.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,https://your-app.com
   ```

2. **Verify these endpoints are accessible**:
   - `/auth` (login page - public)
   - `/api/auth/login` (login API)
   - `/api/auth/register` (registration API)
   - `/api/auth/me` (user info API)

3. **Backend JWT configuration** (backend only, not shared with frontend):
   ```env
   JWT_SECRET=your-secret-key-kept-on-backend-only
   JWT_EXPIRES_IN=7d
   ```
   
   **Note**: `JWT_SECRET` stays on the backend server. Frontend never receives or configures this secret.

## Additional Resources

For more detailed information, refer to the Forsion backend documentation:
- Complete API reference: `/docs/API.md`
- Backend integration guide: `/docs/CLIENT_INTEGRATION.md`
- Login system architecture: `/Documents/登录系统/统一登录系统实现方案.md`
- SMS service setup: `/Documents/登录系统/阿里云短信服务配置指南.md`

## Quick Checklist

Before deploying:
- [ ] `authRedirect.ts` utility created
- [ ] Auth check on app mount
- [ ] Environment variables configured
- [ ] API client with auth interceptors
- [ ] 401 error handling implemented
- [ ] Logout functionality working
- [ ] CORS configured on backend
- [ ] App identifier chosen
- [ ] Tested in clean browser session

## Summary

This skill provides everything needed to integrate the Forsion unified login system:
1. Copy `authRedirect.ts` utility
2. Call `initAuth()` and `validateAndRedirect()` on app mount
3. Configure API client with token interceptors
4. Handle 401 errors with logout
5. Test thoroughly

The integration enables seamless authentication across all Forsion applications with automatic token management and unified login experience.
