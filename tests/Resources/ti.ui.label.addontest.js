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

	it.iosBroken('animate font color', function (finish) {
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
			// FIXME: iOS appears to be firing this event immediately, not when the animation is actually done!
			// test takes 206 ms, but fastest it could run is 1200ms due to 1s animation value
			try {
				should(label.color).be.eql('#fff'); // iOS also doesn't update properties post-animation
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
