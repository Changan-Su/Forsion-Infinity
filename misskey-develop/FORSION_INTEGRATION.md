# Forsion Backend Integration Configuration

## Overview

This document describes how to configure Misskey to use Forsion unified authentication system.

## Backend Configuration

Add the following section to your `.config/default.yml` file:

```yaml
# Forsion Backend Integration
forsion:
  enabled: true
  apiUrl: 'http://localhost:3001'  # Forsion Backend API URL
```

### Configuration Options

- **enabled** (boolean, required): Enable or disable Forsion integration
  - Set to `true` to enable Forsion authentication
  - Set to `false` to use only Misskey native authentication

- **apiUrl** (string, required if enabled=true): Forsion Backend API base URL
  - Development: `http://localhost:3001`
  - Production: Your actual Forsion Backend URL (e.g., `https://api.forsion.com`)
  - Do not include trailing slash
  - Used to verify JWT tokens by calling Forsion's `/api/auth/me` endpoint

## Frontend Configuration

The frontend automatically detects Forsion configuration through environment variables.

Create or update `misskey-develop/packages/frontend/.env`:

```env
# Development
VITE_FORSION_AUTH_URL=http://localhost:3001/auth
VITE_FORSION_API_URL=http://localhost:3001

# Production (update with actual URLs)
# VITE_FORSION_AUTH_URL=https://api.forsion.com/auth
# VITE_FORSION_API_URL=https://api.forsion.com
```

### Environment Variables

- **VITE_FORSION_AUTH_URL**: URL of Forsion login page
  - Users will be redirected here for authentication
  - Format: `{forsion-api-url}/auth`

- **VITE_FORSION_API_URL**: Forsion Backend API base URL
  - Used for token validation
  - Must match backend `apiUrl` configuration

## Complete Example

### Backend (.config/default.yml)

```yaml
url: https://misskey.example.com
port: 3000

db:
  host: localhost
  port: 5432
  db: misskey
  user: misskey
  pass: your-db-password

redis:
  host: localhost
  port: 6379
  pass: your-redis-password

# Forsion Integration
forsion:
  enabled: true
  apiUrl: 'https://api.forsion.com'

# ... other Misskey configurations
```

### Frontend (.env)

```env
VITE_FORSION_AUTH_URL=https://api.forsion.com/auth
VITE_FORSION_API_URL=https://api.forsion.com
```

## Security Considerations

1. **Token Verification**:
   - Misskey Backend verifies tokens by calling Forsion Backend's `/api/auth/me` API
   - No need to share JWT_SECRET with Misskey Backend
   - Token verification happens in real-time for maximum security

2. **HTTPS**:
   - Always use HTTPS in production for both Forsion and Misskey
   - JWT tokens contain sensitive user information

3. **CORS**:
   - Ensure Forsion Backend has proper CORS configuration
   - Add your Misskey domain to `ALLOWED_ORIGINS` in Forsion Backend

4. **Network Security**:
   - Ensure Misskey Backend can reach Forsion Backend API
   - Consider using internal network or VPN in production
   - Set appropriate timeout values (default: 10 seconds)

## Testing Configuration

1. Start Forsion Backend:
   ```bash
   cd forsion-backend
   npm run dev
   ```

2. Start Misskey:
   ```bash
   cd misskey-develop
   pnpm dev
   ```

3. Visit Misskey frontend, you should see "Login with Forsion" button
4. Click it and authenticate with Forsion credentials
5. You'll be redirected back to Misskey and logged in automatically

## Troubleshooting

### "Forsion integration is not enabled" error

- Check `forsion.enabled` is set to `true` in backend config
- Restart Misskey backend after config changes

### "Forsion API URL is not configured" error

- Verify `forsion.apiUrl` is set in `.config/default.yml`
- Ensure the URL is reachable from Misskey backend
- Check for typos in the URL

### "Token is invalid or expired" error

- Token may be expired (default: 7 days in Forsion)
- User needs to log in again
- Check that Forsion Backend is running and accessible

### "Failed to verify token" / Network errors

- Ensure Misskey Backend can reach Forsion Backend API
- Check firewall rules and network connectivity
- Verify Forsion Backend is running
- Check timeout settings (default: 10 seconds)

### Login button not showing

- Check frontend `.env` file exists and has Forsion URLs
- Rebuild frontend: `pnpm build` or restart dev server
- Clear browser cache and localStorage

### CORS errors

- Add your Misskey URL to Forsion Backend's `ALLOWED_ORIGINS`
- Format: `http://localhost:5173,https://misskey.example.com`
- Restart Forsion Backend after changes

## Migration from Existing Users

If you have existing Misskey users and want to integrate with Forsion:

1. **Dual Mode**: Keep `forsion.enabled: false` initially
2. **User Mapping**: Existing users can link their Forsion accounts manually
3. **Gradual Migration**: Enable Forsion for new users first
4. **Full Switch**: Set `forsion.enabled: true` when ready

## Disabling Forsion Integration

To disable Forsion and return to native Misskey authentication:

1. Set `forsion.enabled: false` in `.config/default.yml`
2. Restart Misskey backend
3. The "Login with Forsion" button will disappear
4. Users can log in with Misskey native credentials

## API Reference

See the attached skill documentation for complete Forsion API reference and integration details.
