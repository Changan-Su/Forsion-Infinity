/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive } from 'vue';
import * as Misskey from 'misskey-js';
import { apiUrl } from '@@/js/config.js';
import { miLocalStorage } from '@/local-storage.js';
import { handleTokenCallback, getForsionToken, isForsionEnabled } from '@/utils/forsionAuth.js';

// TODO: 他のタブと永続化されたstateを同期

type AccountWithToken = Misskey.entities.MeDetailed & { token: string };

// Check if there's a Forsion token in URL on page load
const hasNewForsionToken = handleTokenCallback();

const accountData = miLocalStorage.getItem('account');

// TODO: 外部からはreadonlyに
export let $i: AccountWithToken | null = accountData ? reactive(JSON.parse(accountData) as AccountWithToken) : null;

// Handle Forsion authentication on app start
async function initForsionLogin(): Promise<void> {
	const forsionToken = getForsionToken();
	
	// If we have a Forsion token but no local account, try to login
	if (forsionToken && !$i && isForsionEnabled()) {
		try {
			// Call Misskey API with Forsion JWT token
			const response = await fetch(`${apiUrl}/i`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${forsionToken}`,
				},
				body: JSON.stringify({}),
			});
			
			if (response.ok) {
				const userData = await response.json() as Misskey.entities.MeDetailed;
				const accountWithToken = {
					...userData,
					token: forsionToken,
				};
				
				// Save to local storage
				miLocalStorage.setItem('account', JSON.stringify(accountWithToken));
				
				// Set $i
				$i = reactive(accountWithToken);
				
				// Reload the page to initialize with new account data
				window.location.reload();
			} else {
				console.error('Forsion login failed:', await response.text());
				// Clear invalid token
				localStorage.removeItem('forsion_jwt_token');
			}
		} catch (error) {
			console.error('Forsion login error:', error);
		}
	}
}

// Run Forsion login initialization if we have a new token
if (hasNewForsionToken) {
	initForsionLogin();
}

export const iAmModerator = $i != null && ($i.isAdmin === true || $i.isModerator === true);
export const iAmAdmin = $i != null && $i.isAdmin;

export function ensureSignin() {
	if ($i == null) throw new Error('signin required');
	return $i;
}

export let notesCount = $i == null ? 0 : $i.notesCount;
export function incNotesCount() {
	notesCount++;
}

if (_DEV_) {
	(window as any).$i = $i;
}
