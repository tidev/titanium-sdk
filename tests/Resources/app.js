/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
require('./ti-mocha');
var $results = [],
	failed = false,
  mainWindow = Ti.UI.createWindow({
  	backgroundColor: 'yellow'
  });
mainWindow.open();

// ============================================================================
// Add the tests here using "require"
require('./es6.arrows.test');
// ============================================================================

// add a special mocha reporter that will time each test run using
// our microsecond timer
function $Reporter(runner) {
	var started,
		title;

	runner.on('suite', function (suite) {
		title = suite.title;
	});

	runner.on('test', function (test) {
		Ti.API.info('!TEST_START: ' + test.title);
		started = new Date().getTime();
	});

	runner.on('pending', function (test) {
		// TODO Spit out something like !TEST_SKIP:  ?
		started = new Date().getTime(); // reset timer. pending/skipped tests basically start and end immediately
	});

	// 'pending' hook for skipped tests? Does 'pending', then immediate 'test end'. No 'test' event

	runner.on('fail', function (test, err) {
		test.err = err;
		failed = true;
	});

	runner.on('test end', function (test) {
		var tdiff = new Date().getTime() - started,
			result = {
				state: test.state || 'skipped',
				duration: tdiff,
				suite: title,
				title: test.title,
				error: test.err // TODO Include the message property on Windows!
			},
			stringified = JSON.stringify(result);

			stringified = stringified.replace(/\\n/g, "\\n")
					   .replace(/\\'/g, "\\'")
					   .replace(/\\"/g, '\\"')
					   .replace(/\\&/g, "\\&")
					   .replace(/\\r/g, "\\r")
					   .replace(/\\t/g, "\\t")
					   .replace(/\\b/g, "\\b")
					   .replace(/\\f/g, "\\f");
			// remove non-printable and other non-valid JSON chars
			stringified = stringified.replace(/[\u0000-\u0019]+/g,'');
		Ti.API.info('!TEST_END: ' + stringified);
		$results.push(result);
	});
};

mocha.setup({
	reporter: $Reporter,
	quiet: true
});

// dump the output, which will get interpreted above in the logging code
mocha.run(function () {
	mainWindow.backgroundColor = failed ? 'red' : 'green';
	Ti.API.info('!TEST_RESULTS_STOP!');
});
