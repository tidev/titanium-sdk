/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { AndroidManifest } from '../lib/android-manifest.js';
import { expect } from 'chai';

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

	describe('hasEnabledLauncherAlias()', () => {
		const launcherFilter = '<intent-filter>'
			+ '<action android:name="android.intent.action.MAIN"/>'
			+ '<category android:name="android.intent.category.LAUNCHER"/>'
			+ '</intent-filter>';
		const deepLinkFilter = '<intent-filter>'
			+ '<action android:name="android.intent.action.VIEW"/>'
			+ '<category android:name="android.intent.category.DEFAULT"/>'
			+ '<data android:scheme="myapp"/>'
			+ '</intent-filter>';
		const createManifest = (appContent) => AndroidManifest.fromXmlString(
			`<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application>${appContent}</application></manifest>`);
		const createAlias = (attributes, content) =>
			`<activity-alias android:name=".alias" android:targetActivity=".TestActivity" ${attributes}>${content}</activity-alias>`;

		it('returns false without an alias', () => {
			expect(new AndroidManifest().hasEnabledLauncherAlias()).to.equal(false);
			expect(createManifest('').hasEnabledLauncherAlias()).to.equal(false);
		});

		it('returns false for an alias without a launcher filter', () => {
			expect(createManifest(createAlias('', deepLinkFilter)).hasEnabledLauncherAlias()).to.equal(false);
		});

		it('returns false if all launcher aliases are disabled', () => {
			const manifest = createManifest(
				createAlias('android:enabled="false"', launcherFilter) + createAlias('android:enabled="@bool/alias"', launcherFilter));
			expect(manifest.hasEnabledLauncherAlias()).to.equal(false);
		});

		it('returns true for an enabled launcher alias', () => {
			expect(createManifest(createAlias('', launcherFilter)).hasEnabledLauncherAlias()).to.equal(true);
			const manifest = createManifest(
				createAlias('android:enabled="false"', launcherFilter) + createAlias('android:enabled="true"', launcherFilter));
			expect(manifest.hasEnabledLauncherAlias()).to.equal(true);
		});
	});
});
