/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Hot reload client. The build copies this file into the app as "ti.hotreload.bootstrap.js"
 * when the "--hot-reload" flag is set. It runs in the app, not in Node.js.
 *
 * The client receives changed files from the CLI and writes them to the override directory.
 * The native asset loader reads that directory before the files in the app package.
 * See "cli/lib/hot-reload/server.js" for the protocol.
 */
/* global Ti */
'use strict';

const PROTOCOL_VERSION = 1;
const RECONNECT_MS = 2000;
const READ_BUFFER_SIZE = 64 * 1024;
const TAG = '[HotReload]';

const config = require('/_hot_reload_.json');

// Must match the directory in KrollAssetHelper.java.
const rootDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, 'hot-reload');
const filesPath = Ti.Filesystem.getFile(rootDir.nativePath, 'files', 'Resources').nativePath;
const manifestFile = Ti.Filesystem.getFile(rootDir.nativePath, 'manifest');

let socket = null;
let pending = Ti.createBuffer({ length: 0 });
let reconnectTimer = null;
let restarting = false;
let rejected = false;

function readManifest() {
	try {
		if (manifestFile.exists()) {
			return manifestFile.read().text || '';
		}
	} catch (err) {
		Ti.API.warn(`${TAG} Cannot read the manifest: ${err.message}`);
	}
	return '';
}

function send(message) {
	if (!socket) {
		return;
	}
	const headerBuffer = Ti.createBuffer({ value: JSON.stringify(message) });
	const frame = Ti.createBuffer({ length: 4 });
	Ti.Codec.encodeNumber({
		source: headerBuffer.length,
		dest: frame,
		position: 0,
		type: Ti.Codec.TYPE_INT,
		byteOrder: Ti.Codec.BIG_ENDIAN
	});
	frame.append(headerBuffer);
	socket.write(frame);
}

function isSafePath(path) {
	return typeof path === 'string' && path.length > 0 && path[0] !== '/' && path.split('/').indexOf('..') < 0;
}

function ensureParentDirectory(file) {
	const parent = file.parent;
	if (parent && !parent.exists()) {
		parent.createDirectory(true);
	}
}

/**
 * Writes the files of one patch to the override directory.
 * @param {object} patch header of the patch frame
 * @param {Ti.Buffer} data buffer that holds the frame
 * @param {number} offset position of the first file byte in `data`
 */
function applyPatch(patch, data, offset) {
	// Without a manifest, the CLI replaces all overrides at the next connect.
	// Delete it first, so that a crash in the middle of the patch cannot leave a mixed state.
	if (manifestFile.exists()) {
		manifestFile.deleteFile();
	}
	if (patch.reset) {
		const filesDir = Ti.Filesystem.getFile(rootDir.nativePath, 'files');
		if (filesDir.exists()) {
			filesDir.deleteDirectory(true);
		}
	}

	for (const entry of patch.files) {
		if (!isSafePath(entry.path)) {
			throw new Error(`Refused the path "${entry.path}"`);
		}
		const file = Ti.Filesystem.getFile(filesPath, entry.path);
		ensureParentDirectory(file);
		if (file.exists()) {
			file.deleteFile();
		}
		const written = entry.size > 0
			? file.write(data.clone(offset, entry.size).toBlob())
			: file.write('');
		if (!written) {
			throw new Error(`Cannot write "${entry.path}"`);
		}
		offset += entry.size;
	}

	for (const path of patch.removed) {
		if (!isSafePath(path)) {
			continue;
		}
		const file = Ti.Filesystem.getFile(filesPath, path);
		if (file.exists()) {
			file.deleteFile();
		}
	}

	ensureParentDirectory(manifestFile);
	manifestFile.write(patch.manifest);
}

function onPatch(patch, data, offset) {
	const count = patch.files.length + patch.removed.length;
	try {
		if (count > 0 || patch.reset) {
			applyPatch(patch, data, offset);
		}
	} catch (err) {
		Ti.API.error(`${TAG} ${err.message}`);
		send({ t: 'ack', id: patch.id, ok: false, error: err.message });
		return;
	}
	send({ t: 'ack', id: patch.id, ok: true });

	if (patch.action === 'restart') {
		Ti.API.info(`${TAG} Applied ${count} file(s), restart`);
		restarting = true;
		close();
		Ti.App._restart();
	}
}

/**
 * Reads all complete frames from the `pending` buffer.
 */
function parseFrames() {
	while (pending.length >= 4) {
		const headerLength = Ti.Codec.decodeNumber({
			source: pending,
			position: 0,
			type: Ti.Codec.TYPE_INT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		if (pending.length < 4 + headerLength) {
			return;
		}
		const header = JSON.parse(Ti.Codec.decodeString({
			source: pending,
			position: 4,
			length: headerLength,
			charset: Ti.Codec.CHARSET_UTF8
		}));
		const end = 4 + headerLength + (header.size || 0);
		if (pending.length < end) {
			return;
		}

		const frame = pending;
		pending = frame.length > end ? frame.clone(end, frame.length - end) : Ti.createBuffer({ length: 0 });
		if (header.t === 'patch') {
			onPatch(header, frame, 4 + headerLength);
		} else if (header.t === 'reject') {
			// The server belongs to the build of another app. Stop until the next start of this app.
			Ti.API.warn(`${TAG} Stopped: ${header.reason}`);
			rejected = true;
			close();
		}
		if (restarting || rejected) {
			return;
		}
	}
}

function close() {
	if (socket) {
		try {
			socket.close();
		} catch (err) {
			// The socket is closed already.
		}
		socket = null;
	}
	pending = Ti.createBuffer({ length: 0 });
}

function scheduleReconnect() {
	close();
	if (restarting || rejected || reconnectTimer) {
		return;
	}
	reconnectTimer = setTimeout(function () {
		reconnectTimer = null;
		connect();
	}, RECONNECT_MS);
}

function connect() {
	const tcp = Ti.Network.Socket.createTCP({
		host: config.host,
		port: config.port,
		connected: function (e) {
			socket = e.socket;
			Ti.API.info(`${TAG} Connected to ${config.host}:${config.port}`);
			send({
				t: 'hello',
				v: PROTOCOL_VERSION,
				token: config.token,
				app: Ti.App.id,
				platform: Ti.Platform.osname,
				manifest: readManifest()
			});
			Ti.Stream.pump(e.socket, function (data) {
				if (restarting || rejected) {
					return;
				}
				if (data.bytesProcessed < 0 || data.errorStatus) {
					scheduleReconnect();
					return;
				}
				try {
					pending.append(data.buffer, 0, data.bytesProcessed);
					parseFrames();
				} catch (err) {
					Ti.API.error(`${TAG} ${err.message}`);
					scheduleReconnect();
				}
			}, READ_BUFFER_SIZE, true);
		},
		error: function () {
			// The CLI does not run, or it is not reachable yet. Try again later.
			scheduleReconnect();
		}
	});
	tcp.connect();
}

connect();
