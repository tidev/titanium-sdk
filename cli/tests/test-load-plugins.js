/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { loadPlugins } from '../lib/load-plugins.js';

const tick = () => new Promise(resolve => setTimeout(resolve, 5));

const noopLogger = {
	debug() {},
	info() {},
	warn() {},
	error() {},
	log() {}
};

/**
 * Writes a plugin that `appc.tiplugin.find()` will discover.
 *
 * @param {String} pluginsDir - The `plugins` directory to write into
 * @param {String} id - The plugin id
 * @param {String} version - The plugin version
 */
function writePlugin(pluginsDir, id, version) {
	const dir = path.join(pluginsDir, id, version);
	fs.ensureDirSync(path.join(dir, 'hooks'));
	fs.writeJsonSync(path.join(dir, 'package.json'), { name: id, version });
}

describe('loadPlugins()', () => {
	let projectDir;
	let cli;
	let config;

	beforeEach(() => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ti-plugins-'));
		fs.ensureDirSync(path.join(projectDir, 'plugins'));

		config = { get: key => (key === 'paths.plugins' ? [] : undefined) };

		cli = {
			argv: { 'project-dir': projectDir },
			env: { installPath: projectDir, os: { sdkPaths: [] } },
			tiapp: { plugins: [] },
			scanned: [],
			emitted: [],
			pending: 0,
			async scanHooks(dir) {
				this.pending++;
				await tick();
				this.pending--;
				this.scanned.push(dir);
			},
			async emit(name, data) {
				this.pending++;
				await tick();
				this.pending--;
				this.emitted.push({ name, data });
			}
		};
	});

	afterEach(() => {
		fs.removeSync(projectDir);
	});

	it('awaits every plugin hook scan before resolving', async () => {
		writePlugin(path.join(projectDir, 'plugins'), 'alpha', '1.0.0');
		writePlugin(path.join(projectDir, 'plugins'), 'beta', '2.0.0');
		cli.tiapp.plugins = [ { id: 'alpha', version: '1.0.0' }, { id: 'beta', version: '2.0.0' } ];

		await loadPlugins(noopLogger, config, cli);

		expect(cli.pending, 'scans still in flight after loadPlugins() resolved').to.equal(0);
		expect(cli.scanned).to.have.lengthOf(2);
		for (const dir of cli.scanned) {
			expect(path.basename(dir)).to.equal('hooks');
		}
	});

	it('awaits the cli:check-plugins event before resolving', async () => {
		await loadPlugins(noopLogger, config, cli);

		expect(cli.pending, 'emit still in flight after loadPlugins() resolved').to.equal(0);
		expect(cli.emitted).to.deep.equal([ { name: 'cli:check-plugins', data: { compact: true } } ]);
	});

	it('honors the silent and compact arguments', async () => {
		await loadPlugins(noopLogger, config, cli, true, false);
		expect(cli.emitted).to.deep.equal([]);

		await loadPlugins(noopLogger, config, cli, false, false);
		expect(cli.emitted).to.deep.equal([ { name: 'cli:check-plugins', data: { compact: false } } ]);
	});

	it('expands ~ in configured plugin search paths', async function () {
		if (process.platform === 'win32') {
			return this.skip();
		}

		// a `~`-prefixed path only resolves against $HOME via appc.fs.resolvePath();
		// node's path.resolve() would turn it into "<cwd>/~/..." and silently miss it
		const name = `.ti-test-plugins-${process.pid}-${Date.now()}`;
		const homePluginsDir = path.join(os.homedir(), name);
		writePlugin(homePluginsDir, 'gamma', '3.0.0');

		try {
			config = { get: key => (key === 'paths.plugins' ? [ `~/${name}` ] : undefined) };
			cli.tiapp.plugins = [ { id: 'gamma', version: '3.0.0' } ];

			await loadPlugins(noopLogger, config, cli);

			expect(cli.scanned).to.have.lengthOf(1);
			expect(cli.scanned[0]).to.equal(path.join(homePluginsDir, 'gamma', '3.0.0', 'hooks'));
		} finally {
			fs.removeSync(homePluginsDir);
		}
	});
});
