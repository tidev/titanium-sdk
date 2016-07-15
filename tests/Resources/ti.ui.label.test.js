/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities'),
	didFocus = false,
	didPostLayout = false;

describe('Titanium.UI.Label', function () {
	var win;

	beforeEach(function() {
		didFocus = false;
		didPostlayout = false;
	});

	afterEach(function() {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('apiName', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text'
		});
		should(label).have.readOnlyProperty('apiName').which.is.a.String;
		should(label.apiName).be.eql('Ti.UI.Label');
	});

	it('text', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text'
		});
		should(label.text).be.a.String;
		should(label.getText).be.a.Function;
		should(label.text).eql('this is some text');
		should(label.getText()).eql('this is some text');
		label.text = 'other text';
		should(label.text).eql('other text');
		should(label.getText()).eql('other text');
	});

	it('textid', function () {
		var label = Ti.UI.createLabel({
			textid: 'this_is_my_key'
		});
		should(label.textid).be.a.String;
		should(label.getTextid).be.a.Function;
		should(label.textid).eql('this_is_my_key');
		should(label.getTextid()).eql('this_is_my_key');
		should(label.text).eql('this is my value');
		label.textid = 'other text';
		should(label.textid).eql('other text');
		should(label.getTextid()).eql('other text');
		should(label.text).eql('this is my value'); // Windows issue
	});

	it('textAlign', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text',
			textAlign: Titanium.UI.TEXT_ALIGNMENT_CENTER
		});
		if (utilities.isAndroid()) {
			should(label.textAlign).be.a.String;
		} else {
			should(label.textAlign).be.a.Number;
		}
		should(label.getTextAlign).be.a.Function;
		should(label.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
		should(label.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
		label.textAlign = Titanium.UI.TEXT_ALIGNMENT_RIGHT;
		should(label.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
		should(label.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
	});

	it('verticalAlign', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text',
			verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM
		});
		if (utilities.isAndroid()) {
			should(label.verticalAlign).be.a.String;
		} else {
			should(label.verticalAlign).be.a.Number;
		}
		should(label.getVerticalAlign).be.a.Function;
		should(label.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		should(label.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
		label.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
		should(label.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
		should(label.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
	});

	// Turn on/off the addition of ellipses at the end of the label if the text is too large to fit.
	// Default: false
	// FIXME Get working on iOS. ellipsize defaults to undefined, should be false according to docs: https://jira.appcelerator.org/browse/TIMOB-23501
	// FIXME Should default to false on Android, but is undefined: https://jira.appcelerator.org/browse/TIMOB-23500
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('ellipsize', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text'
		});
		should(label.ellipsize).be.a.Boolean; // undefined on iOS and Android
		should(label.getEllipsize).be.a.Function;
		should(label.ellipsize).eql(false);
		should(label.getEllipsize()).eql(false);
		label.ellipsize = true;
		should(label.getEllipsize()).eql(true);
		should(label.ellipsize).eql(true);
	});

	// Enable or disable word wrapping in the label.
	// Defaults: true
	// Intentionally skip on iOS, property not on platform.
	// FIXME Should default to true on Android, but is undefined: https://jira.appcelerator.org/browse/TIMOB-23499
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('wordWrap', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text'
		});
		should(label.wordWrap).be.a.Boolean; // undefined on Android
		should(label.getWordWrap).be.a.Function;
		should(label.wordWrap).eql(true);
		should(label.getWordWrap()).eql(true);
		label.wordWrap = false;
		should(label.getWordWrap()).eql(false);
		should(label.wordWrap).eql(false);
	});

	// FIXME Can't rely on Ti.UI.Window.postlayout event firing because ntiher platform fires it for that type (only maybe bubbles up from label)
	(((utilities.isWindows8_1() && utilities.isWindowsDesktop()) ||
	(utilities.isAndroid() || utilities.isIOS())) ? it.skip : it)('width', function (finish) {
		this.slow(1000);
		this.timeout(10000);

		win = Ti.UI.createWindow({ backgroundColor: '#ddd' });

		var label = Ti.UI.createLabel({
			text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ullamcorper massa, eget tempor sapien. Phasellus nisi metus, tempus a magna nec, ultricies rutrum lacus. Aliquam sit amet augue suscipit, dignissim tellus eu, consectetur elit. Praesent ligula velit, blandit vel urna sit amet, suscipit euismod nunc.',
			width: Ti.UI.SIZE
		});
		win.add(label);
		win.addEventListener('postlayout', function () {
			if (didPostLayout) return;
			didPostLayout = true;

			try {
				should(label.size.width).not.be.greaterThan(win.size.width);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// FIXME Can't rely on Ti.UI.Window.postlayout event firing because ntiher platform fires it for that type (only maybe bubbles up from label)
	((utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('height', function (finish) {
		this.slow(1000);
		this.timeout(10000);

		win = Ti.UI.createWindow({ backgroundColor: '#eee' });

		var label = Ti.UI.createLabel({
				text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec ullamcorper massa, eget tempor sapien. Phasellus nisi metus, tempus a magna nec, ultricies rutrum lacus. Aliquam sit amet augue suscipit, dignissim tellus eu, consectetur elit. Praesent ligula velit, blandit vel urna sit amet, suscipit euismod nunc.',
				width: Ti.UI.SIZE,
				height: Ti.UI.SIZE,
				color: 'black'
			}),
			bgView = Ti.UI.createView({
				width: 200, height: 100,
				backgroundColor: 'red'
			});
		bgView.add(label);
		win.add(bgView);

		win.addEventListener('postlayout', function () {
			if (didPostLayout) return;
			didPostLayout = true;

			try {
				should(bgView.size.height).be.eql(100);

				// Uncomment below because it should be ok for label to have height greater than parent view
				// parent view should be able to handle which areas should be shown in that case.
				// should(label.size.height).not.be.greaterThan(100);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

});
