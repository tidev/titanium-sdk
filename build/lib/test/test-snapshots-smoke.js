/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import { SnapshotManager } from '../../../build/lib/test/snapshots.js';

describe('SnapshotManager', function () {
	it('is a class', () => {
		expect(SnapshotManager).to.be.a('function');
	});
	it('constructs with (name, target, snapshotDir, snapshotPromises)', () => {
		const mgr = new SnapshotManager('Pixel_6', 'emulator', '/tmp/snaps', []);
		expect(mgr.name).to.equal('Pixel_6');
		expect(mgr.target).to.equal('emulator');
		expect(mgr.snapshotDir).to.equal('/tmp/snaps');
		expect(mgr.snapshotPromises).to.deep.equal([]);
	});
	it('exposes the four snapshot methods', () => {
		const mgr = new SnapshotManager('', 'simulator', '/tmp/snaps', []);
		expect(mgr.grabGeneratedImage).to.be.a('function');
		expect(mgr.handleMismatchedImage).to.be.a('function');
		expect(mgr.grabAppImage).to.be.a('function');
		expect(mgr.deviceId).to.be.a('function');
	});
});
