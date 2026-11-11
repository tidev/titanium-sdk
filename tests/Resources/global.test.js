/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env node, titanium, mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('global', function () {
	it('exists at top-level', function () {
		should(global).be.an.Object();
	});

	describe('.onunhandledrejection', function () {
		afterEach(function () {
			global.onunhandledrejection = null;
		});

		it.android('fires for a rejection without a handler', function (finish) {
			const reason = new Error('unhandled');
			global.onunhandledrejection = function (event) {
				if (event.reason !== reason) {
					return;
				}
				event.preventDefault();
				try {
					should(event.type).eql('unhandledrejection');
					should(event.promise).be.a.Promise();
				} catch (err) {
					return finish(err);
				}
				finish();
			};
			Promise.reject(reason);
		});

		it.android('does not fire when a queued microtask attaches the catch', function (finish) {
			const reason = new Error('handled-in-microtask');
			let fired = false;
			global.onunhandledrejection = function (event) {
				if (event.reason === reason) {
					event.preventDefault();
					fired = true;
				}
			};
			const promise = Promise.reject(reason);
			Promise.resolve().then(() => promise.catch(() => {}));
			setTimeout(function () {
				try {
					should(fired).be.false();
				} catch (err) {
					return finish(err);
				}
				finish();
			}, 100);
		});

		it.android('does not loop when the handler itself rejects', function (finish) {
			const reason = new Error('from-app');
			const handlerReason = new Error('from-handler');
			let appCount = 0;
			let handlerCount = 0;
			global.onunhandledrejection = async function (event) {
				event.preventDefault();
				if (event.reason === reason) {
					appCount++;
					await Promise.resolve();
					throw handlerReason;
				}
				if (event.reason === handlerReason) {
					handlerCount++;
				}
			};
			Promise.reject(reason);
			// The rejection from the handler is reported after a later microtask checkpoint,
			// so give the runtime one more task before asserting.
			setTimeout(function () {}, 0);
			setTimeout(function () {
				try {
					should(appCount).eql(1);
					should(handlerCount).eql(1);
				} catch (err) {
					return finish(err);
				}
				finish();
			}, 100);
		});
	});
});
