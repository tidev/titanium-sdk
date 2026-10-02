/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.App', () => {

	describe('constants', () => {
		it('EVENT_ACCESSIBILITY_ANNOUNCEMENT', () => {
			should(Ti.App).have.constant('EVENT_ACCESSIBILITY_ANNOUNCEMENT').which.is.eql('accessibilityannouncement');
		});

		it('EVENT_ACCESSIBILITY_CHANGED', () => {
			should(Ti.App).have.constant('EVENT_ACCESSIBILITY_CHANGED').which.is.eql('accessibilitychanged');
		});
	});

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals \'Ti.App\'', () => {
				should(Ti.App.apiName).be.eql('Ti.App');
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('apiName');
			});
		});

		describe('.accessibilityEnabled', () => {
			it('is a read-only Boolean', () => {
				should(Ti.App).have.a.readOnlyProperty('accessibilityEnabled').which.is.a.Boolean();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('accessibilityEnabled');
			});
		});

		describe.ios('.arguments', () => {
			it('is an Object', () => {
				should(Ti.App).have.a.readOnlyProperty('arguments').which.is.an.Object();
			});

			it('has getter', () => {
				should(Ti.App).have.a.getter('arguments');
			});
		});

		describe('.copyright', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('copyright').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('copyright');
			});
		});

		describe('.deployType', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('deployType').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('deployType');
			});
		});

		describe('.description', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('description').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('description');
			});
		});

		describe.ios('.disableNetworkActivityIndicator', () => {
			it('is a Boolean', () => {
				should(Ti.App).have.a.property('disableNetworkActivityIndicator').which.is.a.Boolean();
			});

			it('defaults to false', () => {
				should(Ti.App.disableNetworkActivityIndicator).be.false();
			});

			it('can be assigned a Boolean value', () => {
				Ti.App.disableNetworkActivityIndicator = true;
				should(Ti.App.disableNetworkActivityIndicator).be.true();
			});

			it('has no accessors', () => {
				should(Ti.App).not.have.accessors('disableNetworkActivityIndicator');
			});
		});

		describe.ios('.forceSplashAsSnapshot', () => {
			it('is a Boolean', () => {
				should(Ti.App).have.a.property('forceSplashAsSnapshot').which.is.a.Boolean();
			});

			it('can be assigned a Boolean value', () => {
				Ti.App.forceSplashAsSnapshot = true;
				should(Ti.App.forceSplashAsSnapshot).be.true();
			});

			it('has no accessors', () => {
				should(Ti.App).not.have.accessors('forceSplashAsSnapshot');
			});
		});

		describe('.guid', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('guid').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('guid');
			});
		});

		describe('.id', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('id').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('id');
			});
		});

		describe.ios('.idleTimerDisabled', () => {
			it('is a Boolean', () => {
				should(Ti.App).have.a.property('idleTimerDisabled').which.is.a.Boolean();
			});

			it('can be assigned a Boolean value', () => {
				Ti.App.idleTimerDisabled = true;
				should(Ti.App.idleTimerDisabled).be.true();
			});

			it('has no accessors', () => {
				should(Ti.App).not.have.accessors('idleTimerDisabled');
			});
		});

		describe.ios('.installId', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('installId').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('installId');
			});
		});

		describe.ios('.keyboardVisible', () => {
			it('is a read-only Boolean', () => {
				should(Ti.App).have.a.readOnlyProperty('keyboardVisible').which.is.a.Boolean();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('keyboardVisible');
			});
		});

		describe('.name', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('name').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('name');
			});
		});

		describe('.proximityDetection', () => {
			it('is a Boolean', () => {
				should(Ti.App).have.a.property('proximityDetection').which.is.a.Boolean();
			});

			it('defaults to false', () => {
				should(Ti.App.proximityDetection).be.false();
			});

			it.iosBroken('can be assigned a Boolean value', () => { // iOS does it async? I don't know
				Ti.App.proximityDetection = true;
				should(Ti.App.proximityDetection).be.true();
				Ti.App.proximityDetection = false;
				should(Ti.App.proximityDetection).be.false();
			});

			it('has no accessors', () => {
				should(Ti.App).not.have.accessors('proximityDetection');
			});
		});

		describe('.proximityState', () => {
			it('is a read-only Boolean', () => {
				should(Ti.App).have.a.readOnlyProperty('proximityState').which.is.a.Boolean();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('proximityState');
			});
		});

		describe('.publisher', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('publisher').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('publisher');
			});
		});

		// describe('.sessionId', () => {
		// 	it('is a read-only String', () => {
		// 		should(Ti.App).have.a.readOnlyProperty('sessionId').which.is.a.String();
		// 	});
		//
		// 	it('has no getter', () => {
		// 		should(Ti.App).not.have.a.getter('sessionId');
		// 	});
		// });

		describe('.url', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('url').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('url');
			});
		});

		describe('.version', () => {
			it('is a read-only String', () => {
				should(Ti.App).have.a.readOnlyProperty('version').which.is.a.String();
			});

			it('has no getter', () => {
				should(Ti.App).not.have.a.getter('version');
			});
		});
	});

	// TIMOB-23542 test searchQuery
	it.ios('searchQuery', () => {
		var searchQuery;
		should(Ti.App.iOS.createSearchQuery).not.be.undefined();
		should(Ti.App.iOS.createSearchQuery).be.a.Function();
		searchQuery = Ti.App.iOS.createSearchQuery({
			queryString: 'title == "Titanium*"',
			attributes: [ 'title', 'displayName', 'keywords', 'contentType' ]
		});
		should(searchQuery.attributes).be.an.Array();
		should(searchQuery.attributes.length).be.eql(4);
		should(searchQuery.queryString).be.eql('title == "Titanium*"');
	});

	it('#fireEvent - JSON serialization (TIMOB-25785)', function (finish) {
		var validObject, validArray, invalidObject, invalidArray;
		this.timeout(10000);

		validObject = {
			nl: null,
			num: 123,
			str: 'tirocks',
			arr: [ null, 123, 'tirocks', { num: 123, str: 'tirocks' } ],
			obj: {
				nl: null,
				num: 321,
				str: 'skcorit'
			}
		};

		validArray = [ null, 123, 'tirocks', { nl: null, num: 123, str: 'tirocks' }, [ null, 123, 'tirocks', { num: 123, str: 'tirocks' } ] ];

		invalidObject = {
			tiGesture: Ti.Gesture,
			proxy: Ti.UI.createLabel({ text: 'Whoops' }),
			num: 123,
			str: 'tirocks',
			arr: [ 123, 'tirocks', { num: 123, str: 'tirocks' } ],
			obj: {
				num: 321,
				str: 'skcorit'
			}
		};

		invalidArray = [ Ti.Gesture, Ti.UI.createLabel({ text: 'Whoops' }), 123, 'tirocks', { num: 123, str: 'tirocks' }, [ 123, 'tirocks', { num: 123, str: 'tirocks' } ] ];

		Ti.App.addEventListener('test1', function (e) {
			var obj = e.obj;

			should(obj).be.an.Object();
			should(obj.nl).be.null();
			should(obj.num).eql(123);
			should(obj.str).eql('tirocks');
			should(obj.arr).be.an.Array();
			should(obj.arr[0]).be.null();
			should(obj.arr[1]).eql(123);
			should(obj.arr[2]).eql('tirocks');
			should(obj.arr[3]).be.an.Object();
			should(obj.arr[3].num).eql(123);
			should(obj.arr[3].str).eql('tirocks');
			should(obj.obj).be.an.Object();
			should(obj.obj.nl).be.null();
			should(obj.obj.num).eql(321);
			should(obj.obj.str).eql('skcorit');

			Ti.App.fireEvent('test2', { arr: validArray });
		});

		Ti.App.addEventListener('test2', function (e) {
			var arr = e.arr;
			should(arr).be.an.Array();
			// TODO: Write more tests
			Ti.App.fireEvent('test3', { obj: invalidObject });
		});

		Ti.App.addEventListener('test3', function (e) {
			var obj = e.obj;
			should(obj).be.an.Object();
			// TODO: Write more tests
			Ti.App.fireEvent('test4', { arr: invalidArray });
		});

		Ti.App.addEventListener('test4', function (e) {
			var arr = e.arr;
			should(arr).be.an.Array();
			// TODO: Write more tests
			finish();
		});

		Ti.App.fireEvent('test1', { obj: validObject });
	});

	it.ios('Multiple global event listeners (TIMOB-25836)', function (finish) {
		function functionA () {
			Ti.App.removeEventListener('TestCheckNetwork', functionA);
		}

		function functionB () {
			Ti.App.removeEventListener('TestCheckNetwork', functionB);
			finish();
		}

		Ti.App.addEventListener('TestCheckNetwork', functionA);
		Ti.App.addEventListener('TestCheckNetwork', functionB);
		Ti.App.fireEvent('TestCheckNetwork');
	});

	it.android('pause/resume events', function (finish) {
		this.timeout(5000);

		// Cannot resume activity on Android 10.0+
		if (parseInt(Ti.Platform.version) >= 10) {
			console.warn('Skipping, cannot run test on Android 10.0+');
			return finish();
		}

		let wasPauseEventReceived = false;
		let wasResumeEventReceived = false;

		// Handle Ti.App pause/resume events. They happen when app is sent to background/foreground.
		// - "pause" event must be received before "paused" event.
		// - "resume" event must be received before "resumed" event.
		Ti.App.addEventListener('pause', function pauseEventHandler(e) {
			Ti.API.info('Received event: ' + e.type);
			Ti.App.removeEventListener(e.type, pauseEventHandler);
			wasPauseEventReceived = true;
		});
		Ti.App.addEventListener('paused', function pausedEventHandler(e) {
			try {
				Ti.API.info('Received event: ' + e.type);
				Ti.App.removeEventListener(e.type, pausedEventHandler);
				should(wasPauseEventReceived).be.true();
				Ti.Android.currentActivity.startActivity(Ti.App.Android.launchIntent); // Resume this app.
			} catch (err) {
				finish(err);
			}
		});
		Ti.App.addEventListener('resume', function resumeEventHandler(e) {
			Ti.API.info('Received event: ' + e.type);
			Ti.App.removeEventListener(e.type, resumeEventHandler);
			wasResumeEventReceived = true;
		});
		Ti.App.addEventListener('resumed', function resumedEventHandler(e) {
			try {
				Ti.API.info('Received event: ' + e.type);
				Ti.App.removeEventListener(e.type, resumedEventHandler);
				should(wasResumeEventReceived).be.true();
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		// Navigate to the device's home screen. Equivalent to pressing the "home" button.
		// This should fire this app's "pause" and "paused" events.
		const homeIntent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_MAIN,
		});
		homeIntent.addCategory(Ti.Android.CATEGORY_HOME);
		homeIntent.flags = Ti.Android.FLAG_ACTIVITY_NEW_TASK;
		Ti.Android.currentActivity.startActivity(homeIntent);
	});
});
