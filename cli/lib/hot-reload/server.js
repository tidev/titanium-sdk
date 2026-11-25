/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Hot reload server. Watches the project and pushes the changed files to the running app.
 *
 * Frame format, in both directions:
 *   uint32 (big endian) header length | header (UTF-8 JSON) | body (header.size bytes, optional)
 *
 * Messages:
 *   app -> cli  { t: 'hello', v, token, app, platform, manifest }
 *   cli -> app  { t: 'reject', reason }   The app must not connect again.
 *   cli -> app  { t: 'patch', id, action, reset, manifest, files: [ { path, hash, size } ], removed, index, size }
 *               `index` is the new content of the require index. null deletes the override of the index.
 *               The app keeps its index when the field is absent.
 *   app -> cli  { t: 'ack', id, ok, error }
 *   app -> cli  { t: 'log', level, msg }
 */

import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

export const PROTOCOL_VERSION = 1;
export const DEFAULT_PORT = 8325;

// Resource sub folders that hold files for one platform only.
const PLATFORM_DIRS = [ 'android', 'iphone', 'ipad', 'ios', 'windows', 'mobileweb', 'blackberry', 'tizen' ];

// Alloy files that change the output of every controller.
const ALLOY_FULL_COMPILE_FILES = [ 'app/styles/app.tss', 'app/config.json', 'app/alloy.js' ];

// File types that the require index of the app lists.
const INDEX_FILE_REGEXP = /\.(js|cjs|json)$/i;

// Changes that arrive within this window go to the app as one patch.
const DEBOUNCE_MS = 150;

// A frame header from the app is small. A larger one is not from our client.
const MAX_HEADER_LENGTH = 1024 * 1024;

/**
 * Encodes one frame.
 * @param {object} header JSON header. The function sets `size` when a body exists.
 * @param {Buffer} [body] raw bytes that follow the header
 * @returns {Buffer}
 */
export function encodeFrame(header, body) {
	if (body && body.length) {
		header.size = body.length;
	}
	const headerBuffer = Buffer.from(JSON.stringify(header), 'utf8');
	const lengthBuffer = Buffer.alloc(4);
	lengthBuffer.writeUInt32BE(headerBuffer.length, 0);
	return body && body.length
		? Buffer.concat([ lengthBuffer, headerBuffer, body ])
		: Buffer.concat([ lengthBuffer, headerBuffer ]);
}

/**
 * Splits a byte stream into frames.
 */
export class FrameParser {
	constructor() {
		this.pending = Buffer.alloc(0);
	}

	/**
	 * @param {Buffer} chunk bytes from the socket
	 * @returns {Array<{header: object, body: Buffer}>} the complete frames
	 */
	push(chunk) {
		this.pending = this.pending.length ? Buffer.concat([ this.pending, chunk ]) : chunk;
		const frames = [];
		while (this.pending.length >= 4) {
			const headerLength = this.pending.readUInt32BE(0);
			if (headerLength > MAX_HEADER_LENGTH) {
				throw new Error(`Frame header of ${headerLength} bytes is over the limit`);
			}
			if (this.pending.length < 4 + headerLength) {
				break;
			}
			const header = JSON.parse(this.pending.toString('utf8', 4, 4 + headerLength));
			const size = header.size || 0;
			const end = 4 + headerLength + size;
			if (this.pending.length < end) {
				break;
			}
			frames.push({ header, body: this.pending.subarray(4 + headerLength, end) });
			this.pending = this.pending.subarray(end);
		}
		return frames;
	}
}

