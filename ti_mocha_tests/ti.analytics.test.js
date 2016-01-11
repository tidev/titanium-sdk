/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("analytics", function() {
	it.skip("featureEvent", function(finish) {
		should(function() {
			Ti.Analytics.featureEvent();
		}).throw();
		should(Ti.Analytics.featureEvent("featureEvent.testButton")).be.undefined;
		should(Ti.Analytics.featureEvent("featureEvent.testButton", {
			events: "feature"
		})).be.undefined;
		finish();
	});
	it.skip("navEvent", function(finish) {
		should(function() {
			Ti.Analytics.navEvent();
		}).throw();
		should(function() {
			Ti.Analytics.navEvent("here");
		}).throw();
		should(Ti.Analytics.navEvent("here", "there")).be.undefined;
		should(Ti.Analytics.navEvent("here", "there", "navEvent.testButton")).be.undefined;
		should(Ti.Analytics.navEvent("here", "there", "navEvent.testButton", {
			events: "nav"
		})).be.undefined;
		finish();
	});
});
