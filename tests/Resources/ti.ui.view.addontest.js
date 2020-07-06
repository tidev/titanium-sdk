/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.View', function () {
	let rootWindow;
	let win;

	this.slow(2000);
	this.timeout(10000);

	before(function (finish) {
		rootWindow = Ti.UI.createWindow();
		rootWindow.addEventListener('open', () => finish());
		rootWindow.open();
	});

	after(function (finish) {
		rootWindow.addEventListener('close', () => finish());
		rootWindow.close();
	});

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

	describe.only('borderRadius corners', () => {
		// NOTE: We're very careful to use exact pixel values that are divisble by 1, 2 and 3
		// so that varying device dpi don't alter expectations for snapshot image comparisons

		it('4 values in String', finish => {
			win = Ti.UI.createWindow({ backgroundColor: 'blue' });
			const outerView = Ti.UI.createView({
				width: '90px',
				height: '90px',
				backgroundColor: 'green'
			});
			const view = Ti.UI.createView({
				width: '60px',
				height: '60px',
				borderRadius: '12px 12 12dp 12', // NOTE: Will this ruin image comparison when we vary device resolution?
				backgroundColor: 'yellow'
			});

			win.addEventListener('postlayout', function postlayout() { // FIXME: Support once!
				win.removeEventListener('postlayout', postlayout); // only run once
				try {
					should(view.borderRadius).be.a.String();
					should(view.borderRadius).eql('12px 12 12dp 12');
					should(outerView).matchImage('snapshots/borderRadius12p_x12_12dp_12.png');
				} catch (e) {
					return finish(e);
				}
				finish();
			});
			outerView.add(view);
			win.add(outerView);
			win.open();
		});

		it('4 values in Array', finish => {
			win = Ti.UI.createWindow({ backgroundColor: 'blue' });
			const outerView = Ti.UI.createView({
				width: '90px',
				height: '90px',
				backgroundColor: 'green'
			});
			const view = Ti.UI.createView({
				width: '60px',
				height: '60px',
				borderRadius: [ '12px', 12, '12dp', '12' ],
				backgroundColor: 'yellow'
			});

			win.addEventListener('postlayout', function postlayout() {
				win.removeEventListener('postlayout', postlayout); // only run once
				try {
					should(view.borderRadius).be.an.Array();
					should(view.borderRadius.length).eql(4);
					// should be the exact same as above
					should(outerView).matchImage('snapshots/borderRadius12px_12_12dp_12.png');
				} catch (err) {
					return finish(err);
				}
				finish();
			});

			outerView.add(view);
			win.add(outerView);
			win.open();
		});

		it('2 values in String', finish => {
			win = Ti.UI.createWindow({ backgroundColor: 'blue' });
			const outerView = Ti.UI.createView({
				width: '90px',
				height: '90px',
				backgroundColor: 'green'
			});
			const view = Ti.UI.createView({
				width: '60px',
				height: '60px',
				borderRadius: '12px 12',
				backgroundColor: 'yellow'
			});

			win.addEventListener('postlayout', function postlayout() {
				win.removeEventListener('postlayout', postlayout); // only run once
				try {
					should(view.borderRadius).be.a.String();
					should(view.borderRadius).eql('12px 12');
					should(outerView).matchImage('snapshots/borderRadius12px_12.png');
				} catch (e) {
					return finish(e);
				}
				finish();
			});
			outerView.add(view);
			win.add(outerView);
			win.open();
		});

		it('2 values in Array', finish => {
			win = Ti.UI.createWindow({ backgroundColor: 'blue' });
			const outerView = Ti.UI.createView({
				width: '90px',
				height: '90px',
				backgroundColor: 'green'
			});
			const view = Ti.UI.createView({
				width: '60px',
				height: '60px',
				borderRadius: [ '12px', 12 ],
				backgroundColor: 'yellow'
			});

			win.addEventListener('postlayout', function postlayout() {
				win.removeEventListener('postlayout', postlayout); // only run once
				try {
					should(view.borderRadius).be.an.Array();
					should(view.borderRadius.length).eql(2);
					should(view.borderRadius).eql([ '12px', 12 ]);
					// should be the exact same as above
					should(outerView).matchImage('snapshots/borderRadius12px_12.png');
				} catch (err) {
					return finish(err);
				}
				finish();
			});

			outerView.add(view);
			win.add(outerView);
			win.open();
		});
	});
});
