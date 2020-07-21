/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.ScrollableView', function () {
	this.timeout(5000);

	const isiOS14 =  (parseInt(Ti.Platform.version.split('.')[0]) >= 14);
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

	it.ios('preferredIndicatorImage', function (finish) {
		if (!isiOS14) {
			finish();
		}

		const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
		const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
		const backwardImage = Ti.UI.iOS.systemImage('backward');
		const forwardImage = Ti.UI.iOS.systemImage('forward');
		const scrollableView = Ti.UI.createScrollableView({
			preferredIndicatorImage: backwardImage,
			views: [ view1, view2],
			showPagingControl:true,
		});

		win = Ti.UI.createWindow({ extendSafeArea: false });
		win.addEventListener('postlayout', function () {
			const blob1 = win.toImage();
			scrollableView.preferredIndicatorImage = forwardImage;
			let blob2 = win.toImage();
			should(blob1.compare(blob2, 0)).eql(false);

			scrollableView.preferredIndicatorImage = backwardImage;
			blob2 = win.toImage();
			should(blob1.compare(blob2, 0)).eql(true);

			finish();
		});

		win.add(scrollableView);
		win.open();
	});

	it.ios('setIndicatorImageForPage', function (finish) {
		if (!isiOS14) {
			finish();
		}
		const view1 = Ti.UI.createView({ id: 'view1', backgroundColor: '#836' });
		const view2 = Ti.UI.createView({ id: 'view2', backgroundColor: '#246' });
		const image = Ti.UI.iOS.systemImage('backward');
		const scrollableView = Ti.UI.createScrollableView({
			views: [ view1, view2 ],
			showPagingControl:true,
		});

		win = Ti.UI.createWindow({ extendSafeArea: false });
		win.addEventListener('postlayout', function () {
			const blob1 = win.toImage();
			scrollableView.setIndicatorImageForPage(image, 1);
			let blob2 = win.toImage();
			should(blob1.compare(blob2, 0)).eql(false);

			scrollableView.setIndicatorImageForPage(null, 1); // null will change to default
			blob2 = win.toImage();
			should(blob1.compare(blob2, 0)).eql(true);

			finish();
		});

		win.add(scrollableView);
		win.open();
	});
});
