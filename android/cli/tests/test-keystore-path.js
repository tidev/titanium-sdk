/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateKeystorePath } from '../lib/keystore-path.js';

describe('validateKeystorePath', () => {
	let directory;
	let homeDirectory;

	beforeEach(() => {
		directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ti-keystore-')));
	});

	afterEach(() => {
		fs.rmSync(directory, { recursive: true, force: true });
		if (homeDirectory) {
			fs.rmSync(homeDirectory, { recursive: true, force: true });
			homeDirectory = undefined;
		}
	});

	function check(input, expectedPath, message) {
		let calls = 0;
		validateKeystorePath(input, (error, resolved) => {
			calls++;
			if (message) {
				expect(error).to.be.instanceOf(Error);
				expect(error.message).to.equal(message);
				expect(resolved).to.equal(undefined);
			} else {
				expect(error).to.equal(null);
				expect(resolved).to.equal(expectedPath);
			}
		});
		expect(calls).to.equal(1);
	}

	for (const quote of [ '', "'", '"' ]) {
		const label = quote || 'no quotes';
		it(`accepts absolute paths with spaces and interior apostrophes (${label})`, () => {
			const file = path.join(directory, "Cesar's signing key.keystore");
			fs.writeFileSync(file, 'fixture');
			check(quote + file + quote, file);
		});

		it(`resolves relative paths (${label})`, () => {
			const file = path.join(directory, 'signing.keystore');
			fs.writeFileSync(file, 'fixture');
			check(quote + path.relative(process.cwd(), file) + quote, file);
		});

		it(`expands home paths (${label})`, () => {
			homeDirectory = fs.mkdtempSync(path.join(os.homedir(), '.ti-keystore-test-'));
			const file = path.join(homeDirectory, 'signing.keystore');
			fs.writeFileSync(file, 'fixture');
			check(quote + '~/' + path.relative(os.homedir(), file) + quote, file);
		});

		it(`rejects missing files and directories (${label})`, () => {
			check(quote + path.join(directory, 'missing') + quote, undefined, 'Invalid keystore file');
			check(quote + directory + quote, undefined, 'Invalid keystore file');
		});
	}

	for (const quote of [ "'", '"' ]) {
		it(`prefers an existing literal filename with exterior ${quote} characters`, function () {
			if (process.platform === 'win32' && quote === '"') {
				this.skip(); // Windows does not allow double quotes in filenames.
			}
			const plain = path.join(directory, 'signing.keystore');
			const literal = path.join(directory, quote + 'signing.keystore' + quote);
			fs.writeFileSync(plain, 'plain');
			fs.writeFileSync(literal, 'literal');
			const previous = process.cwd();
			try {
				process.chdir(directory);
				check(quote + 'signing.keystore' + quote, literal);
			} finally {
				process.chdir(previous);
			}
		});

		it(`does not strip unmatched or repeated ${quote} characters`, () => {
			const file = path.join(directory, 'signing.keystore');
			fs.writeFileSync(file, 'fixture');
			for (const input of [ quote + file, file + quote, quote.repeat(2) + file + quote.repeat(2) ]) {
				check(input, undefined, 'Invalid keystore file');
			}
		});
	}

	it('rejects mismatched quotes and surrounding whitespace', () => {
		const file = path.join(directory, 'signing.keystore');
		fs.writeFileSync(file, 'fixture');
		for (const input of [ "'" + file + '"', '"' + file + "'", ' ' + file + ' ', ' "' + file + '" ' ]) {
			check(input, undefined, 'Invalid keystore file');
		}
	});

	it('preserves shell characters, backslashes and spaces in filenames', function () {
		if (process.platform === 'win32') {
			this.skip(); // A backslash is a path separator on Windows.
		}
		const file = path.join(directory, ' $HOME `command` $(command) \\ key ');
		fs.writeFileSync(file, 'fixture');
		for (const quote of [ '', "'", '"' ]) {
			check(quote + file + quote, file);
		}
	});

	it('rejects absent and empty input with the existing message', () => {
		for (const input of [ undefined, null, '' ]) {
			check(input, undefined, 'Please specify the path to your keystore file');
		}
	});

	it('rejects empty quoted input', () => {
		for (const input of [ "''", '""' ]) {
			check(input, undefined, 'Invalid keystore file');
		}
	});
});
