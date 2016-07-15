/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

require('ti-mocha');
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities'),
	didFocus = false;

describe('Titanium.UI.Window', function () {
	this.timeout(5000);

	var win;

	beforeEach(function() {
		didFocus = false;
	});

	afterEach(function() {
		if (win != null) {
			win.close();
		}
		win = null;
	});

	it('title', function () {
		win = Ti.UI.createWindow({
			title: 'this is some text'
		});
		should(win.title).be.a.String;
		should(win.getTitle).be.a.Function;
		should(win.title).eql('this is some text');
		should(win.getTitle()).eql('this is some text');
		win.title = 'other text';
		should(win.title).eql('other text');
		should(win.getTitle()).eql('other text');
	});

	it('titleid', function () {
		win = Ti.UI.createWindow({
			titleid: 'this_is_my_key'
		});
		should(win.titleid).be.a.String;
		should(win.getTitleid).be.a.Function;
		should(win.titleid).eql('this_is_my_key');
		should(win.getTitleid()).eql('this_is_my_key');
		should(win.title).eql('this is my value');
		win.titleid = 'other text';
		should(win.titleid).eql('other text');
		should(win.getTitleid()).eql('other text');
		should(win.title).eql('this is my value'); // FIXME Windows: https://jira.appcelerator.org/browse/TIMOB-23498
	});

	// FIXME Get working on iOS. iOS reports size of 100, which seems right...
	// FIXME Get working on Android. Also reports size of 100...
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('window_size_is_read_only', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue',
			width: 100,
			height: 100
		});
		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				// FIXME size should only be accessible in postlayout callback, which iOS and Android don't currently fire for Ti.UI.Window!
				should(w.size.width).not.be.eql(100); // iOS fails here
				should(w.size.height).not.be.eql(100);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Get working on iOS. reports left of 100, which seems right!
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('window_position_is_read_only', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'green',
			left: 100,
			right: 100
		});
		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				// FIXME rect should only be accessible in postlayout callback, which iOS and Android don't currently fire for Ti.UI.Window!
				should(w.rect.left).not.be.eql(100); // ios reports 100
				should(w.rect.right).not.be.eql(100);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME https://jira.appcelerator.org/browse/TIMOB-23640
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('postlayout event gets fired', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'yellow' });

		// Confirms that Ti.UI.Window fires postlayout event
		win.addEventListener('postlayout', function (e) {
			finish();
		});
		win.open();
	});

	it('#remove(View)', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'gray'
		});
		var view = Ti.UI.createView();
		win.addEventListener('focus', function() {
			if (didFocus) return;
			didFocus = true;

			try {
				should(win.children.length).be.eql(1);
				win.remove(win.children[0]);
				should(win.children.length).be.eql(0);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.add(view);
		win.open();
	});

	it('blur event is fired when closed', function (finish) {
		this.slow(5000);
		this.timeout(20000);

		win = Ti.UI.createWindow({
			backgroundColor: 'pink'
		});

		win.addEventListener('blur', function () { finish(); });
		win.addEventListener('open', function () {
			setTimeout(function () {
				win.close();
			}, 100);
		});
		win.open();
	});

	it('focus event is fired when opened', function (finish) {
		this.slow(2000);
		this.timeout(20000);

		win = Ti.UI.createWindow({
			backgroundColor: 'pink'
		});

		win.addEventListener('focus', function () { finish(); });
		win.open();
	});

	it('open event is fired', function (finish) {
		this.slow(2000);
		this.timeout(20000);

		win = Ti.UI.createWindow({
			backgroundColor: 'pink'
		});

		win.addEventListener('open', function () { finish(); });
		win.open();
	});

	it('close event is fired', function (finish) {
		this.slow(5000);
		this.timeout(20000);

		win = Ti.UI.createWindow({
			backgroundColor: 'pink'
		});
		win.addEventListener('close', function () { finish(); });
		win.addEventListener('open', function () {
			setTimeout(function () {
				win.close();
			}, 100);
		});
		win.open();
	});

	// For this test, you should see errors in the console, it is expected.
	// What you should not see is a crash
	it('should_not_crash', function (finish) {
		this.slow(5000);
		this.timeout(20000);

		var win1 = Ti.UI.createWindow();
		win1.open();
		win1.close();
		var win2 = Ti.UI.createWindow();
		win2.close();
		win1.open();
		win2.close();
		setTimeout(function () {
			win1.close();
			setTimeout(function () {
				win1.close();
				finish();
			}, 1000);
		}, 1000);
	});

	it('window_close_order_1', function (finish) {
		this.slow(5000);
		this.timeout(30000);

		win = Ti.UI.createWindow({backgroundColor:'green'});
		var win2 = Ti.UI.createWindow({backgroundColor:'blue' }),
			win3 = Ti.UI.createWindow({backgroundColor:'gray' });

		win.addEventListener('focus', function(e) {
			if (didFocus) return;
			didFocus = true;

			win2.open();
			setTimeout(function () {
				win3.open();
				setTimeout(function () {
					win3.close();
					setTimeout(function () {
						win2.close();
						finish();
					}, 500);
				}, 500);
			}, 500);
		});

		win.open();
	});

	it('window_close_order_2', function (finish) {
		this.slow(5000);
		this.timeout(20000);

		win = Ti.UI.createWindow({backgroundColor:'green'});
		var win2 = Ti.UI.createWindow({backgroundColor:'blue' }),
			win3 = Ti.UI.createWindow({backgroundColor:'gray' });

		win.addEventListener('focus', function(e) {
			if (didFocus) return;
			didFocus = true;

			win2.open();
			setTimeout(function () {
				win3.open();
				win2.close();
				setTimeout(function () {
					win3.close();
					finish();
				}, 500);
			}, 500);
		});

		win.open();
	});

	// TIMOB-20600
	it('TIMOB-20600', function (finish) {
		this.slow(5000);
		this.timeout(30000);

		win = Ti.UI.createWindow({backgroundColor:'green'});
		var win2 = Ti.UI.createWindow({backgroundColor:'blue' }),
			win3 = Ti.UI.createWindow({backgroundColor:'gray' });

		win.addEventListener('focus', function(e) {
			if (didFocus) return;
			didFocus = true;

			win2.open();
			setTimeout(function () {
				win3.open();
				setTimeout(function () {
					win2.close();
					setTimeout(function () {
						win3.close();
						finish();
					}, 500);
				}, 500);
			}, 500);
		});

		win.open();
	});

	it.skip('window_to_string', function () {
		win = Ti.UI.createWindow();
		should(win.toString()).be.eql('[object Window]');
		should(win.apiName).be.a.String;
		should(win.apiName).be.eql('Ti.UI.Window');
	});

	// FIXME Get working on iOS
	// FIXME Get working on Android - Ti.UI.currentWindow is null
	// Supposedly this property should only exist when using Ti.UI.Window.url to load JS files into own context! But we support elsewhere for Windows
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('window_currentWindow', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'yellow'
		});
		win.addEventListener('focus', function (e) {
			if (didFocus) return;
			didFocus = true;

			try {
				should(Ti.UI.currentWindow).exist; // Android gives null
				should(Ti.UI.currentWindow).be.eql(win); // iOS fails here

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it.skip('window_navigation', function (finish) {
		var rootWindowFocus = 0;
		var rootWindowBlur = 0;
		var rootWindowOpen = 0;
		var rootWindowClose = 0;
		var secondWindowFocus = 0;
		var secondWindowBlur = 0;
		var secondWindowOpen = 0;
		var secondWindowClose = 0;
		var thridWindowFocus = 0;
		var thridWindowBlur = 0;
		var thridWindowOpen = 0;
		var thridWindowClose = 0;

		var rootWindow = Ti.UI.createWindow({
			backgroundColor: 'navy'
		});

		rootWindow.addEventListener('focus', function () { rootWindowFocus++ });
		rootWindow.addEventListener('blur', function () { rootWindowBlur++ });
		rootWindow.addEventListener('open', function () { rootWindowOpen++ });
		rootWindow.addEventListener('close', function () { rootWindowClose++ });
		rootWindow.open();

		setTimeout(function () {
			var secondWindow = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});
			secondWindow.addEventListener('focus', function () { secondWindowFocus++ });
			secondWindow.addEventListener('blur', function () { secondWindowBlur++ });
			secondWindow.addEventListener('open', function () { secondWindowOpen++ });
			secondWindow.addEventListener('close', function () { secondWindowClose++ });
			secondWindow.open();

			setTimeout(function () {
				var thirdWindow = Ti.UI.createWindow({
					backgroundColor: 'green'
				});
				thirdWindow.addEventListener('focus', function () { thridWindowFocus++ });
				thirdWindow.addEventListener('blur', function () { thridWindowBlur++ });
				thirdWindow.addEventListener('open', function () { thridWindowOpen++ });
				thirdWindow.addEventListener('close', function () { thridWindowClose++ });
				thirdWindow.open();

				setTimeout(function () {
					thirdWindow.close();
					setTimeout(function () {
						secondWindow.close();
						setTimeout(function () {
							rootWindow.close();
							try {
								should(rootWindowFocus).be.eql(2);
								should(rootWindowBlur).be.eql(2);
								should(rootWindowOpen).be.eql(1);
								should(rootWindowClose).be.eql(1);

								should(secondWindowFocus).be.eql(2);
								should(secondWindowBlur).be.eql(2);
								should(secondWindowOpen).be.eql(1);
								should(secondWindowClose).be.eql(1);

								should(thridWindowFocus).be.eql(1);
								should(thridWindowBlur).be.eql(1);
								should(thridWindowOpen).be.eql(1);
								should(thridWindowClose).be.eql(1);
								finish();
							} catch(err) {
								finish(err);
							}
						}, 500);
					}, 500);
				}, 500);
			}, 500);
		}, 500);
	});
});
