/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { hashIconComposerDocument, isIconComposerDocument } from '../lib/icon-composer.js';
import { expect } from 'chai';
import crypto from 'node:crypto';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

// the same hash function the builder passes in
const hash = str => crypto.createHash('md5').update(str || '').digest('hex');

describe('icon-composer', () => {
	let tmpDir;
	let iconDir;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ti-icon-composer-'));
		iconDir = path.join(tmpDir, 'DefaultIcon-ios.icon');
		fs.ensureDirSync(path.join(iconDir, 'Assets'));
		fs.writeFileSync(path.join(iconDir, 'icon.json'), '{"groups":[]}');
		fs.writeFileSync(path.join(iconDir, 'Assets', 'Layer.png'), 'layer-one');
	});

	afterEach(() => {
		fs.removeSync(tmpDir);
	});

	describe('isIconComposerDocument()', () => {
		it('accepts a directory', () => {
			expect(isIconComposerDocument(iconDir)).to.equal(true);
		});

		it('rejects a plain file with the same name', () => {
			const file = path.join(tmpDir, 'NotADocument.icon');
			fs.writeFileSync(file, 'not a document');
			expect(isIconComposerDocument(file)).to.equal(false);
		});

		it('rejects a missing path without throwing', () => {
			expect(isIconComposerDocument(path.join(tmpDir, 'Missing.icon'))).to.equal(false);
		});
	});

	describe('hashIconComposerDocument()', () => {
		it('is stable across calls', () => {
			expect(hashIconComposerDocument(iconDir, hash)).to.equal(hashIconComposerDocument(iconDir, hash));
		});

		it('changes when a file’s contents change', () => {
			const before = hashIconComposerDocument(iconDir, hash);
			fs.writeFileSync(path.join(iconDir, 'Assets', 'Layer.png'), 'layer-two');
			expect(hashIconComposerDocument(iconDir, hash)).to.not.equal(before);
		});

		it('changes when a file is renamed but its contents are not', () => {
			const before = hashIconComposerDocument(iconDir, hash);
			fs.renameSync(path.join(iconDir, 'Assets', 'Layer.png'), path.join(iconDir, 'Assets', 'Renamed.png'));
			expect(hashIconComposerDocument(iconDir, hash)).to.not.equal(before);
		});

		it('changes when a file is added', () => {
			const before = hashIconComposerDocument(iconDir, hash);
			fs.writeFileSync(path.join(iconDir, 'Assets', 'Extra.png'), 'extra');
			expect(hashIconComposerDocument(iconDir, hash)).to.not.equal(before);
		});

		it('skips broken symlinks instead of throwing', () => {
			const before = hashIconComposerDocument(iconDir, hash);
			fs.symlinkSync(path.join(iconDir, 'Assets', 'Gone.png'), path.join(iconDir, 'Assets', 'Dangling.png'));
			expect(() => hashIconComposerDocument(iconDir, hash)).to.not.throw();
			expect(hashIconComposerDocument(iconDir, hash)).to.equal(before);
		});
	});
});
