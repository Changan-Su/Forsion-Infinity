/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Forsion Backend Authentication Utilities
 * 
 * This module provides functions to integrate with Forsion unified authentication system.
 * It handles token storage, validation, and redirection flows.
 */

const FORSION_TOKEN_KEY = 'forsion_jwt_token';

/**
 * Get Forsion auth URL from environment
 * Returns empty string if not configured
 */
export function getForsionAuthUrl(): string {
	// In development mode, use import.meta.env
	// In production, use build-time defined variables
	if (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_FORSION_AUTH_URL) {
		return import.meta.env.VITE_FORSION_AUTH_URL as string;
	}
	// Fallback to build-time config (for production builds)
	if (typeof _FORSION_AUTH_URL_ !== 'undefined' && _FORSION_AUTH_URL_) {
		return _FORSION_AUTH_URL_;
	}
	return '';
}

/**
 * Get Forsion API URL from environment
 * Returns empty string if not configured
 */
export function getForsionApiUrl(): string {
	// In development mode, use import.meta.env
	// In production, use build-time defined variables
	if (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_FORSION_API_URL) {
		return import.meta.env.VITE_FORSION_API_URL as string;
	}
	// Fallback to build-time config (for production builds)
	if (typeof _FORSION_API_URL_ !== 'undefined' && _FORSION_API_URL_) {
		return _FORSION_API_URL_;
	}
	return '';
}

/**
 * Check if URL has token parameter and save it
 * @returns true if token was found and saved
 */
export function handleTokenCallback(): boolean {
	const urlParams = new URLSearchParams(window.location.search);
	const token = urlParams.get('token');
	
	if (token) {
		// Save token to localStorage
		localStorage.setItem(FORSION_TOKEN_KEY, token);
		
		// Clean URL by removing token parameter
		urlParams.delete('token');
		const newSearch = urlParams.toString();
		const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
		window.history.replaceState({}, '', newUrl);
		
		return true;
	}
	
	return false;
}

/**
 * Get stored Forsion JWT token
 */
export function getForsionToken(): string | null {
	return localStorage.getItem(FORSION_TOKEN_KEY);
}

/**
 * Save Forsion JWT token
 */
export function setForsionToken(token: string): void {
	localStorage.setItem(FORSION_TOKEN_KEY, token);
}

/**
 * Remove Forsion JWT token
 */
export function clearForsionToken(): void {
	localStorage.removeItem(FORSION_TOKEN_KEY);
}

/**
 * Redirect to Forsion login page
 * @param appName Optional app identifier for Forsion backend
 */
export function redirectToForsionLogin(appName: string = 'misskey'): void {
	const authUrl = getForsionAuthUrl();
	
	// Debug: log the auth URL
	console.log('[Forsion Debug] Auth URL:', authUrl);
	console.log('[Forsion Debug] API URL:', getForsionApiUrl());
	
	if (!authUrl) {
		const errorMsg = 'Forsion 登录系统未配置！\n\n' +
			'请检查环境变量:\n' +
			'- VITE_FORSION_AUTH_URL\n' +
			'- VITE_FORSION_API_URL\n\n' +
			'配置文件: misskey-develop/packages/frontend/.env\n' +
			'修改后需要重启前端开发服务器 (pnpm dev)';
		
		console.error('Forsion auth URL is not configured');
		alert(errorMsg);
		return;
	}
	
	const currentUrl = encodeURIComponent(window.location.href);
	const redirectUrl = `${authUrl}?redirect=${currentUrl}&app=${appName}`;
	console.log('[Forsion] Redirecting to:', redirectUrl);
	
	window.location.href = redirectUrl;
}

/**
 * Validate token with Forsion backend
 * @returns true if token is valid
 */
export async function validateForsionToken(): Promise<boolean> {
	const token = getForsionToken();
	
	if (!token) {
		return false;
	}
	
	try {
		const apiUrl = getForsionApiUrl();
		const response = await fetch(`${apiUrl}/api/auth/me`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});
		
		if (response.ok) {
			return true;
		}
		
		// Token is invalid, clear it
		clearForsionToken();
		return false;
	} catch (error) {
		console.error('Token validation failed:', error);
		// Allow offline usage - don't clear token on network error
		return true;
	}
}

/**
 * Initialize Forsion authentication
 * Call this on app startup to handle token callback
 * @returns true if user is authenticated
 */
export async function initForsionAuth(): Promise<boolean> {
	// Check if we have a token in URL
	const hasNewToken = handleTokenCallback();
	
	// Check if we have a stored token
	const token = getForsionToken();
	
	if (!token) {
		return false;
	}
	
	// If we just got a new token, assume it's valid
	if (hasNewToken) {
		return true;
	}
	
	// Validate existing token
	return await validateForsionToken();
}

/**
 * Logout from Forsion and clear local state
 */
export function forsionLogout(appName: string = 'misskey'): void {
	clearForsionToken();
	// Clear any other Misskey-specific state if needed
	localStorage.removeItem('account');
	// Redirect to login
	redirectToForsionLogin(appName);
}

/**
 * Check if Forsion integration is enabled
 * This checks if Forsion environment variables are configured
 */
export function isForsionEnabled(): boolean {
	// Check if Forsion URLs are configured
	try {
		const authUrl = getForsionAuthUrl();
		const apiUrl = getForsionApiUrl();
		return !!(authUrl && apiUrl);
	} catch {
		return false;
	}
}
