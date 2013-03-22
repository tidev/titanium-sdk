/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

// This test depends on call history already being present. If call history is empty, the test will
// still succeed, but will not test much. Currently it is not possible to add calls programmatically.
module.exports = new function() {
	var finish,
		valueOf,
		reportError,
		Tizen;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
		Tizen = require('tizen');
	}

	this.name = 'call_history';
	this.tests = [
		{name: 'call_history'},
		{name: 'remove'},
		{name: 'remove_batch'},
		{name: 'remove_all'},
		{name: 'listeners'}
	]

	// Search for history of call
	this.call_history = function(testRun) {
		// Type of call
		var tFilter = Tizen.createAttributeFilter({
				attributeName: 'type',
				matchFlag: Tizen.FILTER_MATCH_FLAG_EXACTLY,
				matchValue: 'TEL'
			}),
			// Sort output
			sortMode = Tizen.createSortMode({
				attributeName: 'startTime',
				order: Tizen.SORT_MODE_ORDER_DESC
			}),
			// From number
			numberFilter = Tizen.createAttributeFilter({
				attributeName: 'remoteParties.remoteParty',
				matchFlag: Tizen.FILTER_MATCH_FLAG_EXACTLY,
				matchValue: '12345678'
			}),
			// Add filters
			iFilter = Tizen.createCompositeFilter({
				type: Tizen.COMPOSITE_FILTER_TYPE_INTERSECTION, 
				filters: [
					numberFilter,
					tFilter
				]
			});

		valueOf(testRun, Tizen.CallHistory).shouldBeObject();
		valueOf(testRun, tFilter).shouldBeObject();
		valueOf(testRun, sortMode).shouldBeObject();
		valueOf(testRun, numberFilter).shouldBeObject();
		valueOf(testRun, iFilter).shouldBeObject();

		function onSuccess(results) {
			if (results.length <= 0) {
				reportError(testRun, 'This test requires at least one call in the phone\'s call history. Please make several calls and restart the test.');
				finish(testRun);
			}
			valueOf(testRun, results).shouldNotBeUndefined();
			valueOf(testRun, results).shouldBeObject();

			for (var i in results) {
				valueOf(testRun, results[i].uid).shouldBeString();
				valueOf(testRun, results[i].remoteParties).shouldBeArray();
				valueOf(testRun, results[i].startTime).shouldBeObject();
				valueOf(testRun, results[i].direction).shouldBeString();
				valueOf(testRun, results[i].type).shouldBeString();
				valueOf(testRun, results[i].toString()).shouldBe('[object TizenCallHistoryCallHistoryEntry]');
			}
		}

		function onError(error) {
			reportError(testRun, 'The following error occurred: ' +  error.message);
		}

		// Find call history
		valueOf(testRun, function() { Tizen.CallHistory.find(onSuccess, onError, tFilter, sortMode); }).shouldNotThrowException();

		setTimeout(
			function() {
				finish(testRun);
			},
			10
		);
	}

	// Remove: deletes a call history entries. 
	this.remove = function(testRun) {
		function onSuccess(results) {
			valueOf(testRun, results).shouldNotBeUndefined();
			valueOf(testRun, results).shouldBeObject();

			if (results.length > 0) {
				// Delete call from call history
				valueOf(testRun, function() { Tizen.CallHistory.remove(results[0]); }).shouldNotThrowException();
			} else {
				reportError(testRun, 'This test requires at least one call in the phone\'s call history. Please make several calls and restart the test.');
				finish(testRun);
			}
		}

		function onError(error) {
			reportError(testRun, 'The following error occurred: ' +  error.message);
		}

		valueOf(testRun, Tizen.CallHistory).shouldBeObject();

		// Search for call history
		valueOf(testRun, function() { Tizen.CallHistory.find(onSuccess, onError); }).shouldNotThrowException();

		setTimeout(
			function() {
				finish(testRun);
			},
			10
		);
	}

	// Deletes a list of call history entries. 
	this.remove_batch = function(testRun) {
		function onSuccess(results) {
			valueOf(testRun, results).shouldBeObject();
			// delete found history
			valueOf(testRun, function() { Tizen.CallHistory.removeBatch(results, null, onError); }).shouldNotThrowException();
		}

		function onError(error) {
			reportError(testRun, 'This test requires at least one call in the phone\'s call history. Please make several calls and restart the test.');
			reportError(testRun, 'The following error occurred: ' +  error.message);
			finish(testRun);
		}

		valueOf(testRun, Tizen.CallHistory).shouldBeObject();

		// Search for call history
		valueOf(testRun, function() { Tizen.CallHistory.find(onSuccess, onError); }).shouldNotThrowException();

		// Give some time for execution
		setTimeout(
			function() {
				finish(testRun);
			},
			10
		);
	}

	// Deletes all call history. 
	this.remove_all = function(testRun) {
		function onError(error) {
			reportError(testRun, 'The following error occurred: ' +  error.message);
		}

		valueOf(testRun, Tizen.CallHistory).shouldBeObject();

		// Delete all call history
		valueOf(testRun, function() { Tizen.CallHistory.removeAll(null, onError); }).shouldNotThrowException();

		// Give some time for execution
		setTimeout(
			function() {
				finish(testRun);
			},
			10
		);
	}

	// Observing of callHistory changes. 
	this.listeners = function(testRun) {
		var handle,
			onListenerCB = {
				onadded: function(newItems) {
					valueOf(testRun, newItems).shouldBeObject();
				},
				onchanged: function(changedItems) {
					valueOf(testRun, changedItems).shouldBeObject();
				}
			};

		valueOf(testRun, Tizen.CallHistory).shouldBeObject();

		try {
			// Add new listener
			valueOf(testRun, function() { handle = Tizen.CallHistory.addChangeListener(onListenerCB); }).shouldNotThrowException();
			valueOf(testRun, handle).shouldNotBeNull();
			valueOf(testRun, handle).shouldBeNumber();

			// Remove added listener
			valueOf(testRun, function() { Tizen.CallHistory.removeChangeListener(handle); }).shouldNotThrowException();
		} catch (error) {
			reportError(testRun, 'The following error occurred: ' +  error.message);
		}

		// Give some time for execution
		setTimeout(
			function() {
				finish(testRun);
			},
			10
		);
	}
}
