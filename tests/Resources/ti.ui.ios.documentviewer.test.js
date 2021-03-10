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

	afterEach(done => {
		documentViewer = null;
		done();
	});

	it('.name', () => {
		documentViewer.annotation = 'annotation';
		should(documentViewer.name).eql('example.html');
	});

	it('.annotation', () => {
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
