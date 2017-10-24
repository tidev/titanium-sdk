/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.Toolbar', function() {

	var window;
	
	beforeEach(function () {
		window = Ti.UI.createWindow({exitOnClose: false, theme: 'Theme.AppCompat.NoTitleBar', backgroundColor: "#ACDC77"});
	});

	afterEach(function () {
		window.close();
	});

	it('apiName', function () {
		var toolbar = Ti.UI.createToolbar();
		window.add(toolbar);
		should(toolbar).have.readOnlyProperty('apiName').which.is.a.String;
		should(toolbar.apiName).be.eql('Ti.UI.Toolbar');
	});

	it('barColor word value', function () {
		var toolbar = Ti.UI.createToolbar({barColor: 'gray'});
		window.add(toolbar);
		should(toolbar.barColor).eql('gray');
	});

	it('barColor hex value', function () {
		var toolbar = Ti.UI.createToolbar({barColor: '#ACDC77'});
		window.add(toolbar);
		should(toolbar.barColor).eql('#ACDC77');
	});

	it('barColor shorthand hex value', function () {
		var toolbar = Ti.UI.createToolbar({barColor: '#ABC'});
		window.add(toolbar);
		should(toolbar.barColor).eql('#ABC');
	});

	(utilities.isAndroid() ? it : it.skip)('contentInsetEndWithActions', function() {
		var toolbar = Ti.UI.createToolbar({contentInsetEndWithActions: 20, top: 0, width: Ti.UI.FILL});
		window.activity.supportToolbar = toolbar;
		window.add(toolbar);
		window.activity.onCreateOptionsMenu = function(e) {
			var menu = e.menu;
			var menuItem = menu.add({
				title: 'Item 1',
				showAsAction: Ti.Android.SHOW_AS_ACTION_NEVER
			});
		};
		window.addEventListener("open", function() {
			should(toolbar.contentInsetEndWithActions).eql(20);
		});
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('contentInsetStartWithNavigation', function() {
		var toolbar = Ti.UI.createToolbar({contentInsetStartWithNavigation: 20, top: 0, width: Ti.UI.FILL});
		window.activity.supportToolbar = toolbar;
		window.add(toolbar);
		window.addEventListener("open", function() {
			window.activity.actionBar.displayHomeAsUp = true;
			should(toolbar.contentInsetStartWithNavigation).eql(20);
		});
		window.open();
	});

	it('extendBackground', function() {
		var toolbar = Ti.UI.createToolbar({contentInsetStartWithNavigation: 20, top: 0, width: Ti.UI.FILL, extendBackground: true, barColor: 'red'});
		window.activity.supportToolbar = toolbar;
		window.add(toolbar);
		window.addEventListener("open", function() {
			should(toolbar.extendBackground).eql(true);
		});
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('logo', function(finish) {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, logo: Ti.Filesystem.resourcesDirectory + 'Logo.png', barColor: 'blue'});
		window.activity.supportToolbar = toolbar;
		window.add(toolbar);
		toolbar.addEventListener('resourceLoaded', function(e) {
			should(e.target).eql('logo');
			should(e.loaded).eql(true);
			finish();
		});
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('logo pixel density specific', function(finish) {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, logo: '/images/dip.png', barColor: 'blue'});
		window.activity.supportToolbar = toolbar;
		window.add(toolbar);
		toolbar.addEventListener('resourceLoaded', function(e) {
			should(e.target).eql('logo');
			should(e.loaded).eql(true);
			finish();
		});
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('navigationIcon', function(finish) {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, navigationIcon: Ti.Filesystem.resourcesDirectory + 'Logo.png', barColor: 'blue'});
		toolbar.addEventListener('resourceLoaded', function(e) {
			should(e.target).eql('navigationIcon');
			should(e.loaded).eql(true);
			finish();
		});
		window.activity.supportToolbar = toolbar;
		window.add(toolbar);
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('navigationIcon pixel density specific', function(finish) {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, barColor: 'blue', navigationIcon: '/images/dip.png'});
		toolbar.addEventListener('resourceLoaded', function(e) {
			should(e.target).eql('navigationIcon');
			should(e.loaded).eql(true);
			finish();
		});
		window.activity.supportToolbar = toolbar;
		window.add(toolbar);
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('overflowIcon', function(finish) {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, overflowIcon: Ti.Filesystem.resourcesDirectory + 'Logo.png', barColor: 'blue'});
		toolbar.addEventListener('resourceLoaded', function(e) {
			should(e.target).eql('overflowIcon');
			should(e.loaded).eql(true);
			finish();
		});
		window.activity.supportToolbar = toolbar;
		window.add(toolbar);
		window.activity.onCreateOptionsMenu = function(e) {
			var menu = e.menu;
			var menuItem = menu.add({
				title: 'Item 1',
				showAsAction: Ti.Android.SHOW_AS_ACTION_NEVER
			});
		};
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('overflowIcon pixel density specific', function(finish) {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, overflowIcon: '/images/dip.png', barColor: 'blue'});
		toolbar.addEventListener('resourceLoaded', function(e) {
			should(e.target).eql('overflowIcon');
			should(e.loaded).eql(true);
			finish();
		});
		window.activity.supportToolbar = toolbar;
		window.add(toolbar);
		window.activity.onCreateOptionsMenu = function(e) {
			var menu = e.menu;
			var menuItem = menu.add({
				title: 'Item 1',
				showAsAction: Ti.Android.SHOW_AS_ACTION_NEVER
			});
		};
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('title', function() {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, title: 'Title', barColor: 'blue'});
		window.add(toolbar);
		window.addEventListener("open", function() {
			should(toolbar.title).eql('Title');
		});
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('subtitle', function() {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, subtitle: 'Subtitle', barColor: 'blue'});
		window.add(toolbar);
		window.addEventListener("open", function() {
			should(toolbar.subtitle).eql('Subtitle');
		});
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('titleTextColor', function() {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, title: 'Title', titleTextColor: 'red', barColor: 'blue'});
		window.add(toolbar);
		window.addEventListener("open", function() {
			should(toolbar.titleTextColor).eql('red');
		});
		window.open();
	});

	(utilities.isAndroid() ? it : it.skip)('subtitleTextColor', function() {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, subtitle: 'Subtitle', subtitleTextColor: 'green', barColor: 'blue'});
		window.add(toolbar);
		window.addEventListener("open", function() {
			should(toolbar.subtitleTextColor).eql('green');
		});
		window.open();
	});

	it('translucent', function() {
		var toolbar = Ti.UI.createToolbar({top: 0, width: Ti.UI.FILL, translucent: true, barColor: 'blue'});
		window.add(toolbar);
		window.addEventListener("open", function() {
			should(toolbar.translucent).eql(true);
		});
		window.open();
	});
});