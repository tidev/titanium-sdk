/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const AndroidManifest = require('../lib/android-manifest');
const expect = require('chai').expect;

describe('AndroidManifest', () => {
	it('isEmpty()', () => {
		const manifest = new AndroidManifest();
		expect(manifest.isEmpty()).to.equal(true);
	});

	it('setPackageName()', () => {
		const manifest = new AndroidManifest();
		const packageName = 'org.titanium.testapp';
		manifest.setPackageName(packageName);
		expect(manifest.isEmpty()).to.equal(false);
		expect(manifest.toString().indexOf(packageName) >= 0).to.equal(true);
	});

	it('set/getAppAttribute()', () => {
		const manifest = new AndroidManifest();
		manifest.setAppAttribute('android:icon', '@drawable/app_icon');
		manifest.setAppAttribute('android:theme', '@style/Theme.MaterialComponents.Bridge');
		expect(manifest.getAppAttribute('android:icon')).to.equal('@drawable/app_icon');
		expect(manifest.getAppAttribute('android:theme')).to.equal('@style/Theme.MaterialComponents.Bridge');
	});
});
