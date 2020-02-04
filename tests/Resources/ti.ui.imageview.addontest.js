/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

describe('Titanium.UI.ImageView', function () {
	var win = null;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('Load Image from folder', function (finish) {
		this.timeout(10000);

		var loadCount = 0;
		win = Ti.UI.createWindow();
		let imageView = Ti.UI.createImageView({
			image: 'Logo.png'
		});
		imageView.addEventListener('load', function () {
			loadCount++;
			if (loadCount > 1) {
				finish();
			} else {
				imageView.image = '/image folder/Logo.png';
			}
		});
		win.add(imageView);
		win.open();
	});
});
