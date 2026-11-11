/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import {
	generateKeepXmlContent,
	getFileResourceEntry,
	getResourceTypeFromFolderName,
	getValuesResourceEntries
} from '../lib/generate-keep-xml.js';
import { expect } from 'chai';

describe('generate-keep-xml', () => {
	it('getResourceTypeFromFolderName()', () => {
		expect(getResourceTypeFromFolderName('drawable')).to.equal('drawable');
		expect(getResourceTypeFromFolderName('drawable-long-land-hdpi')).to.equal('drawable');
		expect(getResourceTypeFromFolderName('mipmap-anydpi-v26')).to.equal('mipmap');
		expect(getResourceTypeFromFolderName('values-de')).to.equal('values');
		expect(getResourceTypeFromFolderName('raw')).to.equal('raw');
		expect(getResourceTypeFromFolderName('')).to.equal(null);
	});

	it('getFileResourceEntry()', () => {
		expect(getFileResourceEntry('drawable', 'background.png')).to.equal('@drawable/background');
		expect(getFileResourceEntry('drawable', 'border.9.png')).to.equal('@drawable/border');
		expect(getFileResourceEntry('mipmap', 'ic_launcher.webp')).to.equal('@mipmap/ic_launcher');
		expect(getFileResourceEntry('raw', 'notification.mp3')).to.equal('@raw/notification');
		expect(getFileResourceEntry('drawable', '.DS_Store')).to.equal(null);
		expect(getFileResourceEntry('drawable', '')).to.equal(null);
	});

	it('getValuesResourceEntries()', () => {
		const entries = getValuesResourceEntries(`<?xml version="1.0" encoding="UTF-8"?>
			<resources>
				<string name="app_name" formatted="false">My App</string>
				<color name="backgroundColor">#f6efe2</color>
				<style name="Theme.MyTheme" parent="Theme.Titanium.DayNight.NoTitleBar">
					<item name="android:statusBarColor">#f6efe2</item>
				</style>
				<string-array name="planets">
					<item>Mercury</item>
				</string-array>
				<plurals name="apples">
					<item quantity="one">apple</item>
				</plurals>
				<item type="drawable" name="aliased_icon"/>
				<dimen name="toolbar_height">56dp</dimen>
				<bool name="is_tablet">false</bool>
				<integer name="max_count">10</integer>
				<declare-styleable name="MyView"/>
				<attr name="myAttribute" format="string"/>
			</resources>`);
		expect(entries).to.deep.equal([
			'@string/app_name',
			'@color/backgroundColor',
			'@style/Theme.MyTheme',
			'@array/planets',
			'@plurals/apples',
			'@drawable/aliased_icon',
			'@dimen/toolbar_height',
			'@bool/is_tablet',
			'@integer/max_count'
		]);
	});

	it('getValuesResourceEntries() handles invalid content', () => {
		expect(getValuesResourceEntries('')).to.deep.equal([]);
		expect(getValuesResourceEntries('<manifest/>')).to.deep.equal([]);
	});

	it('generateKeepXmlContent()', () => {
		const content = generateKeepXmlContent([
			'@string/app_name',
			'@drawable/background',
			'@drawable/background'  // Duplicates must be removed.
		]);
		expect(content).to.contain('<resources xmlns:tools="http://schemas.android.com/tools"');
		expect(content).to.contain('tools:keep="@drawable/background,@string/app_name"');
	});
});
