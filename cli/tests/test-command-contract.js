/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { CLI } from 'titanium/src/cli.js';
import { expect } from 'chai';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import appc from 'node-appc';
import * as buildCommand from '../commands/build.js';
import * as cleanCommand from '../commands/clean.js';
import * as projectCommand from '../commands/project.js';

const require = createRequire(import.meta.url);

/**
 * Builds a CLI instance that won't print a banner or touch the terminal.
 *
 * @returns {CLI}
 */
function createCLI() {
	const cli = new CLI();
	cli.ready = true;
	cli.logger.bannerEnabled(false);
	return cli;
}

/**
 * Builds the minimum Commander-ish command object that `executeCommand()` needs.
 *
 * @param {Object} module - The command module exposing validate()/run()
 * @returns {Object}
 */
function createCommand(module) {
	return {
		name: () => 'test',
		options: [],
		opts: () => ({}),
		conf: { options: {}, flags: {} },
		module
	};
}

const tick = () => new Promise(resolve => setTimeout(resolve, 10));

/**
 * Runs a command and returns the error it rejected with. Fails if it resolved.
 *
 * @param {CLI} cli - The CLI instance
 * @param {Object} command - The command to execute
 * @returns {Promise<Error>}
 */
async function captureRejection(cli, command) {
	try {
		await cli.executeCommand([ undefined, undefined, command ]);
	} catch (err) {
		return err;
	}
	throw new Error('expected the command to reject, but it resolved');
}

describe('command completion contract', () => {
	// The SDK's build/clean/project commands export `async validate()` and rely on
	// the CLI awaiting the returned Promise before it runs the command. Titanium CLI
	// 9.0.0 only understood a returned callback-style function, so it would start
	// run() while validate() was still pending. 9.1.0 added the Promise branch.
	it('installed Titanium CLI satisfies the commands\' cliVersion', () => {
		const { version } = JSON.parse(readFileSync(require.resolve('titanium/package.json'), 'utf8'));
		for (const command of [ buildCommand, cleanCommand, projectCommand ]) {
			expect(
				appc.version.satisfies(version, command.cliVersion),
				`titanium@${version} does not satisfy "${command.cliVersion}"; async validate()/run() will not be awaited`
			).to.equal(true);
		}
	});

	it('awaits an async validate() before starting run()', async () => {
		const order = [];
		const cli = createCLI();

		await cli.executeCommand([ undefined, undefined, createCommand({
			async validate() {
				order.push('validate:start');
				await tick();
				order.push('validate:end');
			},
			async run() {
				order.push('run:start');
				await tick();
				order.push('run:end');
			}
		}) ]);

		expect(order).to.deep.equal([ 'validate:start', 'validate:end', 'run:start', 'run:end' ]);
	});

	it('awaits an async run() before emitting cli:post-execute', async () => {
		const order = [];
		const cli = createCLI();
		cli.on('cli:post-execute', () => order.push('post-execute'));

		await cli.executeCommand([ undefined, undefined, createCommand({
			async run() {
				order.push('run:start');
				await tick();
				order.push('run:end');
			}
		}) ]);

		expect(order).to.deep.equal([ 'run:start', 'run:end', 'post-execute' ]);
	});

	it('aborts the command when async validate() rejects', async () => {
		let ran = false;
		const cli = createCLI();

		const err = await captureRejection(cli, createCommand({
			async validate() {
				await tick();
				throw new Error('invalid');
			},
			async run() {
				ran = true;
			}
		}));

		expect(err.message).to.equal('invalid');
		expect(ran).to.equal(false);
	});

	it('rejects the command when async run() rejects', async () => {
		const cli = createCLI();

		const err = await captureRejection(cli, createCommand({
			async run() {
				await tick();
				throw new Error('build failed');
			}
		}));

		expect(err.message).to.equal('build failed');
	});

	it('awaits hooks emitted from an async validate()', async () => {
		const order = [];
		const cli = createCLI();
		cli.on('test:hook', {
			pre(_data, next) {
				order.push('hook:start');
				setTimeout(() => {
					order.push('hook:end');
					next();
				}, 10);
			}
		});

		await cli.executeCommand([ undefined, undefined, createCommand({
			async validate(_logger, _config, c) {
				await c.emit('test:hook');
				order.push('validate:end');
			},
			async run() {
				order.push('run:start');
			}
		}) ]);

		expect(order).to.deep.equal([ 'hook:start', 'hook:end', 'validate:end', 'run:start' ]);
	});
});

describe('command exports', () => {
	for (const [ name, command ] of Object.entries({
		build: buildCommand,
		clean: cleanCommand,
		project: projectCommand
	})) {
		it(`${name} exports an async validate()`, () => {
			expect(command.validate.constructor.name).to.equal('AsyncFunction');
		});

		// `executeCommand()` resolves immediately for a run() that neither returns a
		// Promise nor declares a 4th `callback` argument, so the command would report
		// success while its work is still in flight.
		it(`${name} run() signals completion to the CLI`, () => {
			const isAsync = command.run.constructor.name === 'AsyncFunction';
			const takesCallback = command.run.length >= 4;
			expect(
				isAsync || takesCallback,
				`${name} run() must be async or accept a callback, otherwise the CLI treats it as complete immediately`
			).to.equal(true);
		});

		it(`${name} requires a CLI that awaits async validate()`, () => {
			expect(appc.version.satisfies('9.0.0', command.cliVersion)).to.equal(false);
			expect(appc.version.satisfies('9.1.0', command.cliVersion)).to.equal(true);
		});
	}
});
