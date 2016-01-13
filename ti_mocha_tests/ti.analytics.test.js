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
	it.skip("featureEventJsonValidate", function(finish) {

		var testInput = {
		  "Complex invalid JSON": {"input": "an_complex_invalid.json", "expected": -1},
		  "Complex valid JSON": {"input": "an_complex_valid.json", "expected": 0},
		  "Large invalid JSON": {"input": "an_large_invalid.json", "expected": -1},
		  "Invalid keylength": {"input": "an_invalid_keylength.json", "expected": -1},
		  "Invalid keys": {"input": "an_invalid_maxkeys.json", "expected": -1}
		}
		var readJSON = function(fileName) {
		  var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, "jsonFiles/"+fileName);
		  var blob = file.read();
		  var readText = blob.text;
		  var theJSON = JSON.parse(readText)
		  file = null;
		  blob = null;
		  return theJSON;
		}

		var runTest = function(test) {
		  console.log("Running "+JSON.stringify(test));
		  var theJSON = readJSON(test.input);
		  var result = Titanium.Analytics.featureEvent('ti.analytics.'+test.input, theJSON);
		  (result).should.equal(test.expected);
		}

		runTest(testInput["Complex invalid JSON"]);
		runTest(testInput["Complex valid JSON"]);
		runTest(testInput["Large invalid JSON"]);
		runTest(testInput["Invalid keylength"]);
		runTest(testInput["Invalid keys"]);

		finish();
	});
});
