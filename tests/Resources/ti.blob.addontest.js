/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titnaium.Blob', function () {
	this.slow(2000);
	this.timeout(5000);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	// iOS had a bug where it reported Blob width/height as pts, but Android reported px
	// And worse - numbers not divisble by the device scale (2, 3, etc) we could not reliably reproduce the *real* pixel size
	// i.e. a 10 x 10 pixel image/view on a 3x device woudl report width/height of 3 and scale of 3, so just multiplying those we'd get 9
	// when the real image was actually 10px.
	// However, natively we *can* properly generate true pixel size because image would report scale like 3.33 that we coudl multiply by before returning
	it('image dimensions should be reported in pixels', finish => {
		win = Ti.UI.createWindow();
		const view = Ti.UI.createView({
			backgroundColor: 'green',
			width: '11px',
			height: '13px'
		});
		win.add(view);
		win.addEventListener('postlayout', function postlayout() {
			win.removeEventListener('postlayout', postlayout); // only run once
			try {
				const blob = view.toImage();
				should(blob.width).equal(11);
				should(blob.height).equal(13);
			} catch (e) {
				return finish(e);
			}
			finish();
		});
		win.open();
	});
});
