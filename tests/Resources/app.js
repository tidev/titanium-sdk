/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var win = Ti.UI.createWindow({
	backgroundColor: 'yellow'
});
win.open();

require('./ti-mocha');
var $results = [],
	failed = false;

// ============================================================================
// Add the tests here using "require"
// ES6 syntax/compatability tests
require('./es6.arrows.test');
require('./es6.default.args.test');
require('./es6.rest.args.test');
require('./es6.spread.args.test');
require('./es6.string.interpolation.test');
// Titanium APIs
require('./ti.accelerometer.test');
require('./ti.api.test');
require('./ti.app.test');
require('./ti.app.properties.test');
require('./ti.app.windows.backgroundservice.test');
require('./ti.blob.test');
require('./ti.builtin.test');
require('./ti.buffer.test');
require('./ti.codec.test');
require('./ti.contacts.test');
require('./ti.contacts.group.test');
require('./ti.contacts.person.test');
require('./ti.database.test');
require('./ti.filesystem.test');
require('./ti.filesystem.file.test');
require('./ti.filesystem.filestream.test');
require('./ti.geolocation.test');
require('./ti.gesture.test');
require('./ti.internal.test');
require('./ti.locale.test');
require('./ti.map.test');
require('./ti.network.test');
require('./ti.network.httpclient.test');
require('./ti.platform.test');
require('./ti.platform.displaycaps.test');
require('./ti.require.test');
require('./ti.stream.test');
require('./ti.test');
require('./ti.ui.test');
require('./ti.ui.2dmatrix.test');
require('./ti.ui.activityindicator.test');
require('./ti.ui.alertdialog.test');
require('./ti.ui.button.test');
require('./ti.ui.constants.test');
require('./ti.ui.emaildialog.test');
require('./ti.ui.imageview.test');
require('./ti.ui.label.test');
require('./ti.ui.layout.test');
require('./ti.ui.listview.test');
require('./ti.ui.optiondialog.test');
require('./ti.ui.picker.test');
require('./ti.ui.progressbar.test');
require('./ti.ui.scrollableview.test');
require('./ti.ui.scrollview.test');
require('./ti.ui.searchbar.test');
require('./ti.ui.switch.test');
require('./ti.ui.tab.test');
require('./ti.ui.tableview.test');
require('./ti.ui.textfield.test');
require('./ti.ui.view.test');
require('./ti.ui.webview.test');
require('./ti.ui.window.test');
require('./ti.ui.windows.commandbar.test');
require('./ti.utils.test');
require('./ti.xml.test');
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
	win.backgroundColor = failed ? 'red' : 'green';
	Ti.API.info('!TEST_RESULTS_STOP!');
});
