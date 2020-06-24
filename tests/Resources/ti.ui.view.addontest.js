/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway, Inc. All Rights Reserved.
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

	describe('borderRadius corners', () => {
		// FIXME: Due to very slow performance, I'm not turning on the image comparisons right now
		// We need to speed up the code (presumably Buffer)
		// const density = Ti.Platform.displayCaps.logicalDensityFactor;
		// FIXME: Don't use dp/pts in the actual radii so we can avoid needing separate images per density?
		// Do separate tests for verifying use of pts/dp versus density?

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
					// should(outerView).matchImage(`snapshots/borderRadius12px_12_12dp_12_${density}x.png`);
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
					should(view.borderRadius).eql([ '12px', 12, '12dp', '12' ]);
					// should be the exact same as above
					// should(outerView).matchImage(`snapshots/borderRadius12px_12_12dp_12_${density}x.png`);
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
					// should(outerView).matchImage(`snapshots/borderRadius12px_12_${density}x.png`);
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
					// should(outerView).matchImage(`snapshots/borderRadius12px_12_${density}x.png`);
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

	it.android('touchFeedback', finish => {
		win = Ti.UI.createWindow({ layout: 'horizontal' });
		win.add(Ti.UI.createLabel({
			text: 'View 1',
			touchFeedback: true,
			touchFeedbackColor: 'yellow'
		}));
		win.add(Ti.UI.createLabel({
			text: 'View 2',
			backgroundColor: 'gray',
			touchFeedback: true,
			touchFeedbackColor: 'yellow'
		}));
		win.add(Ti.UI.createLabel({
			text: 'View 3',
			backgroundImage: '/Logo.png',
			touchFeedback: true,
			touchFeedbackColor: 'yellow'
		}));
		win.add(Ti.UI.createLabel({
			text: 'View 4',
			backgroundGradient: {
				type: 'linear',
				startPoint: { x: '0%', y: '50%' },
				endPoint: { x: '100%', y: '50%' },
				colors: [ { color: 'red', offset: 0.0 }, { color: 'blue', offset: 1.0 } ]
			},
			touchFeedback: true,
			touchFeedbackColor: 'yellow'
		}));
		win.add(Ti.UI.createLabel({
			text: 'View 5',
			borderRadius: 20,
			borderColor: 'red',
			borderWidth: '8dp',
			touchFeedback: true,
			touchFeedbackColor: 'yellow'
		}));
		win.add(Ti.UI.createLabel({
			text: 'View 6',
			backgroundColor: 'gray',
			borderRadius: 20,
			borderColor: 'red',
			borderWidth: '8dp',
			touchFeedback: true,
			touchFeedbackColor: 'yellow'
		}));
		win.add(Ti.UI.createLabel({
			text: 'View 7',
			backgroundImage: '/Logo.png',
			borderRadius: 20,
			borderColor: 'red',
			borderWidth: '8dp',
			touchFeedback: true,
			touchFeedbackColor: 'yellow'
		}));
		win.add(Ti.UI.createLabel({
			text: 'View 8',
			backgroundGradient: {
				type: 'linear',
				startPoint: { x: '0%', y: '50%' },
				endPoint: { x: '100%', y: '50%' },
				colors: [ { color: 'red', offset: 0.0 }, { color: 'blue', offset: 1.0 } ]
			},
			borderRadius: 20,
			borderColor: 'red',
			borderWidth: '8dp',
			touchFeedback: true,
			touchFeedbackColor: 'yellow'
		}));
		win.addEventListener('open', () => finish());
		win.open();
	});
});
