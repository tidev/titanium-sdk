/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

require('ti-mocha');
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities'),
	didFocus = false,
	didPostLayout = false;

describe('Titanium.UI.View', function () {
	this.timeout(5000);

	var win;

	beforeEach(function() {
		didFocus = false;
		didPostLayout = false;
	});

	afterEach(function() {
		if (win != null) {
			win.close();
		}
		win = null;
	});

	// FIXME Get working on iOS and Android
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('backgroundColor/Image', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		var view = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			var error;

			if (didFocus) return;
			didFocus = true;

			try {
				should(view.backgroundColor).be.a.String; // undefined on iOS and Android
				should(view.backgroundImage).be.a.String;
				view.backgroundColor = 'white';
				view.backgroundImage = 'Logo.png';
				should(view.backgroundColor).be.eql('white');
				should(view.backgroundImage).be.eql('Logo.png');

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Get working on iOS and Android
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('backgroundFocusedColor/Image', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		var view = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				should(view.backgroundFocusedColor).be.a.String; // undefined on iOS and Android
				should(view.backgroundFocusedImage).be.a.String;
				view.backgroundFocusedColor = 'white';
				view.backgroundFocusedImage = 'Logo.png'
				should(view.backgroundFocusedColor).be.eql('white');
				should(view.backgroundFocusedImage).be.eql('Logo.png');

				finish();
			} catch(err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Get working on iOS
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('backgroundSelectedColor/Image', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		var view = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				should(view.backgroundSelectedColor).be.a.String; // undefined on iOS and Android
				should(view.backgroundSelectedImage).be.a.String;
				view.backgroundSelectedColor = 'white';
				view.backgroundSelectedImage = 'Logo.png';
				should(view.backgroundSelectedColor).be.eql('white');
				should(view.backgroundSelectedImage).be.eql('Logo.png');

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Get working on iOS and Android
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('backgroundDisabledColor/Image', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		var view = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				should(view.backgroundDisabledColor).be.a.String; // undefined on iOS and Android
				should(view.backgroundDisabledImage).be.a.String;
				view.backgroundDisabledColor = 'white';
				view.backgroundDisabledImage = 'Logo.png';
				should(view.backgroundDisabledColor).be.eql('white');
				should(view.backgroundDisabledImage).be.eql('Logo.png');

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Get working on iOS
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isIOS()) ? it.skip : it)('backgroundGradient', function (finish) {
		this.timeout(10000);

		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		var view = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL });
		view.backgroundGradient = {
			type: 'linear',
			startPoint: { x: '0%', y: '50%' },
			endPoint: { x: '100%', y: '100%' },
			colors: [{ color: 'red', offset: 0.0 }, { color: 'blue', offset: 0.25 }, { color: 'red', offset: 1.0 }],
		};
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				should(view.backgroundGradient.type).be.eql('linear');
				should(view.backgroundGradient.startPoint).be.an.Object;
				should(view.backgroundGradient.endPoint).be.an.Object;
				should(view.backgroundGradient.colors).be.an.Array; // undefined on iOS

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Get working on iOS and Android
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('border', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		var view = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				should(view.borderColor).be.a.String; // undefined on iOS and Android
				should(view.borderWidth).be.a.Number;
				view.borderColor = 'blue';
				view.borderWidth = 2;
				should(view.borderColor).be.eql('blue');
				should(view.borderWidth).be.eql(2);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME fails on Android because Ti.UI.View doesn't fire postlayout
	// FIXME Times out on iOS. Never fires postlayout?
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('rect and size', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		var view = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL }),
			error;
		win.add(view);

		view.addEventListener('postlayout', function () {
			if (didPostLayout) return;
			didPostLayout = true;

			try {
				Ti.API.info('Got postlayout event');
				Ti.API.info(JSON.stringify(view.rect));
				Ti.API.info(JSON.stringify(view.size));
				should(view.rect).be.an.Object;
				should(view.rect.width).be.above(0);
				should(view.rect.height).be.above(0);
				should(view.rect.x).be.a.Number;
				should(view.rect.y).be.a.Number;
				should(view.size.width).be.above(0);
				should(view.size.height).be.above(0);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Get working on iOS! After #hide() call, visible still returns true)
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isIOS()) ? it.skip : it)('hide() and show() change visible property value', function (finish) {
		this.slow(2000);
		this.timeout(7500);

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				Ti.API.info('Got focus event');
				should(win.visible).be.true;
				win.hide();
				should(win.visible).be.false; // iOS returns true
				win.show();
				should(win.visible).be.true;

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	// FIXME Android reports view.rect.y to be 100, others report 150
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid()) ? it.skip : it)('animate (top)', function (finish) {
		win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			backgroundColor:'red',
			width: 100, height: 100,
			left: 100,  top: 100
		});

		win.addEventListener('open', function() {
			var animation = Ti.UI.createAnimation({
				top: 150,
				duration: 1000,
			});

			animation.addEventListener('complete', function() {
				// make sure to give it a time to layout
				setTimeout(function() {
					try {
						should(view.rect.x).be.eql(100);
						should(view.rect.y).be.eql(150); // Android reports 100
						should(view.left).be.eql(100);
						should(view.top).be.eql(100);

						finish();
					} catch (err) {
						finish(err);
					}
				}, 500);
			});

			view.animate(animation);

		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	// FIXME Android reports view.rect.x to be 100, others report 150
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid()) ? it.skip : it)('animate (left)', function (finish) {
		win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			backgroundColor:'red',
			width: 100, height: 100,
			left: 100,  top: 100
		});

		win.addEventListener('open', function() {
			var animation = Ti.UI.createAnimation({
				left: 150,
				duration: 1000,
			});

			animation.addEventListener('complete', function() {
				// make sure to give it a time to layout
				setTimeout(function() {

					try {
						should(view.rect.x).be.eql(150); // Android reports 100
						should(view.rect.y).be.eql(100);
						should(view.left).be.eql(100);
						should(view.top).be.eql(100);

						finish();
					} catch (err) {
						finish(err);
					}
				}, 500);
			});

			view.animate(animation);

		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	// FIXME Android reports value of 200 for one of the comparisons to 100
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid()) ? it.skip : it)('TIMOB-20598', function (finish) {
		win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
				backgroundColor:'red',
				width: 100, height: 100,
				left: 100,  top: 100
			}),
			pos = 100,
			count = 0,
			error;

		function start() {
			var animation = Ti.UI.createAnimation({
				left: pos,
				duration: 1000,
			});
			animation.addEventListener('complete', function() {
				setTimeout(function() {
					try {
						should(view.rect.x).be.eql(pos);
						should(view.rect.y).be.eql(100);
						should(view.left).be.eql(100);
						should(view.top).be.eql(100);
					} catch (err) {
						error = err;
					}
					if (count > 1) {
						win.close();
						finish(error);
					} else {
						pos += 50;
						count++;
						start();
					}
				}, 500);
			});

			view.animate(animation);
		}

		win.addEventListener('open', function() {
			start();
		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	// FIXME Android reports 90% for one of comparisons to 0 (view.left?)
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid()) ? it.skip : it)('animate (left %)', function (finish) {
		win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			backgroundColor: 'red',
			width: '10%', height: '10%',
			left: 0, top: 0
		});
		win.addEventListener('open', function () {
			var animation = Ti.UI.createAnimation({
				left: '90%',
				duration: 1000
			});
			animation.addEventListener('complete', function () {
				// make sure to give it a time to layout
				setTimeout(function () {
					try {
						should(view.rect.x).be.approximately(view.rect.width*9, 10);
						should(view.rect.y).be.eql(0);
						should(view.left).be.eql(0);
						should(view.top).be.eql(0);

						finish();
					} catch (err) {
						finish(err);
					}
				}, 500);
			});
			view.animate(animation);
		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	// FIXME Android reports 90% for one of comparisons to 0 (view.top?)
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid()) ? it.skip : it)('animate (top %)', function (finish) {
		win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			backgroundColor: 'red',
			width: '10%', height: '10%',
			left: 0, top: 0
		});
		win.addEventListener('open', function () {
			var animation = Ti.UI.createAnimation({
					top: '90%',
					duration: 1000
				});
			animation.addEventListener('complete', function () {
				// make sure to give it a time to layout
				setTimeout(function () {
					try {
						should(view.rect.x).be.eql(0);
						should(view.rect.y).be.approximately(view.rect.height*9, 10);
						should(view.left).be.eql(0);
						should(view.top).be.eql(0);

						finish();
					} catch (err) {
						finish(err);
					}
				}, 500);
			});
			view.animate(animation);
		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	// FIXME Android reports 90% for one of comparisons to 10% (view.width?)
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid()) ? it.skip : it)('animate (width %)', function (finish) {
		win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			backgroundColor: 'red',
			width: '10%', height: '10%',
			left: '10%', top: 0
		});
		win.addEventListener('open', function () {
			var animation = Ti.UI.createAnimation({
				width: '90%',
				duration: 1000
			});
			animation.addEventListener('complete', function () {
				// make sure to give it a time to layout
				setTimeout(function () {
					try {
						should(view.width).be.eql('10%');
						should(view.height).be.eql('10%');
						should(view.rect.width).be.approximately(view.rect.x*9, 10);
						should(view.left).be.eql('10%');
						should(view.top).be.eql(0);

						finish();
					} catch (err) {
						finish(err);
					}
				}, 500);
			});
			view.animate(animation);
		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	// FIXME Android reports 90% for one of comparisons to 10% (view.height?)
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid()) ? it.skip : it)('animate (height %)', function (finish) {
		win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			backgroundColor: 'red',
			width: '10%', height: '10%',
			left: 0, top: '10%'
		});
		win.addEventListener('open', function () {
			var animation = Ti.UI.createAnimation({
				height: '90%',
				duration: 1000
			});
			animation.addEventListener('complete', function () {
				// make sure to give it a time to layout
				setTimeout(function () {
					try {
						should(view.width).be.eql('10%');
						should(view.height).be.eql('10%');
						should(view.rect.height).be.approximately(view.rect.y*9, 10);
						should(view.left).be.eql(0);
						should(view.top).be.eql('10%');

						finish();
					} catch (err) {
						finish(err);
					}
				}, 500);
			});
			view.animate(animation);
		});
		win.add(view);
		win.open();
	});

	// FIXME Android reports 223 for one of the values we expect 123 (result.y?)
	(utilities.isAndroid() ? it.skip : it)('convertPointToView', function (finish) {
		win = Ti.UI.createWindow();
		var a = Ti.UI.createView({backgroundColor:'red'}),
			b = Ti.UI.createView({ top: '100', backgroundColor: 'blue' }),
			error;

		a.add(b);
		win.add(a);

		b.addEventListener('postlayout', function () {
			if (didPostLayout) return;
			didPostLayout = true;

			try {
				Ti.API.info('Got postlayout event');
				var result = b.convertPointToView({ x: 123, y: 23 }, a);
				should(result).be.an.Object;
				should(result.x).be.a.Number;
				should(result.y).be.a.Number;
				should(result.x).eql(123);
				should(result.y).eql(123);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME one of the getters or setter for parent isn't there on Android. I can't find the property or accessors in our docs!
	(utilities.isAndroid() ? it.skip : it)('parent', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		var view = Ti.UI.createView({ width:Ti.UI.FILL, height:Ti.UI.FILL });
		win.add(view);

		win.addEventListener('open', function () {
			try {
				should(view.parent).be.an.Object;
				should(view.parent).eql(win);
				should(view.getParent).be.a.Function;
				should(view.setParent).be.a.Function;
				should(view.getParent()).eql(win);

				// parent is not read-only
				view.setParent(null);
				should(view.parent).not.exist;

				finish();
			} catch (err) {
				finish(err);
			}
		});

		win.open();
	});

});
