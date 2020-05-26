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
const utilities = require('./utilities/utilities');

describe('Titanium.UI.Label', function () {
	let win;

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
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

	it('animate font color', function (finish) {
		win = Ti.UI.createWindow();

		const label = Ti.UI.createLabel({
			text: 'this is some text',
			color: '#f00',
		});
		const animation = Ti.UI.createAnimation({
			color: '#fff',
			duration: 1000
		});
		animation.addEventListener('complete', function () {
			// FIXME: iOS fires right away because text color doesn't transition over time, it just changes immediately.
			// See https://stackoverflow.com/questions/2426614/how-to-animate-the-textcolor-property-of-an-uilabel
			try {
				should(label.color).be.eql('#fff');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.addEventListener('open', function () {
			setTimeout(() => label.animate(animation), 200);
		});
		win.add(label);
		win.open();
	});
});
