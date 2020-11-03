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

describe('Titanium.UI.Button', function () {
	this.timeout(5000);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it('apiName', () => {
		const button = Ti.UI.createButton({
			title: 'this is some text'
		});
		should(button).have.readOnlyProperty('apiName').which.is.a.String();
		should(button.apiName).be.eql('Ti.UI.Button');
	});

	it('title', function () {
		const bar = Ti.UI.createButton({
			title: 'this is some text'
		});
		should(bar.title).be.a.String();
		should(bar.getTitle).be.a.Function();
		should(bar.title).eql('this is some text');
		should(bar.getTitle()).eql('this is some text');
		bar.title = 'other text';
		should(bar.title).eql('other text');
		should(bar.getTitle()).eql('other text');
	});

	// FIXME Parity issue - iOS and Android retains old title if titleid can't be found, Windows uses key
	it('titleid', function () {
		const bar = Ti.UI.createButton({
			titleid: 'this_is_my_key'
		});
		should(bar.titleid).be.a.String();
		should(bar.getTitleid).be.a.Function();
		should(bar.titleid).eql('this_is_my_key');
		should(bar.getTitleid()).eql('this_is_my_key');
		should(bar.title).eql('this is my value');
		bar.titleid = 'other text'; // key won't get found!
		should(bar.titleid).eql('other text');
		should(bar.getTitleid()).eql('other text');
		should(bar.title).eql('this is my value'); // should retain old value if can't find key! https://jira.appcelerator.org/browse/TIMOB-23498
	});

	it('image(String)', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const view = Ti.UI.createButton({ title: 'push button' });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				view.image = 'Logo.png';
				should(view.image).be.eql('Logo.png');
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// Skip on Windows 10 and 8.1 desktop for now, it hangs
	// FIXME iOS getFile().read() returns null for Logo.png
	it.iosAndWindowsBroken('image(Blob)', function (finish) {
		this.slow(1000);
		this.timeout(20000);

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const view = Ti.UI.createButton({ title: 'push button' });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				view.image = Ti.Filesystem.getFile('Logo.png').read();
				should(view.image).be.an.Object(); // ios gives null
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// FIXME Get working on iOS and Android. borderColor defaults to undefined there, we're verifying it's a String
	it.androidAndIosBroken('backgroundColor/Image', function (finish) {
		var view;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		view = Ti.UI.createButton({ title: 'push button' });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundColor).be.a.String(); // undefined on iOS and Android
				should(view.backgroundImage).be.a.String();
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

	// FIXME Get working on iOS and Android. borderColor defaults to undefined there, we're verifying it's a String
	it.androidAndIosBroken('backgroundFocusedColor/Image', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const view = Ti.UI.createButton({ title: 'push button' });
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

	// FIXME Get working on iOS and Android. borderColor defaults to undefined there, we're verifying it's a String
	it.androidAndIosBroken('backgroundSelectedColor/Image', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const view = Ti.UI.createButton({ title: 'push button' });
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

	// FIXME Get working on iOS and Android. borderColor defaults to undefined there, we're verifying it's a String
	it.androidAndIosBroken('backgroundDisabledColor/Image', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const view = Ti.UI.createButton({ title: 'push button' });
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

	// FIXME Get working on iOS
	it.iosBroken('backgroundGradient', function (finish) {
		this.slow(1000);
		this.timeout(20000);

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const view = Ti.UI.createButton({ title: 'push button' });
		view.backgroundGradient = {
			type: 'linear',
			startPoint: { x: '0%', y: '50%' },
			endPoint: { x: '100%', y: '100%' },
			colors: [ { color: 'red', offset: 0.0 }, { color: 'blue', offset: 0.25 }, { color: 'red', offset: 1.0 } ],
		};
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundGradient.type).be.eql('linear');
				should(view.backgroundGradient.startPoint).be.an.Object();
				should(view.backgroundGradient.endPoint).be.an.Object();
				should(view.backgroundGradient.colors).be.an.Array(); // undefined on iOS
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// FIXME Get working on iOS and Android. borderColor defaults to undefined there, we're verifying it's a String
	// FIXME Get working on Windows. borderWidth returns '0' as a string there, not a Number!
	it.allBroken('border', function (finish) {
		var view;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		view = Ti.UI.createButton({ title: 'push button' });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.borderColor).be.a.String(); // undefined on iOS and Android
				should(view.borderWidth).be.a.Number(); // '0' (as a string!) on Windows
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

	// FIXME Intermittently failing on Android build machine - I think due to test timeout!
	// FIXME Fails on iOS due to timeout. Never fires postlayout?
	it.androidAndIosBroken('rect and size', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createButton({ title: 'push button' });
		win.add(view);

		view.addEventListener('postlayout', function () {
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

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('attributedString', function () {
		var text = 'Titanium rocks!',
			attr = Ti.UI.createAttributedString({
				text: text,
				attributes: [
					// Remove underline
					{
						type: Ti.UI.ATTRIBUTE_UNDERLINES_STYLE,
						value: Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_NONE,
						range: [ 0, text.length ]
					}
				]
			}),
			button = Ti.UI.createButton({ attributedString: attr });

		should(button.attributedString).be.an.Object();
		should(button.attributedString.text).be.a.String();
		should(button.attributedString.text).eql('Titanium rocks!');
		should(button.attributedString.attributes).be.an.Array();
		should(button.attributedString.attributes[0].type).eql(Ti.UI.ATTRIBUTE_UNDERLINES_STYLE);
		should(button.attributedString.attributes[0].value).eql(Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_NONE);
		should(button.attributedString.attributes[0].range[0]).eql(0);
		should(button.attributedString.attributes[0].range[1]).eql(text.length);
	});
});
