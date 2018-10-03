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

describe('Titanium.UI.ImageView', function () {
	var win = null;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	// On Android, paths are relative to JS file.
	// On iOS and Windows, paths are relative to app's "Resources" directory.
	// The below works on all platforms because this JS file is in the "Resources" directory.
	it('image (root-relative-path)', function (finish) {
		this.slow(8000);
		this.timeout(10000);

		win = Ti.UI.createWindow();
		let imageView = Ti.UI.createImageView({
			image: 'Logo.png',
			autorotate: true
		});
		imageView.addEventListener('load', function () {
			finish();
		});
		win.add(imageView);
		win.open();
	});
});
