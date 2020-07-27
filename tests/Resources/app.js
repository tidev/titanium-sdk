/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium, mocha */
/* eslint no-unused-expressions: "off", no-global-assign: "off", no-native-reassign: "off" */
'use strict';
var utilities,
	win,
	$results = [],
	failed = false,
	should;

require('./ti-mocha');
// I *think* we need to load mocha first before utilities...
utilities = require('./utilities/utilities');
should = require('./utilities/assertions');

const isWindows = utilities.isWindows();
const isAndroid = !isWindows && utilities.isAndroid();

// Must test global is available in first app.js explicitly!
// (since app.js is treated slightly differently than required files on at least Android)
describe('global', function () {
	it('should be available as \'global\'', function () {
		should(global).be.ok;
	});
});

// Must have __dirname in the global scope, even in our app.js
describe('__dirname', function () {
	it.windowsMissing('should be available as \'__dirname\'', function () {
		should(__dirname).be.ok;
		should(__dirname).be.a.String();
		should(__dirname).be.eql('/');
	});
});

// Must have __filename in the global scope, even in our app.js
describe('__filename', function () {
	it.windowsMissing('should be available as \'__filename\'', function () {
		should(__filename).be.ok;
		should(__filename).be.a.String();
		should(__filename).be.eql('/app.js');
	});
});

function loadTests() {
	// ============================================================================
	// Add the tests here using "require"
	// Global behavior (top-level timers, functions, types)
	require('./console.test');
	require('./date.test');
	require('./error.test');
	require('./global.test');
	require('./intl.test');
	require('./intl.collator.test');
	require('./intl.datetimeformat.test');
	require('./intl.numberformat.test');
	require('./number.test');
	require('./require.test');
	require('./string.test');
	require('./timers.test');
	// ES6 syntax/compatability tests
	require('./es6.arrows.test');
	require('./es6.async.await.test');
	require('./es6.class.test');
	require('./es6.default.args.test');
	require('./es6.import.test');
	require('./es6.rest.args.test');
	require('./es6.spread.args.test');
	require('./es6.string.interpolation.test');
	// node-compat core modules
	require('./assert.test');
	require('./buffer.test');
	require('./fs.test');
	require('./os.test');
	require('./path.test');
	require('./string_decoder.test');
	require('./util.test');
	// Titanium APIs
	require('./core.runtime.test'); // tests on how proxies behave w/regard to hasOwnProperty
	require('./ti.accelerometer.test');
	require('./ti.analytics.test');
	require('./ti.android.test');
	require('./ti.android.notificationmanager.test');
	require('./ti.android.service.test');
	require('./ti.api.test');
	require('./ti.app.test');
	require('./ti.app.android.test');
	require('./ti.app.ios.test');
	require('./ti.app.ios.searchquery.test');
	require('./ti.app.ios.useractivity.test');
	require('./ti.app.properties.test');
	require('./ti.app.windows.backgroundservice.test');
	require('./ti.blob.test');
	require('./ti.bootstrap.test');
	require('./ti.buffer.test');
	require('./ti.calendar.calendar.test');
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
	require('./ti.locale.test');
	require('./ti.map.test');
	require('./ti.media.test');
	require('./ti.media.audioplayer.test');
	require('./ti.media.sound.test');
	require('./ti.media.videoplayer.test');
	require('./ti.network.test');
	require('./ti.network.bonjourbrowser.test');
	require('./ti.network.bonjourservice.test');
	require('./ti.network.cookie.test');
	require('./ti.network.httpclient.test');
	require('./ti.network.socket.tcp.test');
	require('./ti.network.socket.udp.test');
	require('./ti.platform.test');
	require('./ti.platform.displaycaps.test');
	require('./ti.proxy.test');
	require('./ti.stream.test');
	require('./ti.test');
	require('./ti.ui.test');
	require('./ti.ui.2dmatrix.test');
	require('./ti.ui.matrix2d.test');
	require('./ti.ui.activityindicator.test');
	require('./ti.ui.alertdialog.test');
	require('./ti.ui.android.test');
	require('./ti.ui.android.drawerlayout.test');
	require('./ti.ui.android.progressindicator.test');
	require('./ti.ui.attributedstring.test');
	require('./ti.ui.button.test');
	require('./ti.ui.constants.test');
	require('./ti.ui.emaildialog.test');
	require('./ti.ui.imageview.test');
	require('./ti.ui.ios.test');
	require('./ti.ui.ios.navigationwindow.test');
	require('./ti.ui.ios.previewcontext.test');
	require('./ti.ui.ios.splitwindow.test');
	require('./ti.ui.ios.statusbar.test');
	require('./ti.ui.ios.tableviewstyle.test');
	require('./ti.ui.ios.webviewconfiguration.test');
	require('./ti.ui.ipad.popover.test');
	require('./ti.ui.label.test');
	require('./ti.ui.layout.test');
	require('./ti.ui.listview.test');
	require('./ti.ui.maskedimage.test');
	require('./ti.ui.navigationwindow.test');
	require('./ti.ui.optiondialog.test');
	require('./ti.ui.picker.test');
	require('./ti.ui.progressbar.test');
	require('./ti.ui.scrollableview.test');
	require('./ti.ui.scrollview.test');
	require('./ti.ui.searchbar.test');
	require('./ti.ui.shortcut.test');
	require('./ti.ui.shortcutitem.test');
	require('./ti.ui.slider.test');
	require('./ti.ui.switch.test');
	require('./ti.ui.tab.test');
	require('./ti.ui.tabbedbar.test');
	require('./ti.ui.tabgroup.test');
	require('./ti.ui.tableview.test');
	require('./ti.ui.textarea.test');
	require('./ti.ui.textfield.test');
	require('./ti.ui.toolbar.test');
	require('./ti.ui.view.test');
	require('./ti.ui.webview.test');
	require('./ti.ui.window.test');
	require('./ti.ui.windows.commandbar.test');
	require('./ti.utils.test');
	require('./ti.watchsession.test');
	require('./ti.xml.test');

	// Load in any of the files added to the test/Resources folder of the SDK repos

	loadAddonTestFiles(Ti.Filesystem.resourcesDirectory);
}

