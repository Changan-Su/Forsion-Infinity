#!/usr/bin/env node
/**
 * 若项目根存在 .env，则加载后执行 pnpm start；否则直接 pnpm start。
 * 使用 Node --env-file（Node 20.6+）加载 .env，无需 dotenv。
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');

const args = ['run', 'start'];
const opts = { stdio: 'inherit', env: process.env, cwd: root };

if (existsSync(envPath)) {
	// Node 20.6+ --env-file：将 .env 合并进 process.env，再 spawn 子进程继承
	const code = `const r=require('child_process').spawnSync('pnpm',${JSON.stringify(args)},{stdio:'inherit',env:process.env,cwd:${JSON.stringify(root)}});process.exit(r.status??1);`;
	const child = spawnSync(process.execPath, ['--env-file=' + envPath, '-e', code], opts);
	process.exitCode = child.status ?? 1;
} else {
	const child = spawnSync('pnpm', args, opts);
	process.exitCode = child.status ?? 1;
}
