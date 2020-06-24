/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

describe('Titanium.UI.View', function () {
	let win;

	this.timeout(5000);

	afterEach((done) => {
		if (win) {
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);
			win.addEventListener('close', function listener () {
				clearTimeout(t);
				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.android('touchFeedback', (finish) => {
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
		win.addEventListener('open', () => {
			finish();
		});
		win.open();
	});
});