/**
 * @param {string} name directory or filepath to look for addon tests
 */
function loadAddonTestFiles(name) {
	const info = Ti.Filesystem.getFile(name);
	if (!info) {
		console.warn(`could not load addon test files: ${name}`);
		return;
	}

	if (info.isDirectory()) {
		// ios has a trailing / in Ti.Filesystem.resourcesDirectory so we get too many slashes here!
		if (name.endsWith('/')) {
			name = name.slice(0, name.length - 1);
		}
		info.getDirectoryListing().forEach(listing => loadAddonTestFiles(`${name}/${listing}`));
	} else if (/\w+.addontest\.js$/i.test(info.name)) { // Only load the test files
		try {
			// convert app:/// to just '/' on Android
			const absolutePathWithoutExtension = name.replace(/.js$/, '').replace(Ti.Filesystem.resourcesDirectory, '/');
			console.log(`Loading addon test: ${absolutePathWithoutExtension}`);
			require(absolutePathWithoutExtension); // eslint-disable-line security/detect-non-literal-require
		} catch (e) {
			console.log(e);
		}
	}
}

// ============================================================================

/**
 * To make Jenkins junit reporting happy, let's use anything up until '#'/'.' in
 * suite names as the full "class name". Then concanetate the remainder with the test name.
 * This should consolidate tests together under our API names like 'Ti.Buffer', with subsuites' tests
 * just represented as separate tests (the sub-suite name gets prefixed to the test name)
 * @param  {string[]} suites  stack of suite names
 * @param  {string} testTitle single test name
 * @return {object}
 */
function suiteAndTitle(suites, testTitle) {
	var i;
	var char;
	var index = -1;
	var suiteName = '';
	var newTestTitle = '';
	for (i = 0; i < suites.length; i++) {
		char = suites[i].charAt(0);
		if (char === '.' || char === '#') {
			index = i;
			break;
		}
	}
	if (index !== -1) {
		suiteName = suites.slice(0, index).join('.');
		newTestTitle = suites.slice(index).join(' ') + ' ' + testTitle;
	} else {
		suiteName = suites.join('.');
		newTestTitle = testTitle;
	}
	return {
		suite: suiteName,
		title: newTestTitle
	};
}

function safeStringify(object) {
	// Hack around cycles in structure!
	const seen = [];
	return JSON.stringify(object, (key, val) => {
		if (val != null && typeof val === 'object') { // eslint-disable-line no-eq-null,eqeqeq
			if (seen.indexOf(val) >= 0) {
				return;
			}
			seen.push(val);
		}
		return val;
	});
}

