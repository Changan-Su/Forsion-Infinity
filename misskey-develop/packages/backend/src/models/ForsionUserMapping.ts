/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, JoinColumn, OneToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

/**
 * Maps Forsion user IDs to Misskey user IDs
 * This allows users from Forsion backend to be associated with local Misskey accounts
 */
@Entity('forsion_user_mapping')
@Index(['forsionUserId'], { unique: true })
export class MiForsionUserMapping {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column('varchar', {
		length: 128,
		comment: 'Forsion user ID from JWT token',
	})
	public forsionUserId: string;

	@Index({ unique: true })
	@Column({
		...id(),
		comment: 'Misskey user ID',
	})
	public misskeyUserId: string;

	@OneToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'misskeyUserId', referencedColumnName: 'id' })
	public misskeyUser: MiUser | null;

	@Column('timestamp with time zone', {
		comment: 'Timestamp when the mapping was created',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Timestamp when the user last logged in via Forsion',
	})
	public lastLoginAt: Date | null;

	constructor(data: Partial<MiForsionUserMapping>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
