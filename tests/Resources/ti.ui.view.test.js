/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

const isAndroid = utilities.isAndroid();

describe('Titanium.UI.View', function () {
	let rootWindow;
	let win;

	this.slow(2000);
	this.timeout(10000);

	before(function (finish) {
		rootWindow = Ti.UI.createWindow();
		rootWindow.addEventListener('open', () => finish());
		rootWindow.open();
	});

	after(function (finish) {
		rootWindow.addEventListener('close', () => finish());
		rootWindow.close();
	});

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it('backgroundColor/Image', function () {
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });

		view.backgroundColor = 'white';
		view.backgroundImage = 'Logo.png';
		should(view.backgroundColor).be.a.String();
		should(view.backgroundImage).be.a.String();
		should(view.backgroundColor).be.eql('white');
		should(view.backgroundImage).be.eql('Logo.png');
	});

	// FIXME Get working on iOS and Android
	it.androidAndIosBroken('backgroundFocusedColor/Image', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundFocusedColor).be.a.String(); // undefined on iOS and Android
				should(view.backgroundFocusedImage).be.a.String();
				view.backgroundFocusedColor = 'white';
				view.backgroundFocusedImage = 'Logo.png';
				should(view.backgroundFocusedColor).be.eql('white');
				should(view.backgroundFocusedImage).be.eql('Logo.png');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// FIXME Get working on iOS
	it.androidAndIosBroken('backgroundSelectedColor/Image', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundSelectedColor).be.a.String(); // undefined on iOS and Android
				should(view.backgroundSelectedImage).be.a.String();
				view.backgroundSelectedColor = 'white';
				view.backgroundSelectedImage = 'Logo.png';
				should(view.backgroundSelectedColor).be.eql('white');
				should(view.backgroundSelectedImage).be.eql('Logo.png');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// FIXME Get working on iOS and Android
	it.androidAndIosBroken('backgroundDisabledColor/Image', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundDisabledColor).be.a.String(); // undefined on iOS and Android
				should(view.backgroundDisabledImage).be.a.String();
				view.backgroundDisabledColor = 'white';
				view.backgroundDisabledImage = 'Logo.png';
				should(view.backgroundDisabledColor).be.eql('white');
				should(view.backgroundDisabledImage).be.eql('Logo.png');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// Windows supports linear gradient only
	it.androidAndWindowsMissing('backgroundGradient (radial)', function (finish) {
		this.timeout(10000);

		win = Ti.UI.createWindow({
			backgroundColor: '#fff'
		});

		const gradient = {
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

		const radialGradient = Ti.UI.createView({
			width: 100,
			height: 100,
			backgroundGradient: gradient
		});

		win.addEventListener('open', function () {
			try {
				// general API
				should(radialGradient.backgroundGradient).be.an.Object();

				// type
				should(radialGradient.backgroundGradient.type).be.a.String();
				should(radialGradient.backgroundGradient.type).eql('radial');

				// startPoint
				should(radialGradient.backgroundGradient.startPoint).be.an.Object();
				should(radialGradient.backgroundGradient.startPoint.x).be.a.Number();
				should(radialGradient.backgroundGradient.startPoint.y).be.a.Number();
				should(radialGradient.backgroundGradient.startPoint.x).eql(50);
				should(radialGradient.backgroundGradient.startPoint.y).eql(50);

				// colors
				should(radialGradient.backgroundGradient.colors).be.an.Array();
				should(radialGradient.backgroundGradient.colors[0]).eql('red');
				should(radialGradient.backgroundGradient.colors[1]).eql('blue');

				// startRadius
				should(radialGradient.backgroundGradient.startRadius).eql('90%');

				// endRadius
				should(radialGradient.backgroundGradient.endRadius).eql(0);

				// TODO: Expose those on Android as well
				if (!isAndroid) {
					// endPoint
					should(radialGradient.backgroundGradient.endPoint).be.an.Object();
					should(radialGradient.backgroundGradient.endPoint.x).be.a.Number();
					should(radialGradient.backgroundGradient.endPoint.y).be.a.Number();
					should(radialGradient.backgroundGradient.endPoint.x).eql(50);
					should(radialGradient.backgroundGradient.endPoint.y).eql(50);

					// backfillStart
					should(radialGradient.backgroundGradient.backfillStart).be.a.Boolean();
					should(radialGradient.backgroundGradient.backfillStart).eql(true);

					// backfillEnd
					should(radialGradient.backgroundGradient.backfillEnd).be.a.Boolean();
					should(radialGradient.backgroundGradient.backfillEnd).eql(true);
				}
			} catch (err) {
				return finish(err);
			}

			finish();
		});

		win.add(radialGradient);
		win.open();
	});

	// FIXME Windows throws exception
	it.windowsBroken('backgroundGradient (linear)', function (finish) {
		this.timeout(10000);

		win = Ti.UI.createWindow({
			backgroundColor: '#fff'
		});

		const linearGradient = Ti.UI.createView({
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
			try {
				// general API
				should(linearGradient.backgroundGradient).be.an.Object();

				// type
				should(linearGradient.backgroundGradient.type).be.a.String();
				should(linearGradient.backgroundGradient.type).eql('linear');

				// startPoint
				should(linearGradient.backgroundGradient.startPoint).be.an.Object();
				should(linearGradient.backgroundGradient.startPoint.x).be.a.String();
				should(linearGradient.backgroundGradient.startPoint.y).be.a.String();
				should(linearGradient.backgroundGradient.startPoint.x).eql('0%');
				should(linearGradient.backgroundGradient.startPoint.y).eql('50%');

				// endPoint
				should(linearGradient.backgroundGradient.endPoint).be.an.Object();
				should(linearGradient.backgroundGradient.endPoint.x).be.a.String();
				should(linearGradient.backgroundGradient.endPoint.y).be.a.String();
				should(linearGradient.backgroundGradient.endPoint.x).eql('100%');
				should(linearGradient.backgroundGradient.endPoint.y).eql('100%');

				// colors
				should(linearGradient.backgroundGradient.colors).be.an.Array();
				linearGradient.backgroundGradient.colors.forEach(colorObject => {
					should(colorObject).be.an.Object();
					should(colorObject.color).be.a.String();
					should(colorObject.offset).be.a.Number();
				});
			} catch (err) {
				return finish(err);
			}

			finish();
		});

		win.add(linearGradient);
		win.open();
	});

	// FIXME Get working on iOS and Android
	it.allBroken('border', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.borderColor).be.a.String(); // undefined on iOS and Android
				should(view.borderWidth).be.a.Number(); // Windows gives: expected '0' to be a number
				view.borderColor = 'blue';
				view.borderWidth = 2;
				should(view.borderColor).be.eql('blue');
				should(view.borderWidth).be.eql(2);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// FIXME Times out on iOS. Never fires postlayout?
	it('rect and size', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);

		view.addEventListener('postlayout', function listener () {
			view.removeEventListener('postlayout', listener);

			try {
				Ti.API.info('Got postlayout event');
				Ti.API.info(JSON.stringify(view.rect));
				Ti.API.info(JSON.stringify(view.size));
				should(view.rect).be.an.Object();
				should(view.rect.width).be.above(0);
				should(view.rect.height).be.above(0);
				should(view.rect.x).be.a.Number();
				should(view.rect.y).be.a.Number();
				should(view.size.width).be.above(0);
				should(view.size.height).be.above(0);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// FIXME Get working on iOS! After #hide() call, visible still returns true)
	it.iosBroken('hide() and show() change visible property value', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		win.addEventListener('focus', function () {
			try {
				Ti.API.info('Got focus event');
				should(win.visible).be.true();
				win.hide();
				should(win.visible).be.false(); // iOS returns true
				win.show();
				should(win.visible).be.true();
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	it.windowsBroken('animate (top)', function (finish) {
		win = Ti.UI.createWindow();
		const view = Ti.UI.createView({
			backgroundColor: 'red',
			width: 100, height: 100,
			left: 100,  top: 100
		});

		win.addEventListener('open', function () {
			const animation = Ti.UI.createAnimation({
				top: 150,
				duration: 1000,
			});

			animation.addEventListener('complete', function () {
				// make sure to give it a time to layout
				setTimeout(function () {
					try {
						should(view.rect.x).be.eql(100); // FIXME: do we need to register for a postlayout for this?
						should(view.rect.y).be.eql(150);
						should(view.left).be.eql(100);
						should(view.top).be.eql(150);
					} catch (err) {
						return finish(err);
					}
					finish();
				}, 1);
			});

			view.animate(animation);

		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	it.windowsBroken('animate (left)', function (finish) {
		win = Ti.UI.createWindow();
		const view = Ti.UI.createView({
			backgroundColor: 'red',
			width: 100, height: 100,
			left: 100,  top: 100
		});

		win.addEventListener('open', function () {
			const animation = Ti.UI.createAnimation({
				left: 150,
				duration: 1000,
			});

			animation.addEventListener('complete', function () {
				// make sure to give it a time to layout
				setTimeout(function () {

					try {
						should(view.rect.x).be.eql(150);
						should(view.rect.y).be.eql(100);
						should(view.left).be.eql(150);
						should(view.top).be.eql(100);
					} catch (err) {
						return finish(err);
					}
					finish();
				}, 1);
			});

			view.animate(animation);

		});
		win.add(view);
		win.open();
	});

	// FIXME: iOS fails with 'New layout set while view [object TiUIView] animating'
	// FIXME: Windows fails with timeout
	it.allBroken('TIMOB-20598', function (finish) {
		let left = 150;
		let count = 0;

		const view = Ti.UI.createView({
			backgroundColor: 'red',
			width: 100, height: 100,
			left: 100,  top: 100
		});

		win = Ti.UI.createWindow();

		function start() {
			const animation = Ti.UI.createAnimation({
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

		win.addEventListener('open', () => start());

		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	it.windowsBroken('animate (left %)', function (finish) {
		win = Ti.UI.createWindow();
		const view = Ti.UI.createView({
			backgroundColor: 'red',
			width: '10%', height: '10%',
			left: 0, top: 0
		});
		win.addEventListener('open', function () {
			const animation = Ti.UI.createAnimation({
				left: '90%',
				duration: 1000
			});
			animation.addEventListener('complete', function () {
				// make sure to give it a time to layout
				setTimeout(function () {
					try {
						should(view.rect.x).be.approximately(view.rect.width * 9, 10);
						should(view.rect.y).be.eql(0);
						should(view.left).be.eql('90%');
						should(view.top).be.eql(0);
					} catch (err) {
						return finish(err);
					}

					finish();
				}, 1);
			});
			view.animate(animation);
		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	it.windowsBroken('animate (top %)', function (finish) {
		win = Ti.UI.createWindow();
		const view = Ti.UI.createView({
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
						should(view.top).be.eql('90%');
					} catch (err) {
						return finish(err);
					}
					finish();
				}, 1);
			});
			view.animate(animation);
		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	it.windowsBroken('animate (width %)', function (finish) {
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
						should(view.width).be.eql('90%');
						should(view.height).be.eql('10%');
						should(view.left).be.eql('10%');
						should(view.top).be.eql(0);
						should(view.rect.width).be.approximately(view.rect.x * 9, 10); // Windows Phone gives: expected 32 to be approximately 288 ±10
					} catch (err) {
						return finish(err);
					}
					finish();
				}, 1);
			});
			view.animate(animation);
		});
		win.add(view);
		win.open();
	});

	// FIXME: Windows 10 Store app fails for this...need to figure out why.
	it.windowsBroken('animate (height %)', function (finish) {
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
						should(view.height).be.eql('90%');
						should(view.left).be.eql(0);
						should(view.top).be.eql('10%');
						should(view.rect.height).be.approximately(view.rect.y * 9, 10); // Windows Phone: expected 53 to be approximately 477 ±10
					} catch (err) {
						return finish(err);
					}
					finish();
				}, 1);
			});
			view.animate(animation);
		});
		win.add(view);
		win.open();
	});

	it.androidAndWindowsBroken('convertPointToView', function (finish) {
		win = Ti.UI.createWindow();
		const a = Ti.UI.createView({ backgroundColor: 'red' });
		const b = Ti.UI.createView({ top: '100', backgroundColor: 'blue' });

		a.add(b);
		win.add(a);

		b.addEventListener('postlayout', function listener () {
			b.removeEventListener('postlayout', listener);

			try {
				Ti.API.info('Got postlayout event');
				let result = b.convertPointToView({ x: 123, y: 23 }, a);
				should(result).be.an.Object();
				should(result.x).be.a.Number(); // Windows: expected '123.000000' to be a number
				should(result.y).be.a.Number();
				should(result.x).eql(123);
				should(result.y).eql(123); // Android sometimes gives 223? I assume this is a screen density thing?
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// FIXME one of the getters or setter for parent isn't there on Android. I can't find the property or accessors in our docs!
	it.androidMissing('parent', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);

		win.addEventListener('open', function () {
			try {
				should(view.parent).be.an.Object();
				should(view.parent).eql(win);
				should(view.getParent).be.a.Function();
				should(view.setParent).be.a.Function();
				should(view.getParent()).eql(win);

				// parent is not read-only
				view.setParent(null);
				should(view.parent).not.exist;
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.open();
	});

	// FIXME: Runtime error on Windows.
	// FIXME: iOS updates borderWidth internally but doesn't expose the updated value to JS!
	// FIXME: Docs say borderWidth is a Number, but Android returns a string!
	it.iosAndWindowsBroken('border with only borderColor set', function (finish) {
		const view = Ti.UI.createView({ width: 200, height: 200, borderColor: 'red', backgroundColor: 'white' });
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		win.add(view);
		win.addEventListener('open', function () {
			try {
				should(view.borderWidth).eql('1'); // undefined on ios, despite it actually setting borderWidth under the hood to min 1
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// these properties should be present with all events
	// for this automated test we will be using 'focus'
	it.windowsMissing('event source and bubbles property', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		win.addEventListener('focus', function (e) {
			try {
				should(e.source).be.a.Object();
				should(e.bubbles).be.a.Boolean();
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// TIMOB-25656: Android specific issue where getOrCreateView() could return null
	it.android('getOrCreateView() should always return a View', function (finish) {
		win = Ti.UI.createWindow();

		win.addEventListener('open', function () {

			const child = Ti.UI.createWindow();

			child.addEventListener('open', function () {
				const imageView = Ti.UI.createImageView();

				child.addEventListener('close', function () {
					try {
						imageView.tintColor;
					} catch (error) {
						return finish(error);
					}
					finish();
				});
				child.close();
			});

			child.open();
		});

		win.open();
	});

	it.ios('.horizontalMotionEffect, .verticalMotionEffect', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		const view = Ti.UI.createView({
			horizontalMotionEffect: {
				min: -50,
				max: 50
			},
			verticalMotionEffect: {
				min: -50,
				max: 50
			}
		});

		win.addEventListener('open', function () {
			try {
				// horizontalMotionEffect
				should(view.horizontalMotionEffect).be.an.Object();
				should(view.horizontalMotionEffect.min).be.a.Number();
				should(view.horizontalMotionEffect.max).be.a.Number();

				// verticalMotionEffect
				should(view.verticalMotionEffect).be.an.Object();
				should(view.verticalMotionEffect.min).be.a.Number();
				should(view.verticalMotionEffect.max).be.a.Number();
			} catch (err) {
				return finish(err);
			}

			finish();
		});

		win.add(view);
		win.open();
	});

	it('.backgroundImage (URL-redirect)', function (finish) {
		this.slow(8000);
		this.timeout(10000);

		win = Ti.UI.createWindow();
		win.add(Ti.UI.createView({
			backgroundImage: 'http://raw.githubusercontent.com/recurser/exif-orientation-examples/master/Portrait_1.jpg'
		}));
		win.addEventListener('open', () => finish());
		win.open();
	});

	// FIXME Get working on iOS
	it.android('backgroundDisabledColor', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				view.backgroundDisabledColor = '#88FFFFFF';
				should(view.backgroundDisabledColor).be.eql('#88FFFFFF');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it.android('backgroundColor without color state', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ backgroundColor: '#88FFFFFF', width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundColor).be.eql('#88FFFFFF');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it.android('backgroundColor with border', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ backgroundColor: '#88FFFFFF', borderWidth: 10, borderColor: 'green', width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundColor).be.eql('#88FFFFFF');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it.android('backgroundColor default with color state', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ backgroundColor: '#88FFFFFF', backgroundSelectedColor: 'cyan', width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundColor).be.eql('#88FFFFFF');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it.android('backgroundSelectedColor', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				view.backgroundSelectedColor = '#88FFFFFF';
				should(view.backgroundSelectedColor).be.eql('#88FFFFFF');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it.android('backgroundFocusedColor', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				view.backgroundFocusedColor = '#88FFFFFF';
				should(view.backgroundFocusedColor).be.eql('#88FFFFFF');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it.ios('.accessibility* Properties', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const label = Ti.UI.createLabel({
			text: 'Label for Test',
			accessibilityLabel: 'Text',
			accessibilityValue: 'Value',
			accessibilityHint: 'Hint',
			accessibilityHidden: true
		});
		win.add(label);
		win.addEventListener('focus', function () {
			try {
				should(label.accessibilityLabel).eql('Text');
				should(label.accessibilityValue).eql('Value');
				should(label.accessibilityHint).eql('Hint');
				should(label.accessibilityHidden).eql(true);

				label.setAccessibilityLabel('New Text');
				label.accessibilityValue = 'New Value';
				label.accessibilityHint = 'New Hint';
				label.accessibilityHidden = false;

				should(label.accessibilityLabel).eql('New Text');
				should(label.accessibilityValue).eql('New Value');
				should(label.accessibilityHint).eql('New Hint');
				should(label.accessibilityHidden).eql(false);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});
});
