/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Network.HTTPClient', function () {
	this.timeout(5000);

	it('progress event', finish => {
		let attempts = 3;
		let progressVar = -1;
		const xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(5000);
		xhr.onsendstream = e => {
			try {
				should(e.progress).be.above(0);
				should(e.progress).be.aboveOrEqual(progressVar);
				progressVar = e.progress;
			} catch (error) {
				finish(error);
			}
		};
		xhr.onload = e => {
			finish();
		};
		xhr.onerror = e => {
			if (attempts-- > 0) {
				Ti.API.warn('failed, attempting to retry request...');
				xhr.send();
			} else {
				Ti.API.debug(JSON.stringify(e, null, 2));
				finish(new Error('failed to retrieve large image: ' + e));
			}
		};
		xhr.open('POST', 'https://httpbin.org/post');
		xhr.send(Ti.Utils.base64encode(Ti.Filesystem.getFile('SplashScreen.png')).toString());
	});
});
