/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Blob', function () {
	var win;

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it('resize very large image', function (finish) {

		win = Ti.UI.createWindow({ backgroundColor: 'gray' });
		const img = Ti.UI.createImageView();

		// Obtain large image blob. (8000px, 8000px)
		let blob = Ti.Filesystem.getFile('large.jpg').read();
		should(blob).be.an.Object;

		win.addEventListener('open', async () => {

			// Keep re-sizing the image down by 10%
			for (let i = 0; i < 10; i++) {

				// De-reference original blob so it can be freed.
				blob = blob.imageAsResized(blob.width / 1.1, blob.height / 1.1);
				should(blob).be.an.Object;
			}

			// Display re-sized image.
			img.image = blob;

			finish();
		});

		win.add(img);
		win.open();
	});
});
