/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

const should = require('./utilities/assertions');

describe.windowsMissing('Titanium.UI.MaskedImage', function () {
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

	it.iosBroken('Ti.UI.MaskedImage', () => { // should this be defined?
		should(Ti.UI.MaskedImage).not.be.undefined();
	});

	it('.apiName', function () {
		var view = Ti.UI.createMaskedImage();
		should(view).be.a.Object();
		should(view).have.readOnlyProperty('apiName').which.is.a.String();
		should(view.apiName).be.eql('Ti.UI.MaskedImage');
	});

	it('createMaskedImage', function () {
		var view = Ti.UI.createMaskedImage();
		should(view.mode).be.eql(Ti.UI.BLEND_MODE_SOURCE_IN);
		view.mode = Ti.UI.BLEND_MODE_DESTINATION_IN;
		should(view.mode).be.eql(Ti.UI.BLEND_MODE_DESTINATION_IN);
	});

	it('.tint', function (finish) {
		this.timeout(5000);
		win = Ti.UI.createWindow();
		win.add(Ti.UI.createMaskedImage({
			mask: '/Logo.png',
			tint: 'red',
			mode: Ti.UI.BLEND_MODE_SOURCE_IN,
			width: Ti.UI.FILL,
			height: Ti.UI.FILL,
		}));
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);
			// Assume MaskedImage has rendered successfully by this point.
			finish();
		});
		win.open();
	});

	it('.image', function (finish) {
		this.timeout(5000);
		win = Ti.UI.createWindow();
		win.add(Ti.UI.createMaskedImage({
			mask: '/Logo.png',
			image: '/SplashScreen.png',
			mode: Ti.UI.BLEND_MODE_SOURCE_IN,
			width: Ti.UI.FILL,
			height: Ti.UI.FILL,
		}));
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);
			// Assume MaskedImage has rendered successfully by this point.
			finish();
		});
		win.open();
	});
});