export class HotReloadServer {
	/**
	 * @param {object} options options
	 * @param {string} options.projectDir path of the Titanium project
	 * @param {string} options.platform name of the platform directory, for example "android"
	 * @param {string} options.token secret that the build wrote into the app
	 * @param {number} [options.port] TCP port
	 * @param {string} [options.host] address to listen on
	 * @param {object} [options.logger] CLI logger
	 * @param {object} [options.baseIndex] content of the "index.json" file of the build. The require()
	 * function of the app finds a file only if this index lists it. The server sends an updated index
	 * when a file is new or removed.
	 * @param {Function} [options.transform] `(runtimePath, file, content) => Buffer`. Converts the source
	 * of a changed file to the form that the build puts into the app. It throws when the source has an error.
	 */
	constructor(options) {
		this.projectDir = options.projectDir;
		this.platform = options.platform;
		this.token = options.token;
		this.port = options.port || DEFAULT_PORT;
		this.host = options.host || '127.0.0.1';
		this.logger = options.logger || console;
		this.transform = options.transform || null;
		this.baseIndex = options.baseIndex || null;
		this.sentIndex = null; // the index override that the connected apps hold, null for none
		this.resourcesDir = path.join(this.projectDir, 'Resources');
		this.alloyDir = path.join(this.projectDir, 'app');
		this.isAlloy = fs.existsSync(path.join(this.alloyDir, 'controllers'));

		this.hashCache = new Map(); // absolute path -> { mtimeMs, size, hash }
		this.baseline = new Map(); // runtime path -> hash, the state that the build put into the app
		this.current = new Map(); // runtime path -> { file, hash, size }
		this.manifest = '';
		this.clients = new Set();
		this.watchers = [];
		this.nextPatchId = 1;
		this.flushTimer = null;
		this.alloyRunning = false;
		this.alloyQueued = null;
	}

	/**
	 * Records the baseline, opens the port and starts the watchers.
	 * Call this after the build, because the baseline must match the files in the app.
	 * @returns {Promise<void>}
	 */
	async start() {
		this.current = this.scan();
		this.baseline = new Map();
		for (const [ key, entry ] of this.current) {
			this.baseline.set(key, entry.hash);
		}
		this.manifest = this.computeManifest(this.current);

		this.server = net.createServer(socket => this.onConnection(socket));
		await new Promise((resolve, reject) => {
			this.server.once('error', reject);
			this.server.listen(this.port, this.host, () => {
				this.server.off('error', reject);
				resolve();
			});
		});
		this.server.on('error', err => this.logger.error(`[HotReload] ${err.message}`));

		this.watch(this.resourcesDir, () => this.scheduleFlush());
		if (this.isAlloy) {
			this.watch(this.alloyDir, file => this.compileAlloy(file));
		}
		this.logger.info(`[HotReload] Server listens on ${this.host}:${this.port}`);
	}

	/**
	 * Closes the port, the connections and the watchers.
	 */
	stop() {
		clearTimeout(this.flushTimer);
		for (const watcher of this.watchers) {
			watcher.close();
		}
		this.watchers = [];
		for (const client of this.clients) {
			client.socket.destroy();
		}
		this.clients.clear();
		this.server && this.server.close();
	}

	watch(dir, onChange) {
		if (!fs.existsSync(dir)) {
			return;
		}
		const watcher = fs.watch(dir, { recursive: true }, (_event, file) => {
			const name = file ? path.basename(file.toString()) : '';
			if (name.startsWith('.') || name.endsWith('~')) {
				return;
			}
			onChange(file ? path.join(dir, file.toString()) : null);
		});
		watcher.on('error', err => this.logger.error(`[HotReload] Watcher failed: ${err.message}`));
		this.watchers.push(watcher);
	}

	/**
	 * Lists the files as the app sees them at runtime.
	 * A file in the platform directory replaces the file of the same name in "Resources".
	 * @returns {Map<string, {file: string, hash: string, size: number}>}
	 */
	scan() {
		const result = new Map();
		const platformEntries = [];
		const walk = (dir, relative) => {
			let entries;
			try {
				entries = fs.readdirSync(dir, { withFileTypes: true });
			} catch {
				return;
			}
			for (const entry of entries) {
				if (entry.name.startsWith('.')) {
					continue;
				}
				const file = path.join(dir, entry.name);
				const rel = relative ? `${relative}/${entry.name}` : entry.name;
				if (entry.isDirectory()) {
					if (!relative && PLATFORM_DIRS.includes(entry.name)) {
						if (entry.name === this.platform) {
							walk(file, `${entry.name}`);
						}
						continue;
					}
					walk(file, rel);
				} else if (entry.isFile()) {
					const info = this.hashFile(file);
					if (!info) {
						continue;
					}
					const prefix = `${this.platform}/`;
					if (rel.startsWith(prefix)) {
						platformEntries.push([ rel.slice(prefix.length), info ]);
					} else {
						result.set(rel, info);
					}
				}
			}
		};
		walk(this.resourcesDir, '');
		for (const [ key, info ] of platformEntries) {
			result.set(key, info);
		}
		return result;
	}

