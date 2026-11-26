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
import ti from 'node-titanium-sdk';
import { config as cleanConfig } from '../commands/clean.js';
import { config as buildConfig } from '../commands/build.js';

describe('SDK command selection', () => {
	let projectDir;
	const platformOptions = ti.platformOptions;
	const exit = process.exit;
	const xml = '<ti:app xmlns:ti="http://ti.appcelerator.org"><id>com.example.sdkselection</id><name>SDK Selection</name><version>1.0</version><guid>45e73794-f598-4fb2-bd7c-e30066b0d1f0</guid><sdk-version>14.0.0.fixes</sdk-version></ti:app>';

	beforeEach(() => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ti-sdk-selection-'));
		fs.writeFileSync(path.join(projectDir, 'tiapp.xml'), xml);
		// Platform builders are unrelated to selection of the SDK by the CLI.
		ti.platformOptions = (_logger, _config, _cli, _command, done) => done({});
		process.exit = code => { throw new Error(`Unexpected process.exit(${code})`); };
	});

	afterEach(() => {
		ti.platformOptions = platformOptions;
		process.exit = exit;
		fs.removeSync(projectDir);
	});

	async function configureCommand(command, configure, { legacy = false, sdkArgs = [ '--sdk', '14.0.0.GA' ] } = {}) {
		const sdk = { name: '14.0.0.GA', manifest: { version: '14.0.0' } };
		const cli = {
			argv: { sdk: sdk.name, platform: 'android', legacy, $_: [ command, ...sdkArgs ] },
			sdk,
			env: { sdks: { [sdk.name]: sdk } },
			scanHooks() {},
			createHook(_name, callback) { return done => callback(done); }
		};
		const logger = { levels: {}, log() {}, error() {}, warn() {}, info() {}, banner() {}, getLevels: () => [ 'info' ] };
		const config = { cli: { logLevel: 'info' }, get() {} };
		const options = await new Promise(resolve => configure(logger, config, cli)(resolve));
		return { cli, options };
	}

	for (const [ command, configure ] of [ [ 'clean', cleanConfig ], [ 'build', buildConfig ] ]) {
		it(`${command} honors the CLI-selected SDK when the project SDK is not installed`, async () => {
			const { cli, options } = await configureCommand(command, configure);
			expect(options.options['project-dir'].callback(projectDir)).to.equal(projectDir);
			expect(cli.argv.type).to.equal('app');
			expect(cli.sdk.name).to.equal('14.0.0.GA');
			expect(cli.tiapp['sdk-version']).to.equal('14.0.0.fixes');
			expect(fs.readFileSync(path.join(projectDir, 'tiapp.xml'), 'utf8')).to.equal(xml);
		});

		it(`${command} fills an absent sdk-version in memory without rewriting the XML`, async () => {
			const noSDK = xml.replace('<sdk-version>14.0.0.fixes</sdk-version>', '');
			fs.writeFileSync(path.join(projectDir, 'tiapp.xml'), noSDK);
			const { cli, options } = await configureCommand(command, configure);

			options.options['project-dir'].callback(projectDir);

			expect(cli.tiapp['sdk-version']).to.equal('14.0.0.GA');
			expect(fs.readFileSync(path.join(projectDir, 'tiapp.xml'), 'utf8')).to.equal(noSDK);
		});

		it(`${command} still validates the project SDK without an explicit override`, async () => {
			// Starting in a subdirectory can make the CLI select a default SDK before
			// the project-dir validator locates the ancestor project's tiapp.xml.
			const { options } = await configureCommand(command, configure, { sdkArgs: [] });

			expect(() => options.options['project-dir'].callback(projectDir)).to.throw('Unexpected process.exit(1)');
		});

		for (const sdkArgs of [ [ '-s', '14.0.0.GA' ], [ '--sdk=14.0.0.GA' ], [ '-s14.0.0.GA' ] ]) {
			it(`${command} honors the explicit SDK form ${sdkArgs.join(' ')}`, async () => {
				const { options } = await configureCommand(command, configure, { sdkArgs });

				expect(options.options['project-dir'].callback(projectDir)).to.equal(projectDir);
			});
		}

		it(`${command} still rejects invalid project metadata`, async () => {
			fs.writeFileSync(path.join(projectDir, 'tiapp.xml'), xml.replace('<id>com.example.sdkselection</id>', ''));
			const { options } = await configureCommand(command, configure);

			expect(() => options.options['project-dir'].callback(projectDir)).to.throw('Unexpected process.exit(1)');
		});
	}

	it('keeps legacy build SDK validation', async () => {
		const { options } = await configureCommand('build', buildConfig, { legacy: true });

		expect(() => options.options['project-dir'].callback(projectDir)).to.throw('Unexpected process.exit(1)');
	});
});
