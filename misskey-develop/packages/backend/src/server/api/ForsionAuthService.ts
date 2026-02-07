/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';

/**
 * User information returned from Forsion Backend authentication
 */
export type ForsionUserInfo = {
	id: string;
	username: string;
	email?: string;
	emailVerified?: boolean;
	phone?: string;
	avatar?: string;
	createdAt?: string;
};

/**
 * Custom error for Forsion authentication failures
 */
export class ForsionAuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ForsionAuthError';
	}
}

@Injectable()
export class ForsionAuthService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {}

	/**
	 * Check if a token looks like a Forsion JWT token
	 * JWT tokens have the format: header.payload.signature (3 base64url parts separated by dots)
	 * They typically start with "eyJ" (base64 for '{"')
	 */
	@bindThis
	public isForsionToken(token: string): boolean {
		// Check if Forsion integration is enabled
		if (!this.config.forsion?.enabled) {
			return false;
		}

		// JWT tokens start with "eyJ" and have exactly 3 dot-separated parts
		if (!token.startsWith('eyJ')) {
			return false;
		}

		const parts = token.split('.');
		if (parts.length !== 3) {
			return false;
		}

		// Each part should be non-empty and look like base64url
		return parts.every(part => part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part));
	}

	/**
	 * Verify a Forsion JWT token by calling the Forsion Backend API
	 * @param token The JWT token to verify
	 * @returns The user information from Forsion
	 * @throws ForsionAuthError if verification fails
	 */
	@bindThis
	public async verifyToken(token: string): Promise<ForsionUserInfo> {
		const apiUrl = this.config.forsion?.apiUrl;

		if (!apiUrl) {
			throw new ForsionAuthError('Forsion API URL is not configured');
		}

		try {
			const response = await fetch(`${apiUrl}/api/auth/me`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => 'Unknown error');
				throw new ForsionAuthError(`Forsion token verification failed (HTTP ${response.status}): ${errorText}`);
			}

			const userData = await response.json() as Record<string, unknown>;

			// Map Forsion Backend response to ForsionUserInfo
			// Forsion Backend /api/auth/me returns: { id, username, email, phone, ... }
			if (!userData.id || !userData.username) {
				throw new ForsionAuthError('Invalid response from Forsion Backend: missing id or username');
			}

			return {
				id: String(userData.id),
				username: String(userData.username),
				email: userData.email ? String(userData.email) : undefined,
				emailVerified: typeof userData.emailVerified === 'boolean' ? userData.emailVerified : undefined,
				phone: userData.phone ? String(userData.phone) : undefined,
				avatar: userData.avatar ? String(userData.avatar) : undefined,
				createdAt: userData.createdAt ? String(userData.createdAt) : undefined,
			};
		} catch (error) {
			if (error instanceof ForsionAuthError) {
				throw error;
			}
			throw new ForsionAuthError(`Failed to verify Forsion token: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}
