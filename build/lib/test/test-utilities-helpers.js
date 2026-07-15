/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';

// utilities.js reads Ti.Platform lazily inside each helper, so we can
// stub global.Ti per test to exercise each platform branch.
import utilities from '../../../tests/Resources/utilities/utilities.js';

function setPlatform({ osname, name, model }) {
	global.Ti = global.Ti || {};
	global.Ti.Platform = { osname, name, model };
}

describe('utilities platform helpers', function () {
	afterEach(() => {
		delete global.Ti;
	});

	describe('isIPhone', () => {
		it('returns true when osname is iphone', () => {
			setPlatform({ osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2' });
			expect(utilities.isIPhone()).to.equal(true);
		});
		it('returns false when osname is not iphone', () => {
			setPlatform({ osname: 'ipad', name: 'iPhone OS', model: 'iPad13,8' });
			expect(utilities.isIPhone()).to.equal(false);
		});
	});

	describe('isIPad', () => {
		it('returns true when osname is ipad', () => {
			setPlatform({ osname: 'ipad', name: 'iPhone OS', model: 'iPad13,8' });
			expect(utilities.isIPad()).to.equal(true);
		});
		it('returns false when osname is not ipad', () => {
			setPlatform({ osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2' });
			expect(utilities.isIPad()).to.equal(false);
		});
	});

	describe('isIOS', () => {
		it('returns true when osname is iphone', () => {
			setPlatform({ osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2' });
			expect(utilities.isIOS()).to.equal(true);
		});
		it('returns true when osname is ipad', () => {
			setPlatform({ osname: 'ipad', name: 'iPhone OS', model: 'iPad13,8' });
			expect(utilities.isIOS()).to.equal(true);
		});
		it('returns false when osname is android', () => {
			setPlatform({ osname: 'android', name: 'Android', model: 'Pixel 8' });
			expect(utilities.isIOS()).to.equal(false);
		});
	});

	describe('isIOSSimulator', () => {
		it('returns true on iphone simulator', () => {
			setPlatform({ osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2 (Simulator)' });
			expect(utilities.isIOSSimulator()).to.equal(true);
		});
		it('returns true on ipad simulator', () => {
			setPlatform({ osname: 'ipad', name: 'iPhone OS', model: 'iPad13,8 (Simulator)' });
			expect(utilities.isIOSSimulator()).to.equal(true);
		});
		it('returns false on real iphone hardware', () => {
			setPlatform({ osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2' });
			expect(utilities.isIOSSimulator()).to.equal(false);
		});
		it('returns false on macOS (even though model could match)', () => {
			setPlatform({ osname: 'macos', name: 'Mac OS X', model: 'Mac14,2' });
			expect(utilities.isIOSSimulator()).to.equal(false);
		});
		it('returns false on android', () => {
			setPlatform({ osname: 'android', name: 'Android', model: 'Pixel 8' });
			expect(utilities.isIOSSimulator()).to.equal(false);
		});
	});

	describe('isMacOS', () => {
		it('returns true when name is Mac OS X', () => {
			setPlatform({ osname: 'macos', name: 'Mac OS X', model: 'Mac14,2' });
			expect(utilities.isMacOS()).to.equal(true);
		});
		it('returns false when name is not Mac OS X', () => {
			setPlatform({ osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2' });
			expect(utilities.isMacOS()).to.equal(false);
		});
	});

	describe('isAndroid', () => {
		it('returns true when osname is android', () => {
			setPlatform({ osname: 'android', name: 'Android', model: 'Pixel 8' });
			expect(utilities.isAndroid()).to.equal(true);
		});
		it('returns false when osname is not android', () => {
			setPlatform({ osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2' });
			expect(utilities.isAndroid()).to.equal(false);
		});
	});

	describe('isAndroidARM64Emulator', () => {
		it('returns true when isAndroid and model is "Android SDK built for arm64"', () => {
			setPlatform({ osname: 'android', name: 'Android', model: 'Android SDK built for arm64' });
			expect(utilities.isAndroidARM64Emulator()).to.equal(true);
		});
		it('returns false when on android but model is a real device', () => {
			setPlatform({ osname: 'android', name: 'Android', model: 'Pixel 8' });
			expect(utilities.isAndroidARM64Emulator()).to.equal(false);
		});
		it('returns false when not on android', () => {
			setPlatform({ osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2' });
			expect(utilities.isAndroidARM64Emulator()).to.equal(false);
		});
	});

	describe('isWindowsPhone', () => {
		it('returns true when osname is windowsphone', () => {
			setPlatform({ osname: 'windowsphone', name: 'Windows Phone', model: 'Test' });
			expect(utilities.isWindowsPhone()).to.equal(true);
		});
		it('returns false otherwise', () => {
			setPlatform({ osname: 'android', name: 'Android', model: 'Pixel 8' });
			expect(utilities.isWindowsPhone()).to.equal(false);
		});
	});

	describe('isWindowsDesktop', () => {
		it('returns true when osname is windowsstore', () => {
			setPlatform({ osname: 'windowsstore', name: 'Windows', model: 'Test' });
			expect(utilities.isWindowsDesktop()).to.equal(true);
		});
		it('returns false otherwise', () => {
			setPlatform({ osname: 'android', name: 'Android', model: 'Pixel 8' });
			expect(utilities.isWindowsDesktop()).to.equal(false);
		});
	});

	describe('isWindows', () => {
		it('returns true when osname is windowsphone', () => {
			setPlatform({ osname: 'windowsphone', name: 'Windows Phone', model: 'Test' });
			expect(utilities.isWindows()).to.equal(true);
		});
		it('returns true when osname is windowsstore', () => {
			setPlatform({ osname: 'windowsstore', name: 'Windows', model: 'Test' });
			expect(utilities.isWindows()).to.equal(true);
		});
		it('returns false otherwise', () => {
			setPlatform({ osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2' });
			expect(utilities.isWindows()).to.equal(false);
		});
	});

	describe('isWindowsEmulator', () => {
		it('returns true when model is "Microsoft Virtual"', () => {
			setPlatform({ osname: 'windowsphone', name: 'Windows Phone', model: 'Microsoft Virtual' });
			expect(utilities.isWindowsEmulator()).to.equal(true);
		});
		it('returns false when model is not "Microsoft Virtual"', () => {
			setPlatform({ osname: 'windowsphone', name: 'Windows Phone', model: 'Test' });
			expect(utilities.isWindowsEmulator()).to.equal(false);
		});
	});
});
