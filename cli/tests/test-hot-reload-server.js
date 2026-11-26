/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import fs from 'fs-extra';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { HotReloadServer, FrameParser, encodeFrame } from '../lib/hot-reload/server.js';

const PORT = 8399;
const TOKEN = 'secret';
const noopLogger = { info() {}, warn() {}, error() {} };

/**
 * Waits until the condition is true.
 * @param {Function} condition returns true when the wait is over
 * @returns {Promise<void>}
 */
async function waitFor(condition) {
	const end = Date.now() + 3000;
	while (!condition()) {
		if (Date.now() > end) {
			throw new Error('Timeout');
		}
		await new Promise(resolve => setTimeout(resolve, 20));
	}
}

/**
 * Connects a fake app and collects the patches that it receives.
 * @param {string} token token for the hello message
 * @param {string} manifest manifest for the hello message
 * @returns {Promise<object>}
 */
function connect(token, manifest) {
	return new Promise((resolve, reject) => {
		const socket = net.connect(PORT, '127.0.0.1');
		const parser = new FrameParser();
		const client = { socket, patches: [], messages: [], closed: false };
		socket.on('error', reject);
		socket.on('close', () => client.closed = true);
		socket.on('connect', () => {
			socket.write(encodeFrame({ t: 'hello', v: 1, token, platform: 'android', manifest }));
			resolve(client);
		});
		socket.on('data', chunk => {
			for (const frame of parser.push(chunk)) {
				if (frame.header.t !== 'patch') {
					client.messages.push(frame.header);
					continue;
				}
				let offset = 0;
				const contents = {};
				for (const file of frame.header.files) {
					contents[file.path] = frame.body.toString('utf8', offset, offset + file.size);
					offset += file.size;
				}
				client.patches.push({ ...frame.header, contents });
			}
		});
	});
}