	hashFile(file) {
		try {
			const stat = fs.statSync(file);
			const cached = this.hashCache.get(file);
			if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
				return { file, hash: cached.hash, size: cached.size };
			}
			const hash = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
			this.hashCache.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, hash });
			return { file, hash, size: stat.size };
		} catch {
			// The file went away between the directory listing and the read.
			return null;
		}
	}

	computeManifest(state) {
		const hash = crypto.createHash('sha1');
		for (const key of [ ...state.keys() ].sort()) {
			hash.update(`${key}:${state.get(key).hash}\n`);
		}
		return hash.digest('hex');
	}

	/**
	 * Builds the require index for a state: the index of the build, plus the new files, minus the removed files.
	 * @param {Map<string, object>} state runtime path -> file info
	 * @returns {string|null} the JSON content, or null when the index of the build is correct
	 */
	computeIndex(state) {
		if (!this.baseIndex) {
			return null;
		}
		const index = Object.assign({}, this.baseIndex);
		let changed = false;
		for (const key of state.keys()) {
			if (!this.baseline.has(key) && INDEX_FILE_REGEXP.test(key) && !index[`Resources/${key}`]) {
				index[`Resources/${key}`] = 1;
				changed = true;
			}
		}
		for (const key of this.baseline.keys()) {
			if (!state.has(key) && index[`Resources/${key}`]) {
				delete index[`Resources/${key}`];
				changed = true;
			}
		}
		return changed ? JSON.stringify(index) : null;
	}

	scheduleFlush() {
		clearTimeout(this.flushTimer);
		this.flushTimer = setTimeout(() => this.flush(), DEBOUNCE_MS);
	}

	/**
	 * Compares the project with the last state and sends the difference to every app.
	 */
	flush() {
		if (this.alloyRunning) {
			// The Alloy compiler still writes files. compileAlloy() calls flush() when it is done.
			return;
		}
		const previous = this.current;
		const next = this.scan();
		const changed = [];
		const removed = [];
		for (const [ key, entry ] of next) {
			const old = previous.get(key);
			if (!old || old.hash !== entry.hash) {
				changed.push(key);
			}
		}
		for (const key of previous.keys()) {
			if (!next.has(key)) {
				removed.push(key);
			}
		}
		this.current = next;
		this.manifest = this.computeManifest(next);
		if (!changed.length && !removed.length) {
			return;
		}

		this.logger.info(`[HotReload] Changed: ${[ ...changed, ...removed ].join(', ')}`);
		const index = this.computeIndex(next);
		const frame = this.buildPatch(changed, removed, false, 'restart', index !== this.sentIndex ? index : undefined);
		if (!frame) {
			// Keep the last state that the apps hold, so that the next change sends these files again.
			this.current = previous;
			this.manifest = this.computeManifest(previous);
			return;
		}
		this.sentIndex = index;
		for (const client of this.clients) {
			if (client.ready) {
				client.socket.write(frame);
			}
		}
	}

	/**
	 * @param {string[]} changed runtime paths to send
	 * @param {string[]} removed runtime paths to delete
	 * @param {boolean} reset true when the app must delete its override directory first
	 * @param {string} action what the app does after it applied the patch
	 * @param {string|null} [index] new require index, null to delete the override, undefined for no change
	 * @returns {Buffer|null} the frame, or null when a file cannot be read or transformed
	 */
	buildPatch(changed, removed, reset, action, index) {
		const files = [];
		const bodies = [];
		for (const key of changed) {
			const entry = this.current.get(key);
			let content;
			try {
				content = fs.readFileSync(entry.file);
			} catch (err) {
				this.logger.error(`[HotReload] Cannot read ${entry.file}: ${err.message}`);
				return null;
			}
			if (this.transform) {
				try {
					content = Buffer.from(this.transform(key, entry.file, content));
				} catch (err) {
					// A syntax error in the source. The app keeps the last version that works.
					this.logger.error(`[HotReload] Cannot process ${entry.file}: ${err.codeFrame || err.message}`);
					return null;
				}
			}
			files.push({ path: key, hash: entry.hash, size: content.length });
			bodies.push(content);
		}
		return encodeFrame({
			t: 'patch',
			id: this.nextPatchId++,
			action,
			reset,
			manifest: this.manifest,
			files,
			removed,
			index
		}, Buffer.concat(bodies));
	}

	onConnection(socket) {
		const client = { socket, ready: false, parser: new FrameParser() };
		socket.setNoDelay(true);
		socket.on('data', chunk => {
			let frames;
			try {
				frames = client.parser.push(chunk);
			} catch (err) {
				this.logger.warn(`[HotReload] Closed a connection: ${err.message}`);
				socket.destroy();
				return;
			}
			for (const frame of frames) {
				this.onMessage(client, frame.header);
			}
		});
		socket.on('error', () => {});
		socket.on('close', () => {
			if (this.clients.delete(client)) {
				this.logger.info('[HotReload] App disconnected');
			}
		});
	}

	onMessage(client, message) {
		if (!client.ready) {
			if (message.t !== 'hello' || message.token !== this.token || message.v !== PROTOCOL_VERSION) {
				// Another app with a hot reload client runs on the device. It is from a different build.
				const name = typeof message.app === 'string' ? message.app : 'an app';
				this.logger.warn(`[HotReload] Refused ${name}: it is not from this build`);
				client.socket.end(encodeFrame({ t: 'reject', reason: 'The app is not from the build that this server belongs to' }));
				return;
			}
			client.ready = true;
			this.clients.add(client);
			this.logger.info('[HotReload] App connected');
			this.sync(client, message.manifest);
			return;
		}

		switch (message.t) {
			case 'ack':
				if (!message.ok) {
					this.logger.error(`[HotReload] App failed to apply patch ${message.id}: ${message.error}`);
				}
				break;
			case 'log':
				this.logger[message.level === 'error' ? 'error' : 'info'](`[HotReload] ${message.msg}`);
				break;
			case 'ping':
				client.socket.write(encodeFrame({ t: 'pong' }));
				break;
		}
	}

	/**
	 * Brings an app that just connected to the current state.
	 * @param {object} client the connection
	 * @param {string} manifest the manifest that the app holds
	 */
	sync(client, manifest) {
		if (manifest === this.manifest) {
			client.socket.write(encodeFrame({
				t: 'patch', id: this.nextPatchId++, action: 'none', reset: false, manifest: this.manifest, files: [], removed: []
			}));
			return;
		}

		// The app holds an unknown state. Send every difference from the build, and replace all overrides.
		const changed = [];
		const removed = [];
		for (const [ key, entry ] of this.current) {
			if (this.baseline.get(key) !== entry.hash) {
				changed.push(key);
			}
		}
		for (const key of this.baseline.keys()) {
			if (!this.current.has(key)) {
				removed.push(key);
			}
		}
		// An app without overrides that matches the build needs no restart.
		const action = (!manifest && !changed.length && !removed.length) ? 'none' : 'restart';
		// The reset deletes the index override of the app, so send the index only when one is necessary.
		const frame = this.buildPatch(changed, removed, true, action, this.computeIndex(this.current) || undefined);
		frame && client.socket.write(frame);
	}

	/**
	 * Runs the Alloy compiler. The compiler writes to "Resources", and flush() sends the result.
	 * @param {string|null} file the changed file under "app"
	 */
	compileAlloy(file) {
		if (this.alloyRunning) {
			this.alloyQueued = { file };
			return;
		}
		this.alloyRunning = true;

		let config = `platform=${this.platform}`;
		if (file) {
			const relative = path.relative(this.projectDir, file).replace(/\\/g, '/');
			if (!relative.startsWith('app/themes/') && !ALLOY_FULL_COMPILE_FILES.includes(relative)) {
				config += `,file=${relative}`;
			}
		}

		let command = process.platform === 'win32' ? 'alloy.cmd' : 'alloy';
		let args = [ 'compile', this.alloyDir, '--no-colors', '--config', config ];
		if (process.env.ALLOY_PATH) {
			args.unshift(process.env.ALLOY_PATH);
			command = process.execPath;
		}

		const started = Date.now();
		let output = '';
		const child = spawn(command, args, { cwd: this.projectDir });
		child.stdout.on('data', data => output += data);
		child.stderr.on('data', data => output += data);
		const done = (code, err) => {
			if (!this.alloyRunning) {
				return;
			}
			this.alloyRunning = false;
			if (err || code) {
				this.logger.error(`[HotReload] Alloy compile failed: ${err ? err.message : output.trim()}`);
			} else {
				this.logger.info(`[HotReload] Alloy compile finished in ${Date.now() - started} ms`);
			}
			if (this.alloyQueued) {
				const queued = this.alloyQueued;
				this.alloyQueued = null;
				// More than one file changed during the compile, so compile the whole project.
				this.compileAlloy(queued.file === file ? file : null);
				return;
			}
			if (!err && !code) {
				this.flush();
			}
		};
		child.on('error', err => done(1, err));
		child.on('close', code => done(code));
	}
}
