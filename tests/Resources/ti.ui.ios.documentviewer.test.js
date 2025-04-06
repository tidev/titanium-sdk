/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

// DocumentView is only supported on iOS or macOS 11+. See: https://developer.apple.com/forums/thread/125819
const isSupported = !utilities.isMacOS() || (OS_VERSION_MAJOR >= 11);

describe.ios('Titanium.UI.iOS',  () => {
	it('#createDocumentViewer()', () => {
		should(Ti.UI.iOS.createDocumentViewer).be.a.Function();
	});
});

describe.ios('Titanium.UI.iOS.DocumentViewer', () => {

	let documentViewer;

	beforeEach(() => {
		if (isSupported) {
			documentViewer = Ti.UI.iOS.createDocumentViewer({
				url: 'example.html'
			});
		}
	});

	it('.name', function () {
		if (!isSupported) {
			this.skip();
			return;
		}
		documentViewer.annotation = 'annotation';
		should(documentViewer.name).eql('example.html');
	});

	it('.annotation', function () {
		if (!isSupported) {
			this.skip();
			return;
		}

		documentViewer.annotation = 'annotation';
		should(documentViewer.annotation).eql('annotation');

		documentViewer.annotation = [ 'annotation1', 'annotation2' ];
		should(documentViewer.annotation).eql([ 'annotation1', 'annotation2' ]);

		documentViewer.annotation = 1;
		should(documentViewer.annotation).eql(1);

		const date = Date();
		documentViewer.annotation = date;
		should(documentViewer.annotation).eql(date);

		documentViewer.annotation = { key: 'value' };
		should(documentViewer.annotation).eql({ key: 'value' });
	});
});