describe('hot reload server', function () {
	let projectDir;
	let server;
	const clients = [];

	async function open(token, manifest) {
		const client = await connect(token, manifest);
		clients.push(client);
		return client;
	}

	beforeEach(async function () {
		projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ti-hot-reload-'));
		await fs.outputFile(path.join(projectDir, 'Resources', 'app.js'), 'one');
		await fs.outputFile(path.join(projectDir, 'Resources', 'ui', 'win.js'), 'generic');
		await fs.outputFile(path.join(projectDir, 'Resources', 'android', 'ui', 'win.js'), 'android');
		await fs.outputFile(path.join(projectDir, 'Resources', 'iphone', 'ios.js'), 'ios');
		server = new HotReloadServer({
			projectDir,
			platform: 'android',
			token: TOKEN,
			port: PORT,
			logger: noopLogger,
			baseIndex: { 'Resources/app.js': 1, 'Resources/ui/win.js': 1, 'Resources/ti.main.js': 1 }
		});
		await server.start();
	});

	afterEach(async function () {
		clients.splice(0).forEach(client => client.socket.destroy());
		server.stop();
		await fs.remove(projectDir);
	});

	it('splits a byte stream into frames', function () {
		const parser = new FrameParser();
		const bytes = Buffer.concat([
			encodeFrame({ t: 'a' }, Buffer.from('body')),
			encodeFrame({ t: 'b' })
		]);
		expect(parser.push(bytes.subarray(0, 7))).to.have.length(0);
		const frames = parser.push(bytes.subarray(7));
		expect(frames.map(frame => frame.header.t)).to.deep.equal([ 'a', 'b' ]);
		expect(frames[0].body.toString()).to.equal('body');
	});

	it('maps the platform directory to runtime paths', function () {
		const state = server.scan();
		expect([ ...state.keys() ].sort()).to.deep.equal([ 'app.js', 'ui/win.js' ]);
		expect(state.get('ui/win.js').file).to.equal(path.join(projectDir, 'Resources', 'android', 'ui', 'win.js'));
	});

	it('merges the iOS platform directories, "ios" wins over "iphone"', async function () {
		await fs.outputFile(path.join(projectDir, 'Resources', 'iphone', 'ui', 'win.js'), 'iphone');
		await fs.outputFile(path.join(projectDir, 'Resources', 'ios', 'ui', 'win.js'), 'ios');
		await fs.outputFile(path.join(projectDir, 'Resources', 'iphone', 'ios', 'nested.js'), 'nested');
		const iosServer = new HotReloadServer({
			projectDir, platform: 'ios', platformDirs: [ 'iphone', 'ios' ], token: TOKEN, port: PORT + 1, logger: noopLogger
		});
		const state = iosServer.scan();
		expect([ ...state.keys() ].sort()).to.deep.equal([ 'app.js', 'ios.js', 'ios/nested.js', 'ui/win.js' ]);
		expect(state.get('ui/win.js').file).to.equal(path.join(projectDir, 'Resources', 'ios', 'ui', 'win.js'));
	});

	it('closes a connection with a wrong token', async function () {
		const client = await open('wrong', '');
		await waitFor(() => client.closed);
		expect(client.patches).to.have.length(0);
		expect(client.messages.map(message => message.t)).to.deep.equal([ 'reject' ]);
	});

	it('sends no files to an app that matches the build', async function () {
		const client = await open(TOKEN, '');
		await waitFor(() => client.patches.length === 1);
		expect(client.patches[0]).to.include({ action: 'none', reset: true });
		expect(client.patches[0].files).to.have.length(0);
	});

	it('sends a changed file and a restart', async function () {
		const client = await open(TOKEN, '');
		await waitFor(() => client.patches.length === 1);
		await fs.writeFile(path.join(projectDir, 'Resources', 'app.js'), 'two');
		await waitFor(() => client.patches.length === 2);
		const patch = client.patches[1];
		expect(patch).to.include({ action: 'restart', reset: false });
		expect(patch.contents).to.deep.equal({ 'app.js': 'two' });
		expect(patch.manifest).to.equal(server.manifest);
	});

	it('brings an app with an unknown state back to the current state', async function () {
		const first = await open(TOKEN, '');
		await waitFor(() => first.patches.length === 1);
		await fs.writeFile(path.join(projectDir, 'Resources', 'app.js'), 'two');
		await waitFor(() => first.patches.length === 2);

		const same = await open(TOKEN, first.patches[1].manifest);
		await waitFor(() => same.patches.length === 1);
		expect(same.patches[0]).to.include({ action: 'none', reset: false });

		const stale = await open(TOKEN, 'unknown');
		await waitFor(() => stale.patches.length === 1);
		expect(stale.patches[0]).to.include({ action: 'restart', reset: true });
		expect(stale.patches[0].contents).to.deep.equal({ 'app.js': 'two' });
	});

	it('sends the transformed content of a changed file', async function () {
		let failed = false;
		server.transform = (runtimePath, file, content) => {
			if (content.toString() === 'broken') {
				failed = true;
				throw new Error('syntax error');
			}
			return Buffer.from(`${runtimePath}:${path.basename(file)}:${content}`);
		};
		const client = await open(TOKEN, '');
		await waitFor(() => client.patches.length === 1);

		// The server sends no patch for a file with an error, and sends the file after the fix.
		const before = server.manifest;
		await fs.writeFile(path.join(projectDir, 'Resources', 'app.js'), 'broken');
		await waitFor(() => failed);
		expect(client.patches).to.have.length(1);
		expect(server.manifest).to.equal(before);

		await fs.writeFile(path.join(projectDir, 'Resources', 'app.js'), 'two');
		await waitFor(() => client.patches.length === 2);
		expect(client.patches[1].contents).to.deep.equal({ 'app.js': 'app.js:app.js:two' });
	});

	it('updates the require index for a new file and a removed file', async function () {
		const client = await open(TOKEN, '');
		await waitFor(() => client.patches.length === 1);
		expect(client.patches[0]).to.not.have.property('index');

		// A changed file needs no new index.
		await fs.writeFile(path.join(projectDir, 'Resources', 'app.js'), 'two');
		await waitFor(() => client.patches.length === 2);
		expect(client.patches[1]).to.not.have.property('index');

		await fs.outputFile(path.join(projectDir, 'Resources', 'lib', 'new.js'), 'new');
		await fs.outputFile(path.join(projectDir, 'Resources', 'lib', 'logo.png'), 'png');
		await waitFor(() => client.patches.length === 3);
		expect(JSON.parse(client.patches[2].index)).to.deep.equal({
			'Resources/app.js': 1, 'Resources/ui/win.js': 1, 'Resources/ti.main.js': 1, 'Resources/lib/new.js': 1
		});

		await fs.remove(path.join(projectDir, 'Resources', 'app.js'));
		await waitFor(() => client.patches.length === 4);
		expect(JSON.parse(client.patches[3].index)).to.deep.equal({
			'Resources/ui/win.js': 1, 'Resources/ti.main.js': 1, 'Resources/lib/new.js': 1
		});

		// An app that connects later gets the same index with the reset.
		const late = await open(TOKEN, 'unknown');
		await waitFor(() => late.patches.length === 1);
		expect(late.patches[0].index).to.equal(client.patches[3].index);

		// The index of the build is correct again, so the app deletes its override.
		await fs.remove(path.join(projectDir, 'Resources', 'lib'));
		await fs.outputFile(path.join(projectDir, 'Resources', 'app.js'), 'one');
		await waitFor(() => client.patches.length >= 5 && client.patches[client.patches.length - 1].index === null);
	});

	it('warns and sends no patch for a file that needs a build', async function () {
		const warnings = [];
		server.logger = { ...noopLogger, warn: message => warnings.push(message) };
		const client = await open(TOKEN, '');
		await waitFor(() => client.patches.length === 1);

		await fs.outputFile(path.join(projectDir, 'Resources', 'logo.png'), 'image');
		await waitFor(() => warnings.some(message => message.includes('Resources/logo.png')));
		await fs.outputFile(path.join(projectDir, 'tiapp.xml'), '<ti:app/>');
		await waitFor(() => warnings.some(message => message.includes('tiapp.xml')));
		expect(warnings.some(message => message.includes('Build the app again'))).to.equal(true);

		// The next patch holds the JS file only, and the manifest does not count the other files.
		await fs.writeFile(path.join(projectDir, 'Resources', 'app.js'), 'two');
		await waitFor(() => client.patches.length === 2);
		expect(client.patches[1].contents).to.deep.equal({ 'app.js': 'two' });
		expect(client.patches[1].removed).to.deep.equal([]);
	});

	it('does not run the Alloy compiler for an image under "app"', async function () {
		const warnings = [];
		const compiled = [];
		server.logger = { ...noopLogger, warn: message => warnings.push(message) };
		server.compileAlloy = file => compiled.push(file);

		const image = path.join(projectDir, 'app', 'assets', 'images', 'logo.png');
		const strings = path.join(projectDir, 'app', 'i18n', 'en', 'strings.xml');
		const controller = path.join(projectDir, 'app', 'controllers', 'index.js');
		await fs.outputFile(image, 'image');
		await fs.outputFile(strings, '<resources/>');
		await fs.outputFile(controller, 'code');
		server.onAlloyChange(image);
		server.onAlloyChange(strings);
		server.onAlloyChange(controller);

		expect(compiled).to.deep.equal([ controller ]);
		await waitFor(() => warnings.length === 2);
		expect(warnings[0]).to.include('app/assets/images/logo.png').and.to.include('app/i18n/en/strings.xml');
		expect(warnings[1]).to.include('Build the app again');
	});

	it('reports a removed file', async function () {
		const client = await open(TOKEN, '');
		await waitFor(() => client.patches.length === 1);
		await fs.remove(path.join(projectDir, 'Resources', 'app.js'));
		await waitFor(() => client.patches.length === 2);
		expect(client.patches[1].removed).to.deep.equal([ 'app.js' ]);
	});
});
