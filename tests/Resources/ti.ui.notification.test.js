/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint promise/no-callback-in-promise: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.Notification', function () {
	this.timeout(10000);

	let window;
	afterEach(done => {
		if (window && !window.closed) {
			window.close().then(() => done()).catch(_e => done());
		} else {
			window = null;
			done();
		}
	});

	describe('methods', () => {
		describe('#show()', () => {
			it('is a Function', () => {
				const notification = Ti.UI.createNotification({
					title: 'Hello world',
					duration: Ti.UI.NOTIFICATION_DURATION_SHORT
				});

				should(notification).have.a.property('show').which.is.a.Function();
			});

			it('does not crash', finish => {
				const notification = Ti.UI.createNotification({
					title: 'Hello world',
					duration: Ti.UI.NOTIFICATION_DURATION_SHORT
				});

				window = Ti.UI.createWindow();
				window.open().then(notification.show).catch(finish);
			});
		});
	});
});
