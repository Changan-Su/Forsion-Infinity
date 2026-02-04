# Code Templates & Examples

## Complete Integration Examples

### React + TypeScript + Axios

#### Directory Structure
```
src/
├── utils/
│   └── authRedirect.ts
├── services/
│   └── api.ts
├── App.tsx
└── main.tsx
```

#### authRedirect.ts
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
  
  return !!localStorage.getItem(TOKEN_KEY);
}

export function redirectToLogin(appName?: string): void {
  const currentUrl = encodeURIComponent(window.location.href);
  let authUrl = `${AUTH_BASE_URL}?redirect=${currentUrl}`;
  if (appName) authUrl += `&app=${appName}`;
  window.location.href = authUrl;
}

export async function validateAndRedirect(
  apiBaseUrl: string,
  appName?: string
): Promise<boolean> {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token) {
    redirectToLogin(appName);
    return false;
  }
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) return true;
    
    localStorage.removeItem(TOKEN_KEY);
    redirectToLogin(appName);
    return false;
  } catch (error) {
    console.error('Token validation failed:', error);
    return true; // Allow offline
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

#### api.ts
```typescript
import axios from 'axios';
import { getToken, logout } from '../utils/authRedirect';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

#### App.tsx
```typescript
import { useEffect, useState } from 'react';
import { initAuth, validateAndRedirect } from './utils/authRedirect';
import apiClient from './services/api';

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      initAuth();
      const isValid = await validateAndRedirect(
        import.meta.env.VITE_API_URL,
        'your-app-name'
      );
      
      if (isValid) {
        try {
          const response = await apiClient.get('/api/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting to login
  }

  return (
    <div className="app">
      <header>
        <h1>Welcome, {user?.username}</h1>
      </header>
      <main>{/* Your app content */}</main>
    </div>
  );
}

export default App;
```

---

### Vue 3 + TypeScript + Composables

#### Directory Structure
```
src/
├── composables/
│   └── useAuth.ts
├── services/
│   └── api.ts
├── App.vue
└── main.ts
```

#### useAuth.ts
```typescript
import { ref, onMounted } from 'vue';

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001/auth';
const TOKEN_KEY = 'auth_token';

export function useAuth(appName: string) {
  const isAuthenticated = ref(false);
  const isLoading = ref(true);
  const user = ref<any>(null);

  function initAuth(): boolean {
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
    
    return !!localStorage.getItem(TOKEN_KEY);
  }

  function redirectToLogin(): void {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `${AUTH_BASE_URL}?redirect=${currentUrl}&app=${appName}`;
  }

  async function validateAndRedirect(): Promise<boolean> {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      redirectToLogin();
      return false;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        user.value = await response.json();
        return true;
      }
      
      localStorage.removeItem(TOKEN_KEY);
      redirectToLogin();
      return false;
    } catch (error) {
      console.error('Token validation failed:', error);
      return true;
    }
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    redirectToLogin();
  }

  function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  onMounted(async () => {
    initAuth();
    const valid = await validateAndRedirect();
    isAuthenticated.value = valid;
    isLoading.value = false;
  });

  return {
    isAuthenticated,
    isLoading,
    user,
    logout,
    getToken
  };
}
```

#### App.vue
```vue
<template>
  <div v-if="isLoading" class="loading-screen">
    <p>Loading...</p>
  </div>
  <div v-else-if="!isAuthenticated">
    <!-- Redirecting -->
  </div>
  <div v-else class="app">
    <header>
      <h1>Welcome, {{ user?.username }}</h1>
      <button @click="handleLogout">Logout</button>
    </header>
    <main>
      <!-- Your app content -->
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from './composables/useAuth';

const { isAuthenticated, isLoading, user, logout } = useAuth('your-app-name');

function handleLogout() {
  logout();
}
</script>
```

---

### React + React Router + Protected Routes

```typescript
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { getToken } from './utils/authRedirect';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Router configuration
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### Vue Router + Navigation Guards

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      component: () => import('../views/Settings.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !token) {
    const currentUrl = encodeURIComponent(window.location.origin + to.fullPath);
    window.location.href = `http://localhost:3001/auth?redirect=${currentUrl}&app=your-app`;
  } else {
    next();
  }
});

export default router;
```

---

## Login UI Components

### React Login Form with SMS

```typescript
import { useState } from 'react';

