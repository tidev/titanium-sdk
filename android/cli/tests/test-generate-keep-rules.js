/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import {
	generateBindingsKeepRules,
	getSdkNamespacePackages,
	getUsedNamespaces
} from '../lib/generate-keep-rules.js';
import { expect } from 'chai';

// Trimmed down version of the SDK's kroll-apt generated "titanium.bindings.json" file.
const sdkBindings = {
	proxies: {},
	modules: {
		'org.appcelerator.kroll.KrollModule': { apiName: 'KrollModule' },
		'ti.modules.titanium.TitaniumModule': { apiName: 'Titanium' },
		'ti.modules.titanium.ui.UIModule': { apiName: 'UI' },
		'ti.modules.titanium.ui.ShortcutModule': { apiName: 'Shortcut' },
		'ti.modules.titanium.ui.android.AndroidModule': { apiName: 'Android' },
		'ti.modules.titanium.android.AndroidModule': { apiName: 'Android' },
		'ti.modules.titanium.app.AndroidModule': { apiName: 'Android' },
		'ti.modules.titanium.app.AppModule': { apiName: 'App' },
		'ti.modules.titanium.media.MediaModule': { apiName: 'Media' },
		'ti.modules.titanium.calendar.CalendarModule': { apiName: 'Calendar' },
		'ti.modules.titanium.contacts.ContactsModule': { apiName: 'Contacts' },
		'ti.modules.titanium.database.DatabaseModule': { apiName: 'Database' },
		'ti.modules.titanium.network.NetworkModule': { apiName: 'Network' },
		'ti.modules.titanium.network.socket.SocketModule': { apiName: 'Socket' },
		'ti.modules.titanium.xml.XMLModule': { apiName: 'XML' }
	}
};

describe('generate-keep-rules', () => {
	it('getUsedNamespaces()', () => {
		const namespaces = getUsedNamespaces({
			'app.js': [ 'UI.createView', 'Media.createSound', 'API.info' ],
			'other.js': [ 'UI.Window', null ],
			'empty.js': null
		});
		expect(Array.from(namespaces).sort()).to.deep.equal([ 'API', 'Media', 'UI' ]);
	});

	it('getSdkNamespacePackages()', () => {
		const map = getSdkNamespacePackages(sdkBindings);
		expect(map.get('UI')).to.equal('ti.modules.titanium.ui');
		expect(map.get('Media')).to.equal('ti.modules.titanium.media');
		expect(map.get('XML')).to.equal('ti.modules.titanium.xml');

		// "Ti.Android" must map to the "android" package, not to the "app" or "ui.android"
		// packages which also contain a module class named "AndroidModule".
		expect(map.get('Android')).to.equal('ti.modules.titanium.android');

		// Submodules must not be treated as top-level namespaces.
		expect(map.has('Socket')).to.equal(false);
		expect(map.has('Shortcut')).to.equal(false);

		// Classes outside of the "ti.modules.titanium" package must be ignored.
		expect(map.has('KrollModule')).to.equal(false);

		// The root "TitaniumModule" must be ignored. (Its package is always kept.)
		expect(map.has('Titanium')).to.equal(false);
	});

	it('keeps all bindings by default', () => {
		const result = generateBindingsKeepRules({
			tiSymbols: { 'app.js': [ 'UI.createView' ] },
			sdkBindings: sdkBindings,
			stripUnusedApis: false
		});
		expect(result.content).to.contain('-keep class ti.modules.** { *; }');
		expect(result.content).to.contain('-keep class * extends org.appcelerator.kroll.KrollProxy { *; }');
		expect(result.strippedNamespaces).to.deep.equal([]);
	});

	it('keeps all bindings if SDK binding info is unavailable', () => {
		const result = generateBindingsKeepRules({
			tiSymbols: { 'app.js': [ 'UI.createView' ] },
			sdkBindings: null,
			stripUnusedApis: true
		});
		expect(result.content).to.contain('-keep class ti.modules.** { *; }');
	});

	describe('stripUnusedApis', () => {
		const result = generateBindingsKeepRules({
			tiSymbols: {
				'app.js': [ 'UI.createView', 'Media.createSound', 'API.info' ]
			},
			sdkBindings: sdkBindings,
			stripUnusedApis: true
		});

		it('keeps used SDK modules', () => {
			expect(result.content).to.contain('-keep class ti.modules.titanium.ui.** { *; }');
			expect(result.content).to.contain('-keep class ti.modules.titanium.media.** { *; }');
			expect(result.keptNamespaces).to.contain('Media');
		});

		it('strips unused SDK modules', () => {
			expect(result.content).to.not.contain('-keep class ti.modules.titanium.calendar.** { *; }');
			expect(result.content).to.not.contain('-keep class ti.modules.titanium.contacts.** { *; }');
			expect(result.content).to.not.contain('-keep class ti.modules.titanium.xml.** { *; }');
			expect(result.content).to.not.contain('-keep class ti.modules.** { *; }');
			expect(result.strippedNamespaces).to.deep.equal([ 'Calendar', 'Contacts', 'XML' ]);
		});

		it('always keeps SDK modules used by the SDK bootstrap scripts', () => {
			expect(result.content).to.contain('-keep class ti.modules.titanium.android.** { *; }');
			expect(result.content).to.contain('-keep class ti.modules.titanium.app.** { *; }');
			expect(result.content).to.contain('-keep class ti.modules.titanium.network.** { *; }');
			// "Database.install" is an invocation API resolved eagerly by the runtime's "bootstrap.js".
			expect(result.content).to.contain('-keep class ti.modules.titanium.database.** { *; }');
		});

		it('always keeps the root bindings package', () => {
			expect(result.content).to.contain('-keep class ti.modules.titanium.* { *; }');
		});

		it('keeps kroll proxies outside of the SDK packages', () => {
			expect(result.content).to.contain('-keep class !ti.modules.**,** extends org.appcelerator.kroll.KrollProxy { *; }');
		});

		it('reports namespaces without an SDK Java package', () => {
			expect(result.unresolvedNamespaces).to.contain('API');
		});

		it('keeps all binding classes of native modules', () => {
			const moduleResult = generateBindingsKeepRules({
				tiSymbols: {},
				sdkBindings: sdkBindings,
				moduleBindingsList: [ {
					modules: {
						'com.example.map.MapModule': { apiName: 'Map' }
					},
					proxies: {
						'com.example.map.MapModule': {},
						'com.example.map.ViewProxy': {},
						'org.appcelerator.kroll.KrollModule': {}
					}
				} ],
				stripUnusedApis: true
			});
			expect(moduleResult.content).to.contain('-keep class com.example.map.MapModule { *; }');
			expect(moduleResult.content).to.contain('-keep class com.example.map.ViewProxy { *; }');
			expect(moduleResult.content).to.not.contain('-keep class org.appcelerator.kroll.KrollModule { *; }');
		});
	});
});
