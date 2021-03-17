/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

const isCI = Ti.App.Properties.getBool('isCI', false);

describe.ios('Titanium.UI.iOS',  () => {
	it('#createDocumentViewer()', () => {
		should(Ti.UI.iOS.createDocumentViewer).be.a.Function();
	});
});

describe.ios('Titanium.UI.iOS.DocumentViewer', () => {

	let documentViewer;

	beforeEach(() => {
		documentViewer = Ti.UI.iOS.createDocumentViewer({
			url: 'example.html'
		});
	});

	it('.name', function () {
		// On macOS < 11, it is failing. https://developer.apple.com/forums/thread/125819
		if (isCI && utilities.isMacOS() && OS_VERSION_MAJOR < 11) {
			// this.skip(); // ti-mocha doesn't have runtime skip, so just return
			return;
		}
		documentViewer.annotation = 'annotation';
		should(documentViewer.name).eql('example.html');
	});

	it('.annotation', function () {
		// On macOS < 11, it is failing. https://developer.apple.com/forums/thread/125819
		if (isCI && utilities.isMacOS() && OS_VERSION_MAJOR < 11) {
			// this.skip(); // ti-mocha doesn't have runtime skip, so just return
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
