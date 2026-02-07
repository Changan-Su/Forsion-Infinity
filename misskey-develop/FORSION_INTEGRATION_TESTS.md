# Forsion Login Integration - Test Plan

## Test Overview

This document provides a comprehensive test plan for验证 Forsion Backend integration with Misskey.

## Prerequisites

Before testing, ensure:

1. ✅ Forsion Backend is running and accessible
2. ✅ Misskey Backend configuration includes Forsion settings
3. ✅ Misskey Frontend has Forsion environment variables
4. ✅ JWT_SECRET is identical in both Forsion and Misskey backends
5. ✅ Database migration has been run (for `forsion_user_mapping` table)

## Test Scenarios

### Scenario 1: New User First Login

**Objective**: Verify that a Forsion user without existing Misskey account can log in successfully.

**Steps**:
1. Clear browser localStorage and cookies
2. Navigate to Misskey frontend
3. Click "Login with Forsion" button
4. Enter Forsion credentials (username/email + password)
5. Complete authentication on Forsion page
6. Observe redirect back to Misskey

**Expected Results**:
- User is redirected to Forsion login page with correct `redirect` and `app` parameters
- After Forsion auth, user is redirected back with `token` parameter
- Token is saved to localStorage as `forsion_jwt_token`
- New Misskey user is created automatically
- User profile page shows correct username and email
- Entry exists in `forsion_user_mapping` table linking Forsion ID to Misskey ID

**SQL Verification**:
```sql
-- Check user was created
SELECT id, username, email FROM "user" WHERE username LIKE '%forsion_username%';

-- Check mapping exists
SELECT * FROM forsion_user_mapping WHERE forsion_user_id = 'forsion_user_id_from_jwt';
```

### Scenario 2: Existing User Login

**Objective**: Verify that an existing Forsion-linked user can log in again.

**Steps**:
1. Log out from Scenario 1
2. Clear localStorage
3. Navigate to Misskey
4. Click "Login with Forsion"
5. Authenticate with same Forsion credentials

**Expected Results**:
- User is redirected to Forsion
- After auth, user is logged into their existing Misskey account
- No duplicate user created
- `lastLoginAt` timestamp updated in `forsion_user_mapping`

**SQL Verification**:
```sql
-- Verify no duplicate users
SELECT COUNT(*) FROM forsion_user_mapping WHERE forsion_user_id = 'forsion_user_id';
-- Should return 1

-- Check last login time
SELECT last_login_at FROM forsion_user_mapping WHERE forsion_user_id = 'forsion_user_id';
```

### Scenario 3: API Request with JWT Token

**Objective**: Verify API requests work with Forsion JWT token.

**Steps**:
1. Log in with Forsion (Scenario 1 or 2)
2. Open browser DevTools Network tab
3. Perform actions that trigger API calls (e.g., create note, view timeline)
4. Inspect API request headers

**Expected Results**:
- API requests include `Authorization: Bearer <jwt_token>` header
- Requests succeed (200 OK)
- No `i` parameter in request body (JWT is used instead)
- User actions (notes, follows) are attributed correctly

### Scenario 4: Token Expiration

**Objective**: Verify handling of expired JWT tokens.

**Steps**:
1. Log in with Forsion
2. Manually modify token expiration in browser:
   - Decode JWT at https://jwt.io
   - Change `exp` to past timestamp
   - Save to localStorage
3. Refresh page or make API call

**Expected Results**:
- Token validation fails
- User is redirected to Forsion login page
- After re-login, new token is issued
- User can continue using Misskey

### Scenario 5: Mixed Authentication (Forsion + Native)

**Objective**: Verify Forsion and native Misskey auth can coexist.

**Setup**: Create a native Misskey user (via database or signup if available)

**Steps**:
1. Try logging in with native Misskey credentials (if login UI supports it)
2. Try logging in with Forsion credentials
3. Switch between accounts

**Expected Results**:
- Both auth methods work
- Forsion users use JWT, native users use Misskey token
- No interference between auth types

### Scenario 6: Logout Flow

**Objective**: Verify logout clears Forsion session.

**Steps**:
1. Log in with Forsion
2. Click logout button in Misskey
3. Check localStorage and cookies

**Expected Results**:
- `forsion_jwt_token` is removed from localStorage
- `account` is removed from localStorage
- User is redirected to Forsion login page
- Attempting to access protected pages redirects to login

### Scenario 7: Multi-Tab Synchronization

**Objective**: Verify auth state sync across browser tabs.

**Steps**:
1. Open Misskey in Tab 1, log in with Forsion
2. Open Misskey in Tab 2 (should auto-login)
3. In Tab 1, logout
4. Switch to Tab 2

**Expected Results**:
- Tab 2 automatically logs in when opened
- When Tab 1 logs out, Tab 2 detects and logs out too
- Both tabs use same JWT token

### Scenario 8: Invalid/Corrupted Token

**Objective**: Verify graceful handling of invalid tokens.

**Steps**:
1. Log in with Forsion
2. Manually edit `forsion_jwt_token` in localStorage (corrupt it)
3. Refresh page or make API call

