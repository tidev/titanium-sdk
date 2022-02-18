/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.ios('Titanium.App.iOS.UserActivity', function () {

	var userActivity;

	before(function () {
		userActivity = Ti.App.iOS.createUserActivity({
			activityType: 'com.setdirection.home',
			title: 'activity 1',
			userInfo: {
				msg: 'hello world'
			},
			eligibleForSearch: true,
			eligibleForPrediction: true,
			persistentIdentifier: 'titanium_activity_identifier'
		});
	});

	after(function () {
		userActivity = null;
	});

	it('constructor', function () {
		should(userActivity).be.an.Object();
		should(userActivity).have.readOnlyProperty('apiName').which.is.a.String();
		should(userActivity.apiName).be.eql('Ti.App.iOS.UserActivity');
	});

	it('#deleteSavedUserActivitiesForPersistentIdentifiers()', function () {
		should(userActivity.deleteSavedUserActivitiesForPersistentIdentifiers).be.a.Function();
	});

	it('#deleteAllSavedUserActivities()', function () {
		should(userActivity.deleteAllSavedUserActivities).be.a.Function();
	});

});
