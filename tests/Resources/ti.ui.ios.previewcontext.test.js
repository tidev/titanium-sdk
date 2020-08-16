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

describe.ios('Titanium.UI.iOS',  () => {
	// TIMOB-23542 test previewContext
	it('#createPreviewContext()', () => {
		should(Ti.UI.iOS.createPreviewContext).be.a.Function();
		const previewContext = Ti.UI.iOS.createPreviewContext({
			preview: Ti.UI.createView({
				backgroundColor: 'red'
			}),
			contentHeight: 300
		});
		if (Ti.UI.iOS.forceTouchSupported) {
			should(previewContext.preview).be.an.Object();
			should(previewContext.contentHeight).be.eql(300);
		}
	});
});

// describe.ios('Titanium.UI.iOS.PreviewContext', function () {
// TODO Add tests for PreviewContext type!
// });