**Expected Results**:
- Invalid token detected
- Token cleared from localStorage
- User redirected to Forsion login
- No application crash or error dialogs

### Scenario 9: Forsion Backend Offline

**Objective**: Verify behavior when Forsion Backend is unreachable.

**Steps**:
1. Stop Forsion Backend server
2. Try to log in to Misskey
3. Or, if already logged in, try to make API calls

**Expected Results**:
- Login redirect fails gracefully (error message shown)
- If already logged in with valid token, API calls still work (token verified locally)
- Clear error messaging to user

### Scenario 10: Username Collision

**Objective**: Verify unique username generation when Forsion username exists.

**Setup**: Create Misskey user with username "testuser"

**Steps**:
1. Log in with Forsion user whose username is "testuser"
2. Check created Misskey username

**Expected Results**:
- New user created with username like "testuser1" or similar
- No username conflict error
- User can log in successfully
- Mapping correctly links Forsion ID to new Misskey user

## Database Migration Test

**Objective**: Verify database migration runs successfully.

**Steps**:
```bash
cd misskey-develop
pnpm compile-config
pnpm migrate
```

**Expected Results**:
- Migration runs without errors
- New table `forsion_user_mapping` exists
- Table has correct columns: `id`, `forsionUserId`, `misskeyUserId`, `createdAt`, `lastLoginAt`
- Indexes created on `forsionUserId` and `misskeyUserId`

**SQL Verification**:
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'forsion_user_mapping';

-- Check columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'forsion_user_mapping';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'forsion_user_mapping';
```

## Performance Tests

### Test 1: JWT Verification Performance

**Objective**: Verify JWT verification doesn't slow down API requests.

**Method**:
1. Log in with Forsion
2. Make 100 API requests (e.g., timeline fetch)
3. Measure average response time
4. Compare with native Misskey token auth (if available)

**Expected Results**:
- JWT verification adds < 5ms to request processing
- No noticeable performance degradation

### Test 2: User Creation Performance

**Objective**: Verify first-time user creation is reasonably fast.

**Method**:
1. Create 10 new Forsion users
2. Log in each to Misskey for first time
3. Measure time from redirect back to UI ready

**Expected Results**:
- User creation completes in < 2 seconds
- No database deadlocks or conflicts
- All users created successfully

## Security Tests

### Test 1: Token Secret Mismatch

**Setup**: Configure Misskey with different JWT_SECRET than Forsion

**Expected Result**: Token verification fails, user cannot log in

### Test 2: Token Tampering

**Steps**: Modify JWT payload or signature

**Expected Result**: Token rejected, user redirected to login

### Test 3: Replay Attack

**Steps**: Reuse expired token

**Expected Result**: Token rejected due to expiration

## Rollback Test

**Objective**: Verify system works after disabling Forsion integration.

**Steps**:
1. Set `forsion.enabled: false` in config
2. Restart Misskey backend
3. Try to log in

**Expected Results**:
- "Login with Forsion" button disappears
- Native Misskey login still works (if enabled)
- Existing Forsion-created users still exist but cannot log in via Forsion
- No errors or crashes

## Test Checklist

Use this checklist to track test completion:

- [ ] Scenario 1: New User First Login
- [ ] Scenario 2: Existing User Login  
- [ ] Scenario 3: API Request with JWT Token
- [ ] Scenario 4: Token Expiration
- [ ] Scenario 5: Mixed Authentication
- [ ] Scenario 6: Logout Flow
- [ ] Scenario 7: Multi-Tab Synchronization
- [ ] Scenario 8: Invalid/Corrupted Token
- [ ] Scenario 9: Forsion Backend Offline
- [ ] Scenario 10: Username Collision
- [ ] Database Migration Test
- [ ] Performance Tests
- [ ] Security Tests
- [ ] Rollback Test

## Known Issues / Limitations

Document any known issues discovered during testing:

1. [Issue description]
2. [Workaround if available]

## Test Environment

Record test environment details:

- Misskey Version: [version]
- Forsion Backend Version: [version]
- Node.js Version: [version]
- Database: PostgreSQL [version]
- Browser: [browser and version]
- OS: [operating system]

## Test Results Summary

| Test Scenario | Status | Notes |
|---------------|--------|-------|
| New User Login | ⏳ Pending | |
| Existing User Login | ⏳ Pending | |
| API with JWT | ⏳ Pending | |
| Token Expiration | ⏳ Pending | |
| Mixed Auth | ⏳ Pending | |
| Logout Flow | ⏳ Pending | |
| Multi-Tab Sync | ⏳ Pending | |
| Invalid Token | ⏳ Pending | |
| Backend Offline | ⏳ Pending | |
| Username Collision | ⏳ Pending | |
| Database Migration | ⏳ Pending | |
| Performance | ⏳ Pending | |
| Security | ⏳ Pending | |
| Rollback | ⏳ Pending | |

Legend: ✅ Passed | ❌ Failed | ⚠️ Partial | ⏳ Pending
