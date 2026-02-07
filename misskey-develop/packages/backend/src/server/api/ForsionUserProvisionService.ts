/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { MiUser, MiLocalUser } from '@/models/User.js';
import { MiForsionUserMapping } from '@/models/ForsionUserMapping.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, UserProfilesRepository, ForsionUserMappingsRepository, UserKeypairsRepository, UserPublickeysRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { generateKeyPair } from 'node:crypto';
import { promisify } from 'node:util';
import type { ForsionUserInfo } from './ForsionAuthService.js';
import { UserService } from '@/core/UserService.js';
import { IdService } from '@/core/IdService.js';

const generateKeyPairAsync = promisify(generateKeyPair);

@Injectable()
export class ForsionUserProvisionService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.forsionUserMappingsRepository)
		private forsionUserMappingsRepository: ForsionUserMappingsRepository,

		@Inject(DI.userKeypairsRepository)
		private userKeypairsRepository: UserKeypairsRepository,

		@Inject(DI.userPublickeysRepository)
		private userPublickeysRepository: UserPublickeysRepository,

		private userService: UserService,
		private idService: IdService,
	) {}

	/**
	 * Find Misskey user by Forsion user ID
	 */
	@bindThis
	public async findMisskeyUserByForsionId(forsionUserId: string): Promise<MiLocalUser | null> {
		const mapping = await this.forsionUserMappingsRepository.findOne({
			where: { forsionUserId },
			relations: ['misskeyUser'],
		});

		if (!mapping || !mapping.misskeyUser) {
			return null;
		}

		// Ensure it's a local user
		if (mapping.misskeyUser.host !== null) {
			return null;
		}

		return mapping.misskeyUser as MiLocalUser;
	}

	/**
	 * Create a new Misskey user from Forsion user info
	 */
	@bindThis
	public async createMisskeyUserFromForsion(forsionUserInfo: ForsionUserInfo): Promise<MiLocalUser> {
		const timestamp = new Date();
		const userId = this.idService.gen();

		// Generate username from Forsion username
		// Ensure it's unique by appending numbers if necessary
		let username = forsionUserInfo.username.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
		username = username.substring(0, 20); // Limit to 20 chars

		let finalUsername = username;
		let counter = 0;
		while (true) {
			const existingUser = await this.usersRepository.findOneBy({
				usernameLower: finalUsername,
				host: null,
			});
			if (!existingUser) break;
			counter++;
			finalUsername = `${username}${counter}`;
			if (finalUsername.length > 20) {
				finalUsername = `${username.substring(0, 20 - counter.toString().length)}${counter}`;
			}
		}

		// Generate RSA keypair for ActivityPub
		const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
			modulusLength: 4096,
			publicKeyEncoding: {
				type: 'spki',
				format: 'pem',
			},
			privateKeyEncoding: {
				type: 'pkcs8',
				format: 'pem',
			},
		}) as { publicKey: string; privateKey: string };

		// Create user
		const user = await this.usersRepository.save({
			id: userId,
			username: finalUsername,
			usernameLower: finalUsername.toLowerCase(),
			host: null,
			token: null, // No native token for Forsion users
			isAdmin: false,
			isLocked: false,
			isExplorable: true,
			isBot: false,
			isCat: false,
			isSuspended: false,
			isDeleted: false,
			isHibernated: false,
			lastActiveDate: timestamp,
			hideOnlineStatus: false,
		} as MiUser);

		// Create user profile
		await this.userProfilesRepository.save({
			userId: user.id,
			email: forsionUserInfo.email || null,
			emailVerified: forsionUserInfo.emailVerified || false,
			autoAcceptFollowed: false,
			noCrawle: false,
			preventAiLearning: true,
			alwaysMarkNsfw: false,
			autoSensitive: false,
			carefulBot: false,
			injectFeaturedNote: true,
			receiveAnnouncementEmail: true,
		});

		// Create keypair
		await this.userKeypairsRepository.save({
			userId: user.id,
			publicKey: publicKey,
			privateKey: privateKey,
		});

		// Create public key record
		await this.userPublickeysRepository.save({
			userId: user.id,
			keyId: `${user.id}#main-key`,
			keyPem: publicKey,
		});

		// Create Forsion user mapping
		await this.forsionUserMappingsRepository.save({
			id: this.idService.gen(),
			forsionUserId: forsionUserInfo.id,
			misskeyUserId: user.id,
			createdAt: timestamp,
			lastLoginAt: timestamp,
		});

		// Notify system webhooks
		await this.userService.notifySystemWebhook(user, 'userCreated');

		return user as MiLocalUser;
	}

	/**
	 * Update last login time for Forsion user
	 */
	@bindThis
	public async updateLastLogin(forsionUserId: string): Promise<void> {
		await this.forsionUserMappingsRepository.update(
			{ forsionUserId },
			{ lastLoginAt: new Date() },
		);
	}

	/**
	 * Get or create Misskey user from Forsion user info
	 */
	@bindThis
	public async getOrCreateUser(forsionUserInfo: ForsionUserInfo): Promise<MiLocalUser> {
		// Try to find existing user
		let user = await this.findMisskeyUserByForsionId(forsionUserInfo.id);

		if (user) {
			// Update last login time
			await this.updateLastLogin(forsionUserInfo.id);
			return user;
		}

		// Create new user
		user = await this.createMisskeyUserFromForsion(forsionUserInfo);
		return user;
	}
}
