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
import { run } from '../commands/clean.js';

const tick = () => new Promise(resolve => setTimeout(resolve, 5));

const noopLogger = {
	debug() {},
	info() {},
	warn() {},
	error() {},
	log() {}
};

/**
 * A CLI stub whose hooks and hook scans settle asynchronously, so anything that
 * fires them without awaiting shows up as a missing/out-of-order event.
 *
 * @param {Object} argv - The argv to expose to the command
 * @returns {Object}
 */
function createCLI(argv) {
	const events = [];
	return {
		argv,
		startTime: Date.now(),
		events,
		async emit(name) {
			await tick();
			events.push(name);
		},
		async scanHooks(dir) {
			await tick();
			events.push(`scan:${path.basename(path.dirname(path.dirname(dir)))}`);
		}
	};
}

describe('clean run()', () => {
	let projectDir;
	let buildDir;

	beforeEach(() => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ti-clean-'));
		buildDir = path.join(projectDir, 'build');
		for (const platform of [ 'android', 'iphone' ]) {
			fs.ensureDirSync(path.join(buildDir, platform));
			fs.writeFileSync(path.join(buildDir, `build_${platform}.log`), 'log');
		}
	});

	afterEach(() => {
		fs.removeSync(projectDir);
	});

	it('completes every platform sequence before resolving', async () => {
		const cli = createCLI({ 'project-dir': projectDir, platforms: [ 'android', 'iphone' ] });

		await run(noopLogger, {}, cli);

		// each platform runs its full pre/post hook sequence, in order, one after another
		expect(cli.events).to.deep.equal([
			'scan:android', 'clean.pre', 'clean.android.pre', 'clean.android.post', 'clean.post',
			'scan:iphone', 'clean.pre', 'clean.iphone.pre', 'clean.iphone.post', 'clean.post'
		]);
	});

	it('removes each platform build directory and log before resolving', async () => {
		const cli = createCLI({ 'project-dir': projectDir, platforms: [ 'android', 'iphone' ] });

		await run(noopLogger, {}, cli);

		for (const platform of [ 'android', 'iphone' ]) {
			expect(fs.existsSync(path.join(buildDir, platform)), `${platform} build dir`).to.equal(false);
			expect(fs.existsSync(path.join(buildDir, `build_${platform}.log`)), `${platform} log`).to.equal(false);
		}
	});

	it('cleans every build subdirectory when no platforms are given', async () => {
		const cli = createCLI({ 'project-dir': projectDir, platforms: null });

		await run(noopLogger, {}, cli);

		expect(cli.events).to.include('clean.pre');
		expect(cli.events).to.include('clean.android.pre');
		expect(cli.events).to.include('clean.android.post');
		expect(cli.events.at(-1)).to.equal('clean.post');
		expect(fs.readdirSync(buildDir)).to.deep.equal([]);
	});

	it('propagates a rejected hook instead of reporting success', async () => {
		const cli = createCLI({ 'project-dir': projectDir, platforms: [ 'android' ] });
		cli.emit = async name => {
			if (name === 'clean.android.pre') {
				throw new Error('hook exploded');
			}
			cli.events.push(name);
		};

		let err;
		try {
			await run(noopLogger, {}, cli);
		} catch (e) {
			err = e;
		}

		expect(err).to.be.an('error');
		expect(err.message).to.equal('hook exploded');
		// the build dir must survive, since cleaning never got past the hook
		expect(fs.existsSync(path.join(buildDir, 'android'))).to.equal(true);
	});

	it('resolves without hooks when there is no build directory', async () => {
		fs.removeSync(buildDir);
		const cli = createCLI({ 'project-dir': projectDir, platforms: null });

		await run(noopLogger, {}, cli);

		expect(cli.events).to.deep.equal([]);
	});
});
