/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';
import { HTML_BUNDLE_MAX_SIZE, HTML_BUNDLE_MAX_FILES, HTML_BUNDLE_FORBIDDEN_EXTENSIONS } from '@/const.js';
import { bindThis } from '@/decorators.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';

type ExtractResult = {
	bundlePath: string;
	indexHtmlPath: string;
	/** Relative path from extract root to the folder containing index.html (empty string if in root) */
	relativeBundlePath: string;
};

@Injectable()
export class HtmlBundleService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('html-bundle');
	}

	/**
	 * Validate and extract HTML Bundle from ZIP file
	 * @param zipPath Path to the ZIP file
	 * @param extractTo Path to extract the bundle to
	 * @returns Path to the extracted bundle and index.html
	 */
	@bindThis
	public async extractHtmlBundle(zipPath: string, extractTo: string): Promise<ExtractResult> {
		this.logger.info(`Extracting HTML Bundle from ${zipPath} to ${extractTo}`);

		// Ensure extract directory exists
		await fs.mkdir(extractTo, { recursive: true });

		// Read and parse ZIP file
		const zip = new AdmZip(zipPath);
		const entries = zip.getEntries();

		let fileCount = 0;
		let totalSize = 0;
		let indexHtmlPath: string | null = null;
		const filePaths: string[] = [];

		// First pass: validate entries and find index.html
		for (const entry of entries) {
			// Skip directories
			if (entry.isDirectory) {
				continue;
			}

			fileCount++;
			totalSize += entry.header.size;

			// Check file count limit
			if (fileCount > HTML_BUNDLE_MAX_FILES) {
				throw new IdentifiableError('e8a3c2d1-4f5e-6a7b-8c9d-0e1f2a3b4c5d', 'Too many files in HTML Bundle');
			}

			// Check total size limit
			if (totalSize > HTML_BUNDLE_MAX_SIZE) {
				throw new IdentifiableError('f9b4d3e2-5g6f-7b8c-9d0e-1f2g3h4i5j6k', 'HTML Bundle exceeds maximum size');
			}

			// Check for forbidden file extensions
			const entryPath = entry.entryName.toLowerCase();
			const hasForbiddenExt = HTML_BUNDLE_FORBIDDEN_EXTENSIONS.some(ext => entryPath.endsWith(ext));
			if (hasForbiddenExt) {
				throw new IdentifiableError('a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p', `Forbidden file type in HTML Bundle: ${entry.entryName}`);
			}

			// Normalize the path
			const normalizedName = entry.entryName.replace(/^\.\//, '').replace(/\\/g, '/');
			filePaths.push(normalizedName);

			// Prevent directory traversal attacks
			if (entry.entryName.includes('..') || entry.entryName.startsWith('/')) {
				throw new IdentifiableError('b2c3d4e5-6f7g-8h9i-0j1k-2l3m4n5o6p7q', `Invalid file path in HTML Bundle: ${entry.entryName}`);
			}
		}

		// Find index.html - check root first, then check for common parent folder
		const rootIndexHtml = filePaths.find(p => p === 'index.html');
		if (rootIndexHtml) {
			indexHtmlPath = 'index.html';
		} else {
			// Check if all files share a common parent folder with index.html inside
			const parentFolders = new Set<string>();
			for (const filePath of filePaths) {
				const parts = filePath.split('/');
				if (parts.length > 1) {
					parentFolders.add(parts[0]);
				}
			}

			// If there's exactly one parent folder, look for index.html inside it
			if (parentFolders.size === 1) {
				const parentFolder = [...parentFolders][0];
				const indexInSubfolder = filePaths.find(p => p === `${parentFolder}/index.html`);
				if (indexInSubfolder) {
					indexHtmlPath = indexInSubfolder;
					this.logger.info(`Found index.html in subfolder: ${indexHtmlPath}`);
				}
			}

			// Also check for any index.html file in the archive
			if (!indexHtmlPath) {
				const anyIndexHtml = filePaths.find(p => p.endsWith('/index.html') || p === 'index.html');
				if (anyIndexHtml) {
					indexHtmlPath = anyIndexHtml;
					this.logger.info(`Found index.html at: ${indexHtmlPath}`);
				}
			}
		}

		// Check if index.html exists
		if (!indexHtmlPath) {
			throw new IdentifiableError('c3d4e5f6-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 'HTML Bundle must contain index.html');
		}

		// Extract files
		zip.extractAllTo(extractTo, true);

		// Build the full path to index.html
		const fullIndexHtmlPath = path.join(extractTo, indexHtmlPath);
		
		// Verify index.html exists after extraction
		try {
			await fs.access(fullIndexHtmlPath);
		} catch {
			throw new IdentifiableError('d4e5f6g7-8h9i-0j1k-2l3m-4n5o6p7q8r9s', `index.html not found after extraction at ${fullIndexHtmlPath}`);
		}

		// Determine the bundle path (the folder containing index.html)
		const bundlePath = path.dirname(fullIndexHtmlPath);
		
		// Calculate relative path from extract root to bundle folder
		const relativeBundlePath = path.dirname(indexHtmlPath);

		this.logger.info(`HTML Bundle extracted successfully. Bundle path: ${bundlePath}, index.html: ${fullIndexHtmlPath}, relative: ${relativeBundlePath}`);

		return {
			bundlePath,
			indexHtmlPath: fullIndexHtmlPath,
			relativeBundlePath: relativeBundlePath === '.' ? '' : relativeBundlePath,
		};
	}

	/**
	 * Clean up extracted HTML Bundle directory
	 */
	@bindThis
	public async cleanupBundle(bundlePath: string): Promise<void> {
		try {
			await fs.rm(bundlePath, { recursive: true, force: true });
			this.logger.info(`Cleaned up HTML Bundle: ${bundlePath}`);
		} catch (error) {
			this.logger.warn(`Failed to cleanup HTML Bundle: ${bundlePath}`, error);
		}
	}
}
