# Forsion Login Integration Skill

This skill helps agents integrate frontend applications with the Forsion unified backend authentication system.

## What This Skill Does

- Guides integration of Forsion authentication into React, Vue, Angular, or vanilla JS apps
- Provides code templates for auth utilities, API clients, and UI components
- Offers troubleshooting guidance for common authentication issues
- Documents all authentication API endpoints and flows

## Files in This Skill

- **SKILL.md** - Main skill instructions (start here)
- **api-reference.md** - Complete API endpoint documentation
- **code-templates.md** - Ready-to-use code examples and templates
- **README.md** - This file

## Quick Start

The agent will automatically use this skill when:
- You ask to integrate authentication into a project
- You mention "Forsion login" or "Forsion backend"
- You need help with JWT token management
- You're setting up API clients with authentication

## Manual Usage

You can manually invoke this skill by:
1. Mentioning "use the forsion-login-integration skill"
2. Referencing "@forsion-login-integration" in your message
3. Asking about Forsion authentication integration

## Key Concepts

### Authentication Flow
1. User visits your app
2. App checks for token in localStorage
3. If no token → redirect to Forsion login page
4. User logs in → redirected back with token in URL
5. App saves token and validates it
6. All API requests include token in Authorization header

### Required Components
1. **authRedirect.ts** - Core authentication utility
2. **API Client** - Axios/fetch wrapper with auth interceptors
3. **App Entry Logic** - Token validation on mount
4. **Environment Variables** - API and auth URLs

## Integration Time

- **Simple app**: 15-30 minutes
- **Complex app with routing**: 30-60 minutes
- **Full production setup with error handling**: 1-2 hours

## Support

For issues or questions:
1. Check the troubleshooting section in SKILL.md
2. Review api-reference.md for endpoint details
3. Examine code-templates.md for working examples
4. Refer to backend documentation in the Forsion-Backend-Service repository

## Version

- **Created**: 2026-02-03
- **Backend API Version**: v2.0.0
- **Compatible with**: React, Vue, Angular, Svelte, vanilla JS

## Related Documentation

In the Forsion Backend Service repository:
- `/Documents/登录系统/统一登录系统实现方案.md`
- `/Documents/登录系统/客户端集成指南.md`
- `/Documents/登录系统/阿里云短信服务配置指南.md`
- `/docs/API.md`
- `/docs/CLIENT_INTEGRATION.md`