function escapeCharacters(string) {
	return string.replace(/\\n/g, '\\n')
		.replace(/\\'/g, '\\\'')
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, '\\&')
		.replace(/\\r/g, '\\r')
		.replace(/\\t/g, '\\t')
		.replace(/\\b/g, '\\b')
		.replace(/\\f/g, '\\f')
		// remove non-printable and other non-valid JSON chars
		.replace(/[\u0000-\u0019]+/g, ''); // eslint-disable-line no-control-regex
}

// add a special mocha reporter that will time each test run using
// our microsecond timer
function $Reporter(runner) {
	var started,
		suites = [];

	runner.on('suite', function (suite) {
		if (suite.title) {
			suites.push(suite.title);
		}
	});

	runner.on('suite end', function (suite) {
		if (suite.title) {
			suites.pop();
		}
	});

	runner.on('test', function (test) {
		Ti.API.info('!TEST_START: ' + test.title);
		started = new Date().getTime();
	});

	runner.on('pending', function () {
		// TODO Spit out something like !TEST_SKIP:  ?
		started = new Date().getTime(); // reset timer. pending/skipped tests basically start and end immediately
	});

	// 'pending' hook for skipped tests? Does 'pending', then immediate 'test end'. No 'test' event

	runner.on('fail', function (test, err) {
		test.err = err;
		failed = true;
	});

	runner.on('test end', function (test) {
		const tdiff = new Date().getTime() - started;
		const fixedNames = suiteAndTitle(suites, test.title);
		const result = {
			state: test.state || 'skipped',
			duration: tdiff,
			suite: fixedNames.suite,
			title: fixedNames.title,
			error: test.err,
			message: ''
		};

		if (test.err) {
			let message = test.err.message || 'Error';
			let stack = test.err.stack || '';
			// uncaught
			if (test.err.uncaught) {
				message = 'Uncaught ' + message;
			}

			// if there's both a stack and message property and they differ, but message is in the stack, strip it from the stack
			if (test.err.message && test.err.stack && stack.indexOf(message) !== -1) {
				// stack trace includes the message in it!
				const index = stack.indexOf(message) + message.length;
				// indent stack trace without msg
				stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
			}
			result.message = message;
			result.stack = stack;
		}

		// Hack around cycles in structure!
		let stringified = escapeCharacters(safeStringify(result));
		// FIXME: On Android we have a max log size of 4076 bytes (some of which is taken up by our tag/etc)
		// if the stringified output is too long, we should "split" it by looking for the last '","' before the limit
		// and print that chunk etc.
		// In practice it seems to get cut off at 4067 characters,
		// and we take up the first 19 with the log level and !TEST_END stuff - leaving us with up to 4048 characters
		if (isAndroid && stringified.length > 4000) {
			let prefix = '!TEST_END: ';
			while (stringified.length > 4000) {
				const splitIndex = stringified.lastIndexOf('","', 4000);
				if (splitIndex !== -1) {
					Ti.API.info(prefix + stringified.substring(0, splitIndex + 2)); // keep end quote and comma
					stringified = stringified.substring(splitIndex + 2);
				} else {
					// No obvious split point, just spit out 3900 characters and try loop again
					Ti.API.info(prefix + stringified.substring(0, 3900));
					stringified = stringified.substring(3900);
				}
				prefix = ''; // after first output don't prefix with !TEST_END: anymore
			}
			// print out last chunk
			if (stringified.length !== 0) {
				Ti.API.info(stringified);
			}
		} else {
			Ti.API.info('!TEST_END: ' + stringified);
		}
		$results.push(result);
	});
}

if (isWindows) {
	if (Ti.App.Windows.requestExtendedExecution) {
		Ti.App.Windows.requestExtendedExecution();
	}
}

// Emit OS version
Ti.API.info('OS_VERSION: ' + Ti.Platform.version);

// Display a window to host the test and show the final result.
win = Ti.UI.createWindow({
	backgroundColor: 'yellow',
	keepScreenOn: true
});
win.addEventListener('open', function () {
	setTimeout(function () {
		mocha.setup({
			reporter: $Reporter,
			quiet: true
		});
		loadTests();
		// Start executing the test suite.
		mocha.run(function () {
			// We've finished executing all tests.
			win.backgroundColor = failed ? 'red' : 'green';
			Ti.API.info('!TEST_RESULTS_STOP!');
			if (isWindows) {
				if (Ti.App.Windows.closeExtendedExecution) {
					Ti.App.Windows.closeExtendedExecution();
				}
			}
		});
	}, 25);
});
win.open();
