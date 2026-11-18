/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import { rejects } from 'node:assert/strict';
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
	const removeSync = fs.removeSync;

	beforeEach(() => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ti-clean-'));
		buildDir = path.join(projectDir, 'build');
		for (const platform of [ 'android', 'iphone' ]) {
			fs.ensureDirSync(path.join(buildDir, platform));
			fs.writeFileSync(path.join(buildDir, `build_${platform}.log`), 'log');
		}
	});

	afterEach(() => {
		fs.removeSync = removeSync;
		fs.removeSync(projectDir);
	});

	// Reproduce a writer adding a file after traversal, before the final rmdir.
	// Only intercept the command's removal boundary; rmdir raises the real OS error.
	function interruptRemoval(dir, raceDir, interruptions) {
		let attempts = 0;
		fs.ensureDirSync(raceDir);
		fs.writeFileSync(path.join(raceDir, 'initial'), 'build output');
		fs.removeSync = function (file) {
			if (file === dir && ++attempts <= interruptions) {
				for (const child of fs.readdirSync(raceDir)) {
					removeSync(path.join(raceDir, child));
				}
				fs.writeFileSync(path.join(raceDir, 'late'), 'concurrent output');
				fs.rmdirSync(raceDir);
			}
			return removeSync(file);
		};
		return () => attempts;
	}

	for (const platforms of [ [ 'android' ], null ]) {
		const mode = platforms ? 'with a platform' : 'without platforms';
		for (const [ platform, subdir ] of [
			[ 'android', 'app/build' ],
			[ 'iphone', 'DerivedData/Index.noindex/DataStore/v5' ]
		]) {
			it(`retries a full removal after ENOTEMPTY in ${platform} ${mode}`, async () => {
				const dir = path.join(buildDir, platform);
				const attempts = interruptRemoval(dir, path.join(dir, subdir), 2);
				const cli = createCLI({ 'project-dir': projectDir, platforms: platforms && [ platform ] });

				await run(noopLogger, {}, cli);

				expect(attempts()).to.equal(3);
				expect(fs.existsSync(dir)).to.equal(false);
				expect(cli.events.filter(event => event === `clean.${platform}.pre`)).to.have.lengthOf(1);
				expect(cli.events.filter(event => event === `clean.${platform}.post`)).to.have.lengthOf(1);
				if (platforms) {
					expect(fs.existsSync(path.join(buildDir, `build_${platform}.log`))).to.equal(false);
				}
			});
		}

		it(`stops retrying persistent ENOTEMPTY ${mode} without reporting success`, async function () {
			this.timeout(10000);
			const dir = path.join(buildDir, 'android');
			const raceDir = path.join(dir, 'app/build');
			const attempts = interruptRemoval(dir, raceDir, Infinity);
			const cli = createCLI({ 'project-dir': projectDir, platforms });
			const messages = [];
			const logger = { ...noopLogger, info: message => messages.push(message) };

			await rejects(run(logger, {}, cli), error => error.code === 'ENOTEMPTY' && error.path === raceDir);

			expect(attempts()).to.equal(6);
			expect(fs.existsSync(raceDir)).to.equal(true);
			expect(cli.events).not.to.include('clean.android.post');
			expect(cli.events).not.to.include('clean.post');
			expect(messages).to.deep.equal([]);
		});

		it(`propagates unrelated filesystem errors immediately ${mode}`, async () => {
			const dir = path.join(buildDir, 'android');
			const error = Object.assign(new Error('Access denied'), { code: 'EACCES', path: dir });
			let attempts = 0;
			fs.removeSync = function (file) {
				if (file === dir) {
					attempts++;
					throw error;
				}
				return removeSync(file);
			};
			const cli = createCLI({ 'project-dir': projectDir, platforms });

			await rejects(run(noopLogger, {}, cli), caught => caught === error);

			expect(attempts).to.equal(1);
			expect(cli.events).not.to.include('clean.android.post');
		});
	}

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
