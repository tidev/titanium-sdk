/*
 * Axway Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.android('Titanium.Android', function () {
	it('rootActivity', function () {
		should(Ti.Android.rootActivity).not.be.undefined;
		should(Ti.Android.rootActivity).be.a.Object;
		should(Ti.Android.rootActivity.intent).not.be.undefined;
		should(Ti.Android.rootActivity.intent).be.a.Object;
	});

	it('newintent', function (finish) {
		this.timeout(5000);
		const launchIntent = Ti.App.Android.launchIntent;
		const newIntent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_VIEW,
			data: 'https://www.appcelerator.com',
			packageName: launchIntent.packageName,
			className: launchIntent.className
		});
		newIntent.putExtra('MyBoolean', true);
		newIntent.putExtra('MyDouble', 123.456);
		newIntent.putExtra('MyString', 'Hello World');
		Ti.Android.rootActivity.addEventListener('newintent', function (e) {
			try {
				function validateIntent(intent) {
					should(intent).be.a.Object;
					should(intent.action).eql(newIntent.action);
					should(intent.data).eql(newIntent.data);
					should(intent.packageName).eql(newIntent.packageName);
					should(intent.className).eql(newIntent.className);
					should(intent.hasExtra('MyBoolean')).be.true;
					should(intent.getBooleanExtra('MyBoolean', false)).eql(true);
					should(intent.hasExtra('MyDouble')).be.true;
					should(intent.getDoubleExtra('MyDouble', 0)).eql(123.456);
					should(intent.hasExtra('MyString')).be.true;
					should(intent.getStringExtra('MyString')).eql('Hello World');
				}
				Ti.API.info('- Validating: e.intent');
				validateIntent(e.intent);
				Ti.API.info('- Validating: Ti.Android.rootActivity.intent');
				validateIntent(Ti.Android.rootActivity.intent);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		Ti.Android.currentActivity.startActivity(newIntent);
	});
});