export function LoginForm() {
  const [mode, setMode] = useState<'password' | 'sms'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('auth_token', token);
        window.location.reload();
      } else {
        const error = await response.json();
        setError(error.detail || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleSendCode = async () => {
    if (countdown > 0) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: phone, type: 'phone', purpose: 'login' })
      });

      if (response.ok) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const error = await response.json();
        setError(error.detail || 'Failed to send code');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('auth_token', token);
        window.location.reload();
      } else {
        const error = await response.json();
        setError(error.detail || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="login-form">
      <div className="tabs">
        <button onClick={() => setMode('password')} className={mode === 'password' ? 'active' : ''}>
          Password Login
        </button>
        <button onClick={() => setMode('sms')} className={mode === 'sms' ? 'active' : ''}>
          SMS Login
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {mode === 'password' ? (
        <form onSubmit={handlePasswordLogin}>
          <input
            type="text"
            placeholder="Email/Phone/Username"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <form onSubmit={handleSmsLogin}>
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <div className="code-input">
            <input
              type="text"
              placeholder="Verification Code"
              value={code}
              onChange={e => setCode(e.target.value)}
            />
            <button type="button" onClick={handleSendCode} disabled={countdown > 0}>
              {countdown > 0 ? `${countdown}s` : 'Send Code'}
            </button>
          </div>
          <button type="submit">Login</button>
        </form>
      )}
    </div>
  );
}
```

---

## Testing Utilities

### Mock Auth for Tests

```typescript
// test-utils/mockAuth.ts
export function mockAuthSuccess(user = { id: '1', username: 'testuser', role: 'USER' }) {
  localStorage.setItem('auth_token', 'mock-token-123');
  
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => user
      } as Response);
    }
    return Promise.reject(new Error('Not mocked'));
  });
}

export function mockAuthFailure() {
  localStorage.removeItem('auth_token');
  
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' })
      } as Response);
    }
    return Promise.reject(new Error('Not mocked'));
  });
}

export function clearAuthMocks() {
  localStorage.clear();
  jest.clearAllMocks();
}
```

### Usage in Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { mockAuthSuccess, mockAuthFailure, clearAuthMocks } from './test-utils/mockAuth';
import App from './App';

describe('App Authentication', () => {
  afterEach(() => {
    clearAuthMocks();
  });

  it('shows loading state initially', () => {
    mockAuthSuccess();
    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders app when authenticated', async () => {
    mockAuthSuccess({ id: '1', username: 'testuser', role: 'USER' });
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
    });
  });

  it('redirects when not authenticated', async () => {
    mockAuthFailure();
    delete window.location;
    window.location = { href: '' } as any;
    
    render(<App />);
    
    await waitFor(() => {
      expect(window.location.href).toContain('/auth');
    });
  });
});
```

---

## Environment Setup Examples

### Vite Project (.env files)

**.env.development**
```env
VITE_API_URL=http://localhost:3001
VITE_AUTH_URL=http://localhost:3001/auth
VITE_APP_NAME=your-app-name
```

**.env.production**
```env
VITE_API_URL=https://api.forsion.com
VITE_AUTH_URL=https://api.forsion.com/auth
VITE_APP_NAME=your-app-name
```

### Next.js Project (.env files)

**.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_URL=http://localhost:3001/auth
NEXT_PUBLIC_APP_NAME=your-app-name
```

**.env.production**
```env
NEXT_PUBLIC_API_URL=https://api.forsion.com
NEXT_PUBLIC_AUTH_URL=https://api.forsion.com/auth
NEXT_PUBLIC_APP_NAME=your-app-name
```

---

## Complete Mini App Example

### Minimal React App with Auth

```typescript
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// App.tsx
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001/auth';
const APP_NAME = 'mini-app';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      params.delete('token');
      window.history.replaceState({}, '', `${window.location.pathname}`);
    }

    // Validate token
    const validateToken = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        window.location.href = `${AUTH_URL}?redirect=${encodeURIComponent(window.location.href)}&app=${APP_NAME}`;
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });

        if (res.ok) {
          setUser(await res.json());
        } else {
          localStorage.removeItem('auth_token');
          window.location.href = `${AUTH_URL}?redirect=${encodeURIComponent(window.location.href)}&app=${APP_NAME}`;
        }
      } catch (err) {
        console.error('Auth failed:', err);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = `${AUTH_URL}?redirect=${encodeURIComponent(window.location.href)}&app=${APP_NAME}`;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome, {user?.username}!</h1>
      <p>Email: {user?.email || 'Not provided'}</p>
      <p>Role: {user?.role}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default App;
```

This is a complete working example in under 100 lines!
