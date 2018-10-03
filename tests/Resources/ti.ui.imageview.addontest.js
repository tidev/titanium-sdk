/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.ImageView', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('should handle file URLs from applicationDataDirectory - TIMOB-18262', function (finish) {
		var imageView = Ti.UI.createImageView({
			top: 10
		});
		var icon = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
		var dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'Logo.png');

		should(icon.exists()).eql(true);
		dest.write(icon.read());
		should(dest.exists()).eql(true);

		imageView.addEventListener('error', function () {
			finish('Failed to load PNG file from applicationDataDirectory');
		});

		imageView.addEventListener('load', function (e) {
			should(e.state).eql('images');
			finish();
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'white'
		});

		win.add(imageView);
		win.open();

		imageView.images = [ Ti.Filesystem.applicationDataDirectory  + 'Logo.png' ];
	});

	it('should absolute-looking paths by resolving relative to resource dir', function (finish) {
		var imageView = Ti.UI.createImageView({
			top: 10
		});

		imageView.addEventListener('error', function () {
			finish('Failed to load PNG file from absolute path that is really relative to resources');
		});

		imageView.addEventListener('load', function (e) {
			should(e.state).eql('images');
			finish();
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'white'
		});

		win.add(imageView);
		win.open();

		imageView.images = [ '/Logo.png' ];
	});
});
