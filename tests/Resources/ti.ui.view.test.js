/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.View', function () {
	var rootWindow,
		win,
		didFocus = false,
		didPostLayout = false;

	this.slow(2000);
	this.timeout(10000);

	before(function (finish) {
		rootWindow = Ti.UI.createWindow();
		rootWindow.addEventListener('open', function () {
			finish();
		});
		rootWindow.open();
	});

	after(function (finish) {
		rootWindow.addEventListener('close', function () {
			finish();
		});
		rootWindow.close();
	});

	beforeEach(function () {
		didFocus = false;
		didPostLayout = false;
	});

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('backgroundColor/Image', function (finish) {
		var view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });

		try {
			view.backgroundColor = 'white';
			view.backgroundImage = 'Logo.png';
			should(view.backgroundColor).be.a.String;
			should(view.backgroundImage).be.a.String;
			should(view.backgroundColor).be.eql('white');
			should(view.backgroundImage).be.eql('Logo.png');

			finish();
		} catch (e) {
			finish(e);
		}
	});

	// FIXME Get working on iOS and Android
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('backgroundFocusedColor/Image', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
			didFocus = true;

			try {
				should(view.backgroundFocusedColor).be.a.String; // undefined on iOS and Android
				should(view.backgroundFocusedImage).be.a.String;
				view.backgroundFocusedColor = 'white';
				view.backgroundFocusedImage = 'Logo.png';
				should(view.backgroundFocusedColor).be.eql('white');
				should(view.backgroundFocusedImage).be.eql('Logo.png');

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Get working on iOS
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) || utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('backgroundSelectedColor/Image', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
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
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
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

	it.androidMissing('backgroundGradient (radial)', function (finish) {
		var gradient, radialGradient;
		this.timeout(10000);

		win = Ti.UI.createWindow({
			backgroundColor: '#fff'
		});

		gradient = {
			type: 'radial',
			startPoint: {
				x: 50,
				y: 50
			},
			colors: [ 'red', 'blue' ],
			startRadius: '90%',
			endRadius: 0
		};

		// iOS/Windows-only properties
		if (!utilities.isAndroid()) {
			gradient.endPoint = {
				x: 50,
				y: 50
			};
			gradient.backfillStart = true;
			gradient.backfillEnd = true;
		}

		radialGradient = Ti.UI.createView({
			width: 100,
			height: 100,
			backgroundGradient: gradient
		});

		win.addEventListener('open', function () {
			// general API
			should(radialGradient.backgroundGradient).be.an.Object;

			// type
			should(radialGradient.backgroundGradient.type).be.a.String;
			should(radialGradient.backgroundGradient.type).eql('radial');

			// startPoint
			should(radialGradient.backgroundGradient.startPoint).be.an.Object;
			should(radialGradient.backgroundGradient.startPoint.x).be.a.Number;
			should(radialGradient.backgroundGradient.startPoint.y).be.a.Number;
			should(radialGradient.backgroundGradient.startPoint.x).eql(50);
			should(radialGradient.backgroundGradient.startPoint.y).eql(50);

			// colors
			should(radialGradient.backgroundGradient.colors).be.an.Array;
			should(radialGradient.backgroundGradient.colors[0]).eql('red');
			should(radialGradient.backgroundGradient.colors[1]).eql('blue');

			// startRadius
			should(radialGradient.backgroundGradient.startRadius).eql('90%');

			// endRadius
			should(radialGradient.backgroundGradient.endRadius).eql(0);

			// TODO: Expose those on Android as well
			if (!utilities.isAndroid()) {
				// endPoint
				should(radialGradient.backgroundGradient.endPoint).be.an.Object;
				should(radialGradient.backgroundGradient.endPoint.x).be.a.Number;
				should(radialGradient.backgroundGradient.endPoint.y).be.a.Number;
				should(radialGradient.backgroundGradient.endPoint.x).eql(50);
				should(radialGradient.backgroundGradient.endPoint.y).eql(50);

				// backfillStart
				should(radialGradient.backgroundGradient.backfillStart).be.a.Boolean;
				should(radialGradient.backgroundGradient.backfillStart).eql(true);

				// backfillEnd
				should(radialGradient.backgroundGradient.backfillEnd).be.a.Boolean;
				should(radialGradient.backgroundGradient.backfillEnd).eql(true);
			}

			finish();
		});

		win.add(radialGradient);
		win.open();
	});

	it('backgroundGradient (linear)', function (finish) {
		var linearGradient;

		this.timeout(10000);

		win = Ti.UI.createWindow({
			backgroundColor: '#fff'
		});

		linearGradient = Ti.UI.createView({
			width: 100,
			height: 100,
			backgroundGradient: {
				type: 'linear',
				startPoint: {
					x: '0%',
					y: '50%'
				},
				endPoint: {
					x: '100%',
					y: '100%'
				},
				colors: [ {
					color: 'red',
					offset: 0.0
				}, {
					color: 'blue',
					offset: 0.25
				}, {
					color: 'red',
					offset: 1.0
				} ],
			}
		});

		win.addEventListener('open', function () {
			// general API
			should(linearGradient.backgroundGradient).be.an.Object;

			// type
			should(linearGradient.backgroundGradient.type).be.a.String;
			should(linearGradient.backgroundGradient.type).eql('linear');

			// startPoint
			should(linearGradient.backgroundGradient.startPoint).be.an.Object;
			should(linearGradient.backgroundGradient.startPoint.x).be.a.String;
			should(linearGradient.backgroundGradient.startPoint.y).be.a.String;
			should(linearGradient.backgroundGradient.startPoint.x).eql('0%');
			should(linearGradient.backgroundGradient.startPoint.y).eql('50%');

			// endPoint
			should(linearGradient.backgroundGradient.endPoint).be.an.Object;
			should(linearGradient.backgroundGradient.endPoint.x).be.a.String;
			should(linearGradient.backgroundGradient.endPoint.y).be.a.String;
			should(linearGradient.backgroundGradient.endPoint.x).eql('100%');
			should(linearGradient.backgroundGradient.endPoint.y).eql('100%');

			// colors
			should(linearGradient.backgroundGradient.colors).be.an.Array;
			linearGradient.backgroundGradient.colors.forEach(function (colorObject) {
				should(colorObject).be.an.Object;
				should(colorObject.color).be.a.String;
				should(colorObject.offset).be.a.Number;
			});

			finish();
		});

		win.add(linearGradient);
		win.open();
	});

	// FIXME Get working on iOS and Android
	it.allBroken('border', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
			didFocus = true;

			try {
				should(view.borderColor).be.a.String; // undefined on iOS and Android
				should(view.borderWidth).be.a.Number; // Windows gives: expected '0' to be a number
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
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);

		view.addEventListener('postlayout', function () {
			if (didPostLayout) {
				return;
			}
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

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		win.addEventListener('focus', function () {
			if (didFocus) {
				return;
			}
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
	(utilities.isWindows10() && utilities.isWindowsDesktop() ? it.skip : it)('animate (top)', function (finish) {
		var view;
		win = Ti.UI.createWindow();
		view = Ti.UI.createView({
			backgroundColor: 'red',
			width: 100, height: 100,
			left: 100,  top: 100
		});

		win.addEventListener('open', function () {
			var animation = Ti.UI.createAnimation({
				top: 150,
				duration: 1000,
			});

			animation.addEventListener('complete', function () {
				// make sure to give it a time to layout
				setTimeout(function () {
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
	(utilities.isWindows10() && utilities.isWindowsDesktop() ? it.skip : it)('animate (left)', function (finish) {
		var view;
		win = Ti.UI.createWindow();
		view = Ti.UI.createView({
			backgroundColor: 'red',
			width: 100, height: 100,
			left: 100,  top: 100
		});

		win.addEventListener('open', function () {
			var animation = Ti.UI.createAnimation({
				left: 150,
				duration: 1000,
			});

			animation.addEventListener('complete', function () {
				// make sure to give it a time to layout
				setTimeout(function () {

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

	// FIXME: iOS fails with 'New layout set while view [object TiUIView] animating'
	// FIXME: Windows fails with timeout
	it.allBroken('TIMOB-20598', function (finish) {
		var view,
			left = 150,
			count = 0;

		view = Ti.UI.createView({
			backgroundColor: 'red',
			width: 100, height: 100,
			left: 100,  top: 100
		});

		win = Ti.UI.createWindow();

		function start() {
			var animation = Ti.UI.createAnimation({
				left: left,
				duration: 1000
			});

			animation.addEventListener('complete', function () {
				setTimeout(function () {
					try {
						should(view.rect.x).be.eql(left);
						should(view.rect.y).be.eql(100);
						should(view.left).be.eql(100);
						should(view.top).be.eql(100);

						if (count++ > 1) {
							win.close();
							finish();
							return;
						}
						left += 50;
						start();
					} catch (e) {
						finish(e);
					}
				}, 1000);
			});

			view.animate(animation);
		}

		win.addEventListener('open', function () {
			start();
		});

		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	// FIXME Android reports 90% for one of comparisons to 0 (view.left?)
	(utilities.isWindows10() && utilities.isWindowsDesktop() ? it.skip : it)('animate (left %)', function (finish) {
		var view;
		win = Ti.UI.createWindow();
		view = Ti.UI.createView({
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
						should(view.rect.x).be.approximately(view.rect.width * 9, 10);
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
	(utilities.isWindows10() && utilities.isWindowsDesktop() ? it.skip : it)('animate (top %)', function (finish) {
		var view;
		win = Ti.UI.createWindow();
		view = Ti.UI.createView({
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
						should(view.rect.y).be.approximately(view.rect.height * 9, 10);
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
	it.androidAndWindowsBroken('animate (width %)', function (finish) {
		var view;
		win = Ti.UI.createWindow();
		view = Ti.UI.createView({
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
						should(view.rect.width).be.approximately(view.rect.x * 9, 10); // Windows Phone gives: expected 32 to be approximately 288 ±10
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
	it.androidAndWindowsBroken('animate (height %)', function (finish) {
		var view;
		win = Ti.UI.createWindow();
		view = Ti.UI.createView({
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
						should(view.rect.height).be.approximately(view.rect.y * 9, 10); // Windows Phone: expected 53 to be approximately 477 ±10
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
	it.androidAndWindowsBroken('convertPointToView', function (finish) {
		var a,
			b;
		win = Ti.UI.createWindow();
		a = Ti.UI.createView({ backgroundColor: 'red' });
		b = Ti.UI.createView({ top: '100', backgroundColor: 'blue' });

		a.add(b);
		win.add(a);

		b.addEventListener('postlayout', function () {
			var result;
			if (didPostLayout) {
				return;
			}
			didPostLayout = true;

			try {
				Ti.API.info('Got postlayout event');
				result = b.convertPointToView({ x: 123, y: 23 }, a);
				should(result).be.an.Object;
				should(result.x).be.a.Number; // Windows: expected '123.000000' to be a number
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
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
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

	// FIXME: Runtime error on Windows.
	// FIXME: iOS updates borderWidth internally but doesn't expose the updated value to JS!
	// FIXME: Docs say borderWidth is a Number, but Android returns a string!
	it.iosAndWindowsBroken('border with only borderColor set', function (finish) {
		var view = Ti.UI.createView({ width: 200, height: 200, borderColor: 'red', backgroundColor: 'white' });
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		win.add(view);
		win.addEventListener('open', function () {
			should(view.borderWidth).eql('1'); // undefined on ios, despite it actually setting borderWidth under the hood to min 1
			finish();
		});
		win.open();
	});

	// these properties should be present with all events
	// for this automated test we will be using 'focus'
	it.windowsMissing('event source and bubbles property', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		win.addEventListener('focus', function (e) {
			if (didFocus) {
				return;
			}
			didFocus = true;

			try {
				should(e.source).be.a.Object;
				should(e.bubbles).be.a.Boolean;

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// TIMOB-25656: Android specific issue where getOrCreateView() could return null
	it.android('getOrCreateView() should always return a View', function (finish) {
		win = Ti.UI.createWindow();

		win.addEventListener('open', function () {

			var child = Ti.UI.createWindow();

			child.addEventListener('open', function () {
				var imageView = Ti.UI.createImageView();

				child.addEventListener('close', function () {
					try {
						imageView.tintColor;
					} catch (error) {
						finish(error);
					}
					finish();
				});
				child.close();
			});

			child.open();
		});

		win.open();
	});
});
