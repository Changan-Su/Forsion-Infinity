/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import type { Config } from '@/config.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { StatusError } from '@/misc/status-error.js';
import { InternalStorageService } from '@/core/InternalStorageService.js';
import { getSafeContentType } from './FileServerUtils.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { bindThis } from '@/decorators.js';

@Injectable()
export class FileServerHtmlBundleHandler {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private internalStorageService: InternalStorageService,
	) {}

	@bindThis
	public async handle(
		request: FastifyRequest<{ Params: { fileId: string; path: string } }>,
		reply: FastifyReply,
	) {
		const { fileId, path: filePath } = request.params;

		// Resolve file
		const file = await this.driveFilesRepository.findOneBy({ id: fileId });

		if (!file) {
			throw new StatusError('File not found', 404);
		}

		if (!file.isHtmlBundle || !file.htmlBundlePath) {
			throw new StatusError('Not an HTML Bundle', 400);
		}

		// Resolve file path within bundle
		const bundleBasePath = this.internalStorageService.resolvePath(file.htmlBundlePath);
		const requestedPath = path.join(bundleBasePath, filePath);

		// Security: Prevent directory traversal
		if (!requestedPath.startsWith(bundleBasePath)) {
			throw new StatusError('Invalid path', 403);
		}

		// Check if file exists
		try {
			await fs.promises.access(requestedPath);
		} catch {
			throw new StatusError('File not found in bundle', 404);
		}

		// Get file stats
		const stats = await fs.promises.stat(requestedPath);
		if (stats.isDirectory()) {
			throw new StatusError('Cannot serve directory', 400);
		}

		// Determine content type
		const ext = path.extname(requestedPath).toLowerCase();
		const contentTypes: Record<string, string> = {
			'.html': 'text/html',
			'.htm': 'text/html',
			'.css': 'text/css',
			'.js': 'application/javascript',
			'.json': 'application/json',
			'.png': 'image/png',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.gif': 'image/gif',
			'.svg': 'image/svg+xml',
			'.webp': 'image/webp',
			'.woff': 'font/woff',
			'.woff2': 'font/woff2',
			'.ttf': 'font/ttf',
			'.eot': 'application/vnd.ms-fontobject',
			'.otf': 'font/otf',
		};

		const contentType = contentTypes[ext] || 'application/octet-stream';

		// Set headers
		reply.header('Content-Type', getSafeContentType(contentType));
		reply.header('Content-Length', stats.size);
		reply.header('Cache-Control', 'max-age=31536000, immutable');
		
		// Security headers for HTML Bundle
		reply.header('X-Content-Type-Options', 'nosniff');
		reply.header('X-Frame-Options', 'SAMEORIGIN');

		// Send file
		return reply.send(fs.createReadStream(requestedPath));
	}
}
